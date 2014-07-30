'use strict';

var throttle = require('lodash.throttle');
var raf = require('raf');
var clone = require('./clone');
var calendar = require('./calendar');
var momentum = require('./momentum');
var no;

function inputCalendar (input, calendarOptions) {
  var o;
  var api = calendar(calendarOptions);
  var throttledTakeInput = throttle(takeInput, 50);
  var throttledPosition = throttle(position, 30);
  var ignoreInvalidation;
  var ignoreShow;

  events();

  function init (superOptions) {
    o = clone(superOptions, momentum.moment);

    api.container.classList.add(o.styles.positioned);
    api.container.addEventListener('mousedown', containerMouseDown);
    api.container.addEventListener('click', containerClick);

    api.associated = input;
    api.getDate = unrequire(api.getDate);
    api.getDateString = unrequire(api.getDateString);
    api.getMoment = unrequire(api.getMoment);

    if (o.initialValue) {
      input.value = o.initialValue.format(o.inputFormat);
    }

    api.on('data', updateInput);

    eventListening();
    throttledTakeInput();
  }

  function destroy () {
    eventListening(true);
    delete api.associated;
    raf(events);
  }

  function events () {
    api.once('ready', init);
    api.once('destroyed', destroy);
  }

  function eventListening (remove) {
    var prefix = remove ? 'remove' : 'add';
    var op = prefix + 'EventListener';
    input[op]('click', show);
    input[op]('focusin', show);
    input[op]('change', throttledTakeInput);
    input[op]('keypress', throttledTakeInput);
    input[op]('keydown', throttledTakeInput);
    input[op]('input', throttledTakeInput);
    if (o.invalidate) { input[op]('blur', invalidateInput); }
    window[op]('resize', throttledPosition);
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
    position();
  }

  function position () {
    var bounds = input.getBoundingClientRect();
    var scrollTop = document.body.scrollTop;
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
