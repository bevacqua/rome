'use strict';

var crossvent = require('crossvent');
var throttle = require('./throttle');

function popup (el, target, options) {
  var o = options || {};
  var destroyed = false;
  var throttledPosition = throttle(position, 30);

  position();

  if (o.tracking !== false) {
    crossvent.add(window, 'resize', throttledPosition);
  }

  return {
    refresh: position,
    destroy: destroy
  };

  function position () {
    if (destroyed) {
      throw new Error('Popup can\'t refresh after being destroyed. Create another instance instead.');
    }
    var bounds = target.getBoundingClientRect();
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var pageHeight = document.documentElement.clientHeight+scrollTop;
	  var elSize = getElementSize(el);
	  var top = bounds.top + scrollTop + target.offsetHeight;
	  var elBottom = bounds.bottom + elSize.h;
	  if (elBottom > pageHeight){
		  top = top - elSize.h - target.offsetHeight;// bounds.top + scrollTop + target.offsetHeight;
	  }
    el.style.top  = top +'px';
    el.style.left = bounds.left + 'px';

  }

	function getElementSize(element){
		//Create unique class
		var tempId = 'tmp-'+Math.floor(Math.random()*99999);
		//CloneEl and insert just after
		var clone = element.cloneNode(true);
		element.parentNode.appendChild(clone);
		//Position somewhere far away
		clone.style.left = '-1000em';
		// Add Class
		var classes = clone.className.split(' ');
		classes.push(tempId);
		clone.className = classes.join(' ');
		//Display and get the size
		clone.style.display = 'block';
		var tempEl = document.getElementsByClassName(tempId)[0];
		var elementSize = { h: tempEl.clientHeight,
							 w: tempEl.clientWidth};
		//remove
		tempEl.parentNode.removeChild(tempEl);

		return elementSize;
	}

  function destroy () {
    crossvent.remove(window, 'resize', throttledPosition);
    destroyed = true;
  }
}

module.exports = popup;
