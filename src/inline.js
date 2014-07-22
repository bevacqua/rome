'use strict';

var calendar = require('./calendar');
var index = require('./index');

function inline (calendarOptions) {
  var parent = calendarOptions.appendTo;
  var existing = index.find();
  if (existing) {
    return existing;
  }
  var cal = calendar(calendarOptions)
    .on('ready', ready)
    .on('destroyed', destroy);

  function ready () {
    cal.show();
    cal.associated = parent;
  }

  function destroy () {
    delete api.associated;
  }

  index.assign(parent, cal);
  return cal;
}

module.exports = inline;
