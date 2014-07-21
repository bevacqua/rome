'use strict';

var contra = require('contra');
var throttle = require('lodash.throttle');
var clone = require('lodash.clonedeep');
var raf = require('raf');
var dom = require('./dom');
var defaults = require('./defaults');
var ikey = 'romeId';
var index = [];
var no;

function cloner (value) {
  if (calendar.moment.isMoment(value)) {
    return value.clone();
  }
}

function text (elem, value) {
  if (arguments.length === 2) {
    elem.innerText = elem.textContent = value;
  }
  return elem.innerText || elem.textContent;
}

function find (thing) {
  if (typeof thing !== 'number' && thing && thing.dataset) {
    return find(thing.dataset[ikey]);
  }
  var existing = index[thing];
  if (existing !== no) {
    return existing;
  }
}

function calendar (input, calendarOptions) {
  var existing = find(input);
  if (existing) {
    return existing;
  }
  var o;
  var api = contra.emitter({});
  var ref;
  var refCal;
  var container;
  var throttledTakeInput = throttle(takeInput, 50);
  var throttledPosition = throttle(position, 30);
  var ignoreInvalidation;
  var ignoreShow;

  // date variables
  var weekdays = calendar.moment.weekdaysMin();
  var weekdayCount = weekdays.length;
  var month;
  var datebody;
  var lastYear;
  var lastMonth;
  var lastDay;
  var back;
  var next;

  // time variables
  var secondsInDay = 60 * 60 * 24;
  var time;
  var timelist;

  assign();
  init();

  function assign () {
    input.dataset[ikey] = index.push(api) - 1;
  }

  function init (initOptions) {
    o = defaults(calendar.moment, initOptions || calendarOptions, input);
    if (!container) { container = dom({ className: o.styles.container }); }
    lastMonth = no;
    lastYear = no;
    lastDay = no;
    o.appendTo.appendChild(container);
    container.addEventListener('mousedown', containerMouseDown);
    container.addEventListener('click', containerClick);
    input.addEventListener('click', show);
    input.addEventListener('focusin', show);
    input.addEventListener('change', throttledTakeInput);
    input.addEventListener('keypress', throttledTakeInput);
    input.addEventListener('keydown', throttledTakeInput);
    input.addEventListener('input', throttledTakeInput);
    if (o.invalidate) { input.addEventListener('blur', invalidateInput); }
    if (o.autoHideOnBlur) { window.addEventListener('focusin', hideOnBlur); }
    if (o.autoHideOnClick) { window.addEventListener('click', hideOnClick); }
    window.addEventListener('resize', throttledPosition);

    api.emit('ready', clone(o, cloner));

    ref = calendar.moment();
    refCal = ref.clone();
    hide();
    removeChildren(container);
    renderDates();
    renderTime();
    throttledTakeInput();
    updateCalendar();
    updateTime();
    displayValidTimesOnly();

    delete api.restore;
    api.show = show;
    api.hide = hide;
    api.container = container;
    api.input = input;
    api.getDate = getDate;
    api.getDateString = getDateString;
    api.getMoment = getMoment;
    api.destroy = destroy;
    api.options = changeOptions;
    api.options.reset = resetOptions;
  }

  function destroy () {
    container.parentNode.removeChild(container);
    input.removeEventListener('focusin', show);
    input.removeEventListener('change', throttledTakeInput);
    input.removeEventListener('keypress', throttledTakeInput);
    input.removeEventListener('keydown', throttledTakeInput);
    input.removeEventListener('input', throttledTakeInput);
    if (o.invalidate) { input.removeEventListener('blur', invalidateInput); }
    if (o.autoHideOnBlur) { window.removeEventListener('focusin', hideOnBlur); }
    if (o.autoHideOnClick) { window.removeEventListener('click', hideOnClick); }
    window.removeEventListener('resize', throttledPosition);

    // reverse order micro-optimization
    delete api.options;
    delete api.destroy;
    delete api.getMoment;
    delete api.getDateString;
    delete api.getDate;
    delete api.input;
    delete api.container;
    delete api.hide;
    delete api.show;
    api.restore = init;
    api.emit('destroyed');
    api.off();
  }

  function changeOptions (options) {
    if (arguments.length === 0) {
      return clone(o, cloner);
    }
    destroy();
    init(options);
  }

  function resetOptions () {
    changeOptions({});
  }

  function renderDates () {
    if (!o.date) {
      return;
    }
    var datewrapper = dom({ className: o.styles.date, parent: container });
    back = dom({ type: 'button', className: o.styles.back, parent: datewrapper });
    next = dom({ type: 'button', className: o.styles.next, parent: datewrapper });
    month = dom({ className: o.styles.month, parent: datewrapper });
    var date = dom({ type: 'table', className: o.styles.dayTable, parent: datewrapper });
    var datehead = dom({ type: 'thead', className: o.styles.dayHead, parent: date });
    var dateheadrow = dom({ type: 'tr', className: o.styles.dayRow, parent: datehead });
    datebody = dom({ type: 'tbody', className: o.styles.dayBody, parent: date });
    var i;

    for (i = 0; i < weekdayCount; i++) {
      dom({ type: 'th', className: o.styles.dayHeadElem, parent: dateheadrow, text: weekdays[weekday(i)] });
    }

    back.addEventListener('click', subtractMonth);
    next.addEventListener('click', addMonth);
    datebody.addEventListener('click', pickDay);
  }

  function renderTime () {
    if (!o.time || !o.timeInterval) {
      return;
    }
    var timewrapper = dom({ className: o.styles.time, parent: container });
    time = dom({ className: o.styles.selectedTime, parent: timewrapper, text: ref.format(o.timeFormat) });
    time.addEventListener('click', toggleTimeList);
    timelist = dom({ className: o.styles.timeList, parent: timewrapper });
    timelist.addEventListener('click', pickTime);
    var next = calendar.moment('00:00:00', 'HH:mm:ss');
    var latest = next.clone().add('days', 1);
    while (next.isBefore(latest)) {
      dom({ className: o.styles.timeOption, parent: timelist, text: next.format(o.timeFormat) });
      next.add('seconds', o.timeInterval);
    }
  }

  function weekday (index, backwards) {
    var factor = backwards ? -1 : 1;
    var offset = index + o.weekStart * factor;
    if (offset >= weekdayCount || offset < 0) {
      offset += weekdayCount * -factor;
    }
    return offset;
  }

  function displayValidTimesOnly () {
    if (!o.time) {
      return;
    }
    var times = timelist.children;
    var length = times.length;
    var date;
    var time;
    var item;
    var i;
    for (i = 0; i < length; i++) {
      item = times[i];
      time = calendar.moment(text(item), o.timeFormat);
      date = setTime(ref.clone(), time);
      item.style.display = isInRange(date, false, o.timeValidator) ? 'block' : 'none';
    }
  }

  function toggleTimeList (show) {
    var display = typeof show === 'boolean' ? show : timelist.style.display === 'none';
    if (display) {
      showTimeList();
    } else {
      hideTimeList();
    }
  }

  function showTimeList () { if (timelist) { timelist.style.display = 'block'; } }
  function hideTimeList () { if (timelist) { timelist.style.display = 'none'; } }
  function showCalendar () { container.style.display = 'block'; }
  function hideCalendar () { container.style.display = 'none'; }

  function show () {
    if (ignoreShow || container.style.display !== 'none') {
      return;
    }
    toggleTimeList(!o.date);
    showCalendar();
    position();
  }

  function hide () {
    hideTimeList();
    raf(hideCalendar);
  }

  function position () {
    container.style.top = input.offsetTop + input.offsetHeight + 'px';
    container.style.left = input.offsetLeft + 'px';
  }

  function calendarEventTarget (e) {
    var target = e.target;
    if (target === input) {
      return true;
    }
    while (target) {
      if (target === container) {
        return true;
      }
      target = target.parentNode;
    }
  }

  function hideOnBlur (e) {
    if (calendarEventTarget(e)) {
      return;
    }
    hide();
  }

  function hideOnClick (e) {
    if (calendarEventTarget(e)) {
      return;
    }
    hide();
  }

  function takeInput () {
    var value = input.value.trim();
    if (isEmpty()) {
      return;
    }
    var date = calendar.moment(value, o.inputFormat);
    if (date.isValid() === false) {
      return;
    }
    ref = inRange(date) || ref;
    refCal = ref.clone();
    updateCalendar();
    updateTime();
    displayValidTimesOnly();
  }

  function subtractMonth () { changeMonth('subtract'); }
  function addMonth () { changeMonth('add'); }
  function changeMonth (op) {
    refCal[op]('months', 1);
    ref = inRange(refCal.clone()) || ref; update();
  }

  function update () {
    updateCalendar();
    updateTime();
    updateInput();
    displayValidTimesOnly();
    api.emit('data', getDateString());
    api.emit('year', ref.year());
    api.emit('month', ref.month());
  }

  function updateCalendar () {
    if (!o.date) {
      return;
    }
    var y = refCal.year();
    var m = refCal.month();
    var d = refCal.date();
    if (d === lastDay && m === lastMonth && y === lastYear) {
      return;
    }
    text(month, refCal.format(o.monthFormat));
    lastDay = refCal.date();
    lastMonth = refCal.month();
    lastYear = refCal.year();
    removeChildren(datebody);
    renderDays();
  }

  function updateTime () {
    if (!o.time) {
      return;
    }
    text(time, ref.format(o.timeFormat));
  }

  function updateInput () {
    input.value = ref.format(o.inputFormat);
  }

  function containerClick () {
    ignoreShow = true;
    input.focus();
    ignoreShow = false;
  }

  function containerMouseDown () {
    ignoreInvalidation = true;
    raf(unignore);

    function unignore () {
      ignoreInvalidation = false;
    }
  }

  function invalidateInput () {
    if (!ignoreInvalidation && !isEmpty()) {
      updateInput();
    }
  }

  function removeChildren (elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

  function renderDays () {
    var total = refCal.daysInMonth();
    var current = refCal.month() !== ref.month() ? -1 : ref.date(); // 1..31
    var first = refCal.clone().date(1);
    var firstDay = weekday(first.day(), true); // 0..6
    var lastMoment;
    var i, day, node;
    var tr = row();
    var prevMonth = o.styles.dayBodyElem + ' ' + o.styles.dayPrevMonth;
    var nextMonth = o.styles.dayBodyElem + ' ' + o.styles.dayNextMonth;
    var disabled = ' ' + o.styles.dayDisabled;

    for (i = 0; i < firstDay; i++) {
      day = first.clone().subtract('days', firstDay - i);
      node = dom({ type: 'td', className: test(day, prevMonth), parent: tr, text: day.format(o.dayFormat) });
    }
    for (i = 0; i < total; i++) {
      if (tr.children.length === weekdayCount) {
        tr = row();
      }
      day = first.clone().add('days', i);
      node = dom({ type: 'td', className: test(day, o.styles.dayBodyElem), parent: tr, text: day.format(o.dayFormat) });
      if (day.date() === current) {
        node.classList.add(o.styles.selectedDay);
      }
    }
    lastMoment = day.clone();
    for (i = 1; tr.children.length < weekdayCount; i++) {
      day = lastMoment.clone().add('days', i);
      node = dom({ type: 'td', className: test(day, nextMonth), parent: tr, text: day.format(o.dayFormat) });
    }

    back.disabled = !isInRange(first, true);
    next.disabled = !isInRange(lastMoment, true);

    function test (day, classes) {
      if (isInRange(day, true, o.dateValidator)) {
        return classes;
      }
      return classes + disabled;
    }
  }

  function isInRange (date, allday, validator) {
    var min = !o.min ? false : (allday ? o.min.clone().startOf('day') : o.min);
    var max = !o.max ? false : (allday ? o.max.clone().endOf('day') : o.max);
    if (min && date.isBefore(min)) {
      return false;
    }
    if (max && date.isAfter(max)) {
      return false;
    }
    var valid = (validator || Function.prototype)(date.toDate());
    return valid !== false;
  }

  function inRange (date) {
    if (o.min && date.isBefore(o.min)) {
      return inRange(o.min.clone());
    } else if (o.max && date.isAfter(o.max)) {
      return inRange(o.max.clone());
    }
    var days = date.daysInMonth();
    var value = date.clone().subtract('days', 1);
    if (validateTowards(value, date, 'add')) {
      return inTimeRange(value);
    }
    value = date.clone();
    if (validateTowards(value, date, 'subtract')) {
      return inTimeRange(value);
    }
  }

  function inTimeRange (value) {
    var valid = false;
    var copy = value.clone().subtract('seconds', o.timeInterval);
    var times = Math.ceil(secondsInDay / o.timeInterval);
    var i;
    for (i = 0; i < times; i++) {
      copy.add('seconds', o.timeInterval);
      if (copy.date() > value.date()) {
        copy.subtract('days', 1);
      }
      if (o.timeValidator(copy.toDate()) !== false) {
        return copy;
      }
    }
  }

  function validateTowards (value, date, op) {
    var valid = false;
    while (valid === false) {
      value[op]('days', 1);
      if (value.month() !== date.month()) {
        break;
      }
      valid = o.dateValidator(value.toDate());
    }
    return valid !== false;
  }

  function row () {
    return dom({ type: 'tr', className: o.styles.dayRow, parent: datebody });
  }

  function pickDay (e) {
    var target = e.target;
    if (target.classList.contains(o.styles.dayDisabled) || !target.classList.contains(o.styles.dayBodyElem)) {
      return;
    }
    var day = parseInt(text(target), 10);
    var query = '.' + o.styles.selectedDay;
    var selection = container.querySelector(query);
    if (selection) { selection.classList.remove(o.styles.selectedDay); }
    var prev = target.classList.contains(o.styles.dayPrevMonth);
    var next = target.classList.contains(o.styles.dayNextMonth);
    var action;
    if (prev || next) {
      action = prev ? 'subtract' : 'add';
      ref[action]('months', 1);
    } else {
      target.classList.add(o.styles.selectedDay);
    }
    ref.date(day); // must run after setting the month
    setTime(ref, inRange(ref) || ref);
    refCal = ref.clone();
    displayValidTimesOnly();
    updateInput();
    updateTime();
    if (o.autoClose) { hide(); }
    api.emit('data', getDateString());
    api.emit('day', day);
    if (prev || next) {
      updateCalendar(); // must run after setting the date
      api.emit('month', ref.month());
    }
  }

  function setTime (to, from) {
    to.hour(from.hour()).minute(from.minute()).second(from.second());
    return to;
  }

  function pickTime (e) {
    var target = e.target;
    if (!target.classList.contains(o.styles.timeOption)) {
      return;
    }
    var value = calendar.moment(text(target), o.timeFormat);
    setTime(ref, value);
    refCal = ref.clone();
    updateTime();
    updateInput();
    if (!o.date && o.autoClose) {
      hide();
    } else {
      hideTimeList();
    }
    api.emit('data', getDateString());
    api.emit('time', value);
  }

  function isEmpty () {
    return o.required === false && input.value.trim() === '';
  }

  function getDate () {
    return isEmpty() ? null : ref.toDate();
  }

  function getDateString (format) {
    return isEmpty() ? null : ref.format(format || o.inputFormat);
  }

  function getMoment () {
    return isEmpty() ? null : ref.clone();
  }

  return api;
}

calendar.find = find;

module.exports = calendar;
