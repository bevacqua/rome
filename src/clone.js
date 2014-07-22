'use strict';

var clonedeep = require('lodash.clonedeep');

function clone (thing, moment) {
  function transmute (value) {
    if (moment.isMoment(value)) {
      return value.clone();
    }
  }
  return clonedeep(thing, transmute);
}

module.exports = clone;
