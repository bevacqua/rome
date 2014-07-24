'use strict';

var parse = require('./parse');
var index = require('./index');

function pull (value) {
  var cal = index.find(value);
  if (cal && cal.getMoment) {
    return cal.getMoment();
  }
}

var afterEq = builder(function (date, value) { return date >= value; });
var after = builder(function (date, value) { return date > value; });
var beforeEq = builder(function (date, value) { return date <= value; });
var before = builder(function (date, value) { return date < value; });

function builder (compare) {
  return function factory (value) {
    var fixed = parse(value);

    return function (date) {
      var ref = parse(date);
      var provided = fixed || pull(value);
      if (!provided) {
        return true;
      }
      return compare(ref, provided);
    };
  };
}

module.exports = {
  afterEq: afterEq,
  after: after,
  beforeEq: beforeEq,
  before: before
};
