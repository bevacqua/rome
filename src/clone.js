'use strict';

var momentum = require('./momentum');
var clonedeep = require('lodash.clonedeep');

function clone (thing, moment) {
  function transmute (value) {
    if (momentum.isMoment(value)) {
      return value.clone();
    }
  }
  return clonedeep(thing, transmute);
}

module.exports = clone;
