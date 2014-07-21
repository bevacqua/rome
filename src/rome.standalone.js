var rome = require('./rome');

rome.moment = global.moment;

if (rome.moment === void 0) {
  throw new Error('rome depends on moment.js, you can get it at http://momentjs.com, or you could use the bundled distribution file instead.');
}
