'use strict';

var input = require('./input');
var inline = require('./inline');
var isInput = require('./isInput');

function core (elem, options) {
  var o;
  if (isInput(elem)) {
    return input(elem, options);
  }
  o = options || {};
  o.appendTo = elem;
  return inline(o);
}

module.exports = core;
