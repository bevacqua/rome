'use strict';

var momentum = require('./momentum');

function raw (date, format) {
  if (typeof date === 'string') {
    return momentum.moment(date, format);
  }
  if (Object.prototype.toString.call(date) === '[object Date]') {
    return momentum.moment(date);
  }
  if (momentum.moment.isMoment(date)) {
    return date;
  }
}

function parse (date, format) {
  var m = raw(date, format);
  return m && m.isValid() ? m : null;
}

module.exports = parse;
