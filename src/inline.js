'use strict';

var raf = require('raf');
var calendar = require('./calendar');
var index = require('./index');

function inline (calendarOptions) {
  var parent = calendarOptions.appendTo;
  var existing = index.find(parent);
  if (existing) {
    return existing;
  }
  var cal = calendar(calendarOptions)
    .on('ready', ready)
    .on('destroyed', destroy);

  function ready () {
    raf(cal.show);
    cal.associated = parent;
  }

  function destroy () {
    delete api.associated;
  }

  index.assign(parent, cal);
  return cal;
}

module.exports = inline;
