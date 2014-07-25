'use strict';

var parse = require('./parse');
var index = require('./index');
var isInput = require('./isInput');
var bindings = {};

var afterEq = builder(function (left, right) { return left >= right; });
var after = builder(function (left, right) { return left > right; });
var beforeEq = builder(function (left, right) { return left <= right; });
var before = builder(function (left, right) { return left < right; });

function builder (compare) {
  return function factory (value) {
    var fixed = parse(value);

    return function (date) {
      var cal = index.find(value);
      var left = parse(date);
      var right = fixed || cal && cal.getMoment();
      if (!right) {
        return true;
      }
      if (cal) {
        link(this, cal);
      }
      return compare(left, right);
    };
  };
}

function link (source, target) {
  if (isInput(target.associated) || bindings[source.id]) {
    return;
  }
  bindings[source.id] = target.id;
  source.on('data', function () {
    target.refresh();
  });
  source.on('destroyed', function () {
    // when source gets restored the
    // validator will restore the binding
    delete bindings[source.id];
  });
}

module.exports = {
  afterEq: afterEq,
  after: after,
  beforeEq: beforeEq,
  before: before
};
