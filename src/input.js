'use strict';

var throttle = require('lodash.throttle');
var raf = require('raf');
var clone = require('./clone');
var calendar = require('./calendar');
var momentum = require('./momentum');
var classes = require('./classes');
var events = require('./events');

function inputCalendar (input, calendarOptions) {
  var o;
  var api = calendar(calendarOptions);
  var throttledTakeInput = throttle(takeInput, 50);
  var throttledPosition = throttle(position, 30);
  var ignoreInvalidation;
  var ignoreShow;

  bindEvents();

  function init (superOptions) {
    o = clone(superOptions);

    classes.add(api.container, o.styles.positioned);
    events.add(api.container, 'mousedown', containerMouseDown);
    events.add(api.container, 'click', containerClick);

    api.getDate = unrequire(api.getDate);
    api.getDateString = unrequire(api.getDateString);
    api.getMoment = unrequire(api.getMoment);

    if (o.initialValue) {
      input.value = o.initialValue.format(o.inputFormat);
    }

    api.on('data', updateInput);
    api.on('show', throttledPosition);

    eventListening();
    throttledTakeInput();
  }

  function destroy () {
    eventListening(true);
    raf(bindEvents);
  }

  function bindEvents () {
    api.once('ready', init);
    api.once('destroyed', destroy);
  }

  function eventListening (remove) {
    var op = remove ? 'remove' : 'add';
    events[op](input, 'click', show);
    events[op](input, 'touchend', show);
    events[op](input, 'focusin', show);
    events[op](input, 'change', throttledTakeInput);
    events[op](input, 'keypress', throttledTakeInput);
    events[op](input, 'keydown', throttledTakeInput);
    events[op](input, 'input', throttledTakeInput);
    if (o.invalidate) { events[op](input, 'blur', invalidateInput); }
    events[op](window, 'resize', throttledPosition);
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
      api.emitValues();
    }
  }

  function show () {
    if (ignoreShow) {
      return;
    }
    api.show();
  }

  function position () {
    var bounds = input.getBoundingClientRect();
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    api.container.style.top  = bounds.top + scrollTop + input.offsetHeight + 'px';
    api.container.style.left = bounds.left + 'px';
  }

  function takeInput () {
    var value = input.value.trim();
    if (isEmpty()) {
      return;
    }
    var date = momentum.moment(value, o.inputFormat);
    api.setValue(date);
  }

  function updateInput (data) {
    input.value = data;
  }

  function isEmpty () {
    return o.required === false && input.value.trim() === '';
  }

  function unrequire (fn) {
    return function maybe () {
      return isEmpty() ? null : fn.apply(this, arguments);
    };
  }

  return api;
}

module.exports = inputCalendar;
