'use strict';

var core = require('./core');
var index = require('./index');
var use = require('./use');

core.use = use.bind(core);
core.find = index.find;

module.exports = core;
