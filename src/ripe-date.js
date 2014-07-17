'use strict';

var ikey = 'ripeId';
var index = [];
var moment = require('moment');
var throttle = require('lodash.throttle');
var dom = require('./dom');
var defaults = require('./defaults');
var no;

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
  var api = {};
  var ref = moment();
  var container;
  var throttledTakeInput = throttle(takeInput, 100);

  // date variables
  var weekdays = moment.weekdaysMin();
  var month;
  var datebody;
  var lastYear;
  var lastMonth;
  var lastDay;

  // time variables
  var time;

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
    input.addEventListener('click', show);
    input.addEventListener('focus', show);
    input.addEventListener('change', throttledTakeInput);
    input.addEventListener('keypress', throttledTakeInput);
    input.addEventListener('keydown', throttledTakeInput);
    input.addEventListener('input', throttledTakeInput);
    if (o.invalidate) { input.addEventListener('blur', updateInput); }
    if (o.autoHideOnBlur) { input.addEventListener('blur', hide); }
    if (o.autoHideOnClick) { document.body.addEventListener('click', takeHint); }

    hide();
    throttledTakeInput();
    updateCalendar();

    api.show = show;
    api.hide = hide;
    api.datepicker = container;
    api.input = input;
    api.getDate = getDate;
    api.getDateString = getDateString;
    api.getMoment = getMoment;
    api.destroy = destroy;
    api.options = changeOptions;
  }

  function destroy () {
    container.parentNode.removeChild(container);
    input.removeEventListener('click', show);
    input.removeEventListener('focus', show);
    input.removeEventListener('change', throttledTakeInput);
    input.removeEventListener('keypress', throttledTakeInput);
    input.removeEventListener('keydown', throttledTakeInput);
    input.removeEventListener('input', throttledTakeInput);
    if (o.invalidate) { input.removeEventListener('blur', updateInput); }
    if (o.autoHideOnBlur) { input.addEventListener('blur', hide); }
    if (o.autoHideOnClick) { document.body.removeEventListener('click', takeHint); }

    // reverse order micro-optimization
    delete api.options;
    delete api.destroy;
    delete api.getMoment;
    delete api.getDateString;
    delete api.getDate;
    delete api.input;
    delete api.datepicker;
    delete api.hide;
    delete api.show;
    api.init = init;
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
    if (!o.time) {
      return;
    }
    var timewrapper = dom({ className: o.styles.time, parent: container });
    time = dom({ className: o.styles.selectedTime, parent: timewrapper });
    time.innerText = time.textContent = ref.format(o.timeFormat);
  }

  function show () {
    container.style.display = 'block';
    container.style.position = 'absolute';
    container.style.top = input.offsetTop + input.offsetHeight;
    container.style.left = input.offsetLeft;
  }

  function hide () { container.style.display = 'none'; }

  function takeHint (e) {
    var target = e.target;
    if (target === input) {
      return;
    }
    while (target) {
      if (target === container) {
        return;
      }
      target = target.parentNode;
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
    month.innerText = month.textContent = ref.format(o.monthFormat);
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
    time.innerText = time.textContent = ref.format(o.timeFormat);
  }

  function updateInput () {
    input.value = ref.format(o.inputFormat);
  }

  function update () {
    updateCalendar();
    updateInput();
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
    var day = parseInt(target.innerText || target.textContent, 10);
    var query = '.' + o.styles.selectedDay.replace(/\s+/g, '.');
    var prev = container.querySelector(query);
    if (prev) { prev.classList.remove(o.styles.selectedDay); }
    target.classList.add(o.styles.selectedDay);
    ref.date(day);
    if (o.autoClose) { hide(); }
    updateInput();
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
