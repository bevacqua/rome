'use strict';

var moment = require('moment');
var throttle = require('lodash.throttle');

function dom (options) {
  var o = options || {};
  if (!o.type) { o.type = 'div'; }
  var elem = document.createElement(o.type);
  if (o.classes) { elem.className = o.classes; }
  if (o.text) { elem.innerText = elem.textContent = o.text; }
  if (o.parent) { o.parent.appendChild(elem); }
  return elem;
}

function calendar (input, options) {
  var no;
  var o = options || {};
  if (o.autoHide === no) { o.autoHide = true; }
  if (o.inputFormat === no) { o.inputFormat = 'YYYY-MM-DD HH:mm'; }
  if (o.calendar === no) { o.calendar = {}; }
  var cal = o.calendar;
  if (cal.containerClass === no) { cal.containerClass = 'rd-container'; }
  if (cal.monthClass === no) { cal.monthClass = 'rd-month'; }
  if (cal.backClass === no) { cal.backClass = 'rd-back'; }
  if (cal.nextClass === no) { cal.nextClass = 'rd-next'; }
  if (cal.monthFormat === no) { cal.monthFormat = 'MMMM YYYY'; }
  if (cal.dayFormat === no) { cal.dayFormat = 'DD'; }
  if (cal.appendTo === no) { cal.appendTo = document.body; }
  if (cal.dayTableClass === no) { cal.dayTableClass = 'rd-days'; }
  if (cal.dayHeadClass === no) { cal.dayHeadClass = 'rd-days-head'; }
  if (cal.dayHeadElemClass === no) { cal.dayHeadElemClass = 'rd-day-head'; }
  if (cal.dayRowClass === no) { cal.dayRowClass = 'rd-days-row'; }
  if (cal.dayBodyClass === no) { cal.dayBodyClass = 'rd-days-body'; }
  if (cal.dayBodyElemClass === no) { cal.dayBodyElemClass = 'rd-day-body'; }
  if (cal.selectedDayClass === no) { cal.selectedDayClass = 'rd-day-selected'; }
  if (cal.dayDisabledClass === no) { cal.dayDisabledClass = 'rd-day-disabled'; }

  var container = dom({ classes: cal.containerClass });
  var back = dom({ classes: cal.backClass, parent: container });
  var next = dom({ classes: cal.nextClass, parent: container });
  var month = dom({ classes: cal.monthClass, parent: container });
  var date = dom({ type: 'table', classes: cal.dayTableClass, parent: container });
  var datehead = dom({ type: 'thead', classes: cal.dayHeadClass, parent: date });
  var dateheadrow = dom({ type: 'tr', classes: cal.dayRowClass, parent: datehead });
  var datebody = dom({ type: 'tbody', classes: cal.dayBodyClass, parent: date });
  var ref = moment();
  var lastUpdate;
  var i;
  var weekdays = moment.weekdaysMin();

  for (i = 0; i < weekdays.length; i++) {
    dom({ type: 'th', classes: cal.dayHeadElemClass, parent: dateheadrow, text: weekdays[i] });
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
      if (val.isValid()) { ref = val; updated(); }
    }
  }
  function subtractMonth () { ref.subtract('months', 1); updatedMonth(); }
  function addMonth () { ref.add('months', 1); updatedMonth(); }
  function updatedMonth () {
    var value = ref.format(cal.monthFormat);
    if (value === lastUpdate) {
      return;
    }
    month.innerText = month.textContent = lastUpdate = value;
    clearDays();
    drawDays();
  }

  function clearDays () {
    while (datebody.firstChild) {
      datebody.removeChild(datebody.firstChild);
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
    var disabled = cal.dayBodyElemClass + ' ' + cal.dayDisabledClass;

    for (i = 0; i < firstDay; i++) {
      day = first.clone().subtract('days', firstDay - i);
      node = dom({ type: 'td', classes: disabled, parent: tr, text: day.format(cal.dayFormat) });
    }
    for (i = 0; i < total; i++) {
      if (tr.children.length === weekdays.length) {
        tr = row();
      }
      day = first.clone().add('days', i);
      node = dom({ type: 'td', classes: cal.dayBodyElemClass, parent: tr, text: day.format(cal.dayFormat) });
      if (day.date() === current) {
        node.classList.add(cal.selectedDayClass);
      }
    }
    lastMoment = day.clone();
    lastDay = lastMoment.day();
    for (i = 1; tr.children.length < weekdays.length; i++) {
      day = lastMoment.clone().add('days', i);
      node = dom({ type: 'td', classes: disabled, parent: tr, text: day.format(cal.dayFormat) });
    }
  }

  function row () {
    return dom({ type: 'tr', classes: cal.dayRowClass, parent: datebody });
  }

  function pickDay (e) {
    var target = e.target;
    if (!target.classList.contains(cal.dayBodyElemClass)) {
      return;
    }
    var day = parseInt(target.innerText || target.textContent);
    var query = '.' + cal.selectedDayClass.replace(/\s+/g, '.');
    var prev = container.querySelector(query);
    if (prev) { prev.classList.remove(cal.selectedDayClass); }
    target.classList.add(cal.selectedDayClass);
    ref.date(day);
    updateInput();
  }

  function updated () {
    updatedMonth();
  }

  function updateInput () {
    input.value = ref.format(o.inputFormat);
  }

  hide();
  takeInput();
  updated();

  var throttledTakeInput = throttle(takeInput, 100);

  cal.appendTo.appendChild(container);
  input.addEventListener('click', show);
  input.addEventListener('change', throttledTakeInput);
  input.addEventListener('keypress', throttledTakeInput);
  input.addEventListener('keydown', throttledTakeInput);
  input.addEventListener('input', throttledTakeInput);
  back.addEventListener('click', subtractMonth);
  next.addEventListener('click', addMonth);
  datebody.addEventListener('click', pickDay);

  if (o.autoHide) { document.body.addEventListener('click', takeHint); }

  function getDate () {
    return ref.toDate();
  }

  function getDateString (format) {
    return ref.format(format || o.inputFormat);
  }

  function getMoment () {
    return ref.clone();
  }

  return {
    show: show,
    hide: hide,
    element: container,
    getDate: getDate,
    getDateString: getDateString,
    getMoment: getMoment
  };
}

// TODO: time (optional)

module.exports = calendar;
