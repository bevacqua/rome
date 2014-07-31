/**
 * rome - Customizable date (and time) picker. Opt-in UI, no jQuery!
 * @version v0.11.2
 * @link https://github.com/bevacqua/rome
 * @license MIT
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.rome=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(_dereq_,module,exports){
module.exports = _dereq_('./src/contra.emitter.js');

},{"./src/contra.emitter.js":3}],3:[function(_dereq_,module,exports){
(function (process){
(function (root, undefined) {
  'use strict';

  var undef = '' + undefined;
  function atoa (a, n) { return Array.prototype.slice.call(a, n); }
  function debounce (fn, args, ctx) { if (!fn) { return; } tick(function run () { fn.apply(ctx || null, args || []); }); }

  // cross-platform ticker
  var si = typeof setImmediate === 'function', tick;
  if (si) {
    tick = function (fn) { setImmediate(fn); };
  } else if (typeof process !== undef && process.nextTick) {
    tick = process.nextTick;
  } else {
    tick = function (fn) { setTimeout(fn, 0); };
  }

  function _emitter (thing, options) {
    var opts = options || {};
    var evt = {};
    if (thing === undefined) { thing = {}; }
    thing.on = function (type, fn) {
      if (!evt[type]) {
        evt[type] = [fn];
      } else {
        evt[type].push(fn);
      }
      return thing;
    };
    thing.once = function (type, fn) {
      fn._once = true; // thing.off(fn) still works!
      thing.on(type, fn);
      return thing;
    };
    thing.off = function (type, fn) {
      var c = arguments.length;
      if (c === 1) {
        delete evt[type];
      } else if (c === 0) {
        evt = {};
      } else {
        var et = evt[type];
        if (!et) { return thing; }
        et.splice(et.indexOf(fn), 1);
      }
      return thing;
    };
    thing.emit = function () {
      var args = atoa(arguments);
      var type = args.shift();
      var et = evt[type];
      if (type === 'error' && opts.throws !== false && !et) { throw args.length === 1 ? args[0] : args; }
      if (!et) { return thing; }
      evt[type] = et.filter(function emitter (listen) {
        if (opts.async) { debounce(listen, args, thing); } else { listen.apply(thing, args); }
        return !listen._once;
      });
      return thing;
    };
    return thing;
  }

  // cross-platform export
  if (typeof module !== undef && module.exports) {
    module.exports = _emitter;
  } else {
    root.contra = root.contra || {};
    root.contra.emitter = _emitter;
  }
})(this);

}).call(this,_dereq_("FWaASH"))
},{"FWaASH":1}],4:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseClone = _dereq_('lodash._baseclone'),
    baseCreateCallback = _dereq_('lodash._basecreatecallback');

/**
 * Creates a deep clone of `value`. If a callback is provided it will be
 * executed to produce the cloned values. If the callback returns `undefined`
 * cloning will be handled by the method instead. The callback is bound to
 * `thisArg` and invoked with one argument; (value).
 *
 * Note: This method is loosely based on the structured clone algorithm. Functions
 * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
 * objects created by constructors other than `Object` are cloned to plain `Object` objects.
 * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to deep clone.
 * @param {Function} [callback] The function to customize cloning values.
 * @param {*} [thisArg] The `this` binding of `callback`.
 * @returns {*} Returns the deep cloned value.
 * @example
 *
 * var characters = [
 *   { 'name': 'barney', 'age': 36 },
 *   { 'name': 'fred',   'age': 40 }
 * ];
 *
 * var deep = _.cloneDeep(characters);
 * deep[0] === characters[0];
 * // => false
 *
 * var view = {
 *   'label': 'docs',
 *   'node': element
 * };
 *
 * var clone = _.cloneDeep(view, function(value) {
 *   return _.isElement(value) ? value.cloneNode(true) : undefined;
 * });
 *
 * clone.node == view.node;
 * // => false
 */
function cloneDeep(value, callback, thisArg) {
  return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
}

module.exports = cloneDeep;

},{"lodash._baseclone":5,"lodash._basecreatecallback":27}],5:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var assign = _dereq_('lodash.assign'),
    forEach = _dereq_('lodash.foreach'),
    forOwn = _dereq_('lodash.forown'),
    getArray = _dereq_('lodash._getarray'),
    isArray = _dereq_('lodash.isarray'),
    isObject = _dereq_('lodash.isobject'),
    releaseArray = _dereq_('lodash._releasearray'),
    slice = _dereq_('lodash._slice');

/** Used to match regexp flags from their coerced string values */
var reFlags = /\w*$/;

/** `Object#toString` result shortcuts */
var argsClass = '[object Arguments]',
    arrayClass = '[object Array]',
    boolClass = '[object Boolean]',
    dateClass = '[object Date]',
    funcClass = '[object Function]',
    numberClass = '[object Number]',
    objectClass = '[object Object]',
    regexpClass = '[object RegExp]',
    stringClass = '[object String]';

/** Used to identify object classifications that `_.clone` supports */
var cloneableClasses = {};
cloneableClasses[funcClass] = false;
cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
cloneableClasses[boolClass] = cloneableClasses[dateClass] =
cloneableClasses[numberClass] = cloneableClasses[objectClass] =
cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Native method shortcuts */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to lookup a built-in constructor by [[Class]] */
var ctorByClass = {};
ctorByClass[arrayClass] = Array;
ctorByClass[boolClass] = Boolean;
ctorByClass[dateClass] = Date;
ctorByClass[funcClass] = Function;
ctorByClass[objectClass] = Object;
ctorByClass[numberClass] = Number;
ctorByClass[regexpClass] = RegExp;
ctorByClass[stringClass] = String;

/**
 * The base implementation of `_.clone` without argument juggling or support
 * for `thisArg` binding.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep=false] Specify a deep clone.
 * @param {Function} [callback] The function to customize cloning values.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates clones with source counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, callback, stackA, stackB) {
  if (callback) {
    var result = callback(value);
    if (typeof result != 'undefined') {
      return result;
    }
  }
  // inspect [[Class]]
  var isObj = isObject(value);
  if (isObj) {
    var className = toString.call(value);
    if (!cloneableClasses[className]) {
      return value;
    }
    var ctor = ctorByClass[className];
    switch (className) {
      case boolClass:
      case dateClass:
        return new ctor(+value);

      case numberClass:
      case stringClass:
        return new ctor(value);

      case regexpClass:
        result = ctor(value.source, reFlags.exec(value));
        result.lastIndex = value.lastIndex;
        return result;
    }
  } else {
    return value;
  }
  var isArr = isArray(value);
  if (isDeep) {
    // check for circular references and return corresponding clone
    var initedStack = !stackA;
    stackA || (stackA = getArray());
    stackB || (stackB = getArray());

    var length = stackA.length;
    while (length--) {
      if (stackA[length] == value) {
        return stackB[length];
      }
    }
    result = isArr ? ctor(value.length) : {};
  }
  else {
    result = isArr ? slice(value) : assign({}, value);
  }
  // add array properties assigned by `RegExp#exec`
  if (isArr) {
    if (hasOwnProperty.call(value, 'index')) {
      result.index = value.index;
    }
    if (hasOwnProperty.call(value, 'input')) {
      result.input = value.input;
    }
  }
  // exit for shallow clone
  if (!isDeep) {
    return result;
  }
  // add the source value to the stack of traversed objects
  // and associate it with its clone
  stackA.push(value);
  stackB.push(result);

  // recursively populate clone (susceptible to call stack limits)
  (isArr ? forEach : forOwn)(value, function(objValue, key) {
    result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
  });

  if (initedStack) {
    releaseArray(stackA);
    releaseArray(stackB);
  }
  return result;
}

module.exports = baseClone;

},{"lodash._getarray":6,"lodash._releasearray":8,"lodash._slice":11,"lodash.assign":12,"lodash.foreach":17,"lodash.forown":18,"lodash.isarray":23,"lodash.isobject":25}],6:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var arrayPool = _dereq_('lodash._arraypool');

/**
 * Gets an array from the array pool or creates a new one if the pool is empty.
 *
 * @private
 * @returns {Array} The array from the pool.
 */
function getArray() {
  return arrayPool.pop() || [];
}

module.exports = getArray;

},{"lodash._arraypool":7}],7:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to pool arrays and objects used internally */
var arrayPool = [];

module.exports = arrayPool;

},{}],8:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var arrayPool = _dereq_('lodash._arraypool'),
    maxPoolSize = _dereq_('lodash._maxpoolsize');

/**
 * Releases the given array back to the array pool.
 *
 * @private
 * @param {Array} [array] The array to release.
 */
function releaseArray(array) {
  array.length = 0;
  if (arrayPool.length < maxPoolSize) {
    arrayPool.push(array);
  }
}

module.exports = releaseArray;

},{"lodash._arraypool":9,"lodash._maxpoolsize":10}],9:[function(_dereq_,module,exports){
module.exports=_dereq_(7)
},{}],10:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used as the max size of the `arrayPool` and `objectPool` */
var maxPoolSize = 40;

module.exports = maxPoolSize;

},{}],11:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Slices the `collection` from the `start` index up to, but not including,
 * the `end` index.
 *
 * Note: This function is used instead of `Array#slice` to support node lists
 * in IE < 9 and to ensure dense arrays are returned.
 *
 * @private
 * @param {Array|Object|string} collection The collection to slice.
 * @param {number} start The start index.
 * @param {number} end The end index.
 * @returns {Array} Returns the new array.
 */
function slice(array, start, end) {
  start || (start = 0);
  if (typeof end == 'undefined') {
    end = array ? array.length : 0;
  }
  var index = -1,
      length = end - start || 0,
      result = Array(length < 0 ? 0 : length);

  while (++index < length) {
    result[index] = array[start + index];
  }
  return result;
}

module.exports = slice;

},{}],12:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreateCallback = _dereq_('lodash._basecreatecallback'),
    keys = _dereq_('lodash.keys'),
    objectTypes = _dereq_('lodash._objecttypes');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources will overwrite property assignments of previous
 * sources. If a callback is provided it will be executed to produce the
 * assigned values. The callback is bound to `thisArg` and invoked with two
 * arguments; (objectValue, sourceValue).
 *
 * @static
 * @memberOf _
 * @type Function
 * @alias extend
 * @category Objects
 * @param {Object} object The destination object.
 * @param {...Object} [source] The source objects.
 * @param {Function} [callback] The function to customize assigning values.
 * @param {*} [thisArg] The `this` binding of `callback`.
 * @returns {Object} Returns the destination object.
 * @example
 *
 * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
 * // => { 'name': 'fred', 'employer': 'slate' }
 *
 * var defaults = _.partialRight(_.assign, function(a, b) {
 *   return typeof a == 'undefined' ? b : a;
 * });
 *
 * var object = { 'name': 'barney' };
 * defaults(object, { 'name': 'fred', 'employer': 'slate' });
 * // => { 'name': 'barney', 'employer': 'slate' }
 */
var assign = function(object, source, guard) {
  var index, iterable = object, result = iterable;
  if (!iterable) return result;
  var args = arguments,
      argsIndex = 0,
      argsLength = typeof guard == 'number' ? 2 : args.length;
  if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
    var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
  } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
    callback = args[--argsLength];
  }
  while (++argsIndex < argsLength) {
    iterable = args[argsIndex];
    if (iterable && objectTypes[typeof iterable]) {
    var ownIndex = -1,
        ownProps = objectTypes[typeof iterable] && keys(iterable),
        length = ownProps ? ownProps.length : 0;

    while (++ownIndex < length) {
      index = ownProps[ownIndex];
      result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
    }
    }
  }
  return result
};

module.exports = assign;

},{"lodash._basecreatecallback":27,"lodash._objecttypes":13,"lodash.keys":14}],13:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

module.exports = objectTypes;

},{}],14:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative'),
    isObject = _dereq_('lodash.isobject'),
    shimKeys = _dereq_('lodash._shimkeys');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

/**
 * Creates an array composed of the own enumerable property names of an object.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 * @example
 *
 * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
 * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  if (!isObject(object)) {
    return [];
  }
  return nativeKeys(object);
};

module.exports = keys;

},{"lodash._isnative":15,"lodash._shimkeys":16,"lodash.isobject":25}],15:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Used to detect if a method is native */
var reNative = RegExp('^' +
  String(toString)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/toString| for [^\]]+/g, '.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
 */
function isNative(value) {
  return typeof value == 'function' && reNative.test(value);
}

module.exports = isNative;

},{}],16:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = _dereq_('lodash._objecttypes');

/** Used for native method references */
var objectProto = Object.prototype;

/** Native method shortcuts */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which produces an array of the
 * given object's own enumerable property names.
 *
 * @private
 * @type Function
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 */
var shimKeys = function(object) {
  var index, iterable = object, result = [];
  if (!iterable) return result;
  if (!(objectTypes[typeof object])) return result;
    for (index in iterable) {
      if (hasOwnProperty.call(iterable, index)) {
        result.push(index);
      }
    }
  return result
};

module.exports = shimKeys;

},{"lodash._objecttypes":13}],17:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreateCallback = _dereq_('lodash._basecreatecallback'),
    forOwn = _dereq_('lodash.forown');

/**
 * Iterates over elements of a collection, executing the callback for each
 * element. The callback is bound to `thisArg` and invoked with three arguments;
 * (value, index|key, collection). Callbacks may exit iteration early by
 * explicitly returning `false`.
 *
 * Note: As with other "Collections" methods, objects with a `length` property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collections
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [callback=identity] The function called per iteration.
 * @param {*} [thisArg] The `this` binding of `callback`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
 * // => logs each number and returns '1,2,3'
 *
 * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
 * // => logs each number and returns the object (property order is not guaranteed across environments)
 */
function forEach(collection, callback, thisArg) {
  var index = -1,
      length = collection ? collection.length : 0;

  callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
  if (typeof length == 'number') {
    while (++index < length) {
      if (callback(collection[index], index, collection) === false) {
        break;
      }
    }
  } else {
    forOwn(collection, callback);
  }
  return collection;
}

module.exports = forEach;

},{"lodash._basecreatecallback":27,"lodash.forown":18}],18:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreateCallback = _dereq_('lodash._basecreatecallback'),
    keys = _dereq_('lodash.keys'),
    objectTypes = _dereq_('lodash._objecttypes');

/**
 * Iterates over own enumerable properties of an object, executing the callback
 * for each property. The callback is bound to `thisArg` and invoked with three
 * arguments; (value, key, object). Callbacks may exit iteration early by
 * explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {Object} object The object to iterate over.
 * @param {Function} [callback=identity] The function called per iteration.
 * @param {*} [thisArg] The `this` binding of `callback`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
 *   console.log(key);
 * });
 * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
 */
var forOwn = function(collection, callback, thisArg) {
  var index, iterable = collection, result = iterable;
  if (!iterable) return result;
  if (!objectTypes[typeof iterable]) return result;
  callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
    var ownIndex = -1,
        ownProps = objectTypes[typeof iterable] && keys(iterable),
        length = ownProps ? ownProps.length : 0;

    while (++ownIndex < length) {
      index = ownProps[ownIndex];
      if (callback(iterable[index], index, collection) === false) return result;
    }
  return result
};

module.exports = forOwn;

},{"lodash._basecreatecallback":27,"lodash._objecttypes":19,"lodash.keys":20}],19:[function(_dereq_,module,exports){
module.exports=_dereq_(13)
},{}],20:[function(_dereq_,module,exports){
module.exports=_dereq_(14)
},{"lodash._isnative":21,"lodash._shimkeys":22,"lodash.isobject":25}],21:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},{}],22:[function(_dereq_,module,exports){
module.exports=_dereq_(16)
},{"lodash._objecttypes":19}],23:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative');

/** `Object#toString` result shortcuts */
var arrayClass = '[object Array]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;

/**
 * Checks if `value` is an array.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
 * @example
 *
 * (function() { return _.isArray(arguments); })();
 * // => false
 *
 * _.isArray([1, 2, 3]);
 * // => true
 */
var isArray = nativeIsArray || function(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == arrayClass || false;
};

module.exports = isArray;

},{"lodash._isnative":24}],24:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},{}],25:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = _dereq_('lodash._objecttypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // check if the value is the ECMAScript language type of Object
  // http://es5.github.io/#x8
  // and avoid a V8 bug
  // http://code.google.com/p/v8/issues/detail?id=2291
  return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

},{"lodash._objecttypes":26}],26:[function(_dereq_,module,exports){
module.exports=_dereq_(13)
},{}],27:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var bind = _dereq_('lodash.bind'),
    identity = _dereq_('lodash.identity'),
    setBindData = _dereq_('lodash._setbinddata'),
    support = _dereq_('lodash.support');

/** Used to detected named functions */
var reFuncName = /^\s*function[ \n\r\t]+\w/;

/** Used to detect functions containing a `this` reference */
var reThis = /\bthis\b/;

/** Native method shortcuts */
var fnToString = Function.prototype.toString;

/**
 * The base implementation of `_.createCallback` without support for creating
 * "_.pluck" or "_.where" style callbacks.
 *
 * @private
 * @param {*} [func=identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of the created callback.
 * @param {number} [argCount] The number of arguments the callback accepts.
 * @returns {Function} Returns a callback function.
 */
function baseCreateCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  // exit early for no `thisArg` or already bound by `Function#bind`
  if (typeof thisArg == 'undefined' || !('prototype' in func)) {
    return func;
  }
  var bindData = func.__bindData__;
  if (typeof bindData == 'undefined') {
    if (support.funcNames) {
      bindData = !func.name;
    }
    bindData = bindData || !support.funcDecomp;
    if (!bindData) {
      var source = fnToString.call(func);
      if (!support.funcNames) {
        bindData = !reFuncName.test(source);
      }
      if (!bindData) {
        // checks if `func` references the `this` keyword and stores the result
        bindData = reThis.test(source);
        setBindData(func, bindData);
      }
    }
  }
  // exit early if there are no `this` references or `func` is bound
  if (bindData === false || (bindData !== true && bindData[1] & 1)) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 2: return function(a, b) {
      return func.call(thisArg, a, b);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
  }
  return bind(func, thisArg);
}

module.exports = baseCreateCallback;

},{"lodash._setbinddata":28,"lodash.bind":31,"lodash.identity":47,"lodash.support":48}],28:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative'),
    noop = _dereq_('lodash.noop');

/** Used as the property descriptor for `__bindData__` */
var descriptor = {
  'configurable': false,
  'enumerable': false,
  'value': null,
  'writable': false
};

/** Used to set meta data on functions */
var defineProperty = (function() {
  // IE 8 only accepts DOM elements
  try {
    var o = {},
        func = isNative(func = Object.defineProperty) && func,
        result = func(o, o, o) && func;
  } catch(e) { }
  return result;
}());

/**
 * Sets `this` binding data on a given function.
 *
 * @private
 * @param {Function} func The function to set data on.
 * @param {Array} value The data array to set.
 */
var setBindData = !defineProperty ? noop : function(func, value) {
  descriptor.value = value;
  defineProperty(func, '__bindData__', descriptor);
};

module.exports = setBindData;

},{"lodash._isnative":29,"lodash.noop":30}],29:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},{}],30:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * A no-operation function.
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @example
 *
 * var object = { 'name': 'fred' };
 * _.noop(object) === undefined;
 * // => true
 */
function noop() {
  // no operation performed
}

module.exports = noop;

},{}],31:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var createWrapper = _dereq_('lodash._createwrapper'),
    slice = _dereq_('lodash._slice');

/**
 * Creates a function that, when called, invokes `func` with the `this`
 * binding of `thisArg` and prepends any additional `bind` arguments to those
 * provided to the bound function.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to bind.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {...*} [arg] Arguments to be partially applied.
 * @returns {Function} Returns the new bound function.
 * @example
 *
 * var func = function(greeting) {
 *   return greeting + ' ' + this.name;
 * };
 *
 * func = _.bind(func, { 'name': 'fred' }, 'hi');
 * func();
 * // => 'hi fred'
 */
function bind(func, thisArg) {
  return arguments.length > 2
    ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
    : createWrapper(func, 1, null, null, thisArg);
}

module.exports = bind;

},{"lodash._createwrapper":32,"lodash._slice":46}],32:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseBind = _dereq_('lodash._basebind'),
    baseCreateWrapper = _dereq_('lodash._basecreatewrapper'),
    isFunction = _dereq_('lodash.isfunction'),
    slice = _dereq_('lodash._slice');

/**
 * Used for `Array` method references.
 *
 * Normally `Array.prototype` would suffice, however, using an array literal
 * avoids issues in Narwhal.
 */
var arrayRef = [];

/** Native method shortcuts */
var push = arrayRef.push,
    unshift = arrayRef.unshift;

/**
 * Creates a function that, when called, either curries or invokes `func`
 * with an optional `this` binding and partially applied arguments.
 *
 * @private
 * @param {Function|string} func The function or method name to reference.
 * @param {number} bitmask The bitmask of method flags to compose.
 *  The bitmask may be composed of the following flags:
 *  1 - `_.bind`
 *  2 - `_.bindKey`
 *  4 - `_.curry`
 *  8 - `_.curry` (bound)
 *  16 - `_.partial`
 *  32 - `_.partialRight`
 * @param {Array} [partialArgs] An array of arguments to prepend to those
 *  provided to the new function.
 * @param {Array} [partialRightArgs] An array of arguments to append to those
 *  provided to the new function.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new function.
 */
function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
  var isBind = bitmask & 1,
      isBindKey = bitmask & 2,
      isCurry = bitmask & 4,
      isCurryBound = bitmask & 8,
      isPartial = bitmask & 16,
      isPartialRight = bitmask & 32;

  if (!isBindKey && !isFunction(func)) {
    throw new TypeError;
  }
  if (isPartial && !partialArgs.length) {
    bitmask &= ~16;
    isPartial = partialArgs = false;
  }
  if (isPartialRight && !partialRightArgs.length) {
    bitmask &= ~32;
    isPartialRight = partialRightArgs = false;
  }
  var bindData = func && func.__bindData__;
  if (bindData && bindData !== true) {
    // clone `bindData`
    bindData = slice(bindData);
    if (bindData[2]) {
      bindData[2] = slice(bindData[2]);
    }
    if (bindData[3]) {
      bindData[3] = slice(bindData[3]);
    }
    // set `thisBinding` is not previously bound
    if (isBind && !(bindData[1] & 1)) {
      bindData[4] = thisArg;
    }
    // set if previously bound but not currently (subsequent curried functions)
    if (!isBind && bindData[1] & 1) {
      bitmask |= 8;
    }
    // set curried arity if not yet set
    if (isCurry && !(bindData[1] & 4)) {
      bindData[5] = arity;
    }
    // append partial left arguments
    if (isPartial) {
      push.apply(bindData[2] || (bindData[2] = []), partialArgs);
    }
    // append partial right arguments
    if (isPartialRight) {
      unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
    }
    // merge flags
    bindData[1] |= bitmask;
    return createWrapper.apply(null, bindData);
  }
  // fast path for `_.bind`
  var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
  return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
}

module.exports = createWrapper;

},{"lodash._basebind":33,"lodash._basecreatewrapper":39,"lodash._slice":46,"lodash.isfunction":45}],33:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreate = _dereq_('lodash._basecreate'),
    isObject = _dereq_('lodash.isobject'),
    setBindData = _dereq_('lodash._setbinddata'),
    slice = _dereq_('lodash._slice');

/**
 * Used for `Array` method references.
 *
 * Normally `Array.prototype` would suffice, however, using an array literal
 * avoids issues in Narwhal.
 */
var arrayRef = [];

/** Native method shortcuts */
var push = arrayRef.push;

/**
 * The base implementation of `_.bind` that creates the bound function and
 * sets its meta data.
 *
 * @private
 * @param {Array} bindData The bind data array.
 * @returns {Function} Returns the new bound function.
 */
function baseBind(bindData) {
  var func = bindData[0],
      partialArgs = bindData[2],
      thisArg = bindData[4];

  function bound() {
    // `Function#bind` spec
    // http://es5.github.io/#x15.3.4.5
    if (partialArgs) {
      // avoid `arguments` object deoptimizations by using `slice` instead
      // of `Array.prototype.slice.call` and not assigning `arguments` to a
      // variable as a ternary expression
      var args = slice(partialArgs);
      push.apply(args, arguments);
    }
    // mimic the constructor's `return` behavior
    // http://es5.github.io/#x13.2.2
    if (this instanceof bound) {
      // ensure `new bound` is an instance of `func`
      var thisBinding = baseCreate(func.prototype),
          result = func.apply(thisBinding, args || arguments);
      return isObject(result) ? result : thisBinding;
    }
    return func.apply(thisArg, args || arguments);
  }
  setBindData(bound, bindData);
  return bound;
}

module.exports = baseBind;

},{"lodash._basecreate":34,"lodash._setbinddata":28,"lodash._slice":46,"lodash.isobject":37}],34:[function(_dereq_,module,exports){
(function (global){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative'),
    isObject = _dereq_('lodash.isobject'),
    noop = _dereq_('lodash.noop');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} prototype The object to inherit from.
 * @returns {Object} Returns the new object.
 */
function baseCreate(prototype, properties) {
  return isObject(prototype) ? nativeCreate(prototype) : {};
}
// fallback for browsers without `Object.create`
if (!nativeCreate) {
  baseCreate = (function() {
    function Object() {}
    return function(prototype) {
      if (isObject(prototype)) {
        Object.prototype = prototype;
        var result = new Object;
        Object.prototype = null;
      }
      return result || global.Object();
    };
  }());
}

module.exports = baseCreate;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"lodash._isnative":35,"lodash.isobject":37,"lodash.noop":36}],35:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},{}],36:[function(_dereq_,module,exports){
module.exports=_dereq_(30)
},{}],37:[function(_dereq_,module,exports){
module.exports=_dereq_(25)
},{"lodash._objecttypes":38}],38:[function(_dereq_,module,exports){
module.exports=_dereq_(13)
},{}],39:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseCreate = _dereq_('lodash._basecreate'),
    isObject = _dereq_('lodash.isobject'),
    setBindData = _dereq_('lodash._setbinddata'),
    slice = _dereq_('lodash._slice');

/**
 * Used for `Array` method references.
 *
 * Normally `Array.prototype` would suffice, however, using an array literal
 * avoids issues in Narwhal.
 */
var arrayRef = [];

/** Native method shortcuts */
var push = arrayRef.push;

/**
 * The base implementation of `createWrapper` that creates the wrapper and
 * sets its meta data.
 *
 * @private
 * @param {Array} bindData The bind data array.
 * @returns {Function} Returns the new function.
 */
