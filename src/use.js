'use strict';

var momentum = require('./momentum');

function use (moment) {
  this.moment = momentum.moment = moment;
}

module.exports = use;
