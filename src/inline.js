'use strict';

var calendar = require('./calendar');

function inline (elem, calendarOptions) {
  var o = calendarOptions || {};

  o.appendTo = elem;

  var cal = calendar(o);
  cal.show();
  return cal;
}

module.exports = inline;