function baseCreateWrapper(bindData) {
  var func = bindData[0],
      bitmask = bindData[1],
      partialArgs = bindData[2],
      partialRightArgs = bindData[3],
      thisArg = bindData[4],
      arity = bindData[5];

  var isBind = bitmask & 1,
      isBindKey = bitmask & 2,
      isCurry = bitmask & 4,
      isCurryBound = bitmask & 8,
      key = func;

  function bound() {
    var thisBinding = isBind ? thisArg : this;
    if (partialArgs) {
      var args = slice(partialArgs);
      push.apply(args, arguments);
    }
    if (partialRightArgs || isCurry) {
      args || (args = slice(arguments));
      if (partialRightArgs) {
        push.apply(args, partialRightArgs);
      }
      if (isCurry && args.length < arity) {
        bitmask |= 16 & ~32;
        return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
      }
    }
    args || (args = arguments);
    if (isBindKey) {
      func = thisBinding[key];
    }
    if (this instanceof bound) {
      thisBinding = baseCreate(func.prototype);
      var result = func.apply(thisBinding, args);
      return isObject(result) ? result : thisBinding;
    }
    return func.apply(thisBinding, args);
  }
  setBindData(bound, bindData);
  return bound;
}

module.exports = baseCreateWrapper;

},{"lodash._basecreate":40,"lodash._setbinddata":28,"lodash._slice":46,"lodash.isobject":43}],40:[function(_dereq_,module,exports){
module.exports=_dereq_(34)
},{"lodash._isnative":41,"lodash.isobject":43,"lodash.noop":42}],41:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},{}],42:[function(_dereq_,module,exports){
module.exports=_dereq_(30)
},{}],43:[function(_dereq_,module,exports){
module.exports=_dereq_(25)
},{"lodash._objecttypes":44}],44:[function(_dereq_,module,exports){
module.exports=_dereq_(13)
},{}],45:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Checks if `value` is a function.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 */
function isFunction(value) {
  return typeof value == 'function';
}

module.exports = isFunction;

},{}],46:[function(_dereq_,module,exports){
module.exports=_dereq_(11)
},{}],47:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'name': 'fred' };
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],48:[function(_dereq_,module,exports){
(function (global){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative');

/** Used to detect functions containing a `this` reference */
var reThis = /\bthis\b/;

/**
 * An object used to flag environments features.
 *
 * @static
 * @memberOf _
 * @type Object
 */
var support = {};

/**
 * Detect if functions can be decompiled by `Function#toString`
 * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
 *
 * @memberOf _.support
 * @type boolean
 */
support.funcDecomp = !isNative(global.WinRTError) && reThis.test(function() { return this; });

/**
 * Detect if `Function#name` is supported (all but IE).
 *
 * @memberOf _.support
 * @type boolean
 */
support.funcNames = typeof Function.name == 'string';

module.exports = support;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"lodash._isnative":49}],49:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},{}],50:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var debounce = _dereq_('lodash.debounce'),
    isFunction = _dereq_('lodash.isfunction'),
    isObject = _dereq_('lodash.isobject');

/** Used as an internal `_.debounce` options object */
var debounceOptions = {
  'leading': false,
  'maxWait': 0,
  'trailing': false
};

/**
 * Creates a function that, when executed, will only call the `func` function
 * at most once per every `wait` milliseconds. Provide an options object to
 * indicate that `func` should be invoked on the leading and/or trailing edge
 * of the `wait` timeout. Subsequent calls to the throttled function will
 * return the result of the last `func` call.
 *
 * Note: If `leading` and `trailing` options are `true` `func` will be called
 * on the trailing edge of the timeout only if the the throttled function is
 * invoked more than once during the `wait` timeout.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to throttle.
 * @param {number} wait The number of milliseconds to throttle executions to.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // avoid excessively updating the position while scrolling
 * var throttled = _.throttle(updatePosition, 100);
 * jQuery(window).on('scroll', throttled);
 *
 * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
 * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
 *   'trailing': false
 * }));
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (!isFunction(func)) {
    throw new TypeError;
  }
  if (options === false) {
    leading = false;
  } else if (isObject(options)) {
    leading = 'leading' in options ? options.leading : leading;
    trailing = 'trailing' in options ? options.trailing : trailing;
  }
  debounceOptions.leading = leading;
  debounceOptions.maxWait = wait;
  debounceOptions.trailing = trailing;

  return debounce(func, wait, debounceOptions);
}

module.exports = throttle;

},{"lodash.debounce":51,"lodash.isfunction":54,"lodash.isobject":55}],51:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isFunction = _dereq_('lodash.isfunction'),
    isObject = _dereq_('lodash.isobject'),
    now = _dereq_('lodash.now');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeMax = Math.max;

/**
 * Creates a function that will delay the execution of `func` until after
 * `wait` milliseconds have elapsed since the last time it was invoked.
 * Provide an options object to indicate that `func` should be invoked on
 * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
 * to the debounced function will return the result of the last `func` call.
 *
 * Note: If `leading` and `trailing` options are `true` `func` will be called
 * on the trailing edge of the timeout only if the the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
 * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
 * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // avoid costly calculations while the window size is in flux
 * var lazyLayout = _.debounce(calculateLayout, 150);
 * jQuery(window).on('resize', lazyLayout);
 *
 * // execute `sendMail` when the click event is fired, debouncing subsequent calls
 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * });
 *
 * // ensure `batchLog` is executed once after 1 second of debounced calls
 * var source = new EventSource('/stream');
 * source.addEventListener('message', _.debounce(batchLog, 250, {
 *   'maxWait': 1000
 * }, false);
 */
function debounce(func, wait, options) {
  var args,
      maxTimeoutId,
      result,
      stamp,
      thisArg,
      timeoutId,
      trailingCall,
      lastCalled = 0,
      maxWait = false,
      trailing = true;

  if (!isFunction(func)) {
    throw new TypeError;
  }
  wait = nativeMax(0, wait) || 0;
  if (options === true) {
    var leading = true;
    trailing = false;
  } else if (isObject(options)) {
    leading = options.leading;
    maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
    trailing = 'trailing' in options ? options.trailing : trailing;
  }
  var delayed = function() {
    var remaining = wait - (now() - stamp);
    if (remaining <= 0) {
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
      }
      var isCalled = trailingCall;
      maxTimeoutId = timeoutId = trailingCall = undefined;
      if (isCalled) {
        lastCalled = now();
        result = func.apply(thisArg, args);
        if (!timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
      }
    } else {
      timeoutId = setTimeout(delayed, remaining);
    }
  };

  var maxDelayed = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    maxTimeoutId = timeoutId = trailingCall = undefined;
    if (trailing || (maxWait !== wait)) {
      lastCalled = now();
      result = func.apply(thisArg, args);
      if (!timeoutId && !maxTimeoutId) {
        args = thisArg = null;
      }
    }
  };

  return function() {
    args = arguments;
    stamp = now();
    thisArg = this;
    trailingCall = trailing && (timeoutId || !leading);

    if (maxWait === false) {
      var leadingCall = leading && !timeoutId;
    } else {
      if (!maxTimeoutId && !leading) {
        lastCalled = stamp;
      }
      var remaining = maxWait - (stamp - lastCalled),
          isCalled = remaining <= 0;

      if (isCalled) {
        if (maxTimeoutId) {
          maxTimeoutId = clearTimeout(maxTimeoutId);
        }
        lastCalled = stamp;
        result = func.apply(thisArg, args);
      }
      else if (!maxTimeoutId) {
        maxTimeoutId = setTimeout(maxDelayed, remaining);
      }
    }
    if (isCalled && timeoutId) {
      timeoutId = clearTimeout(timeoutId);
    }
    else if (!timeoutId && wait !== maxWait) {
      timeoutId = setTimeout(delayed, wait);
    }
    if (leadingCall) {
      isCalled = true;
      result = func.apply(thisArg, args);
    }
    if (isCalled && !timeoutId && !maxTimeoutId) {
      args = thisArg = null;
    }
    return result;
  };
}

module.exports = debounce;

},{"lodash.isfunction":54,"lodash.isobject":55,"lodash.now":52}],52:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative');

/**
 * Gets the number of milliseconds that have elapsed since the Unix epoch
 * (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @example
 *
 * var stamp = _.now();
 * _.defer(function() { console.log(_.now() - stamp); });
 * // => logs the number of milliseconds it took for the deferred function to be called
 */
var now = isNative(now = Date.now) && now || function() {
  return new Date().getTime();
};

module.exports = now;

},{"lodash._isnative":53}],53:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},{}],54:[function(_dereq_,module,exports){
module.exports=_dereq_(45)
},{}],55:[function(_dereq_,module,exports){
module.exports=_dereq_(25)
},{"lodash._objecttypes":56}],56:[function(_dereq_,module,exports){
module.exports=_dereq_(13)
},{}],57:[function(_dereq_,module,exports){
var now = _dereq_('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , native = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  native = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, next)
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!native) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":58}],58:[function(_dereq_,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*
//@ sourceMappingURL=performance-now.map
*/

}).call(this,_dereq_("FWaASH"))
},{"FWaASH":1}],59:[function(_dereq_,module,exports){
'use strict';

var isInput = _dereq_('./isInput');
var bindings = {};

function has (source, target) {
  var binding = bindings[source.id];
  return binding && binding[target.id];
}

function insert (source, target) {
  var binding = bindings[source.id];
  if (!binding) {
    binding = bindings[source.id] = {};
  }
  var invalidate = invalidator(target);
  binding[target.id] = invalidate;
  source.on('data', invalidate);
  source.on('destroyed', remove.bind(null, source, target));
}

function remove (source, target) {
  var binding = bindings[source.id];
  if (!binding) {
    return;
  }
  var invalidate = binding[target.id];
  source.off('data', invalidate);
  delete binding[target.id];
}

function invalidator (target) {
  return function invalidate () {
    target.refresh();
  };
}

function add (source, target) {
  if (isInput(target.associated) || has(source, target)) {
    return;
  }
  insert(source, target);
}

module.exports = {
  add: add,
  remove: remove
};

},{"./isInput":68}],60:[function(_dereq_,module,exports){
'use strict';

var emitter = _dereq_('contra.emitter');
var raf = _dereq_('raf');
var dom = _dereq_('./dom');
var text = _dereq_('./text');
var parse = _dereq_('./parse');
var clone = _dereq_('./clone');
var defaults = _dereq_('./defaults');
var momentum = _dereq_('./momentum');
var no;

function calendar (calendarOptions) {
  var o;
  var api = emitter({});
  var ref;
  var refCal;
  var container;
  var rendered = false;

  // date variables
  var weekdays = momentum.moment.weekdaysMin();
  var weekdayCount = weekdays.length;
  var month;
  var datebody;
  var lastYear;
  var lastMonth;
  var lastDay;
  var back;
  var next;

  // time variables
  var secondsInDay = 60 * 60 * 24;
  var time;
  var timelist;

  raf(function () {
    init();
  });

  function init (initOptions) {
    o = defaults(initOptions || calendarOptions);
    if (!container) { container = dom({ className: o.styles.container }); }
    lastMonth = no;
    lastYear = no;
    lastDay = no;
    o.appendTo.appendChild(container);

    removeChildren(container);
    rendered = false;
    ref = o.initialValue ? o.initialValue : momentum.moment();
    refCal = ref.clone();

    delete api.restore;
    api.show = show;
    api.hide = hide;
    api.container = container;
    api.getDate = getDate;
    api.getDateString = getDateString;
    api.getMoment = getMoment;
    api.destroy = destroy;
    api.options = changeOptions;
    api.options.reset = resetOptions;
    api.setValue = setValue;
    api.emitValues = emitValues;
    api.refresh = refresh;

    hideCalendar();
    eventListening();

    api.emit('ready', clone(o, momentum.moment));

    return api;
  }

  function destroy () {
    container.parentNode.removeChild(container);

    eventListening(true);

    // reverse order micro-optimization
    delete api.refresh;
    delete api.emitValues;
    delete api.setValue;
    delete api.options;
    delete api.destroy;
    delete api.getMoment;
    delete api.getDateString;
    delete api.getDate;
    delete api.container;
    delete api.hide;
    delete api.show;
    api.restore = init;
    api.emit('destroyed');
    api.off();

    return api;
  }

  function eventListening (remove) {
    var prefix = remove ? 'remove' : 'add';
    var op = prefix + 'EventListener';
    if (o.autoHideOnBlur) { window[op]('focusin', hideOnBlur); }
    if (o.autoHideOnClick) { window[op]('click', hideOnClick); }
  }

  function changeOptions (options) {
    if (arguments.length === 0) {
      return clone(o, momentum.moment);
    }
    destroy();
    init(options);
    return api;
  }

  function resetOptions () {
    return changeOptions({});
  }

  function render () {
    if (rendered) {
      return;
    }
    rendered = true;
    renderDates();
    renderTime();
    api.emit('render');
  }

  function renderDates () {
    if (!o.date) {
      return;
    }
    var datewrapper = dom({ className: o.styles.date, parent: container });
    back = dom({ type: 'button', className: o.styles.back, parent: datewrapper });
    next = dom({ type: 'button', className: o.styles.next, parent: datewrapper });
    month = dom({ className: o.styles.month, parent: datewrapper });
    var date = dom({ type: 'table', className: o.styles.dayTable, parent: datewrapper });
    var datehead = dom({ type: 'thead', className: o.styles.dayHead, parent: date });
    var dateheadrow = dom({ type: 'tr', className: o.styles.dayRow, parent: datehead });
    datebody = dom({ type: 'tbody', className: o.styles.dayBody, parent: date });
    var i;

    for (i = 0; i < weekdayCount; i++) {
      dom({ type: 'th', className: o.styles.dayHeadElem, parent: dateheadrow, text: weekdays[weekday(i)] });
    }

    back.addEventListener('click', subtractMonth);
    next.addEventListener('click', addMonth);
    datebody.addEventListener('click', pickDay);
  }

  function renderTime () {
    if (!o.time || !o.timeInterval) {
      return;
    }
    var timewrapper = dom({ className: o.styles.time, parent: container });
    time = dom({ className: o.styles.selectedTime, parent: timewrapper, text: ref.format(o.timeFormat) });
    time.addEventListener('click', toggleTimeList);
    timelist = dom({ className: o.styles.timeList, parent: timewrapper });
    timelist.addEventListener('click', pickTime);
    var next = momentum.moment('00:00:00', 'HH:mm:ss');
    var latest = next.clone().add('days', 1);
    while (next.isBefore(latest)) {
      dom({ className: o.styles.timeOption, parent: timelist, text: next.format(o.timeFormat) });
      next.add('seconds', o.timeInterval);
    }
  }

  function weekday (index, backwards) {
    var factor = backwards ? -1 : 1;
    var offset = index + o.weekStart * factor;
    if (offset >= weekdayCount || offset < 0) {
      offset += weekdayCount * -factor;
    }
    return offset;
  }

  function displayValidTimesOnly () {
    if (!o.time || ! rendered) {
      return;
    }
    var times = timelist.children;
    var length = times.length;
    var date;
    var time;
    var item;
    var i;
    for (i = 0; i < length; i++) {
      item = times[i];
      time = momentum.moment(text(item), o.timeFormat);
      date = setTime(ref.clone(), time);
      item.style.display = isInRange(date, false, o.timeValidator) ? 'block' : 'none';
    }
  }

  function toggleTimeList (show) {
    var display = typeof show === 'boolean' ? show : timelist.style.display === 'none';
    if (display) {
      showTimeList();
    } else {
      hideTimeList();
    }
  }

  function showTimeList () { if (timelist) { timelist.style.display = 'block'; } }
  function hideTimeList () { if (timelist) { timelist.style.display = 'none'; } }
  function showCalendar () { container.style.display = 'inline-block'; }
  function hideCalendar () { container.style.display = 'none'; }

  function show () {
    render();
    refresh();
    toggleTimeList(!o.date);
    showCalendar();
    return api;
  }

  function hide () {
    hideTimeList();
    raf(hideCalendar);
    return api;
  }

  function hideConditionally () {
    hideTimeList();

    var pos = container.classList.contains(o.styles.positioned);
    if (pos) {
      raf(hideCalendar);
    }
    return api;
  }

  function calendarEventTarget (e) {
    var target = e.target;
    if (target === api.associated) {
      return true;
    }
    while (target) {
      if (target === container) {
        return true;
      }
      target = target.parentNode;
    }
  }

  function hideOnBlur (e) {
    if (calendarEventTarget(e)) {
      return;
    }
    hideConditionally();
  }

  function hideOnClick (e) {
    if (calendarEventTarget(e)) {
      return;
    }
    hideConditionally();
  }

  function subtractMonth () { changeMonth('subtract'); }
  function addMonth () { changeMonth('add'); }
  function changeMonth (op) {
    var bound;
    refCal[op]('months', 1);
    bound = inRange(refCal.clone());
    ref = bound || ref;
    if (bound) { refCal = bound.clone(); }
    update();
  }

  function update (silent) {
    updateCalendar();
    updateTime();
    if (silent !== true) { emitValues(); }
    displayValidTimesOnly();
  }

  function updateCalendar () {
    if (!o.date) {
      return;
    }
    var y = refCal.year();
    var m = refCal.month();
    var d = refCal.date();
    if (d === lastDay && m === lastMonth && y === lastYear) {
      return;
    }
    if( rendered ) {
      text(month, refCal.format(o.monthFormat));
    }
    lastDay = refCal.date();
    lastMonth = refCal.month();
    lastYear = refCal.year();
    if( rendered ) {
      removeChildren(datebody);
      renderDays();
    }
  }

  function updateTime () {
    if (!o.time || ! rendered ) {
      return;
    }
    text(time, ref.format(o.timeFormat));
  }

  function emitValues () {
    api.emit('data', getDateString());
    api.emit('year', ref.year());
    api.emit('month', ref.month());
    api.emit('day', ref.day());
    api.emit('time', ref.format(o.timeFormat));
    return api;
  }

  function refresh () {
    lastDay = false; // force calendar repaint
    update(true);
  }

  function setValue (value) {
    var date = parse(value, o.inputFormat);
    if (date === null) {
      return;
    }
    ref = inRange(date) || ref;
    refCal = ref.clone();
    update(true);

    return api;
  }

  function removeChildren (elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

  function renderDays () {
    var total = refCal.daysInMonth();
    var current = refCal.month() !== ref.month() ? -1 : ref.date(); // 1..31
    var first = refCal.clone().date(1);
    var firstDay = weekday(first.day(), true); // 0..6
    var lastMoment;
    var i, day, node;
    var tr = row();
    var prevMonth = o.styles.dayBodyElem + ' ' + o.styles.dayPrevMonth;
    var nextMonth = o.styles.dayBodyElem + ' ' + o.styles.dayNextMonth;
    var disabled = ' ' + o.styles.dayDisabled;

    for (i = 0; i < firstDay; i++) {
      day = first.clone().subtract('days', firstDay - i);
      node = dom({ type: 'td', className: test(day, prevMonth), parent: tr, text: day.format(o.dayFormat) });
    }
    for (i = 0; i < total; i++) {
      if (tr.children.length === weekdayCount) {
        tr = row();
      }
      day = first.clone().add('days', i);
      node = dom({ type: 'td', className: test(day, o.styles.dayBodyElem), parent: tr, text: day.format(o.dayFormat) });
      if (day.date() === current) {
        node.classList.add(o.styles.selectedDay);
      }
    }
    lastMoment = day.clone();
    for (i = 1; tr.children.length < weekdayCount; i++) {
      day = lastMoment.clone().add('days', i);
      node = dom({ type: 'td', className: test(day, nextMonth), parent: tr, text: day.format(o.dayFormat) });
    }

    back.disabled = !isInRange(first, true);
    next.disabled = !isInRange(lastMoment, true);

    function test (day, classes) {
      if (isInRange(day, true, o.dateValidator)) {
        return classes;
      }
      return classes + disabled;
    }
  }

  function isInRange (date, allday, validator) {
    var min = !o.min ? false : (allday ? o.min.clone().startOf('day') : o.min);
    var max = !o.max ? false : (allday ? o.max.clone().endOf('day') : o.max);
    if (min && date.isBefore(min)) {
      return false;
    }
    if (max && date.isAfter(max)) {
      return false;
    }
    var valid = (validator || Function.prototype).call(api, date.toDate());
    return valid !== false;
  }

  function inRange (date) {
    if (o.min && date.isBefore(o.min)) {
      return inRange(o.min.clone());
    } else if (o.max && date.isAfter(o.max)) {
      return inRange(o.max.clone());
    }
    var days = date.daysInMonth();
    var value = date.clone().subtract('days', 1);
    if (validateTowards(value, date, 'add')) {
      return inTimeRange(value);
    }
    value = date.clone();
    if (validateTowards(value, date, 'subtract')) {
      return inTimeRange(value);
    }
  }

  function inTimeRange (value) {
    var valid = false;
    var copy = value.clone().subtract('seconds', o.timeInterval);
    var times = Math.ceil(secondsInDay / o.timeInterval);
    var i;
    for (i = 0; i < times; i++) {
      copy.add('seconds', o.timeInterval);
      if (copy.date() > value.date()) {
        copy.subtract('days', 1);
      }
      if (o.timeValidator.call(api, copy.toDate()) !== false) {
        return copy;
      }
    }
  }

  function validateTowards (value, date, op) {
    var valid = false;
    while (valid === false) {
      value[op]('days', 1);
      if (value.month() !== date.month()) {
        break;
      }
      valid = o.dateValidator.call(api, value.toDate());
    }
    return valid !== false;
  }

  function row () {
    return dom({ type: 'tr', className: o.styles.dayRow, parent: datebody });
  }

  function pickDay (e) {
    var target = e.target;
    if (target.classList.contains(o.styles.dayDisabled) || !target.classList.contains(o.styles.dayBodyElem)) {
      return;
    }
    var day = parseInt(text(target), 10);
    var query = '.' + o.styles.selectedDay;
    var selection = container.querySelector(query);
    if (selection) { selection.classList.remove(o.styles.selectedDay); }
    var prev = target.classList.contains(o.styles.dayPrevMonth);
    var next = target.classList.contains(o.styles.dayNextMonth);
    var action;
    if (prev || next) {
      action = prev ? 'subtract' : 'add';
      ref[action]('months', 1);
    } else {
      target.classList.add(o.styles.selectedDay);
    }
    ref.date(day); // must run after setting the month
    setTime(ref, inRange(ref) || ref);
    refCal = ref.clone();
    if (o.autoClose) { hideConditionally(); }
    update();
  }

  function setTime (to, from) {
    to.hour(from.hour()).minute(from.minute()).second(from.second());
    return to;
  }

  function pickTime (e) {
    var target = e.target;
    if (!target.classList.contains(o.styles.timeOption)) {
      return;
    }
    var value = momentum.moment(text(target), o.timeFormat);
    setTime(ref, value);
    refCal = ref.clone();
    emitValues();
    updateTime();
    if (!o.date && o.autoClose) {
      hideConditionally();
    } else {
      hideTimeList();
    }
  }

  function getDate () {
    return ref.toDate();
  }

  function getDateString (format) {
    return ref.format(format || o.inputFormat);
  }

  function getMoment () {
    return ref.clone();
  }

  return api;
}

module.exports = calendar;

},{"./clone":61,"./defaults":63,"./dom":64,"./momentum":69,"./parse":70,"./text":73,"contra.emitter":2,"raf":57}],61:[function(_dereq_,module,exports){
'use strict';

var clonedeep = _dereq_('lodash.clonedeep');

function clone (thing, moment) {
  function transmute (value) {
    if (moment.isMoment(value)) {
      return value.clone();
    }
  }
  return clonedeep(thing, transmute);
}

module.exports = clone;

},{"lodash.clonedeep":4}],62:[function(_dereq_,module,exports){
'use strict';

var index = _dereq_('./index');
var input = _dereq_('./input');
var inline = _dereq_('./inline');
var isInput = _dereq_('./isInput');

function core (elem, options) {
  var cal;
  var existing = index.find(input);
  if (existing) {
    return existing;
  }

  if (isInput(elem)) {
    cal = input(elem, options);
  } else {
    cal = inline(elem, options);
  }
  index.assign(elem, cal);

  return cal;
}

module.exports = core;

},{"./index":65,"./inline":66,"./input":67,"./isInput":68}],63:[function(_dereq_,module,exports){
'use strict';

var parse = _dereq_('./parse');

function defaults (options, input) {
  var temp;
  var no;
  var o = options || {};
  if (o.autoHideOnClick === no) { o.autoHideOnClick = true; }
  if (o.autoHideOnBlur === no) { o.autoHideOnBlur = true; }
  if (o.autoClose === no) { o.autoClose = true; }
  if (o.appendTo === no) { o.appendTo = document.body; }
  if (o.appendTo === 'parent') {
    if (input) {
      o.appendTo = input.parentNode;
    } else {
      throw new Error('Inline calendars must be appended to a parent node explicitly.');
    }
  }
  if (o.invalidate === no) { o.invalidate = true; }
  if (o.required === no) { o.required = false; }
  if (o.date === no) { o.date = true; }
  if (o.time === no) { o.time = true; }
  if (o.date === false && o.time === false) { throw new Error('At least one of `date` or `time` must be `true`.'); }
  if (o.inputFormat === no) {
    if (o.date && o.time) {
      o.inputFormat = 'YYYY-MM-DD HH:mm';
    } else if (o.date) {
      o.inputFormat = 'YYYY-MM-DD';
    } else {
      o.inputFormat = 'HH:mm';
    }
  }
  if (o.initialValue === no) {
    o.initialValue = null;
  } else {
    o.initialValue = parse(o.initialValue, o.inputFormat);
  }
  if (o.min === no) { o.min = null; } else { o.min = parse(o.min, o.inputFormat); }
  if (o.max === no) { o.max = null; } else { o.max = parse(o.max, o.inputFormat); }
  if (o.min && o.max) {
    if (o.max.isBefore(o.min)) {
      temp = o.max;
      o.max = o.min;
      o.min = temp;
    }
    if (o.max.clone().subtract('days', 1).isBefore(o.min)) {
      throw new Error('`max` must be at least one day after `min`');
    }
  }
  if (o.dateValidator === no) { o.dateValidator = Function.prototype; }
  if (o.timeValidator === no) { o.timeValidator = Function.prototype; }
  if (o.timeFormat === no) { o.timeFormat = 'HH:mm'; }
  if (o.timeInterval === no) { o.timeInterval = 60 * 30; } // 30 minutes by default
  if (o.weekStart === no) { o.weekStart = 0; }
  if (o.monthFormat === no) { o.monthFormat = 'MMMM YYYY'; }
  if (o.dayFormat === no) { o.dayFormat = 'DD'; }
  if (o.styles === no) { o.styles = {}; }

  var styl = o.styles;
  if (styl.back === no) { styl.back = 'rd-back'; }
  if (styl.container === no) { styl.container = 'rd-container'; }
  if (styl.positioned === no) { styl.positioned = 'rd-container-attachment'; }
  if (styl.date === no) { styl.date = 'rd-date'; }
  if (styl.dayBody === no) { styl.dayBody = 'rd-days-body'; }
  if (styl.dayBodyElem === no) { styl.dayBodyElem = 'rd-day-body'; }
  if (styl.dayPrevMonth === no) { styl.dayPrevMonth = 'rd-day-prev-month'; }
  if (styl.dayNextMonth === no) { styl.dayNextMonth = 'rd-day-next-month'; }
  if (styl.dayDisabled === no) { styl.dayDisabled = 'rd-day-disabled'; }
  if (styl.dayHead === no) { styl.dayHead = 'rd-days-head'; }
  if (styl.dayHeadElem === no) { styl.dayHeadElem = 'rd-day-head'; }
  if (styl.dayRow === no) { styl.dayRow = 'rd-days-row'; }
  if (styl.dayTable === no) { styl.dayTable = 'rd-days'; }
  if (styl.month === no) { styl.month = 'rd-month'; }
  if (styl.next === no) { styl.next = 'rd-next'; }
  if (styl.selectedDay === no) { styl.selectedDay = 'rd-day-selected'; }
  if (styl.selectedTime === no) { styl.selectedTime = 'rd-time-selected'; }
  if (styl.time === no) { styl.time = 'rd-time'; }
  if (styl.timeList === no) { styl.timeList = 'rd-time-list'; }
  if (styl.timeOption === no) { styl.timeOption = 'rd-time-option'; }

  return o;
}

module.exports = defaults;

},{"./parse":70}],64:[function(_dereq_,module,exports){
'use strict';

function dom (options) {
  var o = options || {};
  if (!o.type) { o.type = 'div'; }
  var elem = document.createElement(o.type);
  if (o.className) { elem.className = o.className; }
  if (o.text) { elem.innerText = elem.textContent = o.text; }
  if (o.parent) { o.parent.appendChild(elem); }
  return elem;
}

module.exports = dom;

},{}],65:[function(_dereq_,module,exports){
'use strict';
var no;
var ikey = 'romeId';
var index = [];

function find (thing) { // can be a DOM element or a number
  if (typeof thing !== 'number' && thing && thing.dataset) {
    return find(thing.dataset[ikey]);
  }
  var existing = index[thing];
  if (existing !== no) {
    return existing;
  }
}

function assign (elem, instance) {
  instance.id = elem.dataset[ikey] = index.push(instance) - 1;
}

module.exports = {
  find: find,
  assign: assign
};

},{}],66:[function(_dereq_,module,exports){
'use strict';

var raf = _dereq_('raf');
var calendar = _dereq_('./calendar');

function inline (elem, calendarOptions) {
  var o = calendarOptions || {};

  o.appendTo = elem;

  var api = calendar(o)
    .on('ready', ready)
    .on('destroyed', destroy);

  function ready () {
    raf(api.show);
    api.associated = elem;
  }

  function destroy () {
    delete api.associated;
  }

  return api;
}

module.exports = inline;

},{"./calendar":60,"raf":57}],67:[function(_dereq_,module,exports){
'use strict';

var throttle = _dereq_('lodash.throttle');
var raf = _dereq_('raf');
var clone = _dereq_('./clone');
var calendar = _dereq_('./calendar');
var momentum = _dereq_('./momentum');
var no;

function inputCalendar (input, calendarOptions) {
  var o;
  var api = calendar(calendarOptions);
  var throttledTakeInput = throttle(takeInput, 50);
  var throttledPosition = throttle(position, 30);
  var ignoreInvalidation;
  var ignoreShow;

  events();

  function init (superOptions) {
    o = clone(superOptions, momentum.moment);

    api.container.classList.add(o.styles.positioned);
    api.container.addEventListener('mousedown', containerMouseDown);
    api.container.addEventListener('click', containerClick);

    api.associated = input;
    api.getDate = unrequire(api.getDate);
    api.getDateString = unrequire(api.getDateString);
    api.getMoment = unrequire(api.getMoment);

    if (o.initialValue) {
      input.value = o.initialValue.format(o.inputFormat);
    }

    api.on('data', updateInput);

    eventListening();
    throttledTakeInput();
  }

  function destroy () {
    eventListening(true);
    delete api.associated;
    raf(events);
  }

  function events () {
    api.once('ready', init);
    api.once('destroyed', destroy);
  }

  function eventListening (remove) {
    var prefix = remove ? 'remove' : 'add';
    var op = prefix + 'EventListener';
    input[op]('click', show);
    input[op]('focusin', show);
    input[op]('change', throttledTakeInput);
    input[op]('keypress', throttledTakeInput);
    input[op]('keydown', throttledTakeInput);
    input[op]('input', throttledTakeInput);
    if (o.invalidate) { input[op]('blur', invalidateInput); }
    window[op]('resize', throttledPosition);
  }

  function containerClick () {
    ignoreShow = true;
    input.focus();
    ignoreShow = false;
  }

  function containerMouseDown () {
    ignoreInvalidation = true;
    raf(unignore);

    function unignore () {
      ignoreInvalidation = false;
    }
  }

  function invalidateInput () {
    if (!ignoreInvalidation && !isEmpty()) {
      api.emitValues();
    }
  }

  function show () {
    if (ignoreShow) {
      return;
    }
    api.show();
    position();
  }

  function position () {
    var bounds = input.getBoundingClientRect();
    var scrollTop = document.body.scrollTop;
    api.container.style.top  = bounds.top + scrollTop + input.offsetHeight + 'px';
    api.container.style.left = bounds.left + 'px';
  }

  function takeInput () {
    var value = input.value.trim();
    if (isEmpty()) {
      return;
    }
    var date = momentum.moment(value, o.inputFormat);
    api.setValue(date);
  }

  function updateInput (data) {
    input.value = data;
  }

  function isEmpty () {
    return o.required === false && input.value.trim() === '';
  }

  function unrequire (fn) {
    return function maybe () {
      return isEmpty() ? null : fn.apply(this, arguments);
    };
  }

  return api;
}

module.exports = inputCalendar;

},{"./calendar":60,"./clone":61,"./momentum":69,"lodash.throttle":50,"raf":57}],68:[function(_dereq_,module,exports){
'use strict';

function isInput (elem) {
  return elem && elem.nodeName && elem.nodeName.toLowerCase() === 'input';
}

module.exports = isInput;

},{}],69:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  moment: null
};

},{}],70:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

