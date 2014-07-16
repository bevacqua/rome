'use strict';

var moment = require('moment');
var throttle = require('lodash.throttle');

function c (options) {
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
  if (o.calendar === no) { o.calendar = {}; }
  var cal = o.calendar;
  if (cal.containerClass === no) { cal.containerClass = 'rd-container'; }
  if (cal.monthClass === no) { cal.monthClass = 'rd-month'; }
  if (cal.backClass === no) { cal.backClass = 'rd-back'; }
  if (cal.nextClass === no) { cal.nextClass = 'rd-next'; }
  if (cal.monthFormat === no) { cal.monthFormat = 'MMMM YYYY'; }
  if (cal.dayFormat === no) { cal.dayFormat = 'DD'; }
  if (cal.appendTo === no) { cal.appendTo = document.body; }
  if (o.autoHide === no) { o.autoHide = true; }
  if (o.inputFormat === no) { o.inputFormat = 'YYYY-MM-DD HH:mm'; }
  if (o.dayTableClass === no) { o.dayTableClass = 'rd-days'; }
  if (o.dayHeadClass === no) { o.dayHeadClass = 'rd-days-head'; }
  if (o.dayHeadElemClass === no) { o.dayHeadClass = 'rd-day-head'; }
  if (o.dayRowClass === no) { o.dayHeadClass = 'rd-days-row'; }
  if (o.dayBodyClass === no) { o.dayHeadClass = 'rd-days-head'; }
  if (o.selectedDayClass === no) { o.selectedDayClass = 'rd-day-selected'; }

  var container = c({ classes: cal.containerClass });
  var back = c({ classes: cal.backClass, parent: container });
  var month = c({ classes: cal.monthClass, parent: container });
  var next = c({ classes: cal.nextClass, parent: container });
  var date = c({ type: 'table', classes: cal.dayTableClass, parent: container });
  var datehead = c({ type: 'thead', classes: cal.dayHeadClass, parent: date });
  var dateheadrow = c({ type: 'tr', classes: cal.dayRowClass, parent: datehead });
  var datebody = c({ type: 'tbody', classes: cal.dayBodyClass, parent: date });
  var ref = moment();
  var lastUpdate;
  var i;
  var weekdays = moment.weekdaysMin();

  for (i = 0; i < weekdays.length; i++) {
    c({ type: 'th', classes: cal.dayHeadElementClass, parent: dateheadrow, text: weekdays[i] });
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
    var lastDay;
    var i, day, node;
    var tr = row();

    for (i = 0; i < firstDay; i++) {
      day = first.clone().subtract('days', firstDay - i);
      node = c({ type: 'td', classes: cal.dayBodyElemClass, parent: tr, text: day.format(cal.dayFormat) });
      node.disabled = true;
    }
    for (i = 0; i < total; i++) {
      if (tr.children.length === weekdays.length) {
        tr = row();
      }
      day = first.clone().add('days', i);
      node = c({ type: 'td', classes: cal.dayBodyElemClass, parent: tr, text: day.format(cal.dayFormat) });
      if (day.date() === current) {
        node.classList.add(cal.selectedDayClass);
      }
    }
    lastDay = day.day();
    for (i = lastDay; i < weekdays.length; i++) {
      day = lastDay.clone().add('days', i);
      node = c({ type: 'td', classes: cal.dayBodyElemClass, parent: tr, text: day.format(cal.dayFormat) });
      node.disabled = true;
    }

    function row () {
       return c({ type: 'tr', classes: cal.dayRowClass, parent: datebody });
    }
  }

  function pickDay (e) {
    var day = e.target;
  }

  function updated () {
    updatedMonth();
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
  days.addEventListener('click', pickDay);

  if (o.autoHide) { document.body.addEventListener('click', takeHint); }

// TODO: days, time (optional)

  return {
    show: show,
    hide: hide,
    element: container,
    ref: ref
  };
}

module.exports = calendar;
