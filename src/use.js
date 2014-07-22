'use strict';

var momentum = require('./momentum');

function use (moment) {
  momentum.moment = moment;
}

module.exports = use;
