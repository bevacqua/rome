'use strict';

var moment = require('moment');
var throttle = require('lodash.throttle');

function dom (options) {
  var o = options || {};
  if (!o.type) { o.type = 'div'; }
  var elem = document.createElement(o.type);
  if (o.className) { elem.className = o.className; }
  if (o.text) { elem.innerText = elem.textContent = o.text; }
  if (o.parent) { o.parent.appendChild(elem); }
  return elem;
}

function calendar (input, options) {
  var no;
  var o = options || {};
  if (o.autoHide === no) { o.autoHide = true; }
  if (o.autoClose === no) { o.autoClose = true; }
  if (o.appendTo === no) { o.appendTo = document.body; }
  if (o.appendTo === 'parent') { o.appendTo = input.parentNode; }
  if (o.date === no) { o.date = true; }
  if (o.time === no) { o.time = true; }
  if (o.date === false && o.time === false) { throw new Error('At least one of `date` or `time` must be `true`.'); }
  if (o.inputFormat === no) {
    if (o.date && o.time) {
      o.inputFormat = 'YYYY-MM-DD HH:mm';
    } else if (o.date) {
      o.inputFormat = 'YYYY-MM-DD';
    } else {
      o.inputFormat = 'HH:mm';
    }
  }
  if (o.timeFormat === no) { o.timeFormat = 'HH:mm'; }
  if (o.timeInterval === no) { o.timeInterval = 60 * 30; } // 30 minutes by default
  if (o.monthFormat === no) { o.monthFormat = 'MMMM YYYY'; }
  if (o.dayFormat === no) { o.dayFormat = 'DD'; }
  if (o.styles === no) { o.styles = {}; }
  var styl = o.styles;
  if (styl.container === no) { styl.container = 'rd-container'; }
  if (styl.date === no) { styl.date = 'rd-date'; }
  if (styl.month === no) { styl.month = 'rd-month'; }
  if (styl.back === no) { styl.back = 'rd-back'; }
  if (styl.next === no) { styl.next = 'rd-next'; }
  if (styl.dayTable === no) { styl.dayTable = 'rd-days'; }
  if (styl.dayHead === no) { styl.dayHead = 'rd-days-head'; }
  if (styl.dayHeadElem === no) { styl.dayHeadElem = 'rd-day-head'; }
  if (styl.dayRow === no) { styl.dayRow = 'rd-days-row'; }
  if (styl.dayBody === no) { styl.dayBody = 'rd-days-body'; }
  if (styl.dayBodyElem === no) { styl.dayBodyElem = 'rd-day-body'; }
  if (styl.selectedDay === no) { styl.selectedDay = 'rd-day-selected'; }
  if (styl.dayDisabled === no) { styl.dayDisabled = 'rd-day-disabled'; }
  if (styl.time === no) { styl.time = 'rd-time'; }

  var ref = moment();
  var container = dom({ className: styl.container });
  var throttledTakeInput = throttle(takeInput, 100);

  // date variables
  var weekdays = moment.weekdaysMin();
  var month;
  var datebody;
  var lastMonth;

  renderDates();
  renderTime();
  init();
  hide();
  throttledTakeInput();
  updatedMonth();

  var api = {
    show: show,
    hide: hide,
    element: container,
    getDate: getDate,
    getDateString: getDateString,
    getMoment: getMoment,
    destroy: destroy
  };

  function init () {
    o.appendTo.appendChild(container);
    input.addEventListener('click', show);
    input.addEventListener('focus', show);
    input.addEventListener('change', throttledTakeInput);
    input.addEventListener('keypress', throttledTakeInput);
    input.addEventListener('keydown', throttledTakeInput);
    input.addEventListener('input', throttledTakeInput);
    if (o.autoHide) { document.body.addEventListener('click', takeHint); }
  }

  function destroy () {
    container.parentNode.removeChild(container);
    input.removeEventListener('click', show);
    input.removeEventListener('focus', show);
    input.removeEventListener('change', throttledTakeInput);
    input.removeEventListener('keypress', throttledTakeInput);
    input.removeEventListener('keydown', throttledTakeInput);
    input.removeEventListener('input', throttledTakeInput);
    if (o.autoHide) { document.body.removeEventListener('click', takeHint); }
    Object.keys(api).forEach(function (key) { delete api[key]; });
  }

  function renderDates () {
    if (!o.date) {
      return;
    }
    var datewrapper = dom({ className: styl.date, parent: container });
    var back = dom({ className: styl.back, parent: datewrapper });
    var next = dom({ className: styl.next, parent: datewrapper });
    month = dom({ className: styl.month, parent: datewrapper });
    var date = dom({ type: 'table', className: styl.dayTable, parent: datewrapper });
    var datehead = dom({ type: 'thead', className: styl.dayHead, parent: date });
    var dateheadrow = dom({ type: 'tr', className: styl.dayRow, parent: datehead });
    datebody = dom({ type: 'tbody', className: styl.dayBody, parent: date });
    var i;

    for (i = 0; i < weekdays.length; i++) {
      dom({ type: 'th', className: styl.dayHeadElem, parent: dateheadrow, text: weekdays[i] });
    }

    back.addEventListener('click', subtractMonth);
    next.addEventListener('click', addMonth);
    datebody.addEventListener('click', pickDay);
  }

  function renderTime () {
    if (!o.time) {
      return;
    }
    var timewrapper = dom({ className: styl.time, parent: container });
    timewrapper.innerText = timewrapper.textContent = ref.format(o.timeFormat);
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
      if (val.isValid()) { ref = val; updatedMonth(); }
    }
  }
  function subtractMonth () { ref.subtract('months', 1); update(); }
  function addMonth () { ref.add('months', 1); update(); }
  function updatedMonth () {
    if (!o.date) {
      return;
    }
    var value = ref.month();
    if (value === lastMonth) {
      return;
    }
    month.innerText = month.textContent = ref.format(o.monthFormat);
    lastMonth = ref.month();
    clearDays();
    drawDays();
  }

  function updateInput () {
    input.value = ref.format(o.inputFormat);
  }

  function update () {
    updatedMonth();
    updateInput();
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
    var disabled = styl.dayBodyElem + ' ' + styl.dayDisabled;

    for (i = 0; i < firstDay; i++) {
      day = first.clone().subtract('days', firstDay - i);
      node = dom({ type: 'td', className: disabled, parent: tr, text: day.format(o.dayFormat) });
    }
    for (i = 0; i < total; i++) {
      if (tr.children.length === weekdays.length) {
        tr = row();
      }
      day = first.clone().add('days', i);
      node = dom({ type: 'td', className: styl.dayBodyElem, parent: tr, text: day.format(o.dayFormat) });
      if (day.date() === current) {
        node.classList.add(styl.selectedDay);
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
    return dom({ type: 'tr', className: styl.dayRow, parent: datebody });
  }

  function pickDay (e) {
    var target = e.target;
    if (target.classList.contains(styl.dayDisabled) || !target.classList.contains(styl.dayBodyElem)) {
      return;
    }
    var day = parseInt(target.innerText || target.textContent, 10);
    var query = '.' + styl.selectedDay.replace(/\s+/g, '.');
    var prev = container.querySelector(query);
    if (prev) { prev.classList.remove(styl.selectedDay); }
    target.classList.add(styl.selectedDay);
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

// TODO: time (optional)

module.exports = calendar;
