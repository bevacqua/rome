'use strict';

var input = require('./input');
var inline = require('./inline');
var index = require('./index');
var use = require('./use');

input.use = use.bind(input);
input.find = index.find;
input.inline = inline;

module.exports = input;