function raw (date, format) {
  if (typeof date === 'string') {
    return momentum.moment(date, format);
  }
  if (Object.prototype.toString.call(date) === '[object Date]') {
    return momentum.moment(date);
  }
  if (momentum.moment.isMoment(date)) {
    return date.clone();
  }
}

function parse (date, format) {
  var m = raw(date, typeof format === 'string' ? format : null);
  return m && m.isValid() ? m : null;
}

module.exports = parse;

},{"./momentum":69}],71:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core');
var index = _dereq_('./index');
var use = _dereq_('./use');

core.use = use.bind(core);
core.find = index.find;
core.val = _dereq_('./validators');

module.exports = core;

},{"./core":62,"./index":65,"./use":74,"./validators":75}],72:[function(_dereq_,module,exports){
(function (global){
var rome = _dereq_('./rome');
var momentum = _dereq_('./momentum');

rome.use(global.moment);

if (momentum.moment === void 0) {
  throw new Error('rome depends on moment.js, you can get it at http://momentjs.com, or you could use the bundled distribution file instead.');
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./momentum":69,"./rome":71}],73:[function(_dereq_,module,exports){
'use strict';

function text (elem, value) {
  if (arguments.length === 2) {
    elem.innerText = elem.textContent = value;
  }
  return elem.innerText || elem.textContent;
}

module.exports = text;

},{}],74:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

function use (moment) {
  this.moment = momentum.moment = moment;
}

module.exports = use;

},{"./momentum":69}],75:[function(_dereq_,module,exports){
'use strict';

var index = _dereq_('./index');
var parse = _dereq_('./parse');
var association = _dereq_('./association');

function compareBuilder (compare) {
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
        association.add(this, cal);
      }
      return compare(left, right);
    };
  };
}

function rangeBuilder (how, compare) {
  return function factory (start, end) {
    var dates;
    var len = arguments.length;

    if (Array.isArray(start)) {
      dates = start;
    } else {
      if (len === 1) {
        dates = [start];
      } else if (len === 2) {
        dates = [[start, end]];
      }
    }

    return function (date) {
      return dates.map(expand.bind(this))[how](compare.bind(this, date));
    };

    function expand (value) {
      var start, end;
      var cal = index.find(value);
      if (cal) {
        start = end = cal.getMoment();
      } else if (Array.isArray(value)) {
        start = value[0]; end = value[1];
      } else {
        start = end = value;
      }
      if (cal) {
        association.add(cal, this);
      }
      return {
        start: parse(start).startOf('day').toDate(),
        end: parse(end).endOf('day').toDate()
      };
    }
  };
}

var afterEq  = compareBuilder(function (left, right) { return left >= right; });
var after    = compareBuilder(function (left, right) { return left  > right; });
var beforeEq = compareBuilder(function (left, right) { return left <= right; });
var before   = compareBuilder(function (left, right) { return left  < right; });

var except   = rangeBuilder('every', function (left, right) { return right.start  > left || right.end  < left; });
var only     = rangeBuilder('some',  function (left, right) { return right.start <= left && right.end >= left; });

