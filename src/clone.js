'use strict';

var clonedeep = require('lodash.clonedeep');

function transmute (value) {
  if (calendar.moment.isMoment(value)) {
    return value.clone();
  }
}

function clone (thing) {
  return clonedeep(thing, transmute);
}

module.exports = clone;
