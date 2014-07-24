'use strict';

var parse = require('./parse');
var index = require('./index');

function pull (value) {
  var cal = index.find(value);
  if (cal && cal.getMoment) {
    return cal.getMoment();
  }
}

var afterInclusive = builder(function (date, value) { return date >= value; });
var afterExclusive = builder(function (date, value) { return date > value; });
var beforeInclusive = builder(function (date, value) { return date <= value; });
var beforeExclusive = builder(function (date, value) { return date < value; });

function builder (compare) {
  return function factory (value) {
    var fixed = parse(value);

    return function (date) {
      var ref = parse(date);
      var provided = fixed || pull(value);
      if (!provided) {
        return false;
      }
      return compare(ref, provided);
    };
  };
}

module.exports = {
  after: afterInclusive,
  afterExclusive: afterExclusive,
  before: beforeInclusive,
  beforeExclusive: beforeExclusive
};
