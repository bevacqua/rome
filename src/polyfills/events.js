(function (window, document) {
  if (window.addEventListener) {
    return;
  }

  function hijack (prop) {
    var old = document[prop];
    document[prop] = function addEventListenerPolyfillAdapter () {
      return polyfill(old.apply(this, arguments));
    };
  }

  function addEvent (evt, fn) {
    var self = this;
    return self.attachEvent('on' + evt, function (e) {
      var e = e || window.event;
      e.preventDefault  = e.preventDefault  || function preventDefault () { e.returnValue = false; }
      e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; }
      fn.call(self, e);
    });
  }

  function polyfill (o, i) {
    if (i = o.length) {
      while(i--) {
        o[i].addEventListener = addEvent;
      }
    } else {
      o.addEventListener = addEvent;
    }
    return o;
  }

  polyfill([document, window]);

  if ('Element' in window) { // IE8
    window.Element.prototype.addEventListener = addEvent;
  } else { // IE < 8
    document.attachEvent('onreadystatechange', ready);
    hijack('getElementsByTagName');
    hijack('getElementById');
    hijack('createElement');
    ready();
  }

  function ready () {
    polyfill(document.all); // make sure we also init at domReady
  }
})(window, document);
