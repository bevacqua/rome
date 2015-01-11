'use strict';

var raf = require('raf');
var calendar = require('./calendar');

function inline (elem, calendarOptions) {
  var o = calendarOptions || {};

  o.appendTo = elem;

  return calendar(o);
}

module.exports = inline;
