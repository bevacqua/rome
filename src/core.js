'use strict';

var input = require('./input');
var inline = require('./inline');

function core (elem, options) {
  var o;
  if (elem.nodeName.toLowerCase() === 'input') {
    return input(elem, options);
  }
  o = options || {};
  o.appendTo = elem;
  return inline(o);
}

module.exports = core;
