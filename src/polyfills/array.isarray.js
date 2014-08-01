Array.isArray || (Array.isArray = function (a) {
  return '' + a !== a && Object.prototype.toString.call(a) === '[object Array]';
});
