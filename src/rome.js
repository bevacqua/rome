'use strict';

var contra = require('contra');
var moment = require('moment');
var throttle = require('lodash.throttle');
var raf = require('raf');
var dom = require('./dom');
var defaults = require('./defaults');
var ikey = 'romeId';
var index = [];
var no;

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
  var ref = moment();
  var container;
  var throttledTakeInput = throttle(takeInput, 50);
  var throttledPosition = throttle(position, 30);
  var ignoreInvalidation;
  var ignoreShow;

  // date variables
  var weekdays = moment.weekdaysMin();
  var month;
  var datebody;
  var lastYear;
  var lastMonth;
  var lastDay;

  // time variables
  var time;
  var timelist;

  assign();
  init();

  function assign () {
    input.dataset[ikey] = index.push(api) - 1;
  }

  function init (initOptions) {
    o = defaults(initOptions || calendarOptions);
    if (!container) { container = dom({ className: o.styles.container }); }
    lastMonth = no;
    lastYear = no;
    lastDay = no;
    removeChildren(container);
    renderDates();
    renderTime();
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

    api.emit('ready', o);

    hide();
    throttledTakeInput();
    updateCalendar();

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
  }

  function changeOptions (options) {
    destroy();
    init(options);
  }

  function renderDates () {
    if (!o.date) {
      return;
    }
    var datewrapper = dom({ className: o.styles.date, parent: container });
    var back = dom({ className: o.styles.back, parent: datewrapper });
    var next = dom({ className: o.styles.next, parent: datewrapper });
    month = dom({ className: o.styles.month, parent: datewrapper });
    var date = dom({ type: 'table', className: o.styles.dayTable, parent: datewrapper });
    var datehead = dom({ type: 'thead', className: o.styles.dayHead, parent: date });
    var dateheadrow = dom({ type: 'tr', className: o.styles.dayRow, parent: datehead });
    datebody = dom({ type: 'tbody', className: o.styles.dayBody, parent: date });
    var i;

    for (i = 0; i < weekdays.length; i++) {
      dom({ type: 'th', className: o.styles.dayHeadElem, parent: dateheadrow, text: weekdays[i] });
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
    var next = moment('00:00:00', 'HH:mm:ss');
    var latest = next.clone().add('days', 1);
    while (next.isBefore(latest)) {
      dom({ className: o.styles.timeOption, parent: timelist, text: next.format(o.timeFormat) });
      next.add('seconds', o.timeInterval);
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

  function show () {
    if (ignoreShow || container.style.display === 'block') {
      return;
    }
    toggleTimeList(!o.date);
    container.style.display = 'block';
    position();
  }

  function hide () {
    hideTimeList();
    container.style.display = 'none';
  }

  function position () {
    container.style.position = 'absolute';
    container.style.top = input.offsetTop + input.offsetHeight;
    container.style.left = input.offsetLeft;
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
    if (input.value) {
      var val = moment(input.value, o.inputFormat);
      if (val.isValid()) { ref = val; updateCalendar(); updateTime(); }
    }
  }
  function subtractMonth () { ref.subtract('months', 1); update(); }
  function addMonth () { ref.add('months', 1); update(); }
  function updateCalendar () {
    if (!o.date) {
      return;
    }
    var y = ref.year();
    var m = ref.month();
    var d = ref.date();
    if (d === lastDay && m === lastMonth && y === lastYear) {
      return;
    }
    text(month, ref.format(o.monthFormat));
    lastDay = ref.date();
    lastMonth = ref.month();
    lastYear = ref.year();
    removeChildren(datebody);
    drawDays();
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

  function update () {
    updateCalendar();
    updateInput();
    api.emit('data', getDateString());
    api.emit('year', ref.year());
    api.emit('month', ref.month());
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
    if (!ignoreInvalidation) {
      updateInput();
    }
  }

  function removeChildren (elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

  function drawDays () {
    var total = ref.daysInMonth();
    var current = ref.date(); // 1..31
    var first = ref.clone().date(1);
    var firstDay = first.day(); // 0..6
    var lastMoment;
    var lastDay;
    var i, day, node;
    var tr = row();
    var disabled = o.styles.dayBodyElem + ' ' + o.styles.dayDisabled;

    for (i = 0; i < firstDay; i++) {
      day = first.clone().subtract('days', firstDay - i);
      node = dom({ type: 'td', className: disabled, parent: tr, text: day.format(o.dayFormat) });
    }
    for (i = 0; i < total; i++) {
      if (tr.children.length === weekdays.length) {
        tr = row();
      }
      day = first.clone().add('days', i);
      node = dom({ type: 'td', className: o.styles.dayBodyElem, parent: tr, text: day.format(o.dayFormat) });
      if (day.date() === current) {
        node.classList.add(o.styles.selectedDay);
      }
    }
    lastMoment = day.clone();
    lastDay = lastMoment.day();
    for (i = 1; tr.children.length < weekdays.length; i++) {
      day = lastMoment.clone().add('days', i);
      node = dom({ type: 'td', className: disabled, parent: tr, text: day.format(o.dayFormat) });
    }
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
    var query = '.' + o.styles.selectedDay.replace(/\s+/g, '.');
    var prev = container.querySelector(query);
    if (prev) { prev.classList.remove(o.styles.selectedDay); }
    target.classList.add(o.styles.selectedDay);
    ref.date(day);
    updateInput();
    if (o.autoClose) { hide(); }
    api.emit('data', getDateString());
    api.emit('day', day);
  }

  function pickTime (e) {
    var target = e.target;
    if (!target.classList.contains(o.styles.timeOption)) {
      return;
    }
    var value = moment(text(target), o.timeFormat);
    ref.hour(value.hour()).minute(value.minute()).second(value.second());
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

  function getDate () {
    return ref.toDate();
  }

  function getDateString (format) {
    return ref.format(format || o.inputFormat);
  }

  function getMoment () {
    return ref.clone();
  }

  return api;
}

calendar.find = find;

module.exports = calendar;