module.exports = {
  afterEq: afterEq,
  after: after,
  beforeEq: beforeEq,
  before: before,
  except: except,
  only: only
};

},{"./association":59,"./index":65,"./parse":70}]},{},[72])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2NvbnRyYS5lbWl0dGVyL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvY29udHJhLmVtaXR0ZXIvc3JjL2NvbnRyYS5lbWl0dGVyLmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNsb25lZGVlcC9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNsb25lL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNsb25lZGVlcC9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY2xvbmUvbm9kZV9tb2R1bGVzL2xvZGFzaC5fZ2V0YXJyYXkvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLl9nZXRhcnJheS9ub2RlX21vZHVsZXMvbG9kYXNoLl9hcnJheXBvb2wvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLl9yZWxlYXNlYXJyYXkvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLl9yZWxlYXNlYXJyYXkvbm9kZV9tb2R1bGVzL2xvZGFzaC5fbWF4cG9vbHNpemUvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLl9zbGljZS9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNsb25lL25vZGVfbW9kdWxlcy9sb2Rhc2guYXNzaWduL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNsb25lZGVlcC9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY2xvbmUvbm9kZV9tb2R1bGVzL2xvZGFzaC5hc3NpZ24vbm9kZV9tb2R1bGVzL2xvZGFzaC5fb2JqZWN0dHlwZXMvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLmFzc2lnbi9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLmFzc2lnbi9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5faXNuYXRpdmUvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLmFzc2lnbi9ub2RlX21vZHVsZXMvbG9kYXNoLmtleXMvbm9kZV9tb2R1bGVzL2xvZGFzaC5fc2hpbWtleXMvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLmZvcmVhY2gvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjbG9uZS9ub2RlX21vZHVsZXMvbG9kYXNoLmZvcm93bi9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNsb25lL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNhcnJheS9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNsb25lL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNvYmplY3QvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guX3NldGJpbmRkYXRhL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNsb25lZGVlcC9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5fc2V0YmluZGRhdGEvbm9kZV9tb2R1bGVzL2xvZGFzaC5ub29wL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNsb25lZGVlcC9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvbG9kYXNoLmNsb25lZGVlcC9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2svbm9kZV9tb2R1bGVzL2xvZGFzaC5iaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX2NyZWF0ZXdyYXBwZXIvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmJpbmQvbm9kZV9tb2R1bGVzL2xvZGFzaC5fY3JlYXRld3JhcHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlYmluZC9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guYmluZC9ub2RlX21vZHVsZXMvbG9kYXNoLl9jcmVhdGV3cmFwcGVyL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2ViaW5kL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGUvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLmJpbmQvbm9kZV9tb2R1bGVzL2xvZGFzaC5fY3JlYXRld3JhcHBlci9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNlY3JlYXRld3JhcHBlci9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guYmluZC9ub2RlX21vZHVsZXMvbG9kYXNoLl9jcmVhdGV3cmFwcGVyL25vZGVfbW9kdWxlcy9sb2Rhc2guaXNmdW5jdGlvbi9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC5jbG9uZWRlZXAvbm9kZV9tb2R1bGVzL2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrL25vZGVfbW9kdWxlcy9sb2Rhc2guaWRlbnRpdHkvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2guY2xvbmVkZWVwL25vZGVfbW9kdWxlcy9sb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjay9ub2RlX21vZHVsZXMvbG9kYXNoLnN1cHBvcnQvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2gudGhyb3R0bGUvaW5kZXguanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL25vZGVfbW9kdWxlcy9sb2Rhc2gudGhyb3R0bGUvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWJvdW5jZS9pbmRleC5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlYm91bmNlL25vZGVfbW9kdWxlcy9sb2Rhc2gubm93L2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvcmFmL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9ub2RlX21vZHVsZXMvcmFmL25vZGVfbW9kdWxlcy9wZXJmb3JtYW5jZS1ub3cvbGliL3BlcmZvcm1hbmNlLW5vdy5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvc3JjL2Fzc29jaWF0aW9uLmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9zcmMvY2FsZW5kYXIuanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL3NyYy9jbG9uZS5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvc3JjL2NvcmUuanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL3NyYy9kZWZhdWx0cy5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvc3JjL2RvbS5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvc3JjL2luZGV4LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9zcmMvaW5saW5lLmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9zcmMvaW5wdXQuanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL3NyYy9pc0lucHV0LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9zcmMvbW9tZW50dW0uanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL3NyYy9wYXJzZS5qcyIsIi9Vc2Vycy9ld2Vzc2Vscy9Eb2N1bWVudHMvUHJvamVjdHMvM3JkIHBhcnR5IGZvcmtzL3JvbWUvc3JjL3JvbWUuanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL3NyYy9yb21lLnN0YW5kYWxvbmUuanMiLCIvVXNlcnMvZXdlc3NlbHMvRG9jdW1lbnRzL1Byb2plY3RzLzNyZCBwYXJ0eSBmb3Jrcy9yb21lL3NyYy90ZXh0LmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9zcmMvdXNlLmpzIiwiL1VzZXJzL2V3ZXNzZWxzL0RvY3VtZW50cy9Qcm9qZWN0cy8zcmQgcGFydHkgZm9ya3Mvcm9tZS9zcmMvdmFsaWRhdG9ycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7OztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7OztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL2NvbnRyYS5lbWl0dGVyLmpzJyk7XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuKGZ1bmN0aW9uIChyb290LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciB1bmRlZiA9ICcnICsgdW5kZWZpbmVkO1xuICBmdW5jdGlvbiBhdG9hIChhLCBuKSB7IHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhLCBuKTsgfVxuICBmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGFyZ3MsIGN0eCkgeyBpZiAoIWZuKSB7IHJldHVybjsgfSB0aWNrKGZ1bmN0aW9uIHJ1biAoKSB7IGZuLmFwcGx5KGN0eCB8fCBudWxsLCBhcmdzIHx8IFtdKTsgfSk7IH1cblxuICAvLyBjcm9zcy1wbGF0Zm9ybSB0aWNrZXJcbiAgdmFyIHNpID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJywgdGljaztcbiAgaWYgKHNpKSB7XG4gICAgdGljayA9IGZ1bmN0aW9uIChmbikgeyBzZXRJbW1lZGlhdGUoZm4pOyB9O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSB1bmRlZiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgdGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gIH0gZWxzZSB7XG4gICAgdGljayA9IGZ1bmN0aW9uIChmbikgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9lbWl0dGVyICh0aGluZywgb3B0aW9ucykge1xuICAgIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgZXZ0ID0ge307XG4gICAgaWYgKHRoaW5nID09PSB1bmRlZmluZWQpIHsgdGhpbmcgPSB7fTsgfVxuICAgIHRoaW5nLm9uID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgICBpZiAoIWV2dFt0eXBlXSkge1xuICAgICAgICBldnRbdHlwZV0gPSBbZm5dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXZ0W3R5cGVdLnB1c2goZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gICAgdGhpbmcub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgICAgZm4uX29uY2UgPSB0cnVlOyAvLyB0aGluZy5vZmYoZm4pIHN0aWxsIHdvcmtzIVxuICAgICAgdGhpbmcub24odHlwZSwgZm4pO1xuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gICAgdGhpbmcub2ZmID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICBpZiAoYyA9PT0gMSkge1xuICAgICAgICBkZWxldGUgZXZ0W3R5cGVdO1xuICAgICAgfSBlbHNlIGlmIChjID09PSAwKSB7XG4gICAgICAgIGV2dCA9IHt9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGV0ID0gZXZ0W3R5cGVdO1xuICAgICAgICBpZiAoIWV0KSB7IHJldHVybiB0aGluZzsgfVxuICAgICAgICBldC5zcGxpY2UoZXQuaW5kZXhPZihmbiksIDEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gICAgdGhpbmcuZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgICAgdmFyIHR5cGUgPSBhcmdzLnNoaWZ0KCk7XG4gICAgICB2YXIgZXQgPSBldnRbdHlwZV07XG4gICAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJyAmJiBvcHRzLnRocm93cyAhPT0gZmFsc2UgJiYgIWV0KSB7IHRocm93IGFyZ3MubGVuZ3RoID09PSAxID8gYXJnc1swXSA6IGFyZ3M7IH1cbiAgICAgIGlmICghZXQpIHsgcmV0dXJuIHRoaW5nOyB9XG4gICAgICBldnRbdHlwZV0gPSBldC5maWx0ZXIoZnVuY3Rpb24gZW1pdHRlciAobGlzdGVuKSB7XG4gICAgICAgIGlmIChvcHRzLmFzeW5jKSB7IGRlYm91bmNlKGxpc3RlbiwgYXJncywgdGhpbmcpOyB9IGVsc2UgeyBsaXN0ZW4uYXBwbHkodGhpbmcsIGFyZ3MpOyB9XG4gICAgICAgIHJldHVybiAhbGlzdGVuLl9vbmNlO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpbmc7XG4gICAgfTtcbiAgICByZXR1cm4gdGhpbmc7XG4gIH1cblxuICAvLyBjcm9zcy1wbGF0Zm9ybSBleHBvcnRcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IHVuZGVmICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBfZW1pdHRlcjtcbiAgfSBlbHNlIHtcbiAgICByb290LmNvbnRyYSA9IHJvb3QuY29udHJhIHx8IHt9O1xuICAgIHJvb3QuY29udHJhLmVtaXR0ZXIgPSBfZW1pdHRlcjtcbiAgfVxufSkodGhpcyk7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpKSIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUNsb25lID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNlY2xvbmUnKSxcbiAgICBiYXNlQ3JlYXRlQ2FsbGJhY2sgPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VjcmVhdGVjYWxsYmFjaycpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWVwIGNsb25lIG9mIGB2YWx1ZWAuIElmIGEgY2FsbGJhY2sgaXMgcHJvdmlkZWQgaXQgd2lsbCBiZVxuICogZXhlY3V0ZWQgdG8gcHJvZHVjZSB0aGUgY2xvbmVkIHZhbHVlcy4gSWYgdGhlIGNhbGxiYWNrIHJldHVybnMgYHVuZGVmaW5lZGBcbiAqIGNsb25pbmcgd2lsbCBiZSBoYW5kbGVkIGJ5IHRoZSBtZXRob2QgaW5zdGVhZC4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvXG4gKiBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCBvbmUgYXJndW1lbnQ7ICh2YWx1ZSkuXG4gKlxuICogTm90ZTogVGhpcyBtZXRob2QgaXMgbG9vc2VseSBiYXNlZCBvbiB0aGUgc3RydWN0dXJlZCBjbG9uZSBhbGdvcml0aG0uIEZ1bmN0aW9uc1xuICogYW5kIERPTSBub2RlcyBhcmUgKipub3QqKiBjbG9uZWQuIFRoZSBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgYGFyZ3VtZW50c2Agb2JqZWN0cyBhbmRcbiAqIG9iamVjdHMgY3JlYXRlZCBieSBjb25zdHJ1Y3RvcnMgb3RoZXIgdGhhbiBgT2JqZWN0YCBhcmUgY2xvbmVkIHRvIHBsYWluIGBPYmplY3RgIG9iamVjdHMuXG4gKiBTZWUgaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDUvaW5mcmFzdHJ1Y3R1cmUuaHRtbCNpbnRlcm5hbC1zdHJ1Y3R1cmVkLWNsb25pbmctYWxnb3JpdGhtLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gZGVlcCBjbG9uZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjbG9uaW5nIHZhbHVlcy5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGRlZXAgY2xvbmVkIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgY2hhcmFjdGVycyA9IFtcbiAqICAgeyAnbmFtZSc6ICdiYXJuZXknLCAnYWdlJzogMzYgfSxcbiAqICAgeyAnbmFtZSc6ICdmcmVkJywgICAnYWdlJzogNDAgfVxuICogXTtcbiAqXG4gKiB2YXIgZGVlcCA9IF8uY2xvbmVEZWVwKGNoYXJhY3RlcnMpO1xuICogZGVlcFswXSA9PT0gY2hhcmFjdGVyc1swXTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogdmFyIHZpZXcgPSB7XG4gKiAgICdsYWJlbCc6ICdkb2NzJyxcbiAqICAgJ25vZGUnOiBlbGVtZW50XG4gKiB9O1xuICpcbiAqIHZhciBjbG9uZSA9IF8uY2xvbmVEZWVwKHZpZXcsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gKiAgIHJldHVybiBfLmlzRWxlbWVudCh2YWx1ZSkgPyB2YWx1ZS5jbG9uZU5vZGUodHJ1ZSkgOiB1bmRlZmluZWQ7XG4gKiB9KTtcbiAqXG4gKiBjbG9uZS5ub2RlID09IHZpZXcubm9kZTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGNsb25lRGVlcCh2YWx1ZSwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgcmV0dXJuIGJhc2VDbG9uZSh2YWx1ZSwgdHJ1ZSwgdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgJiYgYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAxKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xvbmVEZWVwO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBhc3NpZ24gPSByZXF1aXJlKCdsb2Rhc2guYXNzaWduJyksXG4gICAgZm9yRWFjaCA9IHJlcXVpcmUoJ2xvZGFzaC5mb3JlYWNoJyksXG4gICAgZm9yT3duID0gcmVxdWlyZSgnbG9kYXNoLmZvcm93bicpLFxuICAgIGdldEFycmF5ID0gcmVxdWlyZSgnbG9kYXNoLl9nZXRhcnJheScpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCdsb2Rhc2guaXNhcnJheScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0JyksXG4gICAgcmVsZWFzZUFycmF5ID0gcmVxdWlyZSgnbG9kYXNoLl9yZWxlYXNlYXJyYXknKSxcbiAgICBzbGljZSA9IHJlcXVpcmUoJ2xvZGFzaC5fc2xpY2UnKTtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggcmVnZXhwIGZsYWdzIGZyb20gdGhlaXIgY29lcmNlZCBzdHJpbmcgdmFsdWVzICovXG52YXIgcmVGbGFncyA9IC9cXHcqJC87XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgc2hvcnRjdXRzICovXG52YXIgYXJnc0NsYXNzID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgYXJyYXlDbGFzcyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgYm9vbENsYXNzID0gJ1tvYmplY3QgQm9vbGVhbl0nLFxuICAgIGRhdGVDbGFzcyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICBmdW5jQ2xhc3MgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIG51bWJlckNsYXNzID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgb2JqZWN0Q2xhc3MgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICByZWdleHBDbGFzcyA9ICdbb2JqZWN0IFJlZ0V4cF0nLFxuICAgIHN0cmluZ0NsYXNzID0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cbi8qKiBVc2VkIHRvIGlkZW50aWZ5IG9iamVjdCBjbGFzc2lmaWNhdGlvbnMgdGhhdCBgXy5jbG9uZWAgc3VwcG9ydHMgKi9cbnZhciBjbG9uZWFibGVDbGFzc2VzID0ge307XG5jbG9uZWFibGVDbGFzc2VzW2Z1bmNDbGFzc10gPSBmYWxzZTtcbmNsb25lYWJsZUNsYXNzZXNbYXJnc0NsYXNzXSA9IGNsb25lYWJsZUNsYXNzZXNbYXJyYXlDbGFzc10gPVxuY2xvbmVhYmxlQ2xhc3Nlc1tib29sQ2xhc3NdID0gY2xvbmVhYmxlQ2xhc3Nlc1tkYXRlQ2xhc3NdID1cbmNsb25lYWJsZUNsYXNzZXNbbnVtYmVyQ2xhc3NdID0gY2xvbmVhYmxlQ2xhc3Nlc1tvYmplY3RDbGFzc10gPVxuY2xvbmVhYmxlQ2xhc3Nlc1tyZWdleHBDbGFzc10gPSBjbG9uZWFibGVDbGFzc2VzW3N0cmluZ0NsYXNzXSA9IHRydWU7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGludGVybmFsIFtbQ2xhc3NdXSBvZiB2YWx1ZXMgKi9cbnZhciB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogVXNlZCB0byBsb29rdXAgYSBidWlsdC1pbiBjb25zdHJ1Y3RvciBieSBbW0NsYXNzXV0gKi9cbnZhciBjdG9yQnlDbGFzcyA9IHt9O1xuY3RvckJ5Q2xhc3NbYXJyYXlDbGFzc10gPSBBcnJheTtcbmN0b3JCeUNsYXNzW2Jvb2xDbGFzc10gPSBCb29sZWFuO1xuY3RvckJ5Q2xhc3NbZGF0ZUNsYXNzXSA9IERhdGU7XG5jdG9yQnlDbGFzc1tmdW5jQ2xhc3NdID0gRnVuY3Rpb247XG5jdG9yQnlDbGFzc1tvYmplY3RDbGFzc10gPSBPYmplY3Q7XG5jdG9yQnlDbGFzc1tudW1iZXJDbGFzc10gPSBOdW1iZXI7XG5jdG9yQnlDbGFzc1tyZWdleHBDbGFzc10gPSBSZWdFeHA7XG5jdG9yQnlDbGFzc1tzdHJpbmdDbGFzc10gPSBTdHJpbmc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY2xvbmVgIHdpdGhvdXQgYXJndW1lbnQganVnZ2xpbmcgb3Igc3VwcG9ydFxuICogZm9yIGB0aGlzQXJnYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjbG9uZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRGVlcD1mYWxzZV0gU3BlY2lmeSBhIGRlZXAgY2xvbmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY2xvbmluZyB2YWx1ZXMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQj1bXV0gQXNzb2NpYXRlcyBjbG9uZXMgd2l0aCBzb3VyY2UgY291bnRlcnBhcnRzLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGNsb25lZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gYmFzZUNsb25lKHZhbHVlLCBpc0RlZXAsIGNhbGxiYWNrLCBzdGFja0EsIHN0YWNrQikge1xuICBpZiAoY2FsbGJhY2spIHtcbiAgICB2YXIgcmVzdWx0ID0gY2FsbGJhY2sodmFsdWUpO1xuICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvLyBpbnNwZWN0IFtbQ2xhc3NdXVxuICB2YXIgaXNPYmogPSBpc09iamVjdCh2YWx1ZSk7XG4gIGlmIChpc09iaikge1xuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgICBpZiAoIWNsb25lYWJsZUNsYXNzZXNbY2xhc3NOYW1lXSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICB2YXIgY3RvciA9IGN0b3JCeUNsYXNzW2NsYXNzTmFtZV07XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIGNhc2UgYm9vbENsYXNzOlxuICAgICAgY2FzZSBkYXRlQ2xhc3M6XG4gICAgICAgIHJldHVybiBuZXcgY3RvcigrdmFsdWUpO1xuXG4gICAgICBjYXNlIG51bWJlckNsYXNzOlxuICAgICAgY2FzZSBzdHJpbmdDbGFzczpcbiAgICAgICAgcmV0dXJuIG5ldyBjdG9yKHZhbHVlKTtcblxuICAgICAgY2FzZSByZWdleHBDbGFzczpcbiAgICAgICAgcmVzdWx0ID0gY3Rvcih2YWx1ZS5zb3VyY2UsIHJlRmxhZ3MuZXhlYyh2YWx1ZSkpO1xuICAgICAgICByZXN1bHQubGFzdEluZGV4ID0gdmFsdWUubGFzdEluZGV4O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdmFyIGlzQXJyID0gaXNBcnJheSh2YWx1ZSk7XG4gIGlmIChpc0RlZXApIHtcbiAgICAvLyBjaGVjayBmb3IgY2lyY3VsYXIgcmVmZXJlbmNlcyBhbmQgcmV0dXJuIGNvcnJlc3BvbmRpbmcgY2xvbmVcbiAgICB2YXIgaW5pdGVkU3RhY2sgPSAhc3RhY2tBO1xuICAgIHN0YWNrQSB8fCAoc3RhY2tBID0gZ2V0QXJyYXkoKSk7XG4gICAgc3RhY2tCIHx8IChzdGFja0IgPSBnZXRBcnJheSgpKTtcblxuICAgIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgaWYgKHN0YWNrQVtsZW5ndGhdID09IHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBzdGFja0JbbGVuZ3RoXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0ID0gaXNBcnIgPyBjdG9yKHZhbHVlLmxlbmd0aCkgOiB7fTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXN1bHQgPSBpc0FyciA/IHNsaWNlKHZhbHVlKSA6IGFzc2lnbih7fSwgdmFsdWUpO1xuICB9XG4gIC8vIGFkZCBhcnJheSBwcm9wZXJ0aWVzIGFzc2lnbmVkIGJ5IGBSZWdFeHAjZXhlY2BcbiAgaWYgKGlzQXJyKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdpbmRleCcpKSB7XG4gICAgICByZXN1bHQuaW5kZXggPSB2YWx1ZS5pbmRleDtcbiAgICB9XG4gICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdpbnB1dCcpKSB7XG4gICAgICByZXN1bHQuaW5wdXQgPSB2YWx1ZS5pbnB1dDtcbiAgICB9XG4gIH1cbiAgLy8gZXhpdCBmb3Igc2hhbGxvdyBjbG9uZVxuICBpZiAoIWlzRGVlcCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgLy8gYWRkIHRoZSBzb3VyY2UgdmFsdWUgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzXG4gIC8vIGFuZCBhc3NvY2lhdGUgaXQgd2l0aCBpdHMgY2xvbmVcbiAgc3RhY2tBLnB1c2godmFsdWUpO1xuICBzdGFja0IucHVzaChyZXN1bHQpO1xuXG4gIC8vIHJlY3Vyc2l2ZWx5IHBvcHVsYXRlIGNsb25lIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cylcbiAgKGlzQXJyID8gZm9yRWFjaCA6IGZvck93bikodmFsdWUsIGZ1bmN0aW9uKG9ialZhbHVlLCBrZXkpIHtcbiAgICByZXN1bHRba2V5XSA9IGJhc2VDbG9uZShvYmpWYWx1ZSwgaXNEZWVwLCBjYWxsYmFjaywgc3RhY2tBLCBzdGFja0IpO1xuICB9KTtcblxuICBpZiAoaW5pdGVkU3RhY2spIHtcbiAgICByZWxlYXNlQXJyYXkoc3RhY2tBKTtcbiAgICByZWxlYXNlQXJyYXkoc3RhY2tCKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VDbG9uZTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYXJyYXlQb29sID0gcmVxdWlyZSgnbG9kYXNoLl9hcnJheXBvb2wnKTtcblxuLyoqXG4gKiBHZXRzIGFuIGFycmF5IGZyb20gdGhlIGFycmF5IHBvb2wgb3IgY3JlYXRlcyBhIG5ldyBvbmUgaWYgdGhlIHBvb2wgaXMgZW1wdHkuXG4gKlxuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IGZyb20gdGhlIHBvb2wuXG4gKi9cbmZ1bmN0aW9uIGdldEFycmF5KCkge1xuICByZXR1cm4gYXJyYXlQb29sLnBvcCgpIHx8IFtdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldEFycmF5O1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgdG8gcG9vbCBhcnJheXMgYW5kIG9iamVjdHMgdXNlZCBpbnRlcm5hbGx5ICovXG52YXIgYXJyYXlQb29sID0gW107XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlQb29sO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBhcnJheVBvb2wgPSByZXF1aXJlKCdsb2Rhc2guX2FycmF5cG9vbCcpLFxuICAgIG1heFBvb2xTaXplID0gcmVxdWlyZSgnbG9kYXNoLl9tYXhwb29sc2l6ZScpO1xuXG4vKipcbiAqIFJlbGVhc2VzIHRoZSBnaXZlbiBhcnJheSBiYWNrIHRvIHRoZSBhcnJheSBwb29sLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byByZWxlYXNlLlxuICovXG5mdW5jdGlvbiByZWxlYXNlQXJyYXkoYXJyYXkpIHtcbiAgYXJyYXkubGVuZ3RoID0gMDtcbiAgaWYgKGFycmF5UG9vbC5sZW5ndGggPCBtYXhQb29sU2l6ZSkge1xuICAgIGFycmF5UG9vbC5wdXNoKGFycmF5KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlbGVhc2VBcnJheTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGFzIHRoZSBtYXggc2l6ZSBvZiB0aGUgYGFycmF5UG9vbGAgYW5kIGBvYmplY3RQb29sYCAqL1xudmFyIG1heFBvb2xTaXplID0gNDA7XG5cbm1vZHVsZS5leHBvcnRzID0gbWF4UG9vbFNpemU7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKipcbiAqIFNsaWNlcyB0aGUgYGNvbGxlY3Rpb25gIGZyb20gdGhlIGBzdGFydGAgaW5kZXggdXAgdG8sIGJ1dCBub3QgaW5jbHVkaW5nLFxuICogdGhlIGBlbmRgIGluZGV4LlxuICpcbiAqIE5vdGU6IFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBpbnN0ZWFkIG9mIGBBcnJheSNzbGljZWAgdG8gc3VwcG9ydCBub2RlIGxpc3RzXG4gKiBpbiBJRSA8IDkgYW5kIHRvIGVuc3VyZSBkZW5zZSBhcnJheXMgYXJlIHJldHVybmVkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gc2xpY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgVGhlIHN0YXJ0IGluZGV4LlxuICogQHBhcmFtIHtudW1iZXJ9IGVuZCBUaGUgZW5kIGluZGV4LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIHNsaWNlKGFycmF5LCBzdGFydCwgZW5kKSB7XG4gIHN0YXJ0IHx8IChzdGFydCA9IDApO1xuICBpZiAodHlwZW9mIGVuZCA9PSAndW5kZWZpbmVkJykge1xuICAgIGVuZCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMDtcbiAgfVxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGVuZCAtIHN0YXJ0IHx8IDAsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGggPCAwID8gMCA6IGxlbmd0aCk7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gYXJyYXlbc3RhcnQgKyBpbmRleF07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzbGljZTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUNyZWF0ZUNhbGxiYWNrID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2snKSxcbiAgICBrZXlzID0gcmVxdWlyZSgnbG9kYXNoLmtleXMnKSxcbiAgICBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqXG4gKiBBc3NpZ25zIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2Ygc291cmNlIG9iamVjdChzKSB0byB0aGUgZGVzdGluYXRpb25cbiAqIG9iamVjdC4gU3Vic2VxdWVudCBzb3VyY2VzIHdpbGwgb3ZlcndyaXRlIHByb3BlcnR5IGFzc2lnbm1lbnRzIG9mIHByZXZpb3VzXG4gKiBzb3VyY2VzLiBJZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgZXhlY3V0ZWQgdG8gcHJvZHVjZSB0aGVcbiAqIGFzc2lnbmVkIHZhbHVlcy4gVGhlIGNhbGxiYWNrIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHR3b1xuICogYXJndW1lbnRzOyAob2JqZWN0VmFsdWUsIHNvdXJjZVZhbHVlKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBhbGlhcyBleHRlbmRcbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZV0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGFzc2lnbmluZyB2YWx1ZXMuXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5hc3NpZ24oeyAnbmFtZSc6ICdmcmVkJyB9LCB7ICdlbXBsb3llcic6ICdzbGF0ZScgfSk7XG4gKiAvLyA9PiB7ICduYW1lJzogJ2ZyZWQnLCAnZW1wbG95ZXInOiAnc2xhdGUnIH1cbiAqXG4gKiB2YXIgZGVmYXVsdHMgPSBfLnBhcnRpYWxSaWdodChfLmFzc2lnbiwgZnVuY3Rpb24oYSwgYikge1xuICogICByZXR1cm4gdHlwZW9mIGEgPT0gJ3VuZGVmaW5lZCcgPyBiIDogYTtcbiAqIH0pO1xuICpcbiAqIHZhciBvYmplY3QgPSB7ICduYW1lJzogJ2Jhcm5leScgfTtcbiAqIGRlZmF1bHRzKG9iamVjdCwgeyAnbmFtZSc6ICdmcmVkJywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9KTtcbiAqIC8vID0+IHsgJ25hbWUnOiAnYmFybmV5JywgJ2VtcGxveWVyJzogJ3NsYXRlJyB9XG4gKi9cbnZhciBhc3NpZ24gPSBmdW5jdGlvbihvYmplY3QsIHNvdXJjZSwgZ3VhcmQpIHtcbiAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IG9iamVjdCwgcmVzdWx0ID0gaXRlcmFibGU7XG4gIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgYXJnc0luZGV4ID0gMCxcbiAgICAgIGFyZ3NMZW5ndGggPSB0eXBlb2YgZ3VhcmQgPT0gJ251bWJlcicgPyAyIDogYXJncy5sZW5ndGg7XG4gIGlmIChhcmdzTGVuZ3RoID4gMyAmJiB0eXBlb2YgYXJnc1thcmdzTGVuZ3RoIC0gMl0gPT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBjYWxsYmFjayA9IGJhc2VDcmVhdGVDYWxsYmFjayhhcmdzWy0tYXJnc0xlbmd0aCAtIDFdLCBhcmdzW2FyZ3NMZW5ndGgtLV0sIDIpO1xuICB9IGVsc2UgaWYgKGFyZ3NMZW5ndGggPiAyICYmIHR5cGVvZiBhcmdzW2FyZ3NMZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBhcmdzWy0tYXJnc0xlbmd0aF07XG4gIH1cbiAgd2hpbGUgKCsrYXJnc0luZGV4IDwgYXJnc0xlbmd0aCkge1xuICAgIGl0ZXJhYmxlID0gYXJnc1thcmdzSW5kZXhdO1xuICAgIGlmIChpdGVyYWJsZSAmJiBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSB7XG4gICAgdmFyIG93bkluZGV4ID0gLTEsXG4gICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgbGVuZ3RoID0gb3duUHJvcHMgPyBvd25Qcm9wcy5sZW5ndGggOiAwO1xuXG4gICAgd2hpbGUgKCsrb3duSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgcmVzdWx0W2luZGV4XSA9IGNhbGxiYWNrID8gY2FsbGJhY2socmVzdWx0W2luZGV4XSwgaXRlcmFibGVbaW5kZXhdKSA6IGl0ZXJhYmxlW2luZGV4XTtcbiAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXNzaWduO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgT2JqZWN0ICovXG52YXIgb2JqZWN0VHlwZXMgPSB7XG4gICdib29sZWFuJzogZmFsc2UsXG4gICdmdW5jdGlvbic6IHRydWUsXG4gICdvYmplY3QnOiB0cnVlLFxuICAnbnVtYmVyJzogZmFsc2UsXG4gICdzdHJpbmcnOiBmYWxzZSxcbiAgJ3VuZGVmaW5lZCc6IGZhbHNlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFR5cGVzO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBpc05hdGl2ZSA9IHJlcXVpcmUoJ2xvZGFzaC5faXNuYXRpdmUnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC5pc29iamVjdCcpLFxuICAgIHNoaW1LZXlzID0gcmVxdWlyZSgnbG9kYXNoLl9zaGlta2V5cycpO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyBmb3IgbWV0aG9kcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcyAqL1xudmFyIG5hdGl2ZUtleXMgPSBpc05hdGl2ZShuYXRpdmVLZXlzID0gT2JqZWN0LmtleXMpICYmIG5hdGl2ZUtleXM7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBjb21wb3NlZCBvZiB0aGUgb3duIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ua2V5cyh7ICdvbmUnOiAxLCAndHdvJzogMiwgJ3RocmVlJzogMyB9KTtcbiAqIC8vID0+IFsnb25lJywgJ3R3bycsICd0aHJlZSddIChwcm9wZXJ0eSBvcmRlciBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3MgZW52aXJvbm1lbnRzKVxuICovXG52YXIga2V5cyA9ICFuYXRpdmVLZXlzID8gc2hpbUtleXMgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBuYXRpdmVLZXlzKG9iamVjdCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXM7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBpbnRlcm5hbCBbW0NsYXNzXV0gb2YgdmFsdWVzICovXG52YXIgdG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZSAqL1xudmFyIHJlTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIFN0cmluZyh0b1N0cmluZylcbiAgICAucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKVxuICAgIC5yZXBsYWNlKC90b1N0cmluZ3wgZm9yIFteXFxdXSsvZywgJy4qPycpICsgJyQnXG4pO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicgJiYgcmVOYXRpdmUudGVzdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNOYXRpdmU7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gb2YgYE9iamVjdC5rZXlzYCB3aGljaCBwcm9kdWNlcyBhbiBhcnJheSBvZiB0aGVcbiAqIGdpdmVuIG9iamVjdCdzIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSBGdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYW4gYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKi9cbnZhciBzaGltS2V5cyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gb2JqZWN0LCByZXN1bHQgPSBbXTtcbiAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgaWYgKCEob2JqZWN0VHlwZXNbdHlwZW9mIG9iamVjdF0pKSByZXR1cm4gcmVzdWx0O1xuICAgIGZvciAoaW5kZXggaW4gaXRlcmFibGUpIHtcbiAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGl0ZXJhYmxlLCBpbmRleCkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgcmV0dXJuIHJlc3VsdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzaGltS2V5cztcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUNyZWF0ZUNhbGxiYWNrID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNlY3JlYXRlY2FsbGJhY2snKSxcbiAgICBmb3JPd24gPSByZXF1aXJlKCdsb2Rhc2guZm9yb3duJyk7XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBhIGNvbGxlY3Rpb24sIGV4ZWN1dGluZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2hcbiAqIGVsZW1lbnQuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM7XG4gKiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuIENhbGxiYWNrcyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHkgYnlcbiAqIGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogTm90ZTogQXMgd2l0aCBvdGhlciBcIkNvbGxlY3Rpb25zXCIgbWV0aG9kcywgb2JqZWN0cyB3aXRoIGEgYGxlbmd0aGAgcHJvcGVydHlcbiAqIGFyZSBpdGVyYXRlZCBsaWtlIGFycmF5cy4gVG8gYXZvaWQgdGhpcyBiZWhhdmlvciBgXy5mb3JJbmAgb3IgYF8uZm9yT3duYFxuICogbWF5IGJlIHVzZWQgZm9yIG9iamVjdCBpdGVyYXRpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBlYWNoXG4gKiBAY2F0ZWdvcnkgQ29sbGVjdGlvbnNcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICogQHJldHVybnMge0FycmF5fE9iamVjdHxzdHJpbmd9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfKFsxLCAyLCAzXSkuZm9yRWFjaChmdW5jdGlvbihudW0pIHsgY29uc29sZS5sb2cobnVtKTsgfSkuam9pbignLCcpO1xuICogLy8gPT4gbG9ncyBlYWNoIG51bWJlciBhbmQgcmV0dXJucyAnMSwyLDMnXG4gKlxuICogXy5mb3JFYWNoKHsgJ29uZSc6IDEsICd0d28nOiAyLCAndGhyZWUnOiAzIH0sIGZ1bmN0aW9uKG51bSkgeyBjb25zb2xlLmxvZyhudW0pOyB9KTtcbiAqIC8vID0+IGxvZ3MgZWFjaCBudW1iZXIgYW5kIHJldHVybnMgdGhlIG9iamVjdCAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAqL1xuZnVuY3Rpb24gZm9yRWFjaChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgY2FsbGJhY2sgPSBjYWxsYmFjayAmJiB0eXBlb2YgdGhpc0FyZyA9PSAndW5kZWZpbmVkJyA/IGNhbGxiYWNrIDogYmFzZUNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnLCAzKTtcbiAgaWYgKHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicpIHtcbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgaWYgKGNhbGxiYWNrKGNvbGxlY3Rpb25baW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbikgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3JPd24oY29sbGVjdGlvbiwgY2FsbGJhY2spO1xuICB9XG4gIHJldHVybiBjb2xsZWN0aW9uO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZvckVhY2g7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGJhc2VDcmVhdGVDYWxsYmFjayA9IHJlcXVpcmUoJ2xvZGFzaC5fYmFzZWNyZWF0ZWNhbGxiYWNrJyksXG4gICAga2V5cyA9IHJlcXVpcmUoJ2xvZGFzaC5rZXlzJyksXG4gICAgb2JqZWN0VHlwZXMgPSByZXF1aXJlKCdsb2Rhc2guX29iamVjdHR5cGVzJyk7XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGFuIG9iamVjdCwgZXhlY3V0aW5nIHRoZSBjYWxsYmFja1xuICogZm9yIGVhY2ggcHJvcGVydHkuIFRoZSBjYWxsYmFjayBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICogYXJndW1lbnRzOyAodmFsdWUsIGtleSwgb2JqZWN0KS4gQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieVxuICogZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZm9yT3duKHsgJzAnOiAnemVybycsICcxJzogJ29uZScsICdsZW5ndGgnOiAyIH0sIGZ1bmN0aW9uKG51bSwga2V5KSB7XG4gKiAgIGNvbnNvbGUubG9nKGtleSk7XG4gKiB9KTtcbiAqIC8vID0+IGxvZ3MgJzAnLCAnMScsIGFuZCAnbGVuZ3RoJyAocHJvcGVydHkgb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGVudmlyb25tZW50cylcbiAqL1xudmFyIGZvck93biA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gIHZhciBpbmRleCwgaXRlcmFibGUgPSBjb2xsZWN0aW9uLCByZXN1bHQgPSBpdGVyYWJsZTtcbiAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgaWYgKCFvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSByZXR1cm4gcmVzdWx0O1xuICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBiYXNlQ3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcsIDMpO1xuICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICBvd25Qcm9wcyA9IG9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0gJiYga2V5cyhpdGVyYWJsZSksXG4gICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBpbmRleCA9IG93blByb3BzW293bkluZGV4XTtcbiAgICAgIGlmIChjYWxsYmFjayhpdGVyYWJsZVtpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICByZXR1cm4gcmVzdWx0XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvck93bjtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgaXNOYXRpdmUgPSByZXF1aXJlKCdsb2Rhc2guX2lzbmF0aXZlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgc2hvcnRjdXRzICovXG52YXIgYXJyYXlDbGFzcyA9ICdbb2JqZWN0IEFycmF5XSc7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGludGVybmFsIFtbQ2xhc3NdXSBvZiB2YWx1ZXMgKi9cbnZhciB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyBmb3IgbWV0aG9kcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcyAqL1xudmFyIG5hdGl2ZUlzQXJyYXkgPSBpc05hdGl2ZShuYXRpdmVJc0FycmF5ID0gQXJyYXkuaXNBcnJheSkgJiYgbmF0aXZlSXNBcnJheTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhbiBhcnJheS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHR5cGUgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiAoZnVuY3Rpb24oKSB7IHJldHVybiBfLmlzQXJyYXkoYXJndW1lbnRzKTsgfSkoKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbnZhciBpc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcnJheUNsYXNzIHx8IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5O1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3QuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdCgxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIGNoZWNrIGlmIHRoZSB2YWx1ZSBpcyB0aGUgRUNNQVNjcmlwdCBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdFxuICAvLyBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDhcbiAgLy8gYW5kIGF2b2lkIGEgVjggYnVnXG4gIC8vIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTFcbiAgcmV0dXJuICEhKHZhbHVlICYmIG9iamVjdFR5cGVzW3R5cGVvZiB2YWx1ZV0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBiaW5kID0gcmVxdWlyZSgnbG9kYXNoLmJpbmQnKSxcbiAgICBpZGVudGl0eSA9IHJlcXVpcmUoJ2xvZGFzaC5pZGVudGl0eScpLFxuICAgIHNldEJpbmREYXRhID0gcmVxdWlyZSgnbG9kYXNoLl9zZXRiaW5kZGF0YScpLFxuICAgIHN1cHBvcnQgPSByZXF1aXJlKCdsb2Rhc2guc3VwcG9ydCcpO1xuXG4vKiogVXNlZCB0byBkZXRlY3RlZCBuYW1lZCBmdW5jdGlvbnMgKi9cbnZhciByZUZ1bmNOYW1lID0gL15cXHMqZnVuY3Rpb25bIFxcblxcclxcdF0rXFx3LztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGZ1bmN0aW9ucyBjb250YWluaW5nIGEgYHRoaXNgIHJlZmVyZW5jZSAqL1xudmFyIHJlVGhpcyA9IC9cXGJ0aGlzXFxiLztcblxuLyoqIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzICovXG52YXIgZm5Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5jcmVhdGVDYWxsYmFja2Agd2l0aG91dCBzdXBwb3J0IGZvciBjcmVhdGluZ1xuICogXCJfLnBsdWNrXCIgb3IgXCJfLndoZXJlXCIgc3R5bGUgY2FsbGJhY2tzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IFtmdW5jPWlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhIGNhbGxiYWNrLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIHRoZSBjcmVhdGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIHtudW1iZXJ9IFthcmdDb3VudF0gVGhlIG51bWJlciBvZiBhcmd1bWVudHMgdGhlIGNhbGxiYWNrIGFjY2VwdHMuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgYSBjYWxsYmFjayBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZUNyZWF0ZUNhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlkZW50aXR5O1xuICB9XG4gIC8vIGV4aXQgZWFybHkgZm9yIG5vIGB0aGlzQXJnYCBvciBhbHJlYWR5IGJvdW5kIGJ5IGBGdW5jdGlvbiNiaW5kYFxuICBpZiAodHlwZW9mIHRoaXNBcmcgPT0gJ3VuZGVmaW5lZCcgfHwgISgncHJvdG90eXBlJyBpbiBmdW5jKSkge1xuICAgIHJldHVybiBmdW5jO1xuICB9XG4gIHZhciBiaW5kRGF0YSA9IGZ1bmMuX19iaW5kRGF0YV9fO1xuICBpZiAodHlwZW9mIGJpbmREYXRhID09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHN1cHBvcnQuZnVuY05hbWVzKSB7XG4gICAgICBiaW5kRGF0YSA9ICFmdW5jLm5hbWU7XG4gICAgfVxuICAgIGJpbmREYXRhID0gYmluZERhdGEgfHwgIXN1cHBvcnQuZnVuY0RlY29tcDtcbiAgICBpZiAoIWJpbmREYXRhKSB7XG4gICAgICB2YXIgc291cmNlID0gZm5Ub1N0cmluZy5jYWxsKGZ1bmMpO1xuICAgICAgaWYgKCFzdXBwb3J0LmZ1bmNOYW1lcykge1xuICAgICAgICBiaW5kRGF0YSA9ICFyZUZ1bmNOYW1lLnRlc3Qoc291cmNlKTtcbiAgICAgIH1cbiAgICAgIGlmICghYmluZERhdGEpIHtcbiAgICAgICAgLy8gY2hlY2tzIGlmIGBmdW5jYCByZWZlcmVuY2VzIHRoZSBgdGhpc2Aga2V5d29yZCBhbmQgc3RvcmVzIHRoZSByZXN1bHRcbiAgICAgICAgYmluZERhdGEgPSByZVRoaXMudGVzdChzb3VyY2UpO1xuICAgICAgICBzZXRCaW5kRGF0YShmdW5jLCBiaW5kRGF0YSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIGV4aXQgZWFybHkgaWYgdGhlcmUgYXJlIG5vIGB0aGlzYCByZWZlcmVuY2VzIG9yIGBmdW5jYCBpcyBib3VuZFxuICBpZiAoYmluZERhdGEgPT09IGZhbHNlIHx8IChiaW5kRGF0YSAhPT0gdHJ1ZSAmJiBiaW5kRGF0YVsxXSAmIDEpKSB7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH1cbiAgc3dpdGNoIChhcmdDb3VudCkge1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlKTtcbiAgICB9O1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYSwgYik7XG4gICAgfTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICB9O1xuICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gYmluZChmdW5jLCB0aGlzQXJnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQ3JlYXRlQ2FsbGJhY2s7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnbG9kYXNoLl9pc25hdGl2ZScpLFxuICAgIG5vb3AgPSByZXF1aXJlKCdsb2Rhc2gubm9vcCcpO1xuXG4vKiogVXNlZCBhcyB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgYF9fYmluZERhdGFfX2AgKi9cbnZhciBkZXNjcmlwdG9yID0ge1xuICAnY29uZmlndXJhYmxlJzogZmFsc2UsXG4gICdlbnVtZXJhYmxlJzogZmFsc2UsXG4gICd2YWx1ZSc6IG51bGwsXG4gICd3cml0YWJsZSc6IGZhbHNlXG59O1xuXG4vKiogVXNlZCB0byBzZXQgbWV0YSBkYXRhIG9uIGZ1bmN0aW9ucyAqL1xudmFyIGRlZmluZVByb3BlcnR5ID0gKGZ1bmN0aW9uKCkge1xuICAvLyBJRSA4IG9ubHkgYWNjZXB0cyBET00gZWxlbWVudHNcbiAgdHJ5IHtcbiAgICB2YXIgbyA9IHt9LFxuICAgICAgICBmdW5jID0gaXNOYXRpdmUoZnVuYyA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgJiYgZnVuYyxcbiAgICAgICAgcmVzdWx0ID0gZnVuYyhvLCBvLCBvKSAmJiBmdW5jO1xuICB9IGNhdGNoKGUpIHsgfVxuICByZXR1cm4gcmVzdWx0O1xufSgpKTtcblxuLyoqXG4gKiBTZXRzIGB0aGlzYCBiaW5kaW5nIGRhdGEgb24gYSBnaXZlbiBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gc2V0IGRhdGEgb24uXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZSBUaGUgZGF0YSBhcnJheSB0byBzZXQuXG4gKi9cbnZhciBzZXRCaW5kRGF0YSA9ICFkZWZpbmVQcm9wZXJ0eSA/IG5vb3AgOiBmdW5jdGlvbihmdW5jLCB2YWx1ZSkge1xuICBkZXNjcmlwdG9yLnZhbHVlID0gdmFsdWU7XG4gIGRlZmluZVByb3BlcnR5KGZ1bmMsICdfX2JpbmREYXRhX18nLCBkZXNjcmlwdG9yKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0QmluZERhdGE7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKipcbiAqIEEgbm8tb3BlcmF0aW9uIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICduYW1lJzogJ2ZyZWQnIH07XG4gKiBfLm5vb3Aob2JqZWN0KSA9PT0gdW5kZWZpbmVkO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBub29wKCkge1xuICAvLyBubyBvcGVyYXRpb24gcGVyZm9ybWVkXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbm9vcDtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgY3JlYXRlV3JhcHBlciA9IHJlcXVpcmUoJ2xvZGFzaC5fY3JlYXRld3JhcHBlcicpLFxuICAgIHNsaWNlID0gcmVxdWlyZSgnbG9kYXNoLl9zbGljZScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGUgYHRoaXNgXG4gKiBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgcHJlcGVuZHMgYW55IGFkZGl0aW9uYWwgYGJpbmRgIGFyZ3VtZW50cyB0byB0aG9zZVxuICogcHJvdmlkZWQgdG8gdGhlIGJvdW5kIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBiaW5kLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAqIEBwYXJhbSB7Li4uKn0gW2FyZ10gQXJndW1lbnRzIHRvIGJlIHBhcnRpYWxseSBhcHBsaWVkLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBmdW5jID0gZnVuY3Rpb24oZ3JlZXRpbmcpIHtcbiAqICAgcmV0dXJuIGdyZWV0aW5nICsgJyAnICsgdGhpcy5uYW1lO1xuICogfTtcbiAqXG4gKiBmdW5jID0gXy5iaW5kKGZ1bmMsIHsgJ25hbWUnOiAnZnJlZCcgfSwgJ2hpJyk7XG4gKiBmdW5jKCk7XG4gKiAvLyA9PiAnaGkgZnJlZCdcbiAqL1xuZnVuY3Rpb24gYmluZChmdW5jLCB0aGlzQXJnKSB7XG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID4gMlxuICAgID8gY3JlYXRlV3JhcHBlcihmdW5jLCAxNywgc2xpY2UoYXJndW1lbnRzLCAyKSwgbnVsbCwgdGhpc0FyZylcbiAgICA6IGNyZWF0ZVdyYXBwZXIoZnVuYywgMSwgbnVsbCwgbnVsbCwgdGhpc0FyZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmluZDtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUJpbmQgPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2ViaW5kJyksXG4gICAgYmFzZUNyZWF0ZVdyYXBwZXIgPSByZXF1aXJlKCdsb2Rhc2guX2Jhc2VjcmVhdGV3cmFwcGVyJyksXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2xvZGFzaC5pc2Z1bmN0aW9uJyksXG4gICAgc2xpY2UgPSByZXF1aXJlKCdsb2Rhc2guX3NsaWNlJyk7XG5cbi8qKlxuICogVXNlZCBmb3IgYEFycmF5YCBtZXRob2QgcmVmZXJlbmNlcy5cbiAqXG4gKiBOb3JtYWxseSBgQXJyYXkucHJvdG90eXBlYCB3b3VsZCBzdWZmaWNlLCBob3dldmVyLCB1c2luZyBhbiBhcnJheSBsaXRlcmFsXG4gKiBhdm9pZHMgaXNzdWVzIGluIE5hcndoYWwuXG4gKi9cbnZhciBhcnJheVJlZiA9IFtdO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBwdXNoID0gYXJyYXlSZWYucHVzaCxcbiAgICB1bnNoaWZ0ID0gYXJyYXlSZWYudW5zaGlmdDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGVpdGhlciBjdXJyaWVzIG9yIGludm9rZXMgYGZ1bmNgXG4gKiB3aXRoIGFuIG9wdGlvbmFsIGB0aGlzYCBiaW5kaW5nIGFuZCBwYXJ0aWFsbHkgYXBwbGllZCBhcmd1bWVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb258c3RyaW5nfSBmdW5jIFRoZSBmdW5jdGlvbiBvciBtZXRob2QgbmFtZSB0byByZWZlcmVuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gYml0bWFzayBUaGUgYml0bWFzayBvZiBtZXRob2QgZmxhZ3MgdG8gY29tcG9zZS5cbiAqICBUaGUgYml0bWFzayBtYXkgYmUgY29tcG9zZWQgb2YgdGhlIGZvbGxvd2luZyBmbGFnczpcbiAqICAxIC0gYF8uYmluZGBcbiAqICAyIC0gYF8uYmluZEtleWBcbiAqICA0IC0gYF8uY3VycnlgXG4gKiAgOCAtIGBfLmN1cnJ5YCAoYm91bmQpXG4gKiAgMTYgLSBgXy5wYXJ0aWFsYFxuICogIDMyIC0gYF8ucGFydGlhbFJpZ2h0YFxuICogQHBhcmFtIHtBcnJheX0gW3BhcnRpYWxBcmdzXSBBbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gcHJlcGVuZCB0byB0aG9zZVxuICogIHByb3ZpZGVkIHRvIHRoZSBuZXcgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge0FycmF5fSBbcGFydGlhbFJpZ2h0QXJnc10gQW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGFwcGVuZCB0byB0aG9zZVxuICogIHByb3ZpZGVkIHRvIHRoZSBuZXcgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICogQHBhcmFtIHtudW1iZXJ9IFthcml0eV0gVGhlIGFyaXR5IG9mIGBmdW5jYC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVXcmFwcGVyKGZ1bmMsIGJpdG1hc2ssIHBhcnRpYWxBcmdzLCBwYXJ0aWFsUmlnaHRBcmdzLCB0aGlzQXJnLCBhcml0eSkge1xuICB2YXIgaXNCaW5kID0gYml0bWFzayAmIDEsXG4gICAgICBpc0JpbmRLZXkgPSBiaXRtYXNrICYgMixcbiAgICAgIGlzQ3VycnkgPSBiaXRtYXNrICYgNCxcbiAgICAgIGlzQ3VycnlCb3VuZCA9IGJpdG1hc2sgJiA4LFxuICAgICAgaXNQYXJ0aWFsID0gYml0bWFzayAmIDE2LFxuICAgICAgaXNQYXJ0aWFsUmlnaHQgPSBiaXRtYXNrICYgMzI7XG5cbiAgaWYgKCFpc0JpbmRLZXkgJiYgIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICB9XG4gIGlmIChpc1BhcnRpYWwgJiYgIXBhcnRpYWxBcmdzLmxlbmd0aCkge1xuICAgIGJpdG1hc2sgJj0gfjE2O1xuICAgIGlzUGFydGlhbCA9IHBhcnRpYWxBcmdzID0gZmFsc2U7XG4gIH1cbiAgaWYgKGlzUGFydGlhbFJpZ2h0ICYmICFwYXJ0aWFsUmlnaHRBcmdzLmxlbmd0aCkge1xuICAgIGJpdG1hc2sgJj0gfjMyO1xuICAgIGlzUGFydGlhbFJpZ2h0ID0gcGFydGlhbFJpZ2h0QXJncyA9IGZhbHNlO1xuICB9XG4gIHZhciBiaW5kRGF0YSA9IGZ1bmMgJiYgZnVuYy5fX2JpbmREYXRhX187XG4gIGlmIChiaW5kRGF0YSAmJiBiaW5kRGF0YSAhPT0gdHJ1ZSkge1xuICAgIC8vIGNsb25lIGBiaW5kRGF0YWBcbiAgICBiaW5kRGF0YSA9IHNsaWNlKGJpbmREYXRhKTtcbiAgICBpZiAoYmluZERhdGFbMl0pIHtcbiAgICAgIGJpbmREYXRhWzJdID0gc2xpY2UoYmluZERhdGFbMl0pO1xuICAgIH1cbiAgICBpZiAoYmluZERhdGFbM10pIHtcbiAgICAgIGJpbmREYXRhWzNdID0gc2xpY2UoYmluZERhdGFbM10pO1xuICAgIH1cbiAgICAvLyBzZXQgYHRoaXNCaW5kaW5nYCBpcyBub3QgcHJldmlvdXNseSBib3VuZFxuICAgIGlmIChpc0JpbmQgJiYgIShiaW5kRGF0YVsxXSAmIDEpKSB7XG4gICAgICBiaW5kRGF0YVs0XSA9IHRoaXNBcmc7XG4gICAgfVxuICAgIC8vIHNldCBpZiBwcmV2aW91c2x5IGJvdW5kIGJ1dCBub3QgY3VycmVudGx5IChzdWJzZXF1ZW50IGN1cnJpZWQgZnVuY3Rpb25zKVxuICAgIGlmICghaXNCaW5kICYmIGJpbmREYXRhWzFdICYgMSkge1xuICAgICAgYml0bWFzayB8PSA4O1xuICAgIH1cbiAgICAvLyBzZXQgY3VycmllZCBhcml0eSBpZiBub3QgeWV0IHNldFxuICAgIGlmIChpc0N1cnJ5ICYmICEoYmluZERhdGFbMV0gJiA0KSkge1xuICAgICAgYmluZERhdGFbNV0gPSBhcml0eTtcbiAgICB9XG4gICAgLy8gYXBwZW5kIHBhcnRpYWwgbGVmdCBhcmd1bWVudHNcbiAgICBpZiAoaXNQYXJ0aWFsKSB7XG4gICAgICBwdXNoLmFwcGx5KGJpbmREYXRhWzJdIHx8IChiaW5kRGF0YVsyXSA9IFtdKSwgcGFydGlhbEFyZ3MpO1xuICAgIH1cbiAgICAvLyBhcHBlbmQgcGFydGlhbCByaWdodCBhcmd1bWVudHNcbiAgICBpZiAoaXNQYXJ0aWFsUmlnaHQpIHtcbiAgICAgIHVuc2hpZnQuYXBwbHkoYmluZERhdGFbM10gfHwgKGJpbmREYXRhWzNdID0gW10pLCBwYXJ0aWFsUmlnaHRBcmdzKTtcbiAgICB9XG4gICAgLy8gbWVyZ2UgZmxhZ3NcbiAgICBiaW5kRGF0YVsxXSB8PSBiaXRtYXNrO1xuICAgIHJldHVybiBjcmVhdGVXcmFwcGVyLmFwcGx5KG51bGwsIGJpbmREYXRhKTtcbiAgfVxuICAvLyBmYXN0IHBhdGggZm9yIGBfLmJpbmRgXG4gIHZhciBjcmVhdGVyID0gKGJpdG1hc2sgPT0gMSB8fCBiaXRtYXNrID09PSAxNykgPyBiYXNlQmluZCA6IGJhc2VDcmVhdGVXcmFwcGVyO1xuICByZXR1cm4gY3JlYXRlcihbZnVuYywgYml0bWFzaywgcGFydGlhbEFyZ3MsIHBhcnRpYWxSaWdodEFyZ3MsIHRoaXNBcmcsIGFyaXR5XSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlV3JhcHBlcjtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgYmFzZUNyZWF0ZSA9IHJlcXVpcmUoJ2xvZGFzaC5fYmFzZWNyZWF0ZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0JyksXG4gICAgc2V0QmluZERhdGEgPSByZXF1aXJlKCdsb2Rhc2guX3NldGJpbmRkYXRhJyksXG4gICAgc2xpY2UgPSByZXF1aXJlKCdsb2Rhc2guX3NsaWNlJyk7XG5cbi8qKlxuICogVXNlZCBmb3IgYEFycmF5YCBtZXRob2QgcmVmZXJlbmNlcy5cbiAqXG4gKiBOb3JtYWxseSBgQXJyYXkucHJvdG90eXBlYCB3b3VsZCBzdWZmaWNlLCBob3dldmVyLCB1c2luZyBhbiBhcnJheSBsaXRlcmFsXG4gKiBhdm9pZHMgaXNzdWVzIGluIE5hcndoYWwuXG4gKi9cbnZhciBhcnJheVJlZiA9IFtdO1xuXG4vKiogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgKi9cbnZhciBwdXNoID0gYXJyYXlSZWYucHVzaDtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5iaW5kYCB0aGF0IGNyZWF0ZXMgdGhlIGJvdW5kIGZ1bmN0aW9uIGFuZFxuICogc2V0cyBpdHMgbWV0YSBkYXRhLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBiaW5kRGF0YSBUaGUgYmluZCBkYXRhIGFycmF5LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VCaW5kKGJpbmREYXRhKSB7XG4gIHZhciBmdW5jID0gYmluZERhdGFbMF0sXG4gICAgICBwYXJ0aWFsQXJncyA9IGJpbmREYXRhWzJdLFxuICAgICAgdGhpc0FyZyA9IGJpbmREYXRhWzRdO1xuXG4gIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgIC8vIGBGdW5jdGlvbiNiaW5kYCBzcGVjXG4gICAgLy8gaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS4zLjQuNVxuICAgIGlmIChwYXJ0aWFsQXJncykge1xuICAgICAgLy8gYXZvaWQgYGFyZ3VtZW50c2Agb2JqZWN0IGRlb3B0aW1pemF0aW9ucyBieSB1c2luZyBgc2xpY2VgIGluc3RlYWRcbiAgICAgIC8vIG9mIGBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbGAgYW5kIG5vdCBhc3NpZ25pbmcgYGFyZ3VtZW50c2AgdG8gYVxuICAgICAgLy8gdmFyaWFibGUgYXMgYSB0ZXJuYXJ5IGV4cHJlc3Npb25cbiAgICAgIHZhciBhcmdzID0gc2xpY2UocGFydGlhbEFyZ3MpO1xuICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICAvLyBtaW1pYyB0aGUgY29uc3RydWN0b3IncyBgcmV0dXJuYCBiZWhhdmlvclxuICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4MTMuMi4yXG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkge1xuICAgICAgLy8gZW5zdXJlIGBuZXcgYm91bmRgIGlzIGFuIGluc3RhbmNlIG9mIGBmdW5jYFxuICAgICAgdmFyIHRoaXNCaW5kaW5nID0gYmFzZUNyZWF0ZShmdW5jLnByb3RvdHlwZSksXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQmluZGluZywgYXJncyB8fCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGlzT2JqZWN0KHJlc3VsdCkgPyByZXN1bHQgOiB0aGlzQmluZGluZztcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyB8fCBhcmd1bWVudHMpO1xuICB9XG4gIHNldEJpbmREYXRhKGJvdW5kLCBiaW5kRGF0YSk7XG4gIHJldHVybiBib3VuZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQmluZDtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgaXNOYXRpdmUgPSByZXF1aXJlKCdsb2Rhc2guX2lzbmF0aXZlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCdsb2Rhc2guaXNvYmplY3QnKSxcbiAgICBub29wID0gcmVxdWlyZSgnbG9kYXNoLm5vb3AnKTtcblxuLyogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgZm9yIG1ldGhvZHMgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMgKi9cbnZhciBuYXRpdmVDcmVhdGUgPSBpc05hdGl2ZShuYXRpdmVDcmVhdGUgPSBPYmplY3QuY3JlYXRlKSAmJiBuYXRpdmVDcmVhdGU7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY3JlYXRlYCB3aXRob3V0IHN1cHBvcnQgZm9yIGFzc2lnbmluZ1xuICogcHJvcGVydGllcyB0byB0aGUgY3JlYXRlZCBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b3R5cGUgVGhlIG9iamVjdCB0byBpbmhlcml0IGZyb20uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBuZXcgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBiYXNlQ3JlYXRlKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICByZXR1cm4gaXNPYmplY3QocHJvdG90eXBlKSA/IG5hdGl2ZUNyZWF0ZShwcm90b3R5cGUpIDoge307XG59XG4vLyBmYWxsYmFjayBmb3IgYnJvd3NlcnMgd2l0aG91dCBgT2JqZWN0LmNyZWF0ZWBcbmlmICghbmF0aXZlQ3JlYXRlKSB7XG4gIGJhc2VDcmVhdGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gT2JqZWN0KCkge31cbiAgICByZXR1cm4gZnVuY3Rpb24ocHJvdG90eXBlKSB7XG4gICAgICBpZiAoaXNPYmplY3QocHJvdG90eXBlKSkge1xuICAgICAgICBPYmplY3QucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE9iamVjdDtcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZSA9IG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0IHx8IGdsb2JhbC5PYmplY3QoKTtcbiAgICB9O1xuICB9KCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VDcmVhdGU7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBiYXNlQ3JlYXRlID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNlY3JlYXRlJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCdsb2Rhc2guaXNvYmplY3QnKSxcbiAgICBzZXRCaW5kRGF0YSA9IHJlcXVpcmUoJ2xvZGFzaC5fc2V0YmluZGRhdGEnKSxcbiAgICBzbGljZSA9IHJlcXVpcmUoJ2xvZGFzaC5fc2xpY2UnKTtcblxuLyoqXG4gKiBVc2VkIGZvciBgQXJyYXlgIG1ldGhvZCByZWZlcmVuY2VzLlxuICpcbiAqIE5vcm1hbGx5IGBBcnJheS5wcm90b3R5cGVgIHdvdWxkIHN1ZmZpY2UsIGhvd2V2ZXIsIHVzaW5nIGFuIGFycmF5IGxpdGVyYWxcbiAqIGF2b2lkcyBpc3N1ZXMgaW4gTmFyd2hhbC5cbiAqL1xudmFyIGFycmF5UmVmID0gW107XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyAqL1xudmFyIHB1c2ggPSBhcnJheVJlZi5wdXNoO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBjcmVhdGVXcmFwcGVyYCB0aGF0IGNyZWF0ZXMgdGhlIHdyYXBwZXIgYW5kXG4gKiBzZXRzIGl0cyBtZXRhIGRhdGEuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGJpbmREYXRhIFRoZSBiaW5kIGRhdGEgYXJyYXkuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZUNyZWF0ZVdyYXBwZXIoYmluZERhdGEpIHtcbiAgdmFyIGZ1bmMgPSBiaW5kRGF0YVswXSxcbiAgICAgIGJpdG1hc2sgPSBiaW5kRGF0YVsxXSxcbiAgICAgIHBhcnRpYWxBcmdzID0gYmluZERhdGFbMl0sXG4gICAgICBwYXJ0aWFsUmlnaHRBcmdzID0gYmluZERhdGFbM10sXG4gICAgICB0aGlzQXJnID0gYmluZERhdGFbNF0sXG4gICAgICBhcml0eSA9IGJpbmREYXRhWzVdO1xuXG4gIHZhciBpc0JpbmQgPSBiaXRtYXNrICYgMSxcbiAgICAgIGlzQmluZEtleSA9IGJpdG1hc2sgJiAyLFxuICAgICAgaXNDdXJyeSA9IGJpdG1hc2sgJiA0LFxuICAgICAgaXNDdXJyeUJvdW5kID0gYml0bWFzayAmIDgsXG4gICAgICBrZXkgPSBmdW5jO1xuXG4gIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgIHZhciB0aGlzQmluZGluZyA9IGlzQmluZCA/IHRoaXNBcmcgOiB0aGlzO1xuICAgIGlmIChwYXJ0aWFsQXJncykge1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZShwYXJ0aWFsQXJncyk7XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIGlmIChwYXJ0aWFsUmlnaHRBcmdzIHx8IGlzQ3VycnkpIHtcbiAgICAgIGFyZ3MgfHwgKGFyZ3MgPSBzbGljZShhcmd1bWVudHMpKTtcbiAgICAgIGlmIChwYXJ0aWFsUmlnaHRBcmdzKSB7XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgcGFydGlhbFJpZ2h0QXJncyk7XG4gICAgICB9XG4gICAgICBpZiAoaXNDdXJyeSAmJiBhcmdzLmxlbmd0aCA8IGFyaXR5KSB7XG4gICAgICAgIGJpdG1hc2sgfD0gMTYgJiB+MzI7XG4gICAgICAgIHJldHVybiBiYXNlQ3JlYXRlV3JhcHBlcihbZnVuYywgKGlzQ3VycnlCb3VuZCA/IGJpdG1hc2sgOiBiaXRtYXNrICYgfjMpLCBhcmdzLCBudWxsLCB0aGlzQXJnLCBhcml0eV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBhcmdzIHx8IChhcmdzID0gYXJndW1lbnRzKTtcbiAgICBpZiAoaXNCaW5kS2V5KSB7XG4gICAgICBmdW5jID0gdGhpc0JpbmRpbmdba2V5XTtcbiAgICB9XG4gICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkge1xuICAgICAgdGhpc0JpbmRpbmcgPSBiYXNlQ3JlYXRlKGZ1bmMucHJvdG90eXBlKTtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICAgIHJldHVybiBpc09iamVjdChyZXN1bHQpID8gcmVzdWx0IDogdGhpc0JpbmRpbmc7XG4gICAgfVxuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgfVxuICBzZXRCaW5kRGF0YShib3VuZCwgYmluZERhdGEpO1xuICByZXR1cm4gYm91bmQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNyZWF0ZVdyYXBwZXI7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RzXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbic7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvbjtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKlxuICogVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgZmlyc3QgYXJndW1lbnQgcHJvdmlkZWQgdG8gaXQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgQW55IHZhbHVlLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgYHZhbHVlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ25hbWUnOiAnZnJlZCcgfTtcbiAqIF8uaWRlbnRpdHkob2JqZWN0KSA9PT0gb2JqZWN0O1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpZGVudGl0eSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaWRlbnRpdHk7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzTmF0aXZlID0gcmVxdWlyZSgnbG9kYXNoLl9pc25hdGl2ZScpO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgZnVuY3Rpb25zIGNvbnRhaW5pbmcgYSBgdGhpc2AgcmVmZXJlbmNlICovXG52YXIgcmVUaGlzID0gL1xcYnRoaXNcXGIvO1xuXG4vKipcbiAqIEFuIG9iamVjdCB1c2VkIHRvIGZsYWcgZW52aXJvbm1lbnRzIGZlYXR1cmVzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAdHlwZSBPYmplY3RcbiAqL1xudmFyIHN1cHBvcnQgPSB7fTtcblxuLyoqXG4gKiBEZXRlY3QgaWYgZnVuY3Rpb25zIGNhbiBiZSBkZWNvbXBpbGVkIGJ5IGBGdW5jdGlvbiN0b1N0cmluZ2BcbiAqIChhbGwgYnV0IFBTMyBhbmQgb2xkZXIgT3BlcmEgbW9iaWxlIGJyb3dzZXJzICYgYXZvaWRlZCBpbiBXaW5kb3dzIDggYXBwcykuXG4gKlxuICogQG1lbWJlck9mIF8uc3VwcG9ydFxuICogQHR5cGUgYm9vbGVhblxuICovXG5zdXBwb3J0LmZ1bmNEZWNvbXAgPSAhaXNOYXRpdmUoZ2xvYmFsLldpblJURXJyb3IpICYmIHJlVGhpcy50ZXN0KGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSk7XG5cbi8qKlxuICogRGV0ZWN0IGlmIGBGdW5jdGlvbiNuYW1lYCBpcyBzdXBwb3J0ZWQgKGFsbCBidXQgSUUpLlxuICpcbiAqIEBtZW1iZXJPZiBfLnN1cHBvcnRcbiAqIEB0eXBlIGJvb2xlYW5cbiAqL1xuc3VwcG9ydC5mdW5jTmFtZXMgPSB0eXBlb2YgRnVuY3Rpb24ubmFtZSA9PSAnc3RyaW5nJztcblxubW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCdsb2Rhc2guZGVib3VuY2UnKSxcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnbG9kYXNoLmlzZnVuY3Rpb24nKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC5pc29iamVjdCcpO1xuXG4vKiogVXNlZCBhcyBhbiBpbnRlcm5hbCBgXy5kZWJvdW5jZWAgb3B0aW9ucyBvYmplY3QgKi9cbnZhciBkZWJvdW5jZU9wdGlvbnMgPSB7XG4gICdsZWFkaW5nJzogZmFsc2UsXG4gICdtYXhXYWl0JzogMCxcbiAgJ3RyYWlsaW5nJzogZmFsc2Vcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gZXhlY3V0ZWQsIHdpbGwgb25seSBjYWxsIHRoZSBgZnVuY2AgZnVuY3Rpb25cbiAqIGF0IG1vc3Qgb25jZSBwZXIgZXZlcnkgYHdhaXRgIG1pbGxpc2Vjb25kcy4gUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0b1xuICogaW5kaWNhdGUgdGhhdCBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb24gdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2VcbiAqIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gU3Vic2VxdWVudCBjYWxscyB0byB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGxcbiAqIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBjYWxsLlxuICpcbiAqIE5vdGU6IElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAgYGZ1bmNgIHdpbGwgYmUgY2FsbGVkXG4gKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGlzXG4gKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHRocm90dGxlLlxuICogQHBhcmFtIHtudW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgZXhlY3V0aW9ucyB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBhdm9pZCBleGNlc3NpdmVseSB1cGRhdGluZyB0aGUgcG9zaXRpb24gd2hpbGUgc2Nyb2xsaW5nXG4gKiB2YXIgdGhyb3R0bGVkID0gXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKTtcbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdzY3JvbGwnLCB0aHJvdHRsZWQpO1xuICpcbiAqIC8vIGV4ZWN1dGUgYHJlbmV3VG9rZW5gIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBidXQgbm90IG1vcmUgdGhhbiBvbmNlIGV2ZXJ5IDUgbWludXRlc1xuICogalF1ZXJ5KCcuaW50ZXJhY3RpdmUnKS5vbignY2xpY2snLCBfLnRocm90dGxlKHJlbmV3VG9rZW4sIDMwMDAwMCwge1xuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICovXG5mdW5jdGlvbiB0aHJvdHRsZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsZWFkaW5nID0gdHJ1ZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAoIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICB9XG4gIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgIGxlYWRpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMubGVhZGluZyA6IGxlYWRpbmc7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyBvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cbiAgZGVib3VuY2VPcHRpb25zLmxlYWRpbmcgPSBsZWFkaW5nO1xuICBkZWJvdW5jZU9wdGlvbnMubWF4V2FpdCA9IHdhaXQ7XG4gIGRlYm91bmNlT3B0aW9ucy50cmFpbGluZyA9IHRyYWlsaW5nO1xuXG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCBkZWJvdW5jZU9wdGlvbnMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnbG9kYXNoLmlzZnVuY3Rpb24nKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC5pc29iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJ2xvZGFzaC5ub3cnKTtcblxuLyogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgZm9yIG1ldGhvZHMgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMgKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gb2YgYGZ1bmNgIHVudGlsIGFmdGVyXG4gKiBgd2FpdGAgbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIGl0IHdhcyBpbnZva2VkLlxuICogUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0byBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvblxuICogdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBTdWJzZXF1ZW50IGNhbGxzXG4gKiB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGNhbGwuXG4gKlxuICogTm90ZTogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAqIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaXNcbiAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gd2FpdCBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXSBTcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBjYWxsZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBhdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4XG4gKiB2YXIgbGF6eUxheW91dCA9IF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApO1xuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIGxhenlMYXlvdXQpO1xuICpcbiAqIC8vIGV4ZWN1dGUgYHNlbmRNYWlsYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzXG4gKiBqUXVlcnkoJyNwb3N0Ym94Jykub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pO1xuICpcbiAqIC8vIGVuc3VyZSBgYmF0Y2hMb2dgIGlzIGV4ZWN1dGVkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzXG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwge1xuICogICAnbWF4V2FpdCc6IDEwMDBcbiAqIH0sIGZhbHNlKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgYXJncyxcbiAgICAgIG1heFRpbWVvdXRJZCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHN0YW1wLFxuICAgICAgdGhpc0FyZyxcbiAgICAgIHRpbWVvdXRJZCxcbiAgICAgIHRyYWlsaW5nQ2FsbCxcbiAgICAgIGxhc3RDYWxsZWQgPSAwLFxuICAgICAgbWF4V2FpdCA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gIH1cbiAgd2FpdCA9IG5hdGl2ZU1heCgwLCB3YWl0KSB8fCAwO1xuICBpZiAob3B0aW9ucyA9PT0gdHJ1ZSkge1xuICAgIHZhciBsZWFkaW5nID0gdHJ1ZTtcbiAgICB0cmFpbGluZyA9IGZhbHNlO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9IG9wdGlvbnMubGVhZGluZztcbiAgICBtYXhXYWl0ID0gJ21heFdhaXQnIGluIG9wdGlvbnMgJiYgKG5hdGl2ZU1heCh3YWl0LCBvcHRpb25zLm1heFdhaXQpIHx8IDApO1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHZhciBkZWxheWVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93KCkgLSBzdGFtcCk7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICBpZiAobWF4VGltZW91dElkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgICAgfVxuICAgICAgdmFyIGlzQ2FsbGVkID0gdHJhaWxpbmdDYWxsO1xuICAgICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGlzQ2FsbGVkKSB7XG4gICAgICAgIGxhc3RDYWxsZWQgPSBub3coKTtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgICAgaWYgKCF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHJlbWFpbmluZyk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBtYXhEZWxheWVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRpbWVvdXRJZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IHRyYWlsaW5nQ2FsbCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHJhaWxpbmcgfHwgKG1heFdhaXQgIT09IHdhaXQpKSB7XG4gICAgICBsYXN0Q2FsbGVkID0gbm93KCk7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgICBhcmdzID0gdGhpc0FyZyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIHN0YW1wID0gbm93KCk7XG4gICAgdGhpc0FyZyA9IHRoaXM7XG4gICAgdHJhaWxpbmdDYWxsID0gdHJhaWxpbmcgJiYgKHRpbWVvdXRJZCB8fCAhbGVhZGluZyk7XG5cbiAgICBpZiAobWF4V2FpdCA9PT0gZmFsc2UpIHtcbiAgICAgIHZhciBsZWFkaW5nQ2FsbCA9IGxlYWRpbmcgJiYgIXRpbWVvdXRJZDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFtYXhUaW1lb3V0SWQgJiYgIWxlYWRpbmcpIHtcbiAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xuICAgICAgfVxuICAgICAgdmFyIHJlbWFpbmluZyA9IG1heFdhaXQgLSAoc3RhbXAgLSBsYXN0Q2FsbGVkKSxcbiAgICAgICAgICBpc0NhbGxlZCA9IHJlbWFpbmluZyA8PSAwO1xuXG4gICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIG1heFRpbWVvdXRJZCA9IGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKCFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgbWF4VGltZW91dElkID0gc2V0VGltZW91dChtYXhEZWxheWVkLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDYWxsZWQgJiYgdGltZW91dElkKSB7XG4gICAgICB0aW1lb3V0SWQgPSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXRpbWVvdXRJZCAmJiB3YWl0ICE9PSBtYXhXYWl0KSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHdhaXQpO1xuICAgIH1cbiAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgIGlzQ2FsbGVkID0gdHJ1ZTtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgfVxuICAgIGlmIChpc0NhbGxlZCAmJiAhdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcbiAgICAgIGFyZ3MgPSB0aGlzQXJnID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgaXNOYXRpdmUgPSByZXF1aXJlKCdsb2Rhc2guX2lzbmF0aXZlJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgVW5peCBlcG9jaFxuICogKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHN0YW1wID0gXy5ub3coKTtcbiAqIF8uZGVmZXIoZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7IH0pO1xuICogLy8gPT4gbG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXG4gKi9cbnZhciBub3cgPSBpc05hdGl2ZShub3cgPSBEYXRlLm5vdykgJiYgbm93IHx8IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vdztcbiIsInZhciBub3cgPSByZXF1aXJlKCdwZXJmb3JtYW5jZS1ub3cnKVxuICAsIGdsb2JhbCA9IHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8ge30gOiB3aW5kb3dcbiAgLCB2ZW5kb3JzID0gWydtb3onLCAnd2Via2l0J11cbiAgLCBzdWZmaXggPSAnQW5pbWF0aW9uRnJhbWUnXG4gICwgcmFmID0gZ2xvYmFsWydyZXF1ZXN0JyArIHN1ZmZpeF1cbiAgLCBjYWYgPSBnbG9iYWxbJ2NhbmNlbCcgKyBzdWZmaXhdIHx8IGdsb2JhbFsnY2FuY2VsUmVxdWVzdCcgKyBzdWZmaXhdXG4gICwgbmF0aXZlID0gdHJ1ZVxuXG5mb3IodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGggJiYgIXJhZjsgaSsrKSB7XG4gIHJhZiA9IGdsb2JhbFt2ZW5kb3JzW2ldICsgJ1JlcXVlc3QnICsgc3VmZml4XVxuICBjYWYgPSBnbG9iYWxbdmVuZG9yc1tpXSArICdDYW5jZWwnICsgc3VmZml4XVxuICAgICAgfHwgZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnQ2FuY2VsUmVxdWVzdCcgKyBzdWZmaXhdXG59XG5cbi8vIFNvbWUgdmVyc2lvbnMgb2YgRkYgaGF2ZSByQUYgYnV0IG5vdCBjQUZcbmlmKCFyYWYgfHwgIWNhZikge1xuICBuYXRpdmUgPSBmYWxzZVxuXG4gIHZhciBsYXN0ID0gMFxuICAgICwgaWQgPSAwXG4gICAgLCBxdWV1ZSA9IFtdXG4gICAgLCBmcmFtZUR1cmF0aW9uID0gMTAwMCAvIDYwXG5cbiAgcmFmID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBpZihxdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHZhciBfbm93ID0gbm93KClcbiAgICAgICAgLCBuZXh0ID0gTWF0aC5tYXgoMCwgZnJhbWVEdXJhdGlvbiAtIChfbm93IC0gbGFzdCkpXG4gICAgICBsYXN0ID0gbmV4dCArIF9ub3dcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjcCA9IHF1ZXVlLnNsaWNlKDApXG4gICAgICAgIC8vIENsZWFyIHF1ZXVlIGhlcmUgdG8gcHJldmVudFxuICAgICAgICAvLyBjYWxsYmFja3MgZnJvbSBhcHBlbmRpbmcgbGlzdGVuZXJzXG4gICAgICAgIC8vIHRvIHRoZSBjdXJyZW50IGZyYW1lJ3MgcXVldWVcbiAgICAgICAgcXVldWUubGVuZ3RoID0gMFxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgY3AubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZighY3BbaV0uY2FuY2VsbGVkKSB7XG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgIGNwW2ldLmNhbGxiYWNrKGxhc3QpXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGhyb3cgZSB9LCAwKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgbmV4dClcbiAgICB9XG4gICAgcXVldWUucHVzaCh7XG4gICAgICBoYW5kbGU6ICsraWQsXG4gICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICBjYW5jZWxsZWQ6IGZhbHNlXG4gICAgfSlcbiAgICByZXR1cm4gaWRcbiAgfVxuXG4gIGNhZiA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYocXVldWVbaV0uaGFuZGxlID09PSBoYW5kbGUpIHtcbiAgICAgICAgcXVldWVbaV0uY2FuY2VsbGVkID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGZuKSB7XG4gIC8vIFdyYXAgaW4gYSBuZXcgZnVuY3Rpb24gdG8gcHJldmVudFxuICAvLyBgY2FuY2VsYCBwb3RlbnRpYWxseSBiZWluZyBhc3NpZ25lZFxuICAvLyB0byB0aGUgbmF0aXZlIHJBRiBmdW5jdGlvblxuICBpZighbmF0aXZlKSB7XG4gICAgcmV0dXJuIHJhZi5jYWxsKGdsb2JhbCwgZm4pXG4gIH1cbiAgcmV0dXJuIHJhZi5jYWxsKGdsb2JhbCwgZnVuY3Rpb24oKSB7XG4gICAgdHJ5e1xuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGhyb3cgZSB9LCAwKVxuICAgIH1cbiAgfSlcbn1cbm1vZHVsZS5leHBvcnRzLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICBjYWYuYXBwbHkoZ2xvYmFsLCBhcmd1bWVudHMpXG59XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgZ2V0TmFub1NlY29uZHMsIGhydGltZSwgbG9hZFRpbWU7XG5cbiAgaWYgKCh0eXBlb2YgcGVyZm9ybWFuY2UgIT09IFwidW5kZWZpbmVkXCIgJiYgcGVyZm9ybWFuY2UgIT09IG51bGwpICYmIHBlcmZvcm1hbmNlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2VzcyAhPT0gbnVsbCkgJiYgcHJvY2Vzcy5ocnRpbWUpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIChnZXROYW5vU2Vjb25kcygpIC0gbG9hZFRpbWUpIC8gMWU2O1xuICAgIH07XG4gICAgaHJ0aW1lID0gcHJvY2Vzcy5ocnRpbWU7XG4gICAgZ2V0TmFub1NlY29uZHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBocjtcbiAgICAgIGhyID0gaHJ0aW1lKCk7XG4gICAgICByZXR1cm4gaHJbMF0gKiAxZTkgKyBoclsxXTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gZ2V0TmFub1NlY29uZHMoKTtcbiAgfSBlbHNlIGlmIChEYXRlLm5vdykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIGxvYWRUaW1lO1xuICAgIH07XG4gICAgbG9hZFRpbWUgPSBEYXRlLm5vdygpO1xuICB9IGVsc2Uge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsb2FkVGltZTtcbiAgICB9O1xuICAgIGxvYWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPXBlcmZvcm1hbmNlLW5vdy5tYXBcbiovXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiRldhQVNIXCIpKSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzSW5wdXQgPSByZXF1aXJlKCcuL2lzSW5wdXQnKTtcbnZhciBiaW5kaW5ncyA9IHt9O1xuXG5mdW5jdGlvbiBoYXMgKHNvdXJjZSwgdGFyZ2V0KSB7XG4gIHZhciBiaW5kaW5nID0gYmluZGluZ3Nbc291cmNlLmlkXTtcbiAgcmV0dXJuIGJpbmRpbmcgJiYgYmluZGluZ1t0YXJnZXQuaWRdO1xufVxuXG5mdW5jdGlvbiBpbnNlcnQgKHNvdXJjZSwgdGFyZ2V0KSB7XG4gIHZhciBiaW5kaW5nID0gYmluZGluZ3Nbc291cmNlLmlkXTtcbiAgaWYgKCFiaW5kaW5nKSB7XG4gICAgYmluZGluZyA9IGJpbmRpbmdzW3NvdXJjZS5pZF0gPSB7fTtcbiAgfVxuICB2YXIgaW52YWxpZGF0ZSA9IGludmFsaWRhdG9yKHRhcmdldCk7XG4gIGJpbmRpbmdbdGFyZ2V0LmlkXSA9IGludmFsaWRhdGU7XG4gIHNvdXJjZS5vbignZGF0YScsIGludmFsaWRhdGUpO1xuICBzb3VyY2Uub24oJ2Rlc3Ryb3llZCcsIHJlbW92ZS5iaW5kKG51bGwsIHNvdXJjZSwgdGFyZ2V0KSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZSAoc291cmNlLCB0YXJnZXQpIHtcbiAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tzb3VyY2UuaWRdO1xuICBpZiAoIWJpbmRpbmcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGludmFsaWRhdGUgPSBiaW5kaW5nW3RhcmdldC5pZF07XG4gIHNvdXJjZS5vZmYoJ2RhdGEnLCBpbnZhbGlkYXRlKTtcbiAgZGVsZXRlIGJpbmRpbmdbdGFyZ2V0LmlkXTtcbn1cblxuZnVuY3Rpb24gaW52YWxpZGF0b3IgKHRhcmdldCkge1xuICByZXR1cm4gZnVuY3Rpb24gaW52YWxpZGF0ZSAoKSB7XG4gICAgdGFyZ2V0LnJlZnJlc2goKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWRkIChzb3VyY2UsIHRhcmdldCkge1xuICBpZiAoaXNJbnB1dCh0YXJnZXQuYXNzb2NpYXRlZCkgfHwgaGFzKHNvdXJjZSwgdGFyZ2V0KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpbnNlcnQoc291cmNlLCB0YXJnZXQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkOiBhZGQsXG4gIHJlbW92ZTogcmVtb3ZlXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW1pdHRlciA9IHJlcXVpcmUoJ2NvbnRyYS5lbWl0dGVyJyk7XG52YXIgcmFmID0gcmVxdWlyZSgncmFmJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi9kb20nKTtcbnZhciB0ZXh0ID0gcmVxdWlyZSgnLi90ZXh0Jyk7XG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG52YXIgY2xvbmUgPSByZXF1aXJlKCcuL2Nsb25lJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyk7XG52YXIgbW9tZW50dW0gPSByZXF1aXJlKCcuL21vbWVudHVtJyk7XG52YXIgbm87XG5cbmZ1bmN0aW9uIGNhbGVuZGFyIChjYWxlbmRhck9wdGlvbnMpIHtcbiAgdmFyIG87XG4gIHZhciBhcGkgPSBlbWl0dGVyKHt9KTtcbiAgdmFyIHJlZjtcbiAgdmFyIHJlZkNhbDtcbiAgdmFyIGNvbnRhaW5lcjtcbiAgdmFyIHJlbmRlcmVkID0gZmFsc2U7XG5cbiAgLy8gZGF0ZSB2YXJpYWJsZXNcbiAgdmFyIHdlZWtkYXlzID0gbW9tZW50dW0ubW9tZW50LndlZWtkYXlzTWluKCk7XG4gIHZhciB3ZWVrZGF5Q291bnQgPSB3ZWVrZGF5cy5sZW5ndGg7XG4gIHZhciBtb250aDtcbiAgdmFyIGRhdGVib2R5O1xuICB2YXIgbGFzdFllYXI7XG4gIHZhciBsYXN0TW9udGg7XG4gIHZhciBsYXN0RGF5O1xuICB2YXIgYmFjaztcbiAgdmFyIG5leHQ7XG5cbiAgLy8gdGltZSB2YXJpYWJsZXNcbiAgdmFyIHNlY29uZHNJbkRheSA9IDYwICogNjAgKiAyNDtcbiAgdmFyIHRpbWU7XG4gIHZhciB0aW1lbGlzdDtcblxuICByYWYoZnVuY3Rpb24gKCkge1xuICAgIGluaXQoKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gaW5pdCAoaW5pdE9wdGlvbnMpIHtcbiAgICBvID0gZGVmYXVsdHMoaW5pdE9wdGlvbnMgfHwgY2FsZW5kYXJPcHRpb25zKTtcbiAgICBpZiAoIWNvbnRhaW5lcikgeyBjb250YWluZXIgPSBkb20oeyBjbGFzc05hbWU6IG8uc3R5bGVzLmNvbnRhaW5lciB9KTsgfVxuICAgIGxhc3RNb250aCA9IG5vO1xuICAgIGxhc3RZZWFyID0gbm87XG4gICAgbGFzdERheSA9IG5vO1xuICAgIG8uYXBwZW5kVG8uYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuICAgIHJlbW92ZUNoaWxkcmVuKGNvbnRhaW5lcik7XG4gICAgcmVuZGVyZWQgPSBmYWxzZTtcbiAgICByZWYgPSBvLmluaXRpYWxWYWx1ZSA/IG8uaW5pdGlhbFZhbHVlIDogbW9tZW50dW0ubW9tZW50KCk7XG4gICAgcmVmQ2FsID0gcmVmLmNsb25lKCk7XG5cbiAgICBkZWxldGUgYXBpLnJlc3RvcmU7XG4gICAgYXBpLnNob3cgPSBzaG93O1xuICAgIGFwaS5oaWRlID0gaGlkZTtcbiAgICBhcGkuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIGFwaS5nZXREYXRlID0gZ2V0RGF0ZTtcbiAgICBhcGkuZ2V0RGF0ZVN0cmluZyA9IGdldERhdGVTdHJpbmc7XG4gICAgYXBpLmdldE1vbWVudCA9IGdldE1vbWVudDtcbiAgICBhcGkuZGVzdHJveSA9IGRlc3Ryb3k7XG4gICAgYXBpLm9wdGlvbnMgPSBjaGFuZ2VPcHRpb25zO1xuICAgIGFwaS5vcHRpb25zLnJlc2V0ID0gcmVzZXRPcHRpb25zO1xuICAgIGFwaS5zZXRWYWx1ZSA9IHNldFZhbHVlO1xuICAgIGFwaS5lbWl0VmFsdWVzID0gZW1pdFZhbHVlcztcbiAgICBhcGkucmVmcmVzaCA9IHJlZnJlc2g7XG5cbiAgICBoaWRlQ2FsZW5kYXIoKTtcbiAgICBldmVudExpc3RlbmluZygpO1xuXG4gICAgYXBpLmVtaXQoJ3JlYWR5JywgY2xvbmUobywgbW9tZW50dW0ubW9tZW50KSk7XG5cbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgY29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY29udGFpbmVyKTtcblxuICAgIGV2ZW50TGlzdGVuaW5nKHRydWUpO1xuXG4gICAgLy8gcmV2ZXJzZSBvcmRlciBtaWNyby1vcHRpbWl6YXRpb25cbiAgICBkZWxldGUgYXBpLnJlZnJlc2g7XG4gICAgZGVsZXRlIGFwaS5lbWl0VmFsdWVzO1xuICAgIGRlbGV0ZSBhcGkuc2V0VmFsdWU7XG4gICAgZGVsZXRlIGFwaS5vcHRpb25zO1xuICAgIGRlbGV0ZSBhcGkuZGVzdHJveTtcbiAgICBkZWxldGUgYXBpLmdldE1vbWVudDtcbiAgICBkZWxldGUgYXBpLmdldERhdGVTdHJpbmc7XG4gICAgZGVsZXRlIGFwaS5nZXREYXRlO1xuICAgIGRlbGV0ZSBhcGkuY29udGFpbmVyO1xuICAgIGRlbGV0ZSBhcGkuaGlkZTtcbiAgICBkZWxldGUgYXBpLnNob3c7XG4gICAgYXBpLnJlc3RvcmUgPSBpbml0O1xuICAgIGFwaS5lbWl0KCdkZXN0cm95ZWQnKTtcbiAgICBhcGkub2ZmKCk7XG5cbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXZlbnRMaXN0ZW5pbmcgKHJlbW92ZSkge1xuICAgIHZhciBwcmVmaXggPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xuICAgIHZhciBvcCA9IHByZWZpeCArICdFdmVudExpc3RlbmVyJztcbiAgICBpZiAoby5hdXRvSGlkZU9uQmx1cikgeyB3aW5kb3dbb3BdKCdmb2N1c2luJywgaGlkZU9uQmx1cik7IH1cbiAgICBpZiAoby5hdXRvSGlkZU9uQ2xpY2spIHsgd2luZG93W29wXSgnY2xpY2snLCBoaWRlT25DbGljayk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYW5nZU9wdGlvbnMgKG9wdGlvbnMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGNsb25lKG8sIG1vbWVudHVtLm1vbWVudCk7XG4gICAgfVxuICAgIGRlc3Ryb3koKTtcbiAgICBpbml0KG9wdGlvbnMpO1xuICAgIHJldHVybiBhcGk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldE9wdGlvbnMgKCkge1xuICAgIHJldHVybiBjaGFuZ2VPcHRpb25zKHt9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgaWYgKHJlbmRlcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlbmRlcmVkID0gdHJ1ZTtcbiAgICByZW5kZXJEYXRlcygpO1xuICAgIHJlbmRlclRpbWUoKTtcbiAgICBhcGkuZW1pdCgncmVuZGVyJyk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJEYXRlcyAoKSB7XG4gICAgaWYgKCFvLmRhdGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGV3cmFwcGVyID0gZG9tKHsgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXRlLCBwYXJlbnQ6IGNvbnRhaW5lciB9KTtcbiAgICBiYWNrID0gZG9tKHsgdHlwZTogJ2J1dHRvbicsIGNsYXNzTmFtZTogby5zdHlsZXMuYmFjaywgcGFyZW50OiBkYXRld3JhcHBlciB9KTtcbiAgICBuZXh0ID0gZG9tKHsgdHlwZTogJ2J1dHRvbicsIGNsYXNzTmFtZTogby5zdHlsZXMubmV4dCwgcGFyZW50OiBkYXRld3JhcHBlciB9KTtcbiAgICBtb250aCA9IGRvbSh7IGNsYXNzTmFtZTogby5zdHlsZXMubW9udGgsIHBhcmVudDogZGF0ZXdyYXBwZXIgfSk7XG4gICAgdmFyIGRhdGUgPSBkb20oeyB0eXBlOiAndGFibGUnLCBjbGFzc05hbWU6IG8uc3R5bGVzLmRheVRhYmxlLCBwYXJlbnQ6IGRhdGV3cmFwcGVyIH0pO1xuICAgIHZhciBkYXRlaGVhZCA9IGRvbSh7IHR5cGU6ICd0aGVhZCcsIGNsYXNzTmFtZTogby5zdHlsZXMuZGF5SGVhZCwgcGFyZW50OiBkYXRlIH0pO1xuICAgIHZhciBkYXRlaGVhZHJvdyA9IGRvbSh7IHR5cGU6ICd0cicsIGNsYXNzTmFtZTogby5zdHlsZXMuZGF5Um93LCBwYXJlbnQ6IGRhdGVoZWFkIH0pO1xuICAgIGRhdGVib2R5ID0gZG9tKHsgdHlwZTogJ3Rib2R5JywgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXlCb2R5LCBwYXJlbnQ6IGRhdGUgfSk7XG4gICAgdmFyIGk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgd2Vla2RheUNvdW50OyBpKyspIHtcbiAgICAgIGRvbSh7IHR5cGU6ICd0aCcsIGNsYXNzTmFtZTogby5zdHlsZXMuZGF5SGVhZEVsZW0sIHBhcmVudDogZGF0ZWhlYWRyb3csIHRleHQ6IHdlZWtkYXlzW3dlZWtkYXkoaSldIH0pO1xuICAgIH1cblxuICAgIGJhY2suYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdWJ0cmFjdE1vbnRoKTtcbiAgICBuZXh0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYWRkTW9udGgpO1xuICAgIGRhdGVib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGlja0RheSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJUaW1lICgpIHtcbiAgICBpZiAoIW8udGltZSB8fCAhby50aW1lSW50ZXJ2YWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWV3cmFwcGVyID0gZG9tKHsgY2xhc3NOYW1lOiBvLnN0eWxlcy50aW1lLCBwYXJlbnQ6IGNvbnRhaW5lciB9KTtcbiAgICB0aW1lID0gZG9tKHsgY2xhc3NOYW1lOiBvLnN0eWxlcy5zZWxlY3RlZFRpbWUsIHBhcmVudDogdGltZXdyYXBwZXIsIHRleHQ6IHJlZi5mb3JtYXQoby50aW1lRm9ybWF0KSB9KTtcbiAgICB0aW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlVGltZUxpc3QpO1xuICAgIHRpbWVsaXN0ID0gZG9tKHsgY2xhc3NOYW1lOiBvLnN0eWxlcy50aW1lTGlzdCwgcGFyZW50OiB0aW1ld3JhcHBlciB9KTtcbiAgICB0aW1lbGlzdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHBpY2tUaW1lKTtcbiAgICB2YXIgbmV4dCA9IG1vbWVudHVtLm1vbWVudCgnMDA6MDA6MDAnLCAnSEg6bW06c3MnKTtcbiAgICB2YXIgbGF0ZXN0ID0gbmV4dC5jbG9uZSgpLmFkZCgnZGF5cycsIDEpO1xuICAgIHdoaWxlIChuZXh0LmlzQmVmb3JlKGxhdGVzdCkpIHtcbiAgICAgIGRvbSh7IGNsYXNzTmFtZTogby5zdHlsZXMudGltZU9wdGlvbiwgcGFyZW50OiB0aW1lbGlzdCwgdGV4dDogbmV4dC5mb3JtYXQoby50aW1lRm9ybWF0KSB9KTtcbiAgICAgIG5leHQuYWRkKCdzZWNvbmRzJywgby50aW1lSW50ZXJ2YWwpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdlZWtkYXkgKGluZGV4LCBiYWNrd2FyZHMpIHtcbiAgICB2YXIgZmFjdG9yID0gYmFja3dhcmRzID8gLTEgOiAxO1xuICAgIHZhciBvZmZzZXQgPSBpbmRleCArIG8ud2Vla1N0YXJ0ICogZmFjdG9yO1xuICAgIGlmIChvZmZzZXQgPj0gd2Vla2RheUNvdW50IHx8IG9mZnNldCA8IDApIHtcbiAgICAgIG9mZnNldCArPSB3ZWVrZGF5Q291bnQgKiAtZmFjdG9yO1xuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9XG5cbiAgZnVuY3Rpb24gZGlzcGxheVZhbGlkVGltZXNPbmx5ICgpIHtcbiAgICBpZiAoIW8udGltZSB8fCAhIHJlbmRlcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lcyA9IHRpbWVsaXN0LmNoaWxkcmVuO1xuICAgIHZhciBsZW5ndGggPSB0aW1lcy5sZW5ndGg7XG4gICAgdmFyIGRhdGU7XG4gICAgdmFyIHRpbWU7XG4gICAgdmFyIGl0ZW07XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpdGVtID0gdGltZXNbaV07XG4gICAgICB0aW1lID0gbW9tZW50dW0ubW9tZW50KHRleHQoaXRlbSksIG8udGltZUZvcm1hdCk7XG4gICAgICBkYXRlID0gc2V0VGltZShyZWYuY2xvbmUoKSwgdGltZSk7XG4gICAgICBpdGVtLnN0eWxlLmRpc3BsYXkgPSBpc0luUmFuZ2UoZGF0ZSwgZmFsc2UsIG8udGltZVZhbGlkYXRvcikgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZVRpbWVMaXN0IChzaG93KSB7XG4gICAgdmFyIGRpc3BsYXkgPSB0eXBlb2Ygc2hvdyA9PT0gJ2Jvb2xlYW4nID8gc2hvdyA6IHRpbWVsaXN0LnN0eWxlLmRpc3BsYXkgPT09ICdub25lJztcbiAgICBpZiAoZGlzcGxheSkge1xuICAgICAgc2hvd1RpbWVMaXN0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVUaW1lTGlzdCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dUaW1lTGlzdCAoKSB7IGlmICh0aW1lbGlzdCkgeyB0aW1lbGlzdC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJzsgfSB9XG4gIGZ1bmN0aW9uIGhpZGVUaW1lTGlzdCAoKSB7IGlmICh0aW1lbGlzdCkgeyB0aW1lbGlzdC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9IH1cbiAgZnVuY3Rpb24gc2hvd0NhbGVuZGFyICgpIHsgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJzsgfVxuICBmdW5jdGlvbiBoaWRlQ2FsZW5kYXIgKCkgeyBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgfVxuXG4gIGZ1bmN0aW9uIHNob3cgKCkge1xuICAgIHJlbmRlcigpO1xuICAgIHJlZnJlc2goKTtcbiAgICB0b2dnbGVUaW1lTGlzdCghby5kYXRlKTtcbiAgICBzaG93Q2FsZW5kYXIoKTtcbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSAoKSB7XG4gICAgaGlkZVRpbWVMaXN0KCk7XG4gICAgcmFmKGhpZGVDYWxlbmRhcik7XG4gICAgcmV0dXJuIGFwaTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVDb25kaXRpb25hbGx5ICgpIHtcbiAgICBoaWRlVGltZUxpc3QoKTtcblxuICAgIHZhciBwb3MgPSBjb250YWluZXIuY2xhc3NMaXN0LmNvbnRhaW5zKG8uc3R5bGVzLnBvc2l0aW9uZWQpO1xuICAgIGlmIChwb3MpIHtcbiAgICAgIHJhZihoaWRlQ2FsZW5kYXIpO1xuICAgIH1cbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FsZW5kYXJFdmVudFRhcmdldCAoZSkge1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICBpZiAodGFyZ2V0ID09PSBhcGkuYXNzb2NpYXRlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHdoaWxlICh0YXJnZXQpIHtcbiAgICAgIGlmICh0YXJnZXQgPT09IGNvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVPbkJsdXIgKGUpIHtcbiAgICBpZiAoY2FsZW5kYXJFdmVudFRhcmdldChlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoaWRlQ29uZGl0aW9uYWxseSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZU9uQ2xpY2sgKGUpIHtcbiAgICBpZiAoY2FsZW5kYXJFdmVudFRhcmdldChlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoaWRlQ29uZGl0aW9uYWxseSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3VidHJhY3RNb250aCAoKSB7IGNoYW5nZU1vbnRoKCdzdWJ0cmFjdCcpOyB9XG4gIGZ1bmN0aW9uIGFkZE1vbnRoICgpIHsgY2hhbmdlTW9udGgoJ2FkZCcpOyB9XG4gIGZ1bmN0aW9uIGNoYW5nZU1vbnRoIChvcCkge1xuICAgIHZhciBib3VuZDtcbiAgICByZWZDYWxbb3BdKCdtb250aHMnLCAxKTtcbiAgICBib3VuZCA9IGluUmFuZ2UocmVmQ2FsLmNsb25lKCkpO1xuICAgIHJlZiA9IGJvdW5kIHx8IHJlZjtcbiAgICBpZiAoYm91bmQpIHsgcmVmQ2FsID0gYm91bmQuY2xvbmUoKTsgfVxuICAgIHVwZGF0ZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlIChzaWxlbnQpIHtcbiAgICB1cGRhdGVDYWxlbmRhcigpO1xuICAgIHVwZGF0ZVRpbWUoKTtcbiAgICBpZiAoc2lsZW50ICE9PSB0cnVlKSB7IGVtaXRWYWx1ZXMoKTsgfVxuICAgIGRpc3BsYXlWYWxpZFRpbWVzT25seSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ2FsZW5kYXIgKCkge1xuICAgIGlmICghby5kYXRlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB5ID0gcmVmQ2FsLnllYXIoKTtcbiAgICB2YXIgbSA9IHJlZkNhbC5tb250aCgpO1xuICAgIHZhciBkID0gcmVmQ2FsLmRhdGUoKTtcbiAgICBpZiAoZCA9PT0gbGFzdERheSAmJiBtID09PSBsYXN0TW9udGggJiYgeSA9PT0gbGFzdFllYXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYoIHJlbmRlcmVkICkge1xuICAgICAgdGV4dChtb250aCwgcmVmQ2FsLmZvcm1hdChvLm1vbnRoRm9ybWF0KSk7XG4gICAgfVxuICAgIGxhc3REYXkgPSByZWZDYWwuZGF0ZSgpO1xuICAgIGxhc3RNb250aCA9IHJlZkNhbC5tb250aCgpO1xuICAgIGxhc3RZZWFyID0gcmVmQ2FsLnllYXIoKTtcbiAgICBpZiggcmVuZGVyZWQgKSB7XG4gICAgICByZW1vdmVDaGlsZHJlbihkYXRlYm9keSk7XG4gICAgICByZW5kZXJEYXlzKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlVGltZSAoKSB7XG4gICAgaWYgKCFvLnRpbWUgfHwgISByZW5kZXJlZCApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGV4dCh0aW1lLCByZWYuZm9ybWF0KG8udGltZUZvcm1hdCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZW1pdFZhbHVlcyAoKSB7XG4gICAgYXBpLmVtaXQoJ2RhdGEnLCBnZXREYXRlU3RyaW5nKCkpO1xuICAgIGFwaS5lbWl0KCd5ZWFyJywgcmVmLnllYXIoKSk7XG4gICAgYXBpLmVtaXQoJ21vbnRoJywgcmVmLm1vbnRoKCkpO1xuICAgIGFwaS5lbWl0KCdkYXknLCByZWYuZGF5KCkpO1xuICAgIGFwaS5lbWl0KCd0aW1lJywgcmVmLmZvcm1hdChvLnRpbWVGb3JtYXQpKTtcbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVmcmVzaCAoKSB7XG4gICAgbGFzdERheSA9IGZhbHNlOyAvLyBmb3JjZSBjYWxlbmRhciByZXBhaW50XG4gICAgdXBkYXRlKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0VmFsdWUgKHZhbHVlKSB7XG4gICAgdmFyIGRhdGUgPSBwYXJzZSh2YWx1ZSwgby5pbnB1dEZvcm1hdCk7XG4gICAgaWYgKGRhdGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVmID0gaW5SYW5nZShkYXRlKSB8fCByZWY7XG4gICAgcmVmQ2FsID0gcmVmLmNsb25lKCk7XG4gICAgdXBkYXRlKHRydWUpO1xuXG4gICAgcmV0dXJuIGFwaTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUNoaWxkcmVuIChlbGVtKSB7XG4gICAgd2hpbGUgKGVsZW0uZmlyc3RDaGlsZCkge1xuICAgICAgZWxlbS5yZW1vdmVDaGlsZChlbGVtLmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlckRheXMgKCkge1xuICAgIHZhciB0b3RhbCA9IHJlZkNhbC5kYXlzSW5Nb250aCgpO1xuICAgIHZhciBjdXJyZW50ID0gcmVmQ2FsLm1vbnRoKCkgIT09IHJlZi5tb250aCgpID8gLTEgOiByZWYuZGF0ZSgpOyAvLyAxLi4zMVxuICAgIHZhciBmaXJzdCA9IHJlZkNhbC5jbG9uZSgpLmRhdGUoMSk7XG4gICAgdmFyIGZpcnN0RGF5ID0gd2Vla2RheShmaXJzdC5kYXkoKSwgdHJ1ZSk7IC8vIDAuLjZcbiAgICB2YXIgbGFzdE1vbWVudDtcbiAgICB2YXIgaSwgZGF5LCBub2RlO1xuICAgIHZhciB0ciA9IHJvdygpO1xuICAgIHZhciBwcmV2TW9udGggPSBvLnN0eWxlcy5kYXlCb2R5RWxlbSArICcgJyArIG8uc3R5bGVzLmRheVByZXZNb250aDtcbiAgICB2YXIgbmV4dE1vbnRoID0gby5zdHlsZXMuZGF5Qm9keUVsZW0gKyAnICcgKyBvLnN0eWxlcy5kYXlOZXh0TW9udGg7XG4gICAgdmFyIGRpc2FibGVkID0gJyAnICsgby5zdHlsZXMuZGF5RGlzYWJsZWQ7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZmlyc3REYXk7IGkrKykge1xuICAgICAgZGF5ID0gZmlyc3QuY2xvbmUoKS5zdWJ0cmFjdCgnZGF5cycsIGZpcnN0RGF5IC0gaSk7XG4gICAgICBub2RlID0gZG9tKHsgdHlwZTogJ3RkJywgY2xhc3NOYW1lOiB0ZXN0KGRheSwgcHJldk1vbnRoKSwgcGFyZW50OiB0ciwgdGV4dDogZGF5LmZvcm1hdChvLmRheUZvcm1hdCkgfSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB0b3RhbDsgaSsrKSB7XG4gICAgICBpZiAodHIuY2hpbGRyZW4ubGVuZ3RoID09PSB3ZWVrZGF5Q291bnQpIHtcbiAgICAgICAgdHIgPSByb3coKTtcbiAgICAgIH1cbiAgICAgIGRheSA9IGZpcnN0LmNsb25lKCkuYWRkKCdkYXlzJywgaSk7XG4gICAgICBub2RlID0gZG9tKHsgdHlwZTogJ3RkJywgY2xhc3NOYW1lOiB0ZXN0KGRheSwgby5zdHlsZXMuZGF5Qm9keUVsZW0pLCBwYXJlbnQ6IHRyLCB0ZXh0OiBkYXkuZm9ybWF0KG8uZGF5Rm9ybWF0KSB9KTtcbiAgICAgIGlmIChkYXkuZGF0ZSgpID09PSBjdXJyZW50KSB7XG4gICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZChvLnN0eWxlcy5zZWxlY3RlZERheSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxhc3RNb21lbnQgPSBkYXkuY2xvbmUoKTtcbiAgICBmb3IgKGkgPSAxOyB0ci5jaGlsZHJlbi5sZW5ndGggPCB3ZWVrZGF5Q291bnQ7IGkrKykge1xuICAgICAgZGF5ID0gbGFzdE1vbWVudC5jbG9uZSgpLmFkZCgnZGF5cycsIGkpO1xuICAgICAgbm9kZSA9IGRvbSh7IHR5cGU6ICd0ZCcsIGNsYXNzTmFtZTogdGVzdChkYXksIG5leHRNb250aCksIHBhcmVudDogdHIsIHRleHQ6IGRheS5mb3JtYXQoby5kYXlGb3JtYXQpIH0pO1xuICAgIH1cblxuICAgIGJhY2suZGlzYWJsZWQgPSAhaXNJblJhbmdlKGZpcnN0LCB0cnVlKTtcbiAgICBuZXh0LmRpc2FibGVkID0gIWlzSW5SYW5nZShsYXN0TW9tZW50LCB0cnVlKTtcblxuICAgIGZ1bmN0aW9uIHRlc3QgKGRheSwgY2xhc3Nlcykge1xuICAgICAgaWYgKGlzSW5SYW5nZShkYXksIHRydWUsIG8uZGF0ZVZhbGlkYXRvcikpIHtcbiAgICAgICAgcmV0dXJuIGNsYXNzZXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2xhc3NlcyArIGRpc2FibGVkO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSW5SYW5nZSAoZGF0ZSwgYWxsZGF5LCB2YWxpZGF0b3IpIHtcbiAgICB2YXIgbWluID0gIW8ubWluID8gZmFsc2UgOiAoYWxsZGF5ID8gby5taW4uY2xvbmUoKS5zdGFydE9mKCdkYXknKSA6IG8ubWluKTtcbiAgICB2YXIgbWF4ID0gIW8ubWF4ID8gZmFsc2UgOiAoYWxsZGF5ID8gby5tYXguY2xvbmUoKS5lbmRPZignZGF5JykgOiBvLm1heCk7XG4gICAgaWYgKG1pbiAmJiBkYXRlLmlzQmVmb3JlKG1pbikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKG1heCAmJiBkYXRlLmlzQWZ0ZXIobWF4KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgdmFsaWQgPSAodmFsaWRhdG9yIHx8IEZ1bmN0aW9uLnByb3RvdHlwZSkuY2FsbChhcGksIGRhdGUudG9EYXRlKCkpO1xuICAgIHJldHVybiB2YWxpZCAhPT0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBpblJhbmdlIChkYXRlKSB7XG4gICAgaWYgKG8ubWluICYmIGRhdGUuaXNCZWZvcmUoby5taW4pKSB7XG4gICAgICByZXR1cm4gaW5SYW5nZShvLm1pbi5jbG9uZSgpKTtcbiAgICB9IGVsc2UgaWYgKG8ubWF4ICYmIGRhdGUuaXNBZnRlcihvLm1heCkpIHtcbiAgICAgIHJldHVybiBpblJhbmdlKG8ubWF4LmNsb25lKCkpO1xuICAgIH1cbiAgICB2YXIgZGF5cyA9IGRhdGUuZGF5c0luTW9udGgoKTtcbiAgICB2YXIgdmFsdWUgPSBkYXRlLmNsb25lKCkuc3VidHJhY3QoJ2RheXMnLCAxKTtcbiAgICBpZiAodmFsaWRhdGVUb3dhcmRzKHZhbHVlLCBkYXRlLCAnYWRkJykpIHtcbiAgICAgIHJldHVybiBpblRpbWVSYW5nZSh2YWx1ZSk7XG4gICAgfVxuICAgIHZhbHVlID0gZGF0ZS5jbG9uZSgpO1xuICAgIGlmICh2YWxpZGF0ZVRvd2FyZHModmFsdWUsIGRhdGUsICdzdWJ0cmFjdCcpKSB7XG4gICAgICByZXR1cm4gaW5UaW1lUmFuZ2UodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluVGltZVJhbmdlICh2YWx1ZSkge1xuICAgIHZhciB2YWxpZCA9IGZhbHNlO1xuICAgIHZhciBjb3B5ID0gdmFsdWUuY2xvbmUoKS5zdWJ0cmFjdCgnc2Vjb25kcycsIG8udGltZUludGVydmFsKTtcbiAgICB2YXIgdGltZXMgPSBNYXRoLmNlaWwoc2Vjb25kc0luRGF5IC8gby50aW1lSW50ZXJ2YWwpO1xuICAgIHZhciBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aW1lczsgaSsrKSB7XG4gICAgICBjb3B5LmFkZCgnc2Vjb25kcycsIG8udGltZUludGVydmFsKTtcbiAgICAgIGlmIChjb3B5LmRhdGUoKSA+IHZhbHVlLmRhdGUoKSkge1xuICAgICAgICBjb3B5LnN1YnRyYWN0KCdkYXlzJywgMSk7XG4gICAgICB9XG4gICAgICBpZiAoby50aW1lVmFsaWRhdG9yLmNhbGwoYXBpLCBjb3B5LnRvRGF0ZSgpKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdmFsaWRhdGVUb3dhcmRzICh2YWx1ZSwgZGF0ZSwgb3ApIHtcbiAgICB2YXIgdmFsaWQgPSBmYWxzZTtcbiAgICB3aGlsZSAodmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICB2YWx1ZVtvcF0oJ2RheXMnLCAxKTtcbiAgICAgIGlmICh2YWx1ZS5tb250aCgpICE9PSBkYXRlLm1vbnRoKCkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB2YWxpZCA9IG8uZGF0ZVZhbGlkYXRvci5jYWxsKGFwaSwgdmFsdWUudG9EYXRlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsaWQgIT09IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcm93ICgpIHtcbiAgICByZXR1cm4gZG9tKHsgdHlwZTogJ3RyJywgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXlSb3csIHBhcmVudDogZGF0ZWJvZHkgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwaWNrRGF5IChlKSB7XG4gICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKG8uc3R5bGVzLmRheURpc2FibGVkKSB8fCAhdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhvLnN0eWxlcy5kYXlCb2R5RWxlbSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRheSA9IHBhcnNlSW50KHRleHQodGFyZ2V0KSwgMTApO1xuICAgIHZhciBxdWVyeSA9ICcuJyArIG8uc3R5bGVzLnNlbGVjdGVkRGF5O1xuICAgIHZhciBzZWxlY3Rpb24gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcihxdWVyeSk7XG4gICAgaWYgKHNlbGVjdGlvbikgeyBzZWxlY3Rpb24uY2xhc3NMaXN0LnJlbW92ZShvLnN0eWxlcy5zZWxlY3RlZERheSk7IH1cbiAgICB2YXIgcHJldiA9IHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoby5zdHlsZXMuZGF5UHJldk1vbnRoKTtcbiAgICB2YXIgbmV4dCA9IHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoby5zdHlsZXMuZGF5TmV4dE1vbnRoKTtcbiAgICB2YXIgYWN0aW9uO1xuICAgIGlmIChwcmV2IHx8IG5leHQpIHtcbiAgICAgIGFjdGlvbiA9IHByZXYgPyAnc3VidHJhY3QnIDogJ2FkZCc7XG4gICAgICByZWZbYWN0aW9uXSgnbW9udGhzJywgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldC5jbGFzc0xpc3QuYWRkKG8uc3R5bGVzLnNlbGVjdGVkRGF5KTtcbiAgICB9XG4gICAgcmVmLmRhdGUoZGF5KTsgLy8gbXVzdCBydW4gYWZ0ZXIgc2V0dGluZyB0aGUgbW9udGhcbiAgICBzZXRUaW1lKHJlZiwgaW5SYW5nZShyZWYpIHx8IHJlZik7XG4gICAgcmVmQ2FsID0gcmVmLmNsb25lKCk7XG4gICAgaWYgKG8uYXV0b0Nsb3NlKSB7IGhpZGVDb25kaXRpb25hbGx5KCk7IH1cbiAgICB1cGRhdGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFRpbWUgKHRvLCBmcm9tKSB7XG4gICAgdG8uaG91cihmcm9tLmhvdXIoKSkubWludXRlKGZyb20ubWludXRlKCkpLnNlY29uZChmcm9tLnNlY29uZCgpKTtcbiAgICByZXR1cm4gdG87XG4gIH1cblxuICBmdW5jdGlvbiBwaWNrVGltZSAoZSkge1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICBpZiAoIXRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoby5zdHlsZXMudGltZU9wdGlvbikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHZhbHVlID0gbW9tZW50dW0ubW9tZW50KHRleHQodGFyZ2V0KSwgby50aW1lRm9ybWF0KTtcbiAgICBzZXRUaW1lKHJlZiwgdmFsdWUpO1xuICAgIHJlZkNhbCA9IHJlZi5jbG9uZSgpO1xuICAgIGVtaXRWYWx1ZXMoKTtcbiAgICB1cGRhdGVUaW1lKCk7XG4gICAgaWYgKCFvLmRhdGUgJiYgby5hdXRvQ2xvc2UpIHtcbiAgICAgIGhpZGVDb25kaXRpb25hbGx5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVUaW1lTGlzdCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERhdGUgKCkge1xuICAgIHJldHVybiByZWYudG9EYXRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREYXRlU3RyaW5nIChmb3JtYXQpIHtcbiAgICByZXR1cm4gcmVmLmZvcm1hdChmb3JtYXQgfHwgby5pbnB1dEZvcm1hdCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRNb21lbnQgKCkge1xuICAgIHJldHVybiByZWYuY2xvbmUoKTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FsZW5kYXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbG9uZWRlZXAgPSByZXF1aXJlKCdsb2Rhc2guY2xvbmVkZWVwJyk7XG5cbmZ1bmN0aW9uIGNsb25lICh0aGluZywgbW9tZW50KSB7XG4gIGZ1bmN0aW9uIHRyYW5zbXV0ZSAodmFsdWUpIHtcbiAgICBpZiAobW9tZW50LmlzTW9tZW50KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmNsb25lKCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjbG9uZWRlZXAodGhpbmcsIHRyYW5zbXV0ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xvbmU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbmRleCA9IHJlcXVpcmUoJy4vaW5kZXgnKTtcbnZhciBpbnB1dCA9IHJlcXVpcmUoJy4vaW5wdXQnKTtcbnZhciBpbmxpbmUgPSByZXF1aXJlKCcuL2lubGluZScpO1xudmFyIGlzSW5wdXQgPSByZXF1aXJlKCcuL2lzSW5wdXQnKTtcblxuZnVuY3Rpb24gY29yZSAoZWxlbSwgb3B0aW9ucykge1xuICB2YXIgY2FsO1xuICB2YXIgZXhpc3RpbmcgPSBpbmRleC5maW5kKGlucHV0KTtcbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nO1xuICB9XG5cbiAgaWYgKGlzSW5wdXQoZWxlbSkpIHtcbiAgICBjYWwgPSBpbnB1dChlbGVtLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICBjYWwgPSBpbmxpbmUoZWxlbSwgb3B0aW9ucyk7XG4gIH1cbiAgaW5kZXguYXNzaWduKGVsZW0sIGNhbCk7XG5cbiAgcmV0dXJuIGNhbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb3JlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG5cbmZ1bmN0aW9uIGRlZmF1bHRzIChvcHRpb25zLCBpbnB1dCkge1xuICB2YXIgdGVtcDtcbiAgdmFyIG5vO1xuICB2YXIgbyA9IG9wdGlvbnMgfHwge307XG4gIGlmIChvLmF1dG9IaWRlT25DbGljayA9PT0gbm8pIHsgby5hdXRvSGlkZU9uQ2xpY2sgPSB0cnVlOyB9XG4gIGlmIChvLmF1dG9IaWRlT25CbHVyID09PSBubykgeyBvLmF1dG9IaWRlT25CbHVyID0gdHJ1ZTsgfVxuICBpZiAoby5hdXRvQ2xvc2UgPT09IG5vKSB7IG8uYXV0b0Nsb3NlID0gdHJ1ZTsgfVxuICBpZiAoby5hcHBlbmRUbyA9PT0gbm8pIHsgby5hcHBlbmRUbyA9IGRvY3VtZW50LmJvZHk7IH1cbiAgaWYgKG8uYXBwZW5kVG8gPT09ICdwYXJlbnQnKSB7XG4gICAgaWYgKGlucHV0KSB7XG4gICAgICBvLmFwcGVuZFRvID0gaW5wdXQucGFyZW50Tm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmxpbmUgY2FsZW5kYXJzIG11c3QgYmUgYXBwZW5kZWQgdG8gYSBwYXJlbnQgbm9kZSBleHBsaWNpdGx5LicpO1xuICAgIH1cbiAgfVxuICBpZiAoby5pbnZhbGlkYXRlID09PSBubykgeyBvLmludmFsaWRhdGUgPSB0cnVlOyB9XG4gIGlmIChvLnJlcXVpcmVkID09PSBubykgeyBvLnJlcXVpcmVkID0gZmFsc2U7IH1cbiAgaWYgKG8uZGF0ZSA9PT0gbm8pIHsgby5kYXRlID0gdHJ1ZTsgfVxuICBpZiAoby50aW1lID09PSBubykgeyBvLnRpbWUgPSB0cnVlOyB9XG4gIGlmIChvLmRhdGUgPT09IGZhbHNlICYmIG8udGltZSA9PT0gZmFsc2UpIHsgdGhyb3cgbmV3IEVycm9yKCdBdCBsZWFzdCBvbmUgb2YgYGRhdGVgIG9yIGB0aW1lYCBtdXN0IGJlIGB0cnVlYC4nKTsgfVxuICBpZiAoby5pbnB1dEZvcm1hdCA9PT0gbm8pIHtcbiAgICBpZiAoby5kYXRlICYmIG8udGltZSkge1xuICAgICAgby5pbnB1dEZvcm1hdCA9ICdZWVlZLU1NLUREIEhIOm1tJztcbiAgICB9IGVsc2UgaWYgKG8uZGF0ZSkge1xuICAgICAgby5pbnB1dEZvcm1hdCA9ICdZWVlZLU1NLUREJztcbiAgICB9IGVsc2Uge1xuICAgICAgby5pbnB1dEZvcm1hdCA9ICdISDptbSc7XG4gICAgfVxuICB9XG4gIGlmIChvLmluaXRpYWxWYWx1ZSA9PT0gbm8pIHtcbiAgICBvLmluaXRpYWxWYWx1ZSA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgby5pbml0aWFsVmFsdWUgPSBwYXJzZShvLmluaXRpYWxWYWx1ZSwgby5pbnB1dEZvcm1hdCk7XG4gIH1cbiAgaWYgKG8ubWluID09PSBubykgeyBvLm1pbiA9IG51bGw7IH0gZWxzZSB7IG8ubWluID0gcGFyc2Uoby5taW4sIG8uaW5wdXRGb3JtYXQpOyB9XG4gIGlmIChvLm1heCA9PT0gbm8pIHsgby5tYXggPSBudWxsOyB9IGVsc2UgeyBvLm1heCA9IHBhcnNlKG8ubWF4LCBvLmlucHV0Rm9ybWF0KTsgfVxuICBpZiAoby5taW4gJiYgby5tYXgpIHtcbiAgICBpZiAoby5tYXguaXNCZWZvcmUoby5taW4pKSB7XG4gICAgICB0ZW1wID0gby5tYXg7XG4gICAgICBvLm1heCA9IG8ubWluO1xuICAgICAgby5taW4gPSB0ZW1wO1xuICAgIH1cbiAgICBpZiAoby5tYXguY2xvbmUoKS5zdWJ0cmFjdCgnZGF5cycsIDEpLmlzQmVmb3JlKG8ubWluKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdgbWF4YCBtdXN0IGJlIGF0IGxlYXN0IG9uZSBkYXkgYWZ0ZXIgYG1pbmAnKTtcbiAgICB9XG4gIH1cbiAgaWYgKG8uZGF0ZVZhbGlkYXRvciA9PT0gbm8pIHsgby5kYXRlVmFsaWRhdG9yID0gRnVuY3Rpb24ucHJvdG90eXBlOyB9XG4gIGlmIChvLnRpbWVWYWxpZGF0b3IgPT09IG5vKSB7IG8udGltZVZhbGlkYXRvciA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgfVxuICBpZiAoby50aW1lRm9ybWF0ID09PSBubykgeyBvLnRpbWVGb3JtYXQgPSAnSEg6bW0nOyB9XG4gIGlmIChvLnRpbWVJbnRlcnZhbCA9PT0gbm8pIHsgby50aW1lSW50ZXJ2YWwgPSA2MCAqIDMwOyB9IC8vIDMwIG1pbnV0ZXMgYnkgZGVmYXVsdFxuICBpZiAoby53ZWVrU3RhcnQgPT09IG5vKSB7IG8ud2Vla1N0YXJ0ID0gMDsgfVxuICBpZiAoby5tb250aEZvcm1hdCA9PT0gbm8pIHsgby5tb250aEZvcm1hdCA9ICdNTU1NIFlZWVknOyB9XG4gIGlmIChvLmRheUZvcm1hdCA9PT0gbm8pIHsgby5kYXlGb3JtYXQgPSAnREQnOyB9XG4gIGlmIChvLnN0eWxlcyA9PT0gbm8pIHsgby5zdHlsZXMgPSB7fTsgfVxuXG4gIHZhciBzdHlsID0gby5zdHlsZXM7XG4gIGlmIChzdHlsLmJhY2sgPT09IG5vKSB7IHN0eWwuYmFjayA9ICdyZC1iYWNrJzsgfVxuICBpZiAoc3R5bC5jb250YWluZXIgPT09IG5vKSB7IHN0eWwuY29udGFpbmVyID0gJ3JkLWNvbnRhaW5lcic7IH1cbiAgaWYgKHN0eWwucG9zaXRpb25lZCA9PT0gbm8pIHsgc3R5bC5wb3NpdGlvbmVkID0gJ3JkLWNvbnRhaW5lci1hdHRhY2htZW50JzsgfVxuICBpZiAoc3R5bC5kYXRlID09PSBubykgeyBzdHlsLmRhdGUgPSAncmQtZGF0ZSc7IH1cbiAgaWYgKHN0eWwuZGF5Qm9keSA9PT0gbm8pIHsgc3R5bC5kYXlCb2R5ID0gJ3JkLWRheXMtYm9keSc7IH1cbiAgaWYgKHN0eWwuZGF5Qm9keUVsZW0gPT09IG5vKSB7IHN0eWwuZGF5Qm9keUVsZW0gPSAncmQtZGF5LWJvZHknOyB9XG4gIGlmIChzdHlsLmRheVByZXZNb250aCA9PT0gbm8pIHsgc3R5bC5kYXlQcmV2TW9udGggPSAncmQtZGF5LXByZXYtbW9udGgnOyB9XG4gIGlmIChzdHlsLmRheU5leHRNb250aCA9PT0gbm8pIHsgc3R5bC5kYXlOZXh0TW9udGggPSAncmQtZGF5LW5leHQtbW9udGgnOyB9XG4gIGlmIChzdHlsLmRheURpc2FibGVkID09PSBubykgeyBzdHlsLmRheURpc2FibGVkID0gJ3JkLWRheS1kaXNhYmxlZCc7IH1cbiAgaWYgKHN0eWwuZGF5SGVhZCA9PT0gbm8pIHsgc3R5bC5kYXlIZWFkID0gJ3JkLWRheXMtaGVhZCc7IH1cbiAgaWYgKHN0eWwuZGF5SGVhZEVsZW0gPT09IG5vKSB7IHN0eWwuZGF5SGVhZEVsZW0gPSAncmQtZGF5LWhlYWQnOyB9XG4gIGlmIChzdHlsLmRheVJvdyA9PT0gbm8pIHsgc3R5bC5kYXlSb3cgPSAncmQtZGF5cy1yb3cnOyB9XG4gIGlmIChzdHlsLmRheVRhYmxlID09PSBubykgeyBzdHlsLmRheVRhYmxlID0gJ3JkLWRheXMnOyB9XG4gIGlmIChzdHlsLm1vbnRoID09PSBubykgeyBzdHlsLm1vbnRoID0gJ3JkLW1vbnRoJzsgfVxuICBpZiAoc3R5bC5uZXh0ID09PSBubykgeyBzdHlsLm5leHQgPSAncmQtbmV4dCc7IH1cbiAgaWYgKHN0eWwuc2VsZWN0ZWREYXkgPT09IG5vKSB7IHN0eWwuc2VsZWN0ZWREYXkgPSAncmQtZGF5LXNlbGVjdGVkJzsgfVxuICBpZiAoc3R5bC5zZWxlY3RlZFRpbWUgPT09IG5vKSB7IHN0eWwuc2VsZWN0ZWRUaW1lID0gJ3JkLXRpbWUtc2VsZWN0ZWQnOyB9XG4gIGlmIChzdHlsLnRpbWUgPT09IG5vKSB7IHN0eWwudGltZSA9ICdyZC10aW1lJzsgfVxuICBpZiAoc3R5bC50aW1lTGlzdCA9PT0gbm8pIHsgc3R5bC50aW1lTGlzdCA9ICdyZC10aW1lLWxpc3QnOyB9XG4gIGlmIChzdHlsLnRpbWVPcHRpb24gPT09IG5vKSB7IHN0eWwudGltZU9wdGlvbiA9ICdyZC10aW1lLW9wdGlvbic7IH1cblxuICByZXR1cm4gbztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gZG9tIChvcHRpb25zKSB7XG4gIHZhciBvID0gb3B0aW9ucyB8fCB7fTtcbiAgaWYgKCFvLnR5cGUpIHsgby50eXBlID0gJ2Rpdic7IH1cbiAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG8udHlwZSk7XG4gIGlmIChvLmNsYXNzTmFtZSkgeyBlbGVtLmNsYXNzTmFtZSA9IG8uY2xhc3NOYW1lOyB9XG4gIGlmIChvLnRleHQpIHsgZWxlbS5pbm5lclRleHQgPSBlbGVtLnRleHRDb250ZW50ID0gby50ZXh0OyB9XG4gIGlmIChvLnBhcmVudCkgeyBvLnBhcmVudC5hcHBlbmRDaGlsZChlbGVtKTsgfVxuICByZXR1cm4gZWxlbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkb207XG4iLCIndXNlIHN0cmljdCc7XG52YXIgbm87XG52YXIgaWtleSA9ICdyb21lSWQnO1xudmFyIGluZGV4ID0gW107XG5cbmZ1bmN0aW9uIGZpbmQgKHRoaW5nKSB7IC8vIGNhbiBiZSBhIERPTSBlbGVtZW50IG9yIGEgbnVtYmVyXG4gIGlmICh0eXBlb2YgdGhpbmcgIT09ICdudW1iZXInICYmIHRoaW5nICYmIHRoaW5nLmRhdGFzZXQpIHtcbiAgICByZXR1cm4gZmluZCh0aGluZy5kYXRhc2V0W2lrZXldKTtcbiAgfVxuICB2YXIgZXhpc3RpbmcgPSBpbmRleFt0aGluZ107XG4gIGlmIChleGlzdGluZyAhPT0gbm8pIHtcbiAgICByZXR1cm4gZXhpc3Rpbmc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzaWduIChlbGVtLCBpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5pZCA9IGVsZW0uZGF0YXNldFtpa2V5XSA9IGluZGV4LnB1c2goaW5zdGFuY2UpIC0gMTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGZpbmQ6IGZpbmQsXG4gIGFzc2lnbjogYXNzaWduXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmFmID0gcmVxdWlyZSgncmFmJyk7XG52YXIgY2FsZW5kYXIgPSByZXF1aXJlKCcuL2NhbGVuZGFyJyk7XG5cbmZ1bmN0aW9uIGlubGluZSAoZWxlbSwgY2FsZW5kYXJPcHRpb25zKSB7XG4gIHZhciBvID0gY2FsZW5kYXJPcHRpb25zIHx8IHt9O1xuXG4gIG8uYXBwZW5kVG8gPSBlbGVtO1xuXG4gIHZhciBhcGkgPSBjYWxlbmRhcihvKVxuICAgIC5vbigncmVhZHknLCByZWFkeSlcbiAgICAub24oJ2Rlc3Ryb3llZCcsIGRlc3Ryb3kpO1xuXG4gIGZ1bmN0aW9uIHJlYWR5ICgpIHtcbiAgICByYWYoYXBpLnNob3cpO1xuICAgIGFwaS5hc3NvY2lhdGVkID0gZWxlbTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGRlbGV0ZSBhcGkuYXNzb2NpYXRlZDtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5saW5lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCdsb2Rhc2gudGhyb3R0bGUnKTtcbnZhciByYWYgPSByZXF1aXJlKCdyYWYnKTtcbnZhciBjbG9uZSA9IHJlcXVpcmUoJy4vY2xvbmUnKTtcbnZhciBjYWxlbmRhciA9IHJlcXVpcmUoJy4vY2FsZW5kYXInKTtcbnZhciBtb21lbnR1bSA9IHJlcXVpcmUoJy4vbW9tZW50dW0nKTtcbnZhciBubztcblxuZnVuY3Rpb24gaW5wdXRDYWxlbmRhciAoaW5wdXQsIGNhbGVuZGFyT3B0aW9ucykge1xuICB2YXIgbztcbiAgdmFyIGFwaSA9IGNhbGVuZGFyKGNhbGVuZGFyT3B0aW9ucyk7XG4gIHZhciB0aHJvdHRsZWRUYWtlSW5wdXQgPSB0aHJvdHRsZSh0YWtlSW5wdXQsIDUwKTtcbiAgdmFyIHRocm90dGxlZFBvc2l0aW9uID0gdGhyb3R0bGUocG9zaXRpb24sIDMwKTtcbiAgdmFyIGlnbm9yZUludmFsaWRhdGlvbjtcbiAgdmFyIGlnbm9yZVNob3c7XG5cbiAgZXZlbnRzKCk7XG5cbiAgZnVuY3Rpb24gaW5pdCAoc3VwZXJPcHRpb25zKSB7XG4gICAgbyA9IGNsb25lKHN1cGVyT3B0aW9ucywgbW9tZW50dW0ubW9tZW50KTtcblxuICAgIGFwaS5jb250YWluZXIuY2xhc3NMaXN0LmFkZChvLnN0eWxlcy5wb3NpdGlvbmVkKTtcbiAgICBhcGkuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGNvbnRhaW5lck1vdXNlRG93bik7XG4gICAgYXBpLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNvbnRhaW5lckNsaWNrKTtcblxuICAgIGFwaS5hc3NvY2lhdGVkID0gaW5wdXQ7XG4gICAgYXBpLmdldERhdGUgPSB1bnJlcXVpcmUoYXBpLmdldERhdGUpO1xuICAgIGFwaS5nZXREYXRlU3RyaW5nID0gdW5yZXF1aXJlKGFwaS5nZXREYXRlU3RyaW5nKTtcbiAgICBhcGkuZ2V0TW9tZW50ID0gdW5yZXF1aXJlKGFwaS5nZXRNb21lbnQpO1xuXG4gICAgaWYgKG8uaW5pdGlhbFZhbHVlKSB7XG4gICAgICBpbnB1dC52YWx1ZSA9IG8uaW5pdGlhbFZhbHVlLmZvcm1hdChvLmlucHV0Rm9ybWF0KTtcbiAgICB9XG5cbiAgICBhcGkub24oJ2RhdGEnLCB1cGRhdGVJbnB1dCk7XG5cbiAgICBldmVudExpc3RlbmluZygpO1xuICAgIHRocm90dGxlZFRha2VJbnB1dCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgZXZlbnRMaXN0ZW5pbmcodHJ1ZSk7XG4gICAgZGVsZXRlIGFwaS5hc3NvY2lhdGVkO1xuICAgIHJhZihldmVudHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXZlbnRzICgpIHtcbiAgICBhcGkub25jZSgncmVhZHknLCBpbml0KTtcbiAgICBhcGkub25jZSgnZGVzdHJveWVkJywgZGVzdHJveSk7XG4gIH1cblxuICBmdW5jdGlvbiBldmVudExpc3RlbmluZyAocmVtb3ZlKSB7XG4gICAgdmFyIHByZWZpeCA9IHJlbW92ZSA/ICdyZW1vdmUnIDogJ2FkZCc7XG4gICAgdmFyIG9wID0gcHJlZml4ICsgJ0V2ZW50TGlzdGVuZXInO1xuICAgIGlucHV0W29wXSgnY2xpY2snLCBzaG93KTtcbiAgICBpbnB1dFtvcF0oJ2ZvY3VzaW4nLCBzaG93KTtcbiAgICBpbnB1dFtvcF0oJ2NoYW5nZScsIHRocm90dGxlZFRha2VJbnB1dCk7XG4gICAgaW5wdXRbb3BdKCdrZXlwcmVzcycsIHRocm90dGxlZFRha2VJbnB1dCk7XG4gICAgaW5wdXRbb3BdKCdrZXlkb3duJywgdGhyb3R0bGVkVGFrZUlucHV0KTtcbiAgICBpbnB1dFtvcF0oJ2lucHV0JywgdGhyb3R0bGVkVGFrZUlucHV0KTtcbiAgICBpZiAoby5pbnZhbGlkYXRlKSB7IGlucHV0W29wXSgnYmx1cicsIGludmFsaWRhdGVJbnB1dCk7IH1cbiAgICB3aW5kb3dbb3BdKCdyZXNpemUnLCB0aHJvdHRsZWRQb3NpdGlvbik7XG4gIH1cblxuICBmdW5jdGlvbiBjb250YWluZXJDbGljayAoKSB7XG4gICAgaWdub3JlU2hvdyA9IHRydWU7XG4gICAgaW5wdXQuZm9jdXMoKTtcbiAgICBpZ25vcmVTaG93ID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBjb250YWluZXJNb3VzZURvd24gKCkge1xuICAgIGlnbm9yZUludmFsaWRhdGlvbiA9IHRydWU7XG4gICAgcmFmKHVuaWdub3JlKTtcblxuICAgIGZ1bmN0aW9uIHVuaWdub3JlICgpIHtcbiAgICAgIGlnbm9yZUludmFsaWRhdGlvbiA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGludmFsaWRhdGVJbnB1dCAoKSB7XG4gICAgaWYgKCFpZ25vcmVJbnZhbGlkYXRpb24gJiYgIWlzRW1wdHkoKSkge1xuICAgICAgYXBpLmVtaXRWYWx1ZXMoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93ICgpIHtcbiAgICBpZiAoaWdub3JlU2hvdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhcGkuc2hvdygpO1xuICAgIHBvc2l0aW9uKCk7XG4gIH1cblxuICBmdW5jdGlvbiBwb3NpdGlvbiAoKSB7XG4gICAgdmFyIGJvdW5kcyA9IGlucHV0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcbiAgICBhcGkuY29udGFpbmVyLnN0eWxlLnRvcCAgPSBib3VuZHMudG9wICsgc2Nyb2xsVG9wICsgaW5wdXQub2Zmc2V0SGVpZ2h0ICsgJ3B4JztcbiAgICBhcGkuY29udGFpbmVyLnN0eWxlLmxlZnQgPSBib3VuZHMubGVmdCArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiB0YWtlSW5wdXQgKCkge1xuICAgIHZhciB2YWx1ZSA9IGlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoaXNFbXB0eSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBkYXRlID0gbW9tZW50dW0ubW9tZW50KHZhbHVlLCBvLmlucHV0Rm9ybWF0KTtcbiAgICBhcGkuc2V0VmFsdWUoZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVJbnB1dCAoZGF0YSkge1xuICAgIGlucHV0LnZhbHVlID0gZGF0YTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzRW1wdHkgKCkge1xuICAgIHJldHVybiBvLnJlcXVpcmVkID09PSBmYWxzZSAmJiBpbnB1dC52YWx1ZS50cmltKCkgPT09ICcnO1xuICB9XG5cbiAgZnVuY3Rpb24gdW5yZXF1aXJlIChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiBtYXliZSAoKSB7XG4gICAgICByZXR1cm4gaXNFbXB0eSgpID8gbnVsbCA6IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBhcGk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5wdXRDYWxlbmRhcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaXNJbnB1dCAoZWxlbSkge1xuICByZXR1cm4gZWxlbSAmJiBlbGVtLm5vZGVOYW1lICYmIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2lucHV0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0lucHV0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbW9tZW50OiBudWxsXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbW9tZW50dW0gPSByZXF1aXJlKCcuL21vbWVudHVtJyk7XG5cbmZ1bmN0aW9uIHJhdyAoZGF0ZSwgZm9ybWF0KSB7XG4gIGlmICh0eXBlb2YgZGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gbW9tZW50dW0ubW9tZW50KGRhdGUsIGZvcm1hdCk7XG4gIH1cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRlKSA9PT0gJ1tvYmplY3QgRGF0ZV0nKSB7XG4gICAgcmV0dXJuIG1vbWVudHVtLm1vbWVudChkYXRlKTtcbiAgfVxuICBpZiAobW9tZW50dW0ubW9tZW50LmlzTW9tZW50KGRhdGUpKSB7XG4gICAgcmV0dXJuIGRhdGUuY2xvbmUoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZSAoZGF0ZSwgZm9ybWF0KSB7XG4gIHZhciBtID0gcmF3KGRhdGUsIHR5cGVvZiBmb3JtYXQgPT09ICdzdHJpbmcnID8gZm9ybWF0IDogbnVsbCk7XG4gIHJldHVybiBtICYmIG0uaXNWYWxpZCgpID8gbSA6IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlJyk7XG52YXIgaW5kZXggPSByZXF1aXJlKCcuL2luZGV4Jyk7XG52YXIgdXNlID0gcmVxdWlyZSgnLi91c2UnKTtcblxuY29yZS51c2UgPSB1c2UuYmluZChjb3JlKTtcbmNvcmUuZmluZCA9IGluZGV4LmZpbmQ7XG5jb3JlLnZhbCA9IHJlcXVpcmUoJy4vdmFsaWRhdG9ycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvcmU7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgcm9tZSA9IHJlcXVpcmUoJy4vcm9tZScpO1xudmFyIG1vbWVudHVtID0gcmVxdWlyZSgnLi9tb21lbnR1bScpO1xuXG5yb21lLnVzZShnbG9iYWwubW9tZW50KTtcblxuaWYgKG1vbWVudHVtLm1vbWVudCA9PT0gdm9pZCAwKSB7XG4gIHRocm93IG5ldyBFcnJvcigncm9tZSBkZXBlbmRzIG9uIG1vbWVudC5qcywgeW91IGNhbiBnZXQgaXQgYXQgaHR0cDovL21vbWVudGpzLmNvbSwgb3IgeW91IGNvdWxkIHVzZSB0aGUgYnVuZGxlZCBkaXN0cmlidXRpb24gZmlsZSBpbnN0ZWFkLicpO1xufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gdGV4dCAoZWxlbSwgdmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBlbGVtLmlubmVyVGV4dCA9IGVsZW0udGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gZWxlbS5pbm5lclRleHQgfHwgZWxlbS50ZXh0Q29udGVudDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0ZXh0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbW9tZW50dW0gPSByZXF1aXJlKCcuL21vbWVudHVtJyk7XG5cbmZ1bmN0aW9uIHVzZSAobW9tZW50KSB7XG4gIHRoaXMubW9tZW50ID0gbW9tZW50dW0ubW9tZW50ID0gbW9tZW50O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGluZGV4ID0gcmVxdWlyZSgnLi9pbmRleCcpO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi9wYXJzZScpO1xudmFyIGFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi9hc3NvY2lhdGlvbicpO1xuXG5mdW5jdGlvbiBjb21wYXJlQnVpbGRlciAoY29tcGFyZSkge1xuICByZXR1cm4gZnVuY3Rpb24gZmFjdG9yeSAodmFsdWUpIHtcbiAgICB2YXIgZml4ZWQgPSBwYXJzZSh2YWx1ZSk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgIHZhciBjYWwgPSBpbmRleC5maW5kKHZhbHVlKTtcbiAgICAgIHZhciBsZWZ0ID0gcGFyc2UoZGF0ZSk7XG4gICAgICB2YXIgcmlnaHQgPSBmaXhlZCB8fCBjYWwgJiYgY2FsLmdldE1vbWVudCgpO1xuICAgICAgaWYgKCFyaWdodCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWwpIHtcbiAgICAgICAgYXNzb2NpYXRpb24uYWRkKHRoaXMsIGNhbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29tcGFyZShsZWZ0LCByaWdodCk7XG4gICAgfTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmFuZ2VCdWlsZGVyIChob3csIGNvbXBhcmUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZhY3RvcnkgKHN0YXJ0LCBlbmQpIHtcbiAgICB2YXIgZGF0ZXM7XG4gICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShzdGFydCkpIHtcbiAgICAgIGRhdGVzID0gc3RhcnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChsZW4gPT09IDEpIHtcbiAgICAgICAgZGF0ZXMgPSBbc3RhcnRdO1xuICAgICAgfSBlbHNlIGlmIChsZW4gPT09IDIpIHtcbiAgICAgICAgZGF0ZXMgPSBbW3N0YXJ0LCBlbmRdXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICAgIHJldHVybiBkYXRlcy5tYXAoZXhwYW5kLmJpbmQodGhpcykpW2hvd10oY29tcGFyZS5iaW5kKHRoaXMsIGRhdGUpKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZXhwYW5kICh2YWx1ZSkge1xuICAgICAgdmFyIHN0YXJ0LCBlbmQ7XG4gICAgICB2YXIgY2FsID0gaW5kZXguZmluZCh2YWx1ZSk7XG4gICAgICBpZiAoY2FsKSB7XG4gICAgICAgIHN0YXJ0ID0gZW5kID0gY2FsLmdldE1vbWVudCgpO1xuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBzdGFydCA9IHZhbHVlWzBdOyBlbmQgPSB2YWx1ZVsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0ID0gZW5kID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAoY2FsKSB7XG4gICAgICAgIGFzc29jaWF0aW9uLmFkZChjYWwsIHRoaXMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IHBhcnNlKHN0YXJ0KS5zdGFydE9mKCdkYXknKS50b0RhdGUoKSxcbiAgICAgICAgZW5kOiBwYXJzZShlbmQpLmVuZE9mKCdkYXknKS50b0RhdGUoKVxuICAgICAgfTtcbiAgICB9XG4gIH07XG59XG5cbnZhciBhZnRlckVxICA9IGNvbXBhcmVCdWlsZGVyKGZ1bmN0aW9uIChsZWZ0LCByaWdodCkgeyByZXR1cm4gbGVmdCA+PSByaWdodDsgfSk7XG52YXIgYWZ0ZXIgICAgPSBjb21wYXJlQnVpbGRlcihmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHsgcmV0dXJuIGxlZnQgID4gcmlnaHQ7IH0pO1xudmFyIGJlZm9yZUVxID0gY29tcGFyZUJ1aWxkZXIoZnVuY3Rpb24gKGxlZnQsIHJpZ2h0KSB7IHJldHVybiBsZWZ0IDw9IHJpZ2h0OyB9KTtcbnZhciBiZWZvcmUgICA9IGNvbXBhcmVCdWlsZGVyKGZ1bmN0aW9uIChsZWZ0LCByaWdodCkgeyByZXR1cm4gbGVmdCAgPCByaWdodDsgfSk7XG5cbnZhciBleGNlcHQgICA9IHJhbmdlQnVpbGRlcignZXZlcnknLCBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHsgcmV0dXJuIHJpZ2h0LnN0YXJ0ICA+IGxlZnQgfHwgcmlnaHQuZW5kICA8IGxlZnQ7IH0pO1xudmFyIG9ubHkgICAgID0gcmFuZ2VCdWlsZGVyKCdzb21lJywgIGZ1bmN0aW9uIChsZWZ0LCByaWdodCkgeyByZXR1cm4gcmlnaHQuc3RhcnQgPD0gbGVmdCAmJiByaWdodC5lbmQgPj0gbGVmdDsgfSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZnRlckVxOiBhZnRlckVxLFxuICBhZnRlcjogYWZ0ZXIsXG4gIGJlZm9yZUVxOiBiZWZvcmVFcSxcbiAgYmVmb3JlOiBiZWZvcmUsXG4gIGV4Y2VwdDogZXhjZXB0LFxuICBvbmx5OiBvbmx5XG59O1xuIl19
(72)
});
