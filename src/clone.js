'use strict';

var momentum = require('./momentum');

// naïve implementation, only meant to clone `options` objects
function clone (thing) {
  var copy = {};
  var value;
  var type;

  for (var key in thing) {
    value = thing[key];
    type = Object.prototype.toString.call(value);

    if (!value) {
      copy[key] = value;
    } else if (momentum.isMoment(value)) {
      copy[key] = value.clone();
    } else if (value._isStylesConfiguration) {
      copy[key] = clone(value);
    } else {
      copy[key] = value;
    }
  }

  return copy;
}

module.exports = clone;
