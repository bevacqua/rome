'use strict';

var raf = require('raf');
var calendar = require('./calendar');

function inline (elem, calendarOptions) {
  var o = calendarOptions || {};

  o.appendTo = elem;

  var api = calendar(o)
    .on('ready', ready)
    .on('destroyed', destroy);

  function ready () {
    raf(api.show);
    api.associated = elem;
  }

  function destroy () {
    delete api.associated;
  }

  return api;
}

module.exports = inline;
