/**
 * rome - Customizable date (and time) picker. Opt-in UI, no jQuery!
 * @version v2.1.14
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
      return thing.emitterSnapshot(args.shift()).apply(this, args);
    };
    thing.emitterSnapshot = function (type) {
      var et = (evt[type] || []).slice(0);
      return function () {
        var args = atoa(arguments);
        var ctx = this || thing;
        if (type === 'error' && opts.throws !== false && !et.length) { throw args.length === 1 ? args[0] : args; }
        evt[type] = et.filter(function emitter (listen) {
          if (opts.async) { debounce(listen, args, ctx); } else { listen.apply(ctx, args); }
          return !listen._once;
        });
        return thing;
      };
    }
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

}).call(this,_dereq_("Zbi7gb"))
},{"Zbi7gb":1}],4:[function(_dereq_,module,exports){
(function (global){
'use strict';

var doc = document;
var addEvent = addEventEasy;
var removeEvent = removeEventEasy;
var hardCache = [];

if (!global.addEventListener) {
  addEvent = addEventHard;
  removeEvent = removeEventHard;
}

function addEventEasy (el, type, fn, capturing) {
  return el.addEventListener(type, fn, capturing);
}

function addEventHard (el, type, fn) {
  return el.attachEvent('on' + type, wrap(el, type, fn));
}

function removeEventEasy (el, type, fn, capturing) {
  return el.removeEventListener(type, fn, capturing);
}

function removeEventHard (el, type, fn) {
  return el.detachEvent('on' + type, unwrap(el, type, fn));
}

function fabricateEvent (el, type) {
  var e;
  if (doc.createEvent) {
    e = doc.createEvent('Event');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
  } else if (doc.createEventObject) {
    e = doc.createEventObject();
    el.fireEvent('on' + type, e);
  }
}

function wrapperFactory (el, type, fn) {
  return function wrapper (originalEvent) {
    var e = originalEvent || global.event;
    e.target = e.target || e.srcElement;
    e.preventDefault  = e.preventDefault  || function preventDefault () { e.returnValue = false; };
    e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
    fn.call(el, e);
  };
}

function wrap (el, type, fn) {
  var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
  hardCache.push({
    wrapper: wrapper,
    element: el,
    type: type,
    fn: fn
  });
  return wrapper;
}

function unwrap (el, type, fn) {
  var i = find(el, type, fn);
  if (i) {
    var wrapper = hardCache[i].wrapper;
    hardCache.splice(i, 1); // free up a tad of memory
    return wrapper;
  }
}

function find (el, type, fn) {
  var i, item;
  for (i = 0; i < hardCache.length; i++) {
    item = hardCache[i];
    if (item.element === el && item.type === type && item.fn === fn) {
      return i;
    }
  }
}

module.exports = {
  add: addEvent,
  remove: removeEvent,
  fabricate: fabricateEvent
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(_dereq_,module,exports){
(function (global){
//! moment.js
//! version : 2.8.3
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.8.3',
        // the global-scope this is NOT the global object in Node.js
        globalScope = typeof global !== 'undefined' ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        parseTokenOrdinal = /\d{1,2}/,

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                _dereq_('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
        Locale
    ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) {
                return parseTokenOneDigit;
            }
            /* falls through */
        case 'SS':
            if (strict) {
                return parseTokenTwoDigits;
            }
            /* falls through */
        case 'SSS':
            if (strict) {
                return parseTokenThreeDigits;
            }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return config._locale._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return parseTokenOrdinal;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = config._locale.monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(input, 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = config._locale.isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = config._locale.weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual zone can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() + config._tzm);
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i);
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.zone(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.zone(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.add(this._dateTzOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                daysAdjust = (this - moment(this).startOf('month')) -
                    (that - moment(that).startOf('month'));
                // same as above but with zones, to negate all dst
                daysAdjust -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4;
                output += daysAdjust / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                return +this.clone().startOf(units) > +moment(input).startOf(units);
            }
        },

        isBefore: function (input, units) {
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                return +this.clone().startOf(units) < +moment(input).startOf(units);
            }
        },

        isSame: function (input, units) {
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
            }
        },

        min: deprecate(
                 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[zone(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist int zone
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        zone : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateTzOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.subtract(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(offset - input, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
            } else {
                return this._isUTC ? offset : this._dateTzOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Use moment().localeData() instead.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateTzOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }
    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + yearsToDays(this._months / 12);
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
        Default Locale
    ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LOCALES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    'Accessing Moment through the global scope is ' +
                    'deprecated, and will be removed in an upcoming ' +
                    'release.',
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define('moment', function (_dereq_, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(_dereq_,module,exports){
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

},{"./isInput":16}],7:[function(_dereq_,module,exports){
'use strict';

var crossvent = _dereq_('crossvent');
var emitter = _dereq_('contra.emitter');
var dom = _dereq_('./dom');
var text = _dereq_('./text');
var parse = _dereq_('./parse');
var clone = _dereq_('./clone');
var defaults = _dereq_('./defaults');
var momentum = _dereq_('./momentum');
var classes = _dereq_('./classes');
var noop = _dereq_('./noop');
var no;

function calendar (calendarOptions) {
  var o;
  var ref;
  var refCal;
  var container;
  var rendered = false;

  // date variables
  var monthOffsetAttribute = 'data-rome-offset';
  var weekdays;
  var weekdayCount;
  var calendarMonths = [];
  var lastYear;
  var lastMonth;
  var lastDay;
  var lastDayElement;
  var datewrapper;
  var back;
  var next;

  // time variables
  var secondsInDay = 60 * 60 * 24;
  var time;
  var timelist;

  var api = emitter({
    associated: calendarOptions.associated
  });

  init();
  setTimeout(ready, 0);

  return api;

  function napi () { return api; }

  function init (initOptions) {
    o = defaults(initOptions || calendarOptions, api);
    if (!container) { container = dom({ className: o.styles.container }); }
    weekdays = o.weekdayFormat;
    weekdayCount = weekdays.length;
    lastMonth = no;
    lastYear = no;
    lastDay = no;
    lastDayElement = no;
    o.appendTo.appendChild(container);

    removeChildren(container);
    rendered = false;
    ref = o.initialValue ? o.initialValue : momentum.moment();
    refCal = ref.clone();

    api.container = container;
    api.destroyed = false;
    api.destroy = destroy.bind(api, false);
    api.emitValues = emitValues;
    api.getDate = getDate;
    api.getDateString = getDateString;
    api.getMoment = getMoment;
    api.hide = hide;
    api.options = changeOptions;
    api.options.reset = resetOptions;
    api.refresh = refresh;
    api.restore = napi;
    api.setValue = setValue;
    api.show = show;

    eventListening();
    ready();

    return api;
  }

  function ready () {
    api.emit('ready', clone(o));
  }

  function destroy (silent) {
    if (container) {
      container.parentNode.removeChild(container);
    }

    if (o) {
      eventListening(true);
    }

    var destroyed = api.emitterSnapshot('destroyed');
    api.destroyed = true;
    api.destroy = napi;
    api.emitValues = napi;
    api.getDate = noop;
    api.getDateString = noop;
    api.getMoment = noop;
    api.hide = napi;
    api.options = napi;
    api.options.reset = napi;
    api.refresh = napi;
    api.restore = init;
    api.setValue = napi;
    api.show = napi;
    api.off();

    if (silent !== true) {
      destroyed();
    }

    return api;
  }

  function eventListening (remove) {
    var op = remove ? 'remove' : 'add';
    if (o.autoHideOnBlur) { crossvent[op](document.documentElement, 'focus', hideOnBlur, true); }
    if (o.autoHideOnClick) { crossvent[op](document, 'click', hideOnClick); }
  }

  function changeOptions (options) {
    if (arguments.length === 0) {
      return clone(o);
    }
    destroy();
    init(options);
    return api;
  }

  function resetOptions () {
    return changeOptions({ appendTo: o.appendTo });
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
    var i;
    calendarMonths = [];

    datewrapper = dom({ className: o.styles.date, parent: container });

    for (i = 0; i < o.monthsInCalendar; i++) {
      renderMonth(i);
    }

    crossvent.add(back, 'click', subtractMonth);
    crossvent.add(next, 'click', addMonth);
    crossvent.add(datewrapper, 'click', pickDay);

    function renderMonth (i) {
      var month = dom({ className: o.styles.month, parent: datewrapper });
      if (i === 0) {
        back = dom({ type: o.monthsInputs, className: o.styles.back, attributes: { type: 'button' }, parent: month });
      }
      if (i === o.monthsInCalendar -1) {
        next = dom({ type: o.monthsInputs, className: o.styles.next, attributes: { type: 'button' }, parent: month });
      }
      var label = dom({ className: o.styles.monthLabel, parent: month });
      var date = dom({ type: 'table', className: o.styles.dayTable, parent: month });
      var datehead = dom({ type: 'thead', className: o.styles.dayHead, parent: date });
      var dateheadrow = dom({ type: 'tr', className: o.styles.dayRow, parent: datehead });
      var datebody = dom({ type: 'tbody', className: o.styles.dayBody, parent: date });
      var j;

      for (j = 0; j < weekdayCount; j++) {
        dom({ type: 'th', className: o.styles.dayHeadElem, parent: dateheadrow, text: weekdays[weekday(j)] });
      }

      datebody.setAttribute(monthOffsetAttribute, i);
      calendarMonths.push({
        label: label,
        body: datebody
      });
    }
  }

  function renderTime () {
    if (!o.time || !o.timeInterval) {
      return;
    }
    var timewrapper = dom({ className: o.styles.time, parent: container });
    time = dom({ className: o.styles.selectedTime, parent: timewrapper, text: ref.format(o.timeFormat) });
    crossvent.add(time, 'click', toggleTimeList);
    timelist = dom({ className: o.styles.timeList, parent: timewrapper });
    crossvent.add(timelist, 'click', pickTime);
    var next = momentum.moment('00:00:00', 'HH:mm:ss');
    var latest = next.clone().add(1, 'days');
    while (next.isBefore(latest)) {
      dom({ className: o.styles.timeOption, parent: timelist, text: next.format(o.timeFormat) });
      next.add(o.timeInterval, 'seconds');
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
    if (!o.time || !rendered) {
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
  function showCalendar () { container.style.display = 'inline-block'; api.emit('show'); }
  function hideCalendar () { container.style.display = 'none'; api.emit('hide'); }

  function show () {
    render();
    refresh();
    toggleTimeList(!o.date);
    showCalendar();
    return api;
  }

  function hide () {
    hideTimeList();
    setTimeout(hideCalendar, 0);
    return api;
  }

  function hideConditionally () {
    hideTimeList();

    var pos = classes.contains(container, o.styles.positioned);
    if (pos) {
      setTimeout(hideCalendar, 0);
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
    var direction = op === 'add' ? -1 : 1;
    var offset = o.monthsInCalendar + direction * getMonthOffset(lastDayElement);
    refCal[op](offset, 'months');
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
    if (!o.date || !rendered) {
      return;
    }
    var y = refCal.year();
    var m = refCal.month();
    var d = refCal.date();
    if (d === lastDay && m === lastMonth && y === lastYear) {
      return;
    }
    var canStay = isDisplayed();
    lastDay = refCal.date();
    lastMonth = refCal.month();
    lastYear = refCal.year();
    if (canStay) { updateCalendarSelection(); return; }
    calendarMonths.forEach(updateMonth);
    renderAllDays();

    function updateMonth (month, i) {
      var offsetCal = refCal.clone().add(i, 'months');
      text(month.label, offsetCal.format(o.monthFormat));
      removeChildren(month.body);
    }
  }

  function updateCalendarSelection () {
    var day = refCal.date() - 1;
    selectDayElement(false);
    calendarMonths.forEach(function (cal) {
      var days;
      if (sameCalendarMonth(cal.date, refCal)) {
        days = cast(cal.body.children).map(aggregate);
        days = Array.prototype.concat.apply([], days).filter(inside);
        selectDayElement(days[day]);
      }
    });

    function cast (like) {
      var dest = [];
      var i;
      for (i = 0; i < like.length; i++) {
        dest.push(like[i]);
      }
      return dest;
    }

    function aggregate (child) {
      return cast(child.children);
    }

    function inside (child) {
      return !classes.contains(child, o.styles.dayPrevMonth) &&
             !classes.contains(child, o.styles.dayNextMonth);
    }
  }

  function isDisplayed () {
    return calendarMonths.some(matches);

    function matches (cal) {
      if (!lastYear) { return false; }
      return sameCalendarMonth(cal.date, refCal);
    }
  }

  function sameCalendarMonth (left, right) {
    return left && right && left.year() === right.year() && left.month() === right.month();
  }

  function updateTime () {
    if (!o.time || !rendered) {
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
    lastYear = false;
    lastMonth = false;
    lastDay = false;
    update(true);
    return api;
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

  function removeChildren (elem, self) {
    while (elem && elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
    if (self === true) {
      elem.parentNode.removeChild(elem);
    }
  }

  function renderAllDays () {
    var i;
    for (i = 0; i < o.monthsInCalendar; i++) {
      renderDays(i);
    }
  }

  function renderDays (offset) {
    var month = calendarMonths[offset];
    var offsetCal = refCal.clone().add(offset, 'months');
    var total = offsetCal.daysInMonth();
    var current = offsetCal.month() !== ref.month() ? -1 : ref.date(); // -1 : 1..31
    var first = offsetCal.clone().date(1);
    var firstDay = weekday(first.day(), true); // 0..6
    var tr = dom({ type: 'tr', className: o.styles.dayRow, parent: month.body });
    var prevMonth = hiddenWhen(offset !== 0, [o.styles.dayBodyElem, o.styles.dayPrevMonth]);
    var nextMonth = hiddenWhen(offset !== o.monthsInCalendar - 1, [o.styles.dayBodyElem, o.styles.dayNextMonth]);
    var disabled = o.styles.dayDisabled;
    var lastDay;

    part({
      base: first.clone().subtract(firstDay, 'days'),
      length: firstDay,
      cell: prevMonth
    });

    part({
      base: first.clone(),
      length: total,
      cell: [o.styles.dayBodyElem],
      selectable: true
    });

    lastDay = first.clone().add(total, 'days');

    part({
      base: lastDay,
      length: weekdayCount - tr.children.length,
      cell: nextMonth
    });

    back.disabled = !isInRangeLeft(first, true);
    next.disabled = !isInRangeRight(lastDay, true);
    month.date = offsetCal.clone();

    function part (data) {
      var i, day, node;
      for (i = 0; i < data.length; i++) {
        if (tr.children.length === weekdayCount) {
          tr = dom({ type: 'tr', className: o.styles.dayRow, parent: month.body });
        }
        day = data.base.clone().add(i, 'days');
        node = dom({
          type: 'td',
          parent: tr,
          text: day.format(o.dayFormat),
          className: validationTest(day, data.cell.join(' ').split(' ')).join(' ')
        });
        if (data.selectable && day.date() === current) {
          selectDayElement(node);
        }
      }
    }

    function validationTest (day, cell) {
      if (!isInRange(day, true, o.dateValidator)) { cell.push(disabled); }
      return cell;
    }

    function hiddenWhen (value, cell) {
      if (value) { cell.push(o.styles.dayConcealed); }
      return cell;
    }
  }

  function isInRange (date, allday, validator) {
    if (!isInRangeLeft(date, allday)) {
      return false;
    }
    if (!isInRangeRight(date, allday)) {
      return false;
    }
    var valid = (validator || Function.prototype).call(api, date.toDate());
    return valid !== false;
  }

  function isInRangeLeft (date, allday) {
    var min = !o.min ? false : (allday ? o.min.clone().startOf('day') : o.min);
    return !min || !date.isBefore(min);
  }

  function isInRangeRight (date, allday) {
    var max = !o.max ? false : (allday ? o.max.clone().endOf('day') : o.max);
    return !max || !date.isAfter(max);
  }

  function inRange (date) {
    if (o.min && date.isBefore(o.min)) {
      return inRange(o.min.clone());
    } else if (o.max && date.isAfter(o.max)) {
      return inRange(o.max.clone());
    }
    var value = date.clone().subtract(1, 'days');
    if (validateTowards(value, date, 'add')) {
      return inTimeRange(value);
    }
    value = date.clone();
    if (validateTowards(value, date, 'subtract')) {
      return inTimeRange(value);
    }
  }

  function inTimeRange (value) {
    var copy = value.clone().subtract(o.timeInterval, 'seconds');
    var times = Math.ceil(secondsInDay / o.timeInterval);
    var i;
    for (i = 0; i < times; i++) {
      copy.add(o.timeInterval, 'seconds');
      if (copy.date() > value.date()) {
        copy.subtract(1, 'days');
      }
      if (o.timeValidator.call(api, copy.toDate()) !== false) {
        return copy;
      }
    }
  }

  function validateTowards (value, date, op) {
    var valid = false;
    while (valid === false) {
      value[op](1, 'days');
      if (value.month() !== date.month()) {
        break;
      }
      valid = o.dateValidator.call(api, value.toDate());
    }
    return valid !== false;
  }

  function pickDay (e) {
    var target = e.target;
    if (classes.contains(target, o.styles.dayDisabled) || !classes.contains(target, o.styles.dayBodyElem)) {
      return;
    }
    var day = parseInt(text(target), 10);
    var prev = classes.contains(target, o.styles.dayPrevMonth);
    var next = classes.contains(target, o.styles.dayNextMonth);
    var offset = getMonthOffset(target) - getMonthOffset(lastDayElement);
    ref.add(offset, 'months');
    if (prev || next) {
      ref.add(prev ? -1 : 1, 'months');
    }
    selectDayElement(target);
    ref.date(day); // must run after setting the month
    setTime(ref, inRange(ref) || ref);
    refCal = ref.clone();
    if (o.autoClose === true) { hideConditionally(); }
    update();
  }

  function selectDayElement (node) {
    if (lastDayElement) {
      classes.remove(lastDayElement, o.styles.selectedDay);
    }
    if (node) {
      classes.add(node, o.styles.selectedDay);
    }
    lastDayElement = node;
  }

  function getMonthOffset (elem) {
    var offset;
    while (elem && elem.getAttribute) {
      offset = elem.getAttribute(monthOffsetAttribute);
      if (typeof offset === 'string') {
        return parseInt(offset, 10);
      }
      elem = elem.parentNode;
    }
    return 0;
  }

  function setTime (to, from) {
    to.hour(from.hour()).minute(from.minute()).second(from.second());
    return to;
  }

  function pickTime (e) {
    var target = e.target;
    if (!classes.contains(target, o.styles.timeOption)) {
      return;
    }
    var value = momentum.moment(text(target), o.timeFormat);
    setTime(ref, value);
    refCal = ref.clone();
    emitValues();
    updateTime();
    if ((!o.date && o.autoClose === true) || o.autoClose === 'time') {
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
}

module.exports = calendar;

},{"./classes":8,"./clone":9,"./defaults":11,"./dom":12,"./momentum":17,"./noop":18,"./parse":19,"./text":32,"contra.emitter":2,"crossvent":4}],8:[function(_dereq_,module,exports){
'use strict';

var trim = /^\s+|\s+$/g;
var whitespace = /\s+/;

function classes (node) {
  return node.className.replace(trim, '').split(whitespace);
}

function set (node, value) {
  node.className = value.join(' ');
}

function add (node, value) {
  var values = remove(node, value);
  values.push(value);
  set(node, values);
}

function remove (node, value) {
  var values = classes(node);
  var i = values.indexOf(value);
  if (i !== -1) {
    values.splice(i, 1);
    set(node, values);
  }
  return values;
}

function contains (node, value) {
  return classes(node).indexOf(value) !== -1;
}

module.exports = {
  add: add,
  remove: remove,
  contains: contains
};

},{}],9:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

// naïve implementation, specifically meant to clone `options` objects
function clone (thing) {
  var copy = {};
  var value;

  for (var key in thing) {
    value = thing[key];

    if (!value) {
      copy[key] = value;
    } else if (momentum.isMoment(value)) {
      copy[key] = value.clone();
    } else if (value._isStylesConfiguration) {
      copy[key] = clone(value);
    } else {
      copy[key] = value;
    }
  }

  return copy;
}

module.exports = clone;

},{"./momentum":17}],10:[function(_dereq_,module,exports){
'use strict';

var index = _dereq_('./index');
var input = _dereq_('./input');
var inline = _dereq_('./inline');
var isInput = _dereq_('./isInput');

function core (elem, options) {
  var cal;
  var existing = index.find(elem);
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

},{"./index":13,"./inline":14,"./input":15,"./isInput":16}],11:[function(_dereq_,module,exports){
'use strict';

var parse = _dereq_('./parse');
var isInput = _dereq_('./isInput');
var momentum = _dereq_('./momentum');

function defaults (options, cal) {
  var temp;
  var no;
  var o = options || {};
  if (o.autoHideOnClick === no) { o.autoHideOnClick = true; }
  if (o.autoHideOnBlur === no) { o.autoHideOnBlur = true; }
  if (o.autoClose === no) { o.autoClose = true; }
  if (o.appendTo === no) { o.appendTo = document.body; }
  if (o.appendTo === 'parent') {
    if (isInput(cal.associated)) {
      o.appendTo = cal.associated.parentNode;
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
  if (o.timeInterval === no) { o.timeInterval = 60 * 30; } // 30 minutes by default
  if (o.min && o.max) {
    if (o.max.isBefore(o.min)) {
      temp = o.max;
      o.max = o.min;
      o.min = temp;
    }
    if (o.date === true) {
      if (o.max.clone().subtract(1, 'days').isBefore(o.min)) {
        throw new Error('`max` must be at least one day after `min`');
      }
    } else if (o.timeInterval * 1000 - o.min % (o.timeInterval * 1000) > o.max - o.min) {
      throw new Error('`min` to `max` range must allow for at least one time option that matches `timeInterval`');
    }
  }
  if (o.dateValidator === no) { o.dateValidator = Function.prototype; }
  if (o.timeValidator === no) { o.timeValidator = Function.prototype; }
  if (o.timeFormat === no) { o.timeFormat = 'HH:mm'; }
  if (o.weekStart === no) { o.weekStart = momentum.moment().weekday(0).day(); }
  if (o.weekdayFormat === no) { o.weekdayFormat = 'min'; }
  if (o.weekdayFormat === 'long') {
    o.weekdayFormat = momentum.moment.weekdays();
  } else if (o.weekdayFormat === 'short') {
    o.weekdayFormat = momentum.moment.weekdaysShort();
  } else if (o.weekdayFormat === 'min') {
    o.weekdayFormat = momentum.moment.weekdaysMin();
  } else if (!Array.isArray(o.weekdayFormat) || o.weekdayFormat.length < 7) {
    throw new Error('`weekdays` must be `min`, `short`, or `long`');
  }
  if (o.monthsInCalendar === no) { o.monthsInCalendar = 1; }
  if (o.monthFormat === no) { o.monthFormat = 'MMMM YYYY'; }
  if (o.dayFormat === no) { o.dayFormat = 'DD'; }
  if (o.styles === no) { o.styles = {}; }
  if (o.monthsInputs === no){o.monthsInputs = 'button'}

  o.styles._isStylesConfiguration = true;

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
  if (styl.dayConcealed === no) { styl.dayConcealed = 'rd-day-concealed'; }
  if (styl.dayHead === no) { styl.dayHead = 'rd-days-head'; }
  if (styl.dayHeadElem === no) { styl.dayHeadElem = 'rd-day-head'; }
  if (styl.dayRow === no) { styl.dayRow = 'rd-days-row'; }
  if (styl.dayTable === no) { styl.dayTable = 'rd-days'; }
  if (styl.month === no) { styl.month = 'rd-month'; }
  if (styl.monthLabel === no) { styl.monthLabel = 'rd-month-label'; }
  if (styl.next === no) { styl.next = 'rd-next'; }
  if (styl.selectedDay === no) { styl.selectedDay = 'rd-day-selected'; }
  if (styl.selectedTime === no) { styl.selectedTime = 'rd-time-selected'; }
  if (styl.time === no) { styl.time = 'rd-time'; }
  if (styl.timeList === no) { styl.timeList = 'rd-time-list'; }
  if (styl.timeOption === no) { styl.timeOption = 'rd-time-option'; }

  return o;
}

module.exports = defaults;

},{"./isInput":16,"./momentum":17,"./parse":19}],12:[function(_dereq_,module,exports){
'use strict';

function dom (options) {
  var o = options || {};
  if (!o.type) { o.type = 'div'; }
  var elem = document.createElement(o.type);
  if (o.className) { elem.className = o.className; }
  if (o.text) { elem.innerText = elem.textContent = o.text; }
  if (o.attributes) {
    Object.keys(o.attributes).forEach(function(key) {
      elem.setAttribute(key, o.attributes[key]);
    });
  }
  if (o.parent) { o.parent.appendChild(elem); }
  return elem;
}

module.exports = dom;

},{}],13:[function(_dereq_,module,exports){
'use strict';
var no;
var ikey = 'data-rome-id';
var index = [];

function find (thing) { // can be a DOM element or a number
  if (typeof thing !== 'number' && thing && thing.getAttribute) {
    return find(thing.getAttribute(ikey));
  }
  var existing = index[thing];
  if (existing !== no) {
    return existing;
  }
  return null;
}

function assign (elem, instance) {
  elem.setAttribute(ikey, instance.id = index.push(instance) - 1);
}

module.exports = {
  find: find,
  assign: assign
};

},{}],14:[function(_dereq_,module,exports){
'use strict';

var calendar = _dereq_('./calendar');

function inline (elem, calendarOptions) {
  var o = calendarOptions || {};

  o.appendTo = elem;
  o.associated = elem;

  var cal = calendar(o);
  cal.show();
  return cal;
}

module.exports = inline;

},{"./calendar":7}],15:[function(_dereq_,module,exports){
'use strict';

var crossvent = _dereq_('crossvent');
var bullseye = _dereq_('./popup');
var throttle = _dereq_('./throttle');
var clone = _dereq_('./clone');
var defaults = _dereq_('./defaults');
var calendar = _dereq_('./calendar');
var momentum = _dereq_('./momentum');
var classes = _dereq_('./classes');

function inputCalendar (input, calendarOptions) {
  var o = calendarOptions || {};

  o.associated = input;

  var api = calendar(o);
  var throttledTakeInput = throttle(takeInput, 30);
  var ignoreInvalidation;
  var ignoreShow;
  var eye;

  init(o);

  return api;

  function init (initOptions) {
    o = defaults(initOptions || o, api);

    classes.add(api.container, o.styles.positioned);
    crossvent.add(api.container, 'mousedown', containerMouseDown);
    crossvent.add(api.container, 'click', containerClick);

    api.getDate = unrequire(api.getDate);
    api.getDateString = unrequire(api.getDateString);
    api.getMoment = unrequire(api.getMoment);

    if (o.initialValue) {
      input.value = o.initialValue.format(o.inputFormat);
    }

    eye = bullseye(api.container, input);
    api.on('data', updateInput);
    api.on('show', eye.refresh);

    eventListening();
    throttledTakeInput();
  }

  function destroy () {
    eventListening(true);
    eye.destroy();
    eye = null;
  }

  function eventListening (remove) {
    var op = remove ? 'remove' : 'add';
    crossvent[op](input, 'click', show);
    crossvent[op](input, 'touchend', show);
    crossvent[op](input, 'focusin', show);
    crossvent[op](input, 'change', throttledTakeInput);
    crossvent[op](input, 'keypress', throttledTakeInput);
    crossvent[op](input, 'keydown', throttledTakeInput);
    crossvent[op](input, 'input', throttledTakeInput);
    if (o.invalidate) { crossvent[op](input, 'blur', invalidateInput); }

    if (remove) {
      api.once('ready', init);
      api.off('destroyed', destroy);
    } else {
      api.off('ready', init);
      api.once('destroyed', destroy);
    }
  }

  function containerClick () {
    ignoreShow = true;
    input.focus();
    ignoreShow = false;
  }

  function containerMouseDown () {
    ignoreInvalidation = true;
    setTimeout(unignore, 0);

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
  }

  function takeInput () {
    var value = input.value.trim();
    if (isEmpty()) {
      return;
    }
    var date = momentum.moment(value, o.inputFormat, o.strictParse);
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
}

module.exports = inputCalendar;

},{"./calendar":7,"./classes":8,"./clone":9,"./defaults":11,"./momentum":17,"./popup":29,"./throttle":33,"crossvent":4}],16:[function(_dereq_,module,exports){
'use strict';

function isInput (elem) {
  return elem && elem.nodeName && elem.nodeName.toLowerCase() === 'input';
}

module.exports = isInput;

},{}],17:[function(_dereq_,module,exports){
'use strict';

function isMoment (value) {
  return value && Object.prototype.hasOwnProperty.call(value, '_isAMomentObject');
}

var api = {
  moment: null,
  isMoment: isMoment
};

module.exports = api;

},{}],18:[function(_dereq_,module,exports){
'use strict';

function noop () {}

module.exports = noop;

},{}],19:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

function raw (date, format) {
  if (typeof date === 'string') {
    return momentum.moment(date, format);
  }
  if (Object.prototype.toString.call(date) === '[object Date]') {
    return momentum.moment(date);
  }
  if (momentum.isMoment(date)) {
    return date.clone();
  }
}

function parse (date, format) {
  var m = raw(date, typeof format === 'string' ? format : null);
  return m && m.isValid() ? m : null;
}

module.exports = parse;

},{"./momentum":17}],20:[function(_dereq_,module,exports){
'use strict';

if (!Array.prototype.filter) {
  Array.prototype.filter = function (fn, ctx) {
    var f = [];
    this.forEach(function (v, i, t) {
      if (fn.call(ctx, v, i, t)) { f.push(v); }
    }, ctx);
    return f;
  };
}

},{}],21:[function(_dereq_,module,exports){
'use strict';

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fn, ctx) {
    if (this === void 0 || this === null || typeof fn !== 'function') {
      throw new TypeError();
    }
    var t = this;
    var len = t.length;
    for (var i = 0; i < len; i++) {
      if (i in t) { fn.call(ctx, t[i], i, t); }
    }
  };
}

},{}],22:[function(_dereq_,module,exports){
'use strict';

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (what, start) {
    if (this === undefined || this === null) {
      throw new TypeError();
    }
    var length = this.length;
    start = +start || 0;
    if (Math.abs(start) === Infinity) {
      start = 0;
    } else if (start < 0) {
      start += length;
      if (start < 0) { start = 0; }
    }
    for (; start < length; start++) {
      if (this[start] === what) {
        return start;
      }
    }
    return -1;
  };
}

},{}],23:[function(_dereq_,module,exports){
'use strict';

Array.isArray || (Array.isArray = function (a) {
  return '' + a !== a && Object.prototype.toString.call(a) === '[object Array]';
});

},{}],24:[function(_dereq_,module,exports){
'use strict';

if (!Array.prototype.map) {
  Array.prototype.map = function (fn, ctx) {
    var context, result, i;

    if (this == null) {
      throw new TypeError('this is null or not defined');
    }

    var source = Object(this);
    var len = source.length >>> 0;

    if (typeof fn !== 'function') {
      throw new TypeError(fn + ' is not a function');
    }

    if (arguments.length > 1) {
      context = ctx;
    }

    result = new Array(len);
    i = 0;

    while (i < len) {
      if (i in source) {
        result[i] = fn.call(context, source[i], i, source);
      }
      i++;
    }
    return result;
  };
}

},{}],25:[function(_dereq_,module,exports){
'use strict';

if (!Array.prototype.some) {
  Array.prototype.some = function (fn, ctx) {
    var context, i;

    if (this == null) {
      throw new TypeError('this is null or not defined');
    }

    var source = Object(this);
    var len = source.length >>> 0;

    if (typeof fn !== 'function') {
      throw new TypeError(fn + ' is not a function');
    }

    if (arguments.length > 1) {
      context = ctx;
    }

    i = 0;

    while (i < len) {
      if (i in source) {
        var test = fn.call(context, source[i], i, source);
        if (test) {
          return true;
        }
      }
      i++;
    }
    return false;
  };
}

},{}],26:[function(_dereq_,module,exports){
'use strict';

if (!Function.prototype.bind) {
  Function.prototype.bind = function (context) {
    if (typeof this !== 'function') {
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }
    var curried = Array.prototype.slice.call(arguments, 1);
    var original = this;
    var NoOp = function () {};
    var bound = function () {
      var ctx = this instanceof NoOp && context ? this : context;
      var args = curried.concat(Array.prototype.slice.call(arguments));
      return original.apply(ctx, args);
    };
    NoOp.prototype = this.prototype;
    bound.prototype = new NoOp();
    return bound;
  };
}

},{}],27:[function(_dereq_,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');
var dontEnums = [
  'toString',
  'toLocaleString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'constructor'
];
var dontEnumsLength = dontEnums.length;

if (!Object.keys) {
  Object.keys = function(obj) {
    if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
      throw new TypeError('Object.keys called on non-object');
    }

    var result = [], prop, i;

    for (prop in obj) {
      if (hasOwn.call(obj, prop)) {
        result.push(prop);
      }
    }

    if (hasDontEnumBug) {
      for (i = 0; i < dontEnumsLength; i++) {
        if (hasOwn.call(obj, dontEnums[i])) {
          result.push(dontEnums[i]);
        }
      }
    }
    return result;
  };
}

},{}],28:[function(_dereq_,module,exports){
'use strict';

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

},{}],29:[function(_dereq_,module,exports){
'use strict';

var crossvent = _dereq_('crossvent');
var throttle = _dereq_('./throttle');

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

},{"./throttle":33,"crossvent":4}],30:[function(_dereq_,module,exports){
'use strict';

// these are only required for IE < 9
// maybe move to IE-specific distro?
_dereq_('./polyfills/function.bind');
_dereq_('./polyfills/array.foreach');
_dereq_('./polyfills/array.map');
_dereq_('./polyfills/array.filter');
_dereq_('./polyfills/array.isarray');
_dereq_('./polyfills/array.indexof');
_dereq_('./polyfills/array.some');
_dereq_('./polyfills/string.trim');
_dereq_('./polyfills/object.keys');

var core = _dereq_('./core');
var index = _dereq_('./index');
var use = _dereq_('./use');

core.use = use.bind(core);
core.find = index.find;
core.val = _dereq_('./validators');

module.exports = core;

},{"./core":10,"./index":13,"./polyfills/array.filter":20,"./polyfills/array.foreach":21,"./polyfills/array.indexof":22,"./polyfills/array.isarray":23,"./polyfills/array.map":24,"./polyfills/array.some":25,"./polyfills/function.bind":26,"./polyfills/object.keys":27,"./polyfills/string.trim":28,"./use":34,"./validators":35}],31:[function(_dereq_,module,exports){
'use strict';

var moment = _dereq_('moment');
var rome = _dereq_('./rome');

rome.use(moment);

module.exports = rome;

},{"./rome":30,"moment":5}],32:[function(_dereq_,module,exports){
'use strict';

function text (elem, value) {
  if (arguments.length === 2) {
    elem.innerText = elem.textContent = value;
  }
  return elem.innerText || elem.textContent;
}

module.exports = text;

},{}],33:[function(_dereq_,module,exports){
'use strict';

module.exports = function throttle (fn, boundary) {
  var last = -Infinity;
  var timer;
  return function bounced () {
    if (timer) {
      return;
    }
    unbound();

    function unbound () {
      clearTimeout(timer);
      timer = null;
      var next = last + boundary;
      var now = +new Date();
      if (now > next) {
        last = now;
        fn.apply(this, arguments);
      } else {
        timer = setTimeout(unbound, next - now);
      }
    }
  };
};

},{}],34:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

function use (moment) {
  this.moment = momentum.moment = moment;
}

module.exports = use;

},{"./momentum":17}],35:[function(_dereq_,module,exports){
'use strict';

var index = _dereq_('./index');
var parse = _dereq_('./parse');
var association = _dereq_('./association');

function compareBuilder (compare) {
  return function factory (value) {
    var fixed = parse(value);

    return function validate (date) {
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

    return function validate (date) {
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

},{"./association":6,"./index":13,"./parse":19}]},{},[31])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxEZXZlbG9wbWVudFxcUHJvdG90eXBlc1xccm9tZSBkYXRlIHBpY2tlciAyXFxyb21lXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvbm9kZV9tb2R1bGVzL2NvbnRyYS5lbWl0dGVyL2luZGV4LmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9ub2RlX21vZHVsZXMvY29udHJhLmVtaXR0ZXIvc3JjL2NvbnRyYS5lbWl0dGVyLmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9ub2RlX21vZHVsZXMvY3Jvc3N2ZW50L3NyYy9jcm9zc3ZlbnQuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL25vZGVfbW9kdWxlcy9tb21lbnQvbW9tZW50LmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvYXNzb2NpYXRpb24uanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9jYWxlbmRhci5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL2NsYXNzZXMuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9jbG9uZS5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL2NvcmUuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9kZWZhdWx0cy5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL2RvbS5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL2luZGV4LmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvaW5saW5lLmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvaW5wdXQuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9pc0lucHV0LmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvbW9tZW50dW0uanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9ub29wLmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvcGFyc2UuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9wb2x5ZmlsbHMvYXJyYXkuZmlsdGVyLmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvcG9seWZpbGxzL2FycmF5LmZvcmVhY2guanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9wb2x5ZmlsbHMvYXJyYXkuaW5kZXhvZi5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL3BvbHlmaWxscy9hcnJheS5pc2FycmF5LmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvcG9seWZpbGxzL2FycmF5Lm1hcC5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL3BvbHlmaWxscy9hcnJheS5zb21lLmpzIiwiYzovRGV2ZWxvcG1lbnQvUHJvdG90eXBlcy9yb21lIGRhdGUgcGlja2VyIDIvcm9tZS9zcmMvcG9seWZpbGxzL2Z1bmN0aW9uLmJpbmQuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9wb2x5ZmlsbHMvb2JqZWN0LmtleXMuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9wb2x5ZmlsbHMvc3RyaW5nLnRyaW0uanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9wb3B1cC5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL3JvbWUuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy9yb21lLm1vbWVudC5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL3RleHQuanMiLCJjOi9EZXZlbG9wbWVudC9Qcm90b3R5cGVzL3JvbWUgZGF0ZSBwaWNrZXIgMi9yb21lL3NyYy90aHJvdHRsZS5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL3VzZS5qcyIsImM6L0RldmVsb3BtZW50L1Byb3RvdHlwZXMvcm9tZSBkYXRlIHBpY2tlciAyL3JvbWUvc3JjL3ZhbGlkYXRvcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMXlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDanBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL2NvbnRyYS5lbWl0dGVyLmpzJyk7XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuKGZ1bmN0aW9uIChyb290LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciB1bmRlZiA9ICcnICsgdW5kZWZpbmVkO1xuICBmdW5jdGlvbiBhdG9hIChhLCBuKSB7IHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhLCBuKTsgfVxuICBmdW5jdGlvbiBkZWJvdW5jZSAoZm4sIGFyZ3MsIGN0eCkgeyBpZiAoIWZuKSB7IHJldHVybjsgfSB0aWNrKGZ1bmN0aW9uIHJ1biAoKSB7IGZuLmFwcGx5KGN0eCB8fCBudWxsLCBhcmdzIHx8IFtdKTsgfSk7IH1cblxuICAvLyBjcm9zcy1wbGF0Zm9ybSB0aWNrZXJcbiAgdmFyIHNpID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJywgdGljaztcbiAgaWYgKHNpKSB7XG4gICAgdGljayA9IGZ1bmN0aW9uIChmbikgeyBzZXRJbW1lZGlhdGUoZm4pOyB9O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSB1bmRlZiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgdGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gIH0gZWxzZSB7XG4gICAgdGljayA9IGZ1bmN0aW9uIChmbikgeyBzZXRUaW1lb3V0KGZuLCAwKTsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9lbWl0dGVyICh0aGluZywgb3B0aW9ucykge1xuICAgIHZhciBvcHRzID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgZXZ0ID0ge307XG4gICAgaWYgKHRoaW5nID09PSB1bmRlZmluZWQpIHsgdGhpbmcgPSB7fTsgfVxuICAgIHRoaW5nLm9uID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgICBpZiAoIWV2dFt0eXBlXSkge1xuICAgICAgICBldnRbdHlwZV0gPSBbZm5dO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXZ0W3R5cGVdLnB1c2goZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gICAgdGhpbmcub25jZSA9IGZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgICAgZm4uX29uY2UgPSB0cnVlOyAvLyB0aGluZy5vZmYoZm4pIHN0aWxsIHdvcmtzIVxuICAgICAgdGhpbmcub24odHlwZSwgZm4pO1xuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gICAgdGhpbmcub2ZmID0gZnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICBpZiAoYyA9PT0gMSkge1xuICAgICAgICBkZWxldGUgZXZ0W3R5cGVdO1xuICAgICAgfSBlbHNlIGlmIChjID09PSAwKSB7XG4gICAgICAgIGV2dCA9IHt9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGV0ID0gZXZ0W3R5cGVdO1xuICAgICAgICBpZiAoIWV0KSB7IHJldHVybiB0aGluZzsgfVxuICAgICAgICBldC5zcGxpY2UoZXQuaW5kZXhPZihmbiksIDEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaW5nO1xuICAgIH07XG4gICAgdGhpbmcuZW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXRvYShhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaW5nLmVtaXR0ZXJTbmFwc2hvdChhcmdzLnNoaWZ0KCkpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gICAgdGhpbmcuZW1pdHRlclNuYXBzaG90ID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgIHZhciBldCA9IChldnRbdHlwZV0gfHwgW10pLnNsaWNlKDApO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhdG9hKGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjdHggPSB0aGlzIHx8IHRoaW5nO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJyAmJiBvcHRzLnRocm93cyAhPT0gZmFsc2UgJiYgIWV0Lmxlbmd0aCkgeyB0aHJvdyBhcmdzLmxlbmd0aCA9PT0gMSA/IGFyZ3NbMF0gOiBhcmdzOyB9XG4gICAgICAgIGV2dFt0eXBlXSA9IGV0LmZpbHRlcihmdW5jdGlvbiBlbWl0dGVyIChsaXN0ZW4pIHtcbiAgICAgICAgICBpZiAob3B0cy5hc3luYykgeyBkZWJvdW5jZShsaXN0ZW4sIGFyZ3MsIGN0eCk7IH0gZWxzZSB7IGxpc3Rlbi5hcHBseShjdHgsIGFyZ3MpOyB9XG4gICAgICAgICAgcmV0dXJuICFsaXN0ZW4uX29uY2U7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpbmc7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpbmc7XG4gIH1cblxuICAvLyBjcm9zcy1wbGF0Zm9ybSBleHBvcnRcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IHVuZGVmICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBfZW1pdHRlcjtcbiAgfSBlbHNlIHtcbiAgICByb290LmNvbnRyYSA9IHJvb3QuY29udHJhIHx8IHt9O1xuICAgIHJvb3QuY29udHJhLmVtaXR0ZXIgPSBfZW1pdHRlcjtcbiAgfVxufSkodGhpcyk7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiWmJpN2diXCIpKSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCB3cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHVud3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gZmFicmljYXRlRXZlbnQgKGVsLCB0eXBlKSB7XG4gIHZhciBlO1xuICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBlLmluaXRFdmVudCh0eXBlLCB0cnVlLCB0cnVlKTtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2UgaWYgKGRvYy5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICBlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJGYWN0b3J5IChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIgKG9yaWdpbmFsRXZlbnQpIHtcbiAgICB2YXIgZSA9IG9yaWdpbmFsRXZlbnQgfHwgZ2xvYmFsLmV2ZW50O1xuICAgIGUudGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgIGUucHJldmVudERlZmF1bHQgID0gZS5wcmV2ZW50RGVmYXVsdCAgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLy8hIG1vbWVudC5qc1xuLy8hIHZlcnNpb24gOiAyLjguM1xuLy8hIGF1dGhvcnMgOiBUaW0gV29vZCwgSXNrcmVuIENoZXJuZXYsIE1vbWVudC5qcyBjb250cmlidXRvcnNcbi8vISBsaWNlbnNlIDogTUlUXG4vLyEgbW9tZW50anMuY29tXG5cbihmdW5jdGlvbiAodW5kZWZpbmVkKSB7XG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdGFudHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgbW9tZW50LFxuICAgICAgICBWRVJTSU9OID0gJzIuOC4zJyxcbiAgICAgICAgLy8gdGhlIGdsb2JhbC1zY29wZSB0aGlzIGlzIE5PVCB0aGUgZ2xvYmFsIG9iamVjdCBpbiBOb2RlLmpzXG4gICAgICAgIGdsb2JhbFNjb3BlID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzLFxuICAgICAgICBvbGRHbG9iYWxNb21lbnQsXG4gICAgICAgIHJvdW5kID0gTWF0aC5yb3VuZCxcbiAgICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgICBpLFxuXG4gICAgICAgIFlFQVIgPSAwLFxuICAgICAgICBNT05USCA9IDEsXG4gICAgICAgIERBVEUgPSAyLFxuICAgICAgICBIT1VSID0gMyxcbiAgICAgICAgTUlOVVRFID0gNCxcbiAgICAgICAgU0VDT05EID0gNSxcbiAgICAgICAgTUlMTElTRUNPTkQgPSA2LFxuXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxvY2FsZSBjb25maWcgZmlsZXNcbiAgICAgICAgbG9jYWxlcyA9IHt9LFxuXG4gICAgICAgIC8vIGV4dHJhIG1vbWVudCBpbnRlcm5hbCBwcm9wZXJ0aWVzIChwbHVnaW5zIHJlZ2lzdGVyIHByb3BzIGhlcmUpXG4gICAgICAgIG1vbWVudFByb3BlcnRpZXMgPSBbXSxcblxuICAgICAgICAvLyBjaGVjayBmb3Igbm9kZUpTXG4gICAgICAgIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyksXG5cbiAgICAgICAgLy8gQVNQLk5FVCBqc29uIGRhdGUgZm9ybWF0IHJlZ2V4XG4gICAgICAgIGFzcE5ldEpzb25SZWdleCA9IC9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2ksXG4gICAgICAgIGFzcE5ldFRpbWVTcGFuSnNvblJlZ2V4ID0gLyhcXC0pPyg/OihcXGQqKVxcLik/KFxcZCspXFw6KFxcZCspKD86XFw6KFxcZCspXFwuPyhcXGR7M30pPyk/LyxcblxuICAgICAgICAvLyBmcm9tIGh0dHA6Ly9kb2NzLmNsb3N1cmUtbGlicmFyeS5nb29nbGVjb2RlLmNvbS9naXQvY2xvc3VyZV9nb29nX2RhdGVfZGF0ZS5qcy5zb3VyY2UuaHRtbFxuICAgICAgICAvLyBzb21ld2hhdCBtb3JlIGluIGxpbmUgd2l0aCA0LjQuMy4yIDIwMDQgc3BlYywgYnV0IGFsbG93cyBkZWNpbWFsIGFueXdoZXJlXG4gICAgICAgIGlzb0R1cmF0aW9uUmVnZXggPSAvXigtKT9QKD86KD86KFswLTksLl0qKVkpPyg/OihbMC05LC5dKilNKT8oPzooWzAtOSwuXSopRCk/KD86VCg/OihbMC05LC5dKilIKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKVMpPyk/fChbMC05LC5dKilXKSQvLFxuXG4gICAgICAgIC8vIGZvcm1hdCB0b2tlbnNcbiAgICAgICAgZm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhNb3xNTT9NP00/fERvfERERG98REQ/RD9EP3xkZGQ/ZD98ZG8/fHdbb3x3XT98V1tvfFddP3xRfFlZWVlZWXxZWVlZWXxZWVlZfFlZfGdnKGdnZz8pP3xHRyhHR0c/KT98ZXxFfGF8QXxoaD98SEg/fG1tP3xzcz98U3sxLDR9fFh8eno/fFpaP3wuKS9nLFxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFR8TEw/TD9MP3xsezEsNH0pL2csXG5cbiAgICAgICAgLy8gcGFyc2luZyB0b2tlbiByZWdleGVzXG4gICAgICAgIHBhcnNlVG9rZW5PbmVPclR3b0RpZ2l0cyA9IC9cXGRcXGQ/LywgLy8gMCAtIDk5XG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb1RocmVlRGlnaXRzID0gL1xcZHsxLDN9LywgLy8gMCAtIDk5OVxuICAgICAgICBwYXJzZVRva2VuT25lVG9Gb3VyRGlnaXRzID0gL1xcZHsxLDR9LywgLy8gMCAtIDk5OTlcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvU2l4RGlnaXRzID0gL1srXFwtXT9cXGR7MSw2fS8sIC8vIC05OTksOTk5IC0gOTk5LDk5OVxuICAgICAgICBwYXJzZVRva2VuRGlnaXRzID0gL1xcZCsvLCAvLyBub256ZXJvIG51bWJlciBvZiBkaWdpdHNcbiAgICAgICAgcGFyc2VUb2tlbldvcmQgPSAvWzAtOV0qWydhLXpcXHUwMEEwLVxcdTA1RkZcXHUwNzAwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdK3xbXFx1MDYwMC1cXHUwNkZGXFwvXSsoXFxzKj9bXFx1MDYwMC1cXHUwNkZGXSspezEsMn0vaSwgLy8gYW55IHdvcmQgKG9yIHR3bykgY2hhcmFjdGVycyBvciBudW1iZXJzIGluY2x1ZGluZyB0d28vdGhyZWUgd29yZCBtb250aCBpbiBhcmFiaWMuXG4gICAgICAgIHBhcnNlVG9rZW5UaW1lem9uZSA9IC9afFtcXCtcXC1dXFxkXFxkOj9cXGRcXGQvZ2ksIC8vICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxuICAgICAgICBwYXJzZVRva2VuVCA9IC9UL2ksIC8vIFQgKElTTyBzZXBhcmF0b3IpXG4gICAgICAgIHBhcnNlVG9rZW5UaW1lc3RhbXBNcyA9IC9bXFwrXFwtXT9cXGQrKFxcLlxcZHsxLDN9KT8vLCAvLyAxMjM0NTY3ODkgMTIzNDU2Nzg5LjEyM1xuICAgICAgICBwYXJzZVRva2VuT3JkaW5hbCA9IC9cXGR7MSwyfS8sXG5cbiAgICAgICAgLy9zdHJpY3QgcGFyc2luZyByZWdleGVzXG4gICAgICAgIHBhcnNlVG9rZW5PbmVEaWdpdCA9IC9cXGQvLCAvLyAwIC0gOVxuICAgICAgICBwYXJzZVRva2VuVHdvRGlnaXRzID0gL1xcZFxcZC8sIC8vIDAwIC0gOTlcbiAgICAgICAgcGFyc2VUb2tlblRocmVlRGlnaXRzID0gL1xcZHszfS8sIC8vIDAwMCAtIDk5OVxuICAgICAgICBwYXJzZVRva2VuRm91ckRpZ2l0cyA9IC9cXGR7NH0vLCAvLyAwMDAwIC0gOTk5OVxuICAgICAgICBwYXJzZVRva2VuU2l4RGlnaXRzID0gL1srLV0/XFxkezZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XG4gICAgICAgIHBhcnNlVG9rZW5TaWduZWROdW1iZXIgPSAvWystXT9cXGQrLywgLy8gLWluZiAtIGluZlxuXG4gICAgICAgIC8vIGlzbyA4NjAxIHJlZ2V4XG4gICAgICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxuICAgICAgICBpc29SZWdleCA9IC9eXFxzKig/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzooXFxkXFxkLVxcZFxcZCl8KFdcXGRcXGQkKXwoV1xcZFxcZC1cXGQpfChcXGRcXGRcXGQpKSgoVHwgKShcXGRcXGQoOlxcZFxcZCg6XFxkXFxkKFxcLlxcZCspPyk/KT8pPyhbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC8sXG5cbiAgICAgICAgaXNvRm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJyxcblxuICAgICAgICBpc29EYXRlcyA9IFtcbiAgICAgICAgICAgIFsnWVlZWVlZLU1NLUREJywgL1srLV1cXGR7Nn0tXFxkezJ9LVxcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGR7Mn0tXFxkezJ9L10sXG4gICAgICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZHsyfS1cXGQvXSxcbiAgICAgICAgICAgIFsnR0dHRy1bV11XVycsIC9cXGR7NH0tV1xcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLURERCcsIC9cXGR7NH0tXFxkezN9L11cbiAgICAgICAgXSxcblxuICAgICAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG4gICAgICAgIGlzb1RpbWVzID0gW1xuICAgICAgICAgICAgWydISDptbTpzcy5TU1NTJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgICAgICAgICBbJ0hIOm1tOnNzJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGQvXSxcbiAgICAgICAgICAgIFsnSEg6bW0nLCAvKFR8IClcXGRcXGQ6XFxkXFxkL10sXG4gICAgICAgICAgICBbJ0hIJywgLyhUfCApXFxkXFxkL11cbiAgICAgICAgXSxcblxuICAgICAgICAvLyB0aW1lem9uZSBjaHVua2VyICcrMTA6MDAnID4gWycxMCcsICcwMCddIG9yICctMTUzMCcgPiBbJy0xNScsICczMCddXG4gICAgICAgIHBhcnNlVGltZXpvbmVDaHVua2VyID0gLyhbXFwrXFwtXXxcXGRcXGQpL2dpLFxuXG4gICAgICAgIC8vIGdldHRlciBhbmQgc2V0dGVyIG5hbWVzXG4gICAgICAgIHByb3h5R2V0dGVyc0FuZFNldHRlcnMgPSAnRGF0ZXxIb3Vyc3xNaW51dGVzfFNlY29uZHN8TWlsbGlzZWNvbmRzJy5zcGxpdCgnfCcpLFxuICAgICAgICB1bml0TWlsbGlzZWNvbmRGYWN0b3JzID0ge1xuICAgICAgICAgICAgJ01pbGxpc2Vjb25kcycgOiAxLFxuICAgICAgICAgICAgJ1NlY29uZHMnIDogMWUzLFxuICAgICAgICAgICAgJ01pbnV0ZXMnIDogNmU0LFxuICAgICAgICAgICAgJ0hvdXJzJyA6IDM2ZTUsXG4gICAgICAgICAgICAnRGF5cycgOiA4NjRlNSxcbiAgICAgICAgICAgICdNb250aHMnIDogMjU5MmU2LFxuICAgICAgICAgICAgJ1llYXJzJyA6IDMxNTM2ZTZcbiAgICAgICAgfSxcblxuICAgICAgICB1bml0QWxpYXNlcyA9IHtcbiAgICAgICAgICAgIG1zIDogJ21pbGxpc2Vjb25kJyxcbiAgICAgICAgICAgIHMgOiAnc2Vjb25kJyxcbiAgICAgICAgICAgIG0gOiAnbWludXRlJyxcbiAgICAgICAgICAgIGggOiAnaG91cicsXG4gICAgICAgICAgICBkIDogJ2RheScsXG4gICAgICAgICAgICBEIDogJ2RhdGUnLFxuICAgICAgICAgICAgdyA6ICd3ZWVrJyxcbiAgICAgICAgICAgIFcgOiAnaXNvV2VlaycsXG4gICAgICAgICAgICBNIDogJ21vbnRoJyxcbiAgICAgICAgICAgIFEgOiAncXVhcnRlcicsXG4gICAgICAgICAgICB5IDogJ3llYXInLFxuICAgICAgICAgICAgREREIDogJ2RheU9mWWVhcicsXG4gICAgICAgICAgICBlIDogJ3dlZWtkYXknLFxuICAgICAgICAgICAgRSA6ICdpc29XZWVrZGF5JyxcbiAgICAgICAgICAgIGdnOiAnd2Vla1llYXInLFxuICAgICAgICAgICAgR0c6ICdpc29XZWVrWWVhcidcbiAgICAgICAgfSxcblxuICAgICAgICBjYW1lbEZ1bmN0aW9ucyA9IHtcbiAgICAgICAgICAgIGRheW9meWVhciA6ICdkYXlPZlllYXInLFxuICAgICAgICAgICAgaXNvd2Vla2RheSA6ICdpc29XZWVrZGF5JyxcbiAgICAgICAgICAgIGlzb3dlZWsgOiAnaXNvV2VlaycsXG4gICAgICAgICAgICB3ZWVreWVhciA6ICd3ZWVrWWVhcicsXG4gICAgICAgICAgICBpc293ZWVreWVhciA6ICdpc29XZWVrWWVhcidcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBmb3JtYXQgZnVuY3Rpb24gc3RyaW5nc1xuICAgICAgICBmb3JtYXRGdW5jdGlvbnMgPSB7fSxcblxuICAgICAgICAvLyBkZWZhdWx0IHJlbGF0aXZlIHRpbWUgdGhyZXNob2xkc1xuICAgICAgICByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzID0ge1xuICAgICAgICAgICAgczogNDUsICAvLyBzZWNvbmRzIHRvIG1pbnV0ZVxuICAgICAgICAgICAgbTogNDUsICAvLyBtaW51dGVzIHRvIGhvdXJcbiAgICAgICAgICAgIGg6IDIyLCAgLy8gaG91cnMgdG8gZGF5XG4gICAgICAgICAgICBkOiAyNiwgIC8vIGRheXMgdG8gbW9udGhcbiAgICAgICAgICAgIE06IDExICAgLy8gbW9udGhzIHRvIHllYXJcbiAgICAgICAgfSxcblxuICAgICAgICAvLyB0b2tlbnMgdG8gb3JkaW5hbGl6ZSBhbmQgcGFkXG4gICAgICAgIG9yZGluYWxpemVUb2tlbnMgPSAnREREIHcgVyBNIEQgZCcuc3BsaXQoJyAnKSxcbiAgICAgICAgcGFkZGVkVG9rZW5zID0gJ00gRCBIIGggbSBzIHcgVycuc3BsaXQoJyAnKSxcblxuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHtcbiAgICAgICAgICAgIE0gICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9udGgoKSArIDE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgTU1NICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzU2hvcnQodGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBNTU1NIDogZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5tb250aHModGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBEICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBEREQgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRheU9mWWVhcigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGQgICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGQgICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXNNaW4odGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZGQgIDogZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5c1Nob3J0KHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGRkZCA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3ICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndlZWsoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBXICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzb1dlZWsoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBZWSAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCkgJSAxMDAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFlZWVkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVlZWVkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLnllYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVlZWVlZIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy55ZWFyKCksIHNpZ24gPSB5ID49IDAgPyAnKycgOiAnLSc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZ24gKyBsZWZ0WmVyb0ZpbGwoTWF0aC5hYnMoeSksIDYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCkgJSAxMDAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnZ2cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLndlZWtZZWFyKCksIDQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdnZ2dnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpLCA1KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHRyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpICUgMTAwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHR0dHIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5pc29XZWVrWWVhcigpLCA0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHR0dHRyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53ZWVrZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc29XZWVrZGF5KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgdHJ1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgZmFsc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEggICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaG91cnMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhvdXJzKCkgJSAxMiB8fCAxMjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1pbnV0ZXMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlY29uZHMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b0ludCh0aGlzLm1pbGxpc2Vjb25kcygpIC8gMTAwKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTUyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodG9JbnQodGhpcy5taWxsaXNlY29uZHMoKSAvIDEwKSwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgU1NTICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMubWlsbGlzZWNvbmRzKCksIDMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNTU1MgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLm1pbGxpc2Vjb25kcygpLCAzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBaICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhID0gLXRoaXMuem9uZSgpLFxuICAgICAgICAgICAgICAgICAgICBiID0gJysnO1xuICAgICAgICAgICAgICAgIGlmIChhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhID0gLWE7XG4gICAgICAgICAgICAgICAgICAgIGIgPSAnLSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBiICsgbGVmdFplcm9GaWxsKHRvSW50KGEgLyA2MCksIDIpICsgJzonICsgbGVmdFplcm9GaWxsKHRvSW50KGEpICUgNjAsIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFpaICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSAtdGhpcy56b25lKCksXG4gICAgICAgICAgICAgICAgICAgIGIgPSAnKyc7XG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcbiAgICAgICAgICAgICAgICAgICAgYiA9ICctJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSAvIDYwKSwgMikgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSkgJSA2MCwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy56b25lQWJicigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHp6IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmVOYW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWCAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51bml4KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWFydGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVwcmVjYXRpb25zID0ge30sXG5cbiAgICAgICAgbGlzdHMgPSBbJ21vbnRocycsICdtb250aHNTaG9ydCcsICd3ZWVrZGF5cycsICd3ZWVrZGF5c1Nob3J0JywgJ3dlZWtkYXlzTWluJ107XG5cbiAgICAvLyBQaWNrIHRoZSBmaXJzdCBkZWZpbmVkIG9mIHR3byBvciB0aHJlZSBhcmd1bWVudHMuIGRmbCBjb21lcyBmcm9tXG4gICAgLy8gZGVmYXVsdC5cbiAgICBmdW5jdGlvbiBkZmwoYSwgYiwgYykge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMjogcmV0dXJuIGEgIT0gbnVsbCA/IGEgOiBiO1xuICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gYSAhPSBudWxsID8gYSA6IGIgIT0gbnVsbCA/IGIgOiBjO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdJbXBsZW1lbnQgbWUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc093blByb3AoYSwgYikge1xuICAgICAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChhLCBiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWZhdWx0UGFyc2luZ0ZsYWdzKCkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIGRlZXAgY2xvbmUgdGhpcyBvYmplY3QsIGFuZCBlczUgc3RhbmRhcmQgaXMgbm90IHZlcnlcbiAgICAgICAgLy8gaGVscGZ1bC5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVtcHR5IDogZmFsc2UsXG4gICAgICAgICAgICB1bnVzZWRUb2tlbnMgOiBbXSxcbiAgICAgICAgICAgIHVudXNlZElucHV0IDogW10sXG4gICAgICAgICAgICBvdmVyZmxvdyA6IC0yLFxuICAgICAgICAgICAgY2hhcnNMZWZ0T3ZlciA6IDAsXG4gICAgICAgICAgICBudWxsSW5wdXQgOiBmYWxzZSxcbiAgICAgICAgICAgIGludmFsaWRNb250aCA6IG51bGwsXG4gICAgICAgICAgICBpbnZhbGlkRm9ybWF0IDogZmFsc2UsXG4gICAgICAgICAgICB1c2VySW52YWxpZGF0ZWQgOiBmYWxzZSxcbiAgICAgICAgICAgIGlzbzogZmFsc2VcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmludE1zZyhtc2cpIHtcbiAgICAgICAgaWYgKG1vbWVudC5zdXBwcmVzc0RlcHJlY2F0aW9uV2FybmluZ3MgPT09IGZhbHNlICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdEZXByZWNhdGlvbiB3YXJuaW5nOiAnICsgbXNnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlcHJlY2F0ZShtc2csIGZuKSB7XG4gICAgICAgIHZhciBmaXJzdFRpbWUgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZXh0ZW5kKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWUpIHtcbiAgICAgICAgICAgICAgICBwcmludE1zZyhtc2cpO1xuICAgICAgICAgICAgICAgIGZpcnN0VGltZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGZuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXByZWNhdGVTaW1wbGUobmFtZSwgbXNnKSB7XG4gICAgICAgIGlmICghZGVwcmVjYXRpb25zW25hbWVdKSB7XG4gICAgICAgICAgICBwcmludE1zZyhtc2cpO1xuICAgICAgICAgICAgZGVwcmVjYXRpb25zW25hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhZFRva2VuKGZ1bmMsIGNvdW50KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbChmdW5jLmNhbGwodGhpcywgYSksIGNvdW50KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb3JkaW5hbGl6ZVRva2VuKGZ1bmMsIHBlcmlvZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5vcmRpbmFsKGZ1bmMuY2FsbCh0aGlzLCBhKSwgcGVyaW9kKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB3aGlsZSAob3JkaW5hbGl6ZVRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgaSA9IG9yZGluYWxpemVUb2tlbnMucG9wKCk7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW2kgKyAnbyddID0gb3JkaW5hbGl6ZVRva2VuKGZvcm1hdFRva2VuRnVuY3Rpb25zW2ldLCBpKTtcbiAgICB9XG4gICAgd2hpbGUgKHBhZGRlZFRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgaSA9IHBhZGRlZFRva2Vucy5wb3AoKTtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbaSArIGldID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnNbaV0sIDIpO1xuICAgIH1cbiAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucy5EREREID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnMuRERELCAzKTtcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdHJ1Y3RvcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBMb2NhbGUoKSB7XG4gICAgfVxuXG4gICAgLy8gTW9tZW50IHByb3RvdHlwZSBvYmplY3RcbiAgICBmdW5jdGlvbiBNb21lbnQoY29uZmlnLCBza2lwT3ZlcmZsb3cpIHtcbiAgICAgICAgaWYgKHNraXBPdmVyZmxvdyAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNoZWNrT3ZlcmZsb3coY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICBjb3B5Q29uZmlnKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIHRoaXMuX2QgPSBuZXcgRGF0ZSgrY29uZmlnLl9kKTtcbiAgICB9XG5cbiAgICAvLyBEdXJhdGlvbiBDb25zdHJ1Y3RvclxuICAgIGZ1bmN0aW9uIER1cmF0aW9uKGR1cmF0aW9uKSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhkdXJhdGlvbiksXG4gICAgICAgICAgICB5ZWFycyA9IG5vcm1hbGl6ZWRJbnB1dC55ZWFyIHx8IDAsXG4gICAgICAgICAgICBxdWFydGVycyA9IG5vcm1hbGl6ZWRJbnB1dC5xdWFydGVyIHx8IDAsXG4gICAgICAgICAgICBtb250aHMgPSBub3JtYWxpemVkSW5wdXQubW9udGggfHwgMCxcbiAgICAgICAgICAgIHdlZWtzID0gbm9ybWFsaXplZElucHV0LndlZWsgfHwgMCxcbiAgICAgICAgICAgIGRheXMgPSBub3JtYWxpemVkSW5wdXQuZGF5IHx8IDAsXG4gICAgICAgICAgICBob3VycyA9IG5vcm1hbGl6ZWRJbnB1dC5ob3VyIHx8IDAsXG4gICAgICAgICAgICBtaW51dGVzID0gbm9ybWFsaXplZElucHV0Lm1pbnV0ZSB8fCAwLFxuICAgICAgICAgICAgc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5zZWNvbmQgfHwgMCxcbiAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZCB8fCAwO1xuXG4gICAgICAgIC8vIHJlcHJlc2VudGF0aW9uIGZvciBkYXRlQWRkUmVtb3ZlXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9ICttaWxsaXNlY29uZHMgK1xuICAgICAgICAgICAgc2Vjb25kcyAqIDFlMyArIC8vIDEwMDBcbiAgICAgICAgICAgIG1pbnV0ZXMgKiA2ZTQgKyAvLyAxMDAwICogNjBcbiAgICAgICAgICAgIGhvdXJzICogMzZlNTsgLy8gMTAwMCAqIDYwICogNjBcbiAgICAgICAgLy8gQmVjYXVzZSBvZiBkYXRlQWRkUmVtb3ZlIHRyZWF0cyAyNCBob3VycyBhcyBkaWZmZXJlbnQgZnJvbSBhXG4gICAgICAgIC8vIGRheSB3aGVuIHdvcmtpbmcgYXJvdW5kIERTVCwgd2UgbmVlZCB0byBzdG9yZSB0aGVtIHNlcGFyYXRlbHlcbiAgICAgICAgdGhpcy5fZGF5cyA9ICtkYXlzICtcbiAgICAgICAgICAgIHdlZWtzICogNztcbiAgICAgICAgLy8gSXQgaXMgaW1wb3NzaWJsZSB0cmFuc2xhdGUgbW9udGhzIGludG8gZGF5cyB3aXRob3V0IGtub3dpbmdcbiAgICAgICAgLy8gd2hpY2ggbW9udGhzIHlvdSBhcmUgYXJlIHRhbGtpbmcgYWJvdXQsIHNvIHdlIGhhdmUgdG8gc3RvcmVcbiAgICAgICAgLy8gaXQgc2VwYXJhdGVseS5cbiAgICAgICAgdGhpcy5fbW9udGhzID0gK21vbnRocyArXG4gICAgICAgICAgICBxdWFydGVycyAqIDMgK1xuICAgICAgICAgICAgeWVhcnMgKiAxMjtcblxuICAgICAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICAgICAgdGhpcy5fbG9jYWxlID0gbW9tZW50LmxvY2FsZURhdGEoKTtcblxuICAgICAgICB0aGlzLl9idWJibGUoKTtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgICAgIGZvciAodmFyIGkgaW4gYikge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3AoYiwgaSkpIHtcbiAgICAgICAgICAgICAgICBhW2ldID0gYltpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsICd0b1N0cmluZycpKSB7XG4gICAgICAgICAgICBhLnRvU3RyaW5nID0gYi50b1N0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsICd2YWx1ZU9mJykpIHtcbiAgICAgICAgICAgIGEudmFsdWVPZiA9IGIudmFsdWVPZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvcHlDb25maWcodG8sIGZyb20pIHtcbiAgICAgICAgdmFyIGksIHByb3AsIHZhbDtcblxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2lzQU1vbWVudE9iamVjdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRvLl9pc0FNb21lbnRPYmplY3QgPSBmcm9tLl9pc0FNb21lbnRPYmplY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmcm9tLl9pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdG8uX2kgPSBmcm9tLl9pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZnJvbS5fZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRvLl9mID0gZnJvbS5fZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2wgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fbCA9IGZyb20uX2w7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmcm9tLl9zdHJpY3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fc3RyaWN0ID0gZnJvbS5fc3RyaWN0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZnJvbS5fdHptICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdG8uX3R6bSA9IGZyb20uX3R6bTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2lzVVRDICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdG8uX2lzVVRDID0gZnJvbS5faXNVVEM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmcm9tLl9vZmZzZXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fb2Zmc2V0ID0gZnJvbS5fb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZnJvbS5fcGYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fcGYgPSBmcm9tLl9wZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2xvY2FsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRvLl9sb2NhbGUgPSBmcm9tLl9sb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9tZW50UHJvcGVydGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGkgaW4gbW9tZW50UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHByb3AgPSBtb21lbnRQcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgICAgIHZhbCA9IGZyb21bcHJvcF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvW3Byb3BdID0gdmFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0bztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhYnNSb3VuZChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBsZWZ0IHplcm8gZmlsbCBhIG51bWJlclxuICAgIC8vIHNlZSBodHRwOi8vanNwZXJmLmNvbS9sZWZ0LXplcm8tZmlsbGluZyBmb3IgcGVyZm9ybWFuY2UgY29tcGFyaXNvblxuICAgIGZ1bmN0aW9uIGxlZnRaZXJvRmlsbChudW1iZXIsIHRhcmdldExlbmd0aCwgZm9yY2VTaWduKSB7XG4gICAgICAgIHZhciBvdXRwdXQgPSAnJyArIE1hdGguYWJzKG51bWJlciksXG4gICAgICAgICAgICBzaWduID0gbnVtYmVyID49IDA7XG5cbiAgICAgICAgd2hpbGUgKG91dHB1dC5sZW5ndGggPCB0YXJnZXRMZW5ndGgpIHtcbiAgICAgICAgICAgIG91dHB1dCA9ICcwJyArIG91dHB1dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHNpZ24gPyAoZm9yY2VTaWduID8gJysnIDogJycpIDogJy0nKSArIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXMgPSB7bWlsbGlzZWNvbmRzOiAwLCBtb250aHM6IDB9O1xuXG4gICAgICAgIHJlcy5tb250aHMgPSBvdGhlci5tb250aCgpIC0gYmFzZS5tb250aCgpICtcbiAgICAgICAgICAgIChvdGhlci55ZWFyKCkgLSBiYXNlLnllYXIoKSkgKiAxMjtcbiAgICAgICAgaWYgKGJhc2UuY2xvbmUoKS5hZGQocmVzLm1vbnRocywgJ00nKS5pc0FmdGVyKG90aGVyKSkge1xuICAgICAgICAgICAgLS1yZXMubW9udGhzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9ICtvdGhlciAtICsoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpKTtcblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXM7XG4gICAgICAgIG90aGVyID0gbWFrZUFzKG90aGVyLCBiYXNlKTtcbiAgICAgICAgaWYgKGJhc2UuaXNCZWZvcmUob3RoZXIpKSB7XG4gICAgICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyA9IHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2Uob3RoZXIsIGJhc2UpO1xuICAgICAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9IC1yZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgcmVzLm1vbnRocyA9IC1yZXMubW9udGhzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvLyBUT0RPOiByZW1vdmUgJ25hbWUnIGFyZyBhZnRlciBkZXByZWNhdGlvbiBpcyByZW1vdmVkXG4gICAgZnVuY3Rpb24gY3JlYXRlQWRkZXIoZGlyZWN0aW9uLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsLCBwZXJpb2QpIHtcbiAgICAgICAgICAgIHZhciBkdXIsIHRtcDtcbiAgICAgICAgICAgIC8vaW52ZXJ0IHRoZSBhcmd1bWVudHMsIGJ1dCBjb21wbGFpbiBhYm91dCBpdFxuICAgICAgICAgICAgaWYgKHBlcmlvZCAhPT0gbnVsbCAmJiAhaXNOYU4oK3BlcmlvZCkpIHtcbiAgICAgICAgICAgICAgICBkZXByZWNhdGVTaW1wbGUobmFtZSwgJ21vbWVudCgpLicgKyBuYW1lICArICcocGVyaW9kLCBudW1iZXIpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgbW9tZW50KCkuJyArIG5hbWUgKyAnKG51bWJlciwgcGVyaW9kKS4nKTtcbiAgICAgICAgICAgICAgICB0bXAgPSB2YWw7IHZhbCA9IHBlcmlvZDsgcGVyaW9kID0gdG1wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyA/ICt2YWwgOiB2YWw7XG4gICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24odmFsLCBwZXJpb2QpO1xuICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBkdXIsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRPclN1YnRyYWN0RHVyYXRpb25Gcm9tTW9tZW50KG1vbSwgZHVyYXRpb24sIGlzQWRkaW5nLCB1cGRhdGVPZmZzZXQpIHtcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IGR1cmF0aW9uLl9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICBkYXlzID0gZHVyYXRpb24uX2RheXMsXG4gICAgICAgICAgICBtb250aHMgPSBkdXJhdGlvbi5fbW9udGhzO1xuICAgICAgICB1cGRhdGVPZmZzZXQgPSB1cGRhdGVPZmZzZXQgPT0gbnVsbCA/IHRydWUgOiB1cGRhdGVPZmZzZXQ7XG5cbiAgICAgICAgaWYgKG1pbGxpc2Vjb25kcykge1xuICAgICAgICAgICAgbW9tLl9kLnNldFRpbWUoK21vbS5fZCArIG1pbGxpc2Vjb25kcyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF5cykge1xuICAgICAgICAgICAgcmF3U2V0dGVyKG1vbSwgJ0RhdGUnLCByYXdHZXR0ZXIobW9tLCAnRGF0ZScpICsgZGF5cyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobW9udGhzKSB7XG4gICAgICAgICAgICByYXdNb250aFNldHRlcihtb20sIHJhd0dldHRlcihtb20sICdNb250aCcpICsgbW9udGhzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGVPZmZzZXQpIHtcbiAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQobW9tLCBkYXlzIHx8IG1vbnRocyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjaGVjayBpZiBpcyBhbiBhcnJheVxuICAgIGZ1bmN0aW9uIGlzQXJyYXkoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBEYXRlXScgfHxcbiAgICAgICAgICAgIGlucHV0IGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9XG5cbiAgICAvLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXG4gICAgZnVuY3Rpb24gY29tcGFyZUFycmF5cyhhcnJheTEsIGFycmF5MiwgZG9udENvbnZlcnQpIHtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgICAgIGRpZmZzID0gMCxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKChkb250Q29udmVydCAmJiBhcnJheTFbaV0gIT09IGFycmF5MltpXSkgfHxcbiAgICAgICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XG4gICAgICAgICAgICAgICAgZGlmZnMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKSB7XG4gICAgICAgIGlmICh1bml0cykge1xuICAgICAgICAgICAgdmFyIGxvd2VyZWQgPSB1bml0cy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyguKXMkLywgJyQxJyk7XG4gICAgICAgICAgICB1bml0cyA9IHVuaXRBbGlhc2VzW3VuaXRzXSB8fCBjYW1lbEZ1bmN0aW9uc1tsb3dlcmVkXSB8fCBsb3dlcmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bml0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVPYmplY3RVbml0cyhpbnB1dE9iamVjdCkge1xuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0ID0ge30sXG4gICAgICAgICAgICBub3JtYWxpemVkUHJvcCxcbiAgICAgICAgICAgIHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIGlucHV0T2JqZWN0KSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChpbnB1dE9iamVjdCwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcCA9IG5vcm1hbGl6ZVVuaXRzKHByb3ApO1xuICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkSW5wdXRbbm9ybWFsaXplZFByb3BdID0gaW5wdXRPYmplY3RbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRJbnB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlTGlzdChmaWVsZCkge1xuICAgICAgICB2YXIgY291bnQsIHNldHRlcjtcblxuICAgICAgICBpZiAoZmllbGQuaW5kZXhPZignd2VlaycpID09PSAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDc7XG4gICAgICAgICAgICBzZXR0ZXIgPSAnZGF5JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChmaWVsZC5pbmRleE9mKCdtb250aCcpID09PSAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDEyO1xuICAgICAgICAgICAgc2V0dGVyID0gJ21vbnRoJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vbWVudFtmaWVsZF0gPSBmdW5jdGlvbiAoZm9ybWF0LCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIGksIGdldHRlcixcbiAgICAgICAgICAgICAgICBtZXRob2QgPSBtb21lbnQuX2xvY2FsZVtmaWVsZF0sXG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdldHRlciA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQoKS51dGMoKS5zZXQoc2V0dGVyLCBpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWV0aG9kLmNhbGwobW9tZW50Ll9sb2NhbGUsIG0sIGZvcm1hdCB8fCAnJyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXR0ZXIoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGdldHRlcihpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvSW50KGFyZ3VtZW50Rm9yQ29lcmNpb24pIHtcbiAgICAgICAgdmFyIGNvZXJjZWROdW1iZXIgPSArYXJndW1lbnRGb3JDb2VyY2lvbixcbiAgICAgICAgICAgIHZhbHVlID0gMDtcblxuICAgICAgICBpZiAoY29lcmNlZE51bWJlciAhPT0gMCAmJiBpc0Zpbml0ZShjb2VyY2VkTnVtYmVyKSkge1xuICAgICAgICAgICAgaWYgKGNvZXJjZWROdW1iZXIgPj0gMCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gTWF0aC5mbG9vcihjb2VyY2VkTnVtYmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBNYXRoLmNlaWwoY29lcmNlZE51bWJlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF5c0luTW9udGgoeWVhciwgbW9udGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoICsgMSwgMCkpLmdldFVUQ0RhdGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3ZWVrc0luWWVhcih5ZWFyLCBkb3csIGRveSkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcihtb21lbnQoW3llYXIsIDExLCAzMSArIGRvdyAtIGRveV0pLCBkb3csIGRveSkud2VlaztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXlzSW5ZZWFyKHllYXIpIHtcbiAgICAgICAgcmV0dXJuIGlzTGVhcFllYXIoeWVhcikgPyAzNjYgOiAzNjU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNMZWFwWWVhcih5ZWFyKSB7XG4gICAgICAgIHJldHVybiAoeWVhciAlIDQgPT09IDAgJiYgeWVhciAlIDEwMCAhPT0gMCkgfHwgeWVhciAlIDQwMCA9PT0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja092ZXJmbG93KG0pIHtcbiAgICAgICAgdmFyIG92ZXJmbG93O1xuICAgICAgICBpZiAobS5fYSAmJiBtLl9wZi5vdmVyZmxvdyA9PT0gLTIpIHtcbiAgICAgICAgICAgIG92ZXJmbG93ID1cbiAgICAgICAgICAgICAgICBtLl9hW01PTlRIXSA8IDAgfHwgbS5fYVtNT05USF0gPiAxMSA/IE1PTlRIIDpcbiAgICAgICAgICAgICAgICBtLl9hW0RBVEVdIDwgMSB8fCBtLl9hW0RBVEVdID4gZGF5c0luTW9udGgobS5fYVtZRUFSXSwgbS5fYVtNT05USF0pID8gREFURSA6XG4gICAgICAgICAgICAgICAgbS5fYVtIT1VSXSA8IDAgfHwgbS5fYVtIT1VSXSA+IDIzID8gSE9VUiA6XG4gICAgICAgICAgICAgICAgbS5fYVtNSU5VVEVdIDwgMCB8fCBtLl9hW01JTlVURV0gPiA1OSA/IE1JTlVURSA6XG4gICAgICAgICAgICAgICAgbS5fYVtTRUNPTkRdIDwgMCB8fCBtLl9hW1NFQ09ORF0gPiA1OSA/IFNFQ09ORCA6XG4gICAgICAgICAgICAgICAgbS5fYVtNSUxMSVNFQ09ORF0gPCAwIHx8IG0uX2FbTUlMTElTRUNPTkRdID4gOTk5ID8gTUlMTElTRUNPTkQgOlxuICAgICAgICAgICAgICAgIC0xO1xuXG4gICAgICAgICAgICBpZiAobS5fcGYuX292ZXJmbG93RGF5T2ZZZWFyICYmIChvdmVyZmxvdyA8IFlFQVIgfHwgb3ZlcmZsb3cgPiBEQVRFKSkge1xuICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gREFURTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbS5fcGYub3ZlcmZsb3cgPSBvdmVyZmxvdztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVmFsaWQobSkge1xuICAgICAgICBpZiAobS5faXNWYWxpZCA9PSBudWxsKSB7XG4gICAgICAgICAgICBtLl9pc1ZhbGlkID0gIWlzTmFOKG0uX2QuZ2V0VGltZSgpKSAmJlxuICAgICAgICAgICAgICAgIG0uX3BmLm92ZXJmbG93IDwgMCAmJlxuICAgICAgICAgICAgICAgICFtLl9wZi5lbXB0eSAmJlxuICAgICAgICAgICAgICAgICFtLl9wZi5pbnZhbGlkTW9udGggJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYubnVsbElucHV0ICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLmludmFsaWRGb3JtYXQgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYudXNlckludmFsaWRhdGVkO1xuXG4gICAgICAgICAgICBpZiAobS5fc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgbS5faXNWYWxpZCA9IG0uX2lzVmFsaWQgJiZcbiAgICAgICAgICAgICAgICAgICAgbS5fcGYuY2hhcnNMZWZ0T3ZlciA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICBtLl9wZi51bnVzZWRUb2tlbnMubGVuZ3RoID09PSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtLl9pc1ZhbGlkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZUxvY2FsZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIGtleSA/IGtleS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ18nLCAnLScpIDoga2V5O1xuICAgIH1cblxuICAgIC8vIHBpY2sgdGhlIGxvY2FsZSBmcm9tIHRoZSBhcnJheVxuICAgIC8vIHRyeSBbJ2VuLWF1JywgJ2VuLWdiJ10gYXMgJ2VuLWF1JywgJ2VuLWdiJywgJ2VuJywgYXMgaW4gbW92ZSB0aHJvdWdoIHRoZSBsaXN0IHRyeWluZyBlYWNoXG4gICAgLy8gc3Vic3RyaW5nIGZyb20gbW9zdCBzcGVjaWZpYyB0byBsZWFzdCwgYnV0IG1vdmUgdG8gdGhlIG5leHQgYXJyYXkgaXRlbSBpZiBpdCdzIGEgbW9yZSBzcGVjaWZpYyB2YXJpYW50IHRoYW4gdGhlIGN1cnJlbnQgcm9vdFxuICAgIGZ1bmN0aW9uIGNob29zZUxvY2FsZShuYW1lcykge1xuICAgICAgICB2YXIgaSA9IDAsIGosIG5leHQsIGxvY2FsZSwgc3BsaXQ7XG5cbiAgICAgICAgd2hpbGUgKGkgPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNwbGl0ID0gbm9ybWFsaXplTG9jYWxlKG5hbWVzW2ldKS5zcGxpdCgnLScpO1xuICAgICAgICAgICAgaiA9IHNwbGl0Lmxlbmd0aDtcbiAgICAgICAgICAgIG5leHQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaSArIDFdKTtcbiAgICAgICAgICAgIG5leHQgPSBuZXh0ID8gbmV4dC5zcGxpdCgnLScpIDogbnVsbDtcbiAgICAgICAgICAgIHdoaWxlIChqID4gMCkge1xuICAgICAgICAgICAgICAgIGxvY2FsZSA9IGxvYWRMb2NhbGUoc3BsaXQuc2xpY2UoMCwgaikuam9pbignLScpKTtcbiAgICAgICAgICAgICAgICBpZiAobG9jYWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuZXh0ICYmIG5leHQubGVuZ3RoID49IGogJiYgY29tcGFyZUFycmF5cyhzcGxpdCwgbmV4dCwgdHJ1ZSkgPj0gaiAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy90aGUgbmV4dCBhcnJheSBpdGVtIGlzIGJldHRlciB0aGFuIGEgc2hhbGxvd2VyIHN1YnN0cmluZyBvZiB0aGlzIG9uZVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgai0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWRMb2NhbGUobmFtZSkge1xuICAgICAgICB2YXIgb2xkTG9jYWxlID0gbnVsbDtcbiAgICAgICAgaWYgKCFsb2NhbGVzW25hbWVdICYmIGhhc01vZHVsZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBvbGRMb2NhbGUgPSBtb21lbnQubG9jYWxlKCk7XG4gICAgICAgICAgICAgICAgcmVxdWlyZSgnLi9sb2NhbGUvJyArIG5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIGJlY2F1c2UgZGVmaW5lTG9jYWxlIGN1cnJlbnRseSBhbHNvIHNldHMgdGhlIGdsb2JhbCBsb2NhbGUsIHdlIHdhbnQgdG8gdW5kbyB0aGF0IGZvciBsYXp5IGxvYWRlZCBsb2NhbGVzXG4gICAgICAgICAgICAgICAgbW9tZW50LmxvY2FsZShvbGRMb2NhbGUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIGEgbW9tZW50IGZyb20gaW5wdXQsIHRoYXQgaXMgbG9jYWwvdXRjL3pvbmUgZXF1aXZhbGVudCB0byBtb2RlbC5cbiAgICBmdW5jdGlvbiBtYWtlQXMoaW5wdXQsIG1vZGVsKSB7XG4gICAgICAgIHJldHVybiBtb2RlbC5faXNVVEMgPyBtb21lbnQoaW5wdXQpLnpvbmUobW9kZWwuX29mZnNldCB8fCAwKSA6XG4gICAgICAgICAgICBtb21lbnQoaW5wdXQpLmxvY2FsKCk7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBMb2NhbGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGV4dGVuZChMb2NhbGUucHJvdG90eXBlLCB7XG5cbiAgICAgICAgc2V0IDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgdmFyIHByb3AsIGk7XG4gICAgICAgICAgICBmb3IgKGkgaW4gY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgcHJvcCA9IGNvbmZpZ1tpXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tpXSA9IHByb3A7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1snXycgKyBpXSA9IHByb3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9tb250aHMgOiAnSmFudWFyeV9GZWJydWFyeV9NYXJjaF9BcHJpbF9NYXlfSnVuZV9KdWx5X0F1Z3VzdF9TZXB0ZW1iZXJfT2N0b2Jlcl9Ob3ZlbWJlcl9EZWNlbWJlcicuc3BsaXQoJ18nKSxcbiAgICAgICAgbW9udGhzIDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNbbS5tb250aCgpXTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbW9udGhzU2hvcnQgOiAnSmFuX0ZlYl9NYXJfQXByX01heV9KdW5fSnVsX0F1Z19TZXBfT2N0X05vdl9EZWMnLnNwbGl0KCdfJyksXG4gICAgICAgIG1vbnRoc1Nob3J0IDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFttLm1vbnRoKCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1vbnRoc1BhcnNlIDogZnVuY3Rpb24gKG1vbnRoTmFtZSkge1xuICAgICAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbW9tID0gbW9tZW50LnV0YyhbMjAwMCwgaV0pO1xuICAgICAgICAgICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMubW9udGhzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMubW9udGhzU2hvcnQobW9tLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrZGF5cyA6ICdTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheScuc3BsaXQoJ18nKSxcbiAgICAgICAgd2Vla2RheXMgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzW20uZGF5KCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrZGF5c1Nob3J0IDogJ1N1bl9Nb25fVHVlX1dlZF9UaHVfRnJpX1NhdCcuc3BsaXQoJ18nKSxcbiAgICAgICAgd2Vla2RheXNTaG9ydCA6IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTaG9ydFttLmRheSgpXTtcbiAgICAgICAgfSxcblxuICAgICAgICBfd2Vla2RheXNNaW4gOiAnU3VfTW9fVHVfV2VfVGhfRnJfU2EnLnNwbGl0KCdfJyksXG4gICAgICAgIHdlZWtkYXlzTWluIDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblttLmRheSgpXTtcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrZGF5c1BhcnNlIDogZnVuY3Rpb24gKHdlZWtkYXlOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vbSA9IG1vbWVudChbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKSArICd8XicgKyB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfbG9uZ0RhdGVGb3JtYXQgOiB7XG4gICAgICAgICAgICBMVCA6ICdoOm1tIEEnLFxuICAgICAgICAgICAgTCA6ICdNTS9ERC9ZWVlZJyxcbiAgICAgICAgICAgIExMIDogJ01NTU0gRCwgWVlZWScsXG4gICAgICAgICAgICBMTEwgOiAnTU1NTSBELCBZWVlZIExUJyxcbiAgICAgICAgICAgIExMTEwgOiAnZGRkZCwgTU1NTSBELCBZWVlZIExUJ1xuICAgICAgICB9LFxuICAgICAgICBsb25nRGF0ZUZvcm1hdCA6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xuICAgICAgICAgICAgaWYgKCFvdXRwdXQgJiYgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNQTSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgICAgICAgICAgLy8gVXNpbmcgY2hhckF0IHNob3VsZCBiZSBtb3JlIGNvbXBhdGlibGUuXG4gICAgICAgICAgICByZXR1cm4gKChpbnB1dCArICcnKS50b0xvd2VyQ2FzZSgpLmNoYXJBdCgwKSA9PT0gJ3AnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP20/XFwuPy9pLFxuICAgICAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xuICAgICAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhbScgOiAnQU0nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9jYWxlbmRhciA6IHtcbiAgICAgICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5IGF0XSBMVCcsXG4gICAgICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgICAgICAgICAgbmV4dFdlZWsgOiAnZGRkZCBbYXRdIExUJyxcbiAgICAgICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheSBhdF0gTFQnLFxuICAgICAgICAgICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgICAgICAgICBzYW1lRWxzZSA6ICdMJ1xuICAgICAgICB9LFxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uIChrZXksIG1vbSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIG91dHB1dCA9PT0gJ2Z1bmN0aW9uJyA/IG91dHB1dC5hcHBseShtb20pIDogb3V0cHV0O1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWxhdGl2ZVRpbWUgOiB7XG4gICAgICAgICAgICBmdXR1cmUgOiAnaW4gJXMnLFxuICAgICAgICAgICAgcGFzdCA6ICclcyBhZ28nLFxuICAgICAgICAgICAgcyA6ICdhIGZldyBzZWNvbmRzJyxcbiAgICAgICAgICAgIG0gOiAnYSBtaW51dGUnLFxuICAgICAgICAgICAgbW0gOiAnJWQgbWludXRlcycsXG4gICAgICAgICAgICBoIDogJ2FuIGhvdXInLFxuICAgICAgICAgICAgaGggOiAnJWQgaG91cnMnLFxuICAgICAgICAgICAgZCA6ICdhIGRheScsXG4gICAgICAgICAgICBkZCA6ICclZCBkYXlzJyxcbiAgICAgICAgICAgIE0gOiAnYSBtb250aCcsXG4gICAgICAgICAgICBNTSA6ICclZCBtb250aHMnLFxuICAgICAgICAgICAgeSA6ICdhIHllYXInLFxuICAgICAgICAgICAgeXkgOiAnJWQgeWVhcnMnXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVsYXRpdmVUaW1lIDogZnVuY3Rpb24gKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xuICAgICAgICAgICAgdmFyIG91dHB1dCA9IHRoaXMuX3JlbGF0aXZlVGltZVtzdHJpbmddO1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygb3V0cHV0ID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICAgICAgICAgICAgb3V0cHV0KG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkgOlxuICAgICAgICAgICAgICAgIG91dHB1dC5yZXBsYWNlKC8lZC9pLCBudW1iZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhc3RGdXR1cmUgOiBmdW5jdGlvbiAoZGlmZiwgb3V0cHV0KSB7XG4gICAgICAgICAgICB2YXIgZm9ybWF0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW2RpZmYgPiAwID8gJ2Z1dHVyZScgOiAncGFzdCddO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBmb3JtYXQgPT09ICdmdW5jdGlvbicgPyBmb3JtYXQob3V0cHV0KSA6IGZvcm1hdC5yZXBsYWNlKC8lcy9pLCBvdXRwdXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb3JkaW5hbC5yZXBsYWNlKCclZCcsIG51bWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIF9vcmRpbmFsIDogJyVkJyxcblxuICAgICAgICBwcmVwYXJzZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcG9zdGZvcm1hdCA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2VlayA6IGZ1bmN0aW9uIChtb20pIHtcbiAgICAgICAgICAgIHJldHVybiB3ZWVrT2ZZZWFyKG1vbSwgdGhpcy5fd2Vlay5kb3csIHRoaXMuX3dlZWsuZG95KS53ZWVrO1xuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrIDoge1xuICAgICAgICAgICAgZG93IDogMCwgLy8gU3VuZGF5IGlzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsuXG4gICAgICAgICAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ludmFsaWREYXRlOiAnSW52YWxpZCBkYXRlJyxcbiAgICAgICAgaW52YWxpZERhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbnZhbGlkRGF0ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGb3JtYXR0aW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBmdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5tYXRjaCgvXFxbW1xcc1xcU10vKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL15cXFt8XFxdJC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcXFwvZywgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gZm9ybWF0Lm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpLCBpLCBsZW5ndGg7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gJyc7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gYXJyYXlbaV0gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IGFycmF5W2ldLmNhbGwobW9tLCBmb3JtYXQpIDogYXJyYXlbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIGZvcm1hdCBkYXRlIHVzaW5nIG5hdGl2ZSBkYXRlIG9iamVjdFxuICAgIGZ1bmN0aW9uIGZvcm1hdE1vbWVudChtLCBmb3JtYXQpIHtcbiAgICAgICAgaWYgKCFtLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG0ubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXQgPSBleHBhbmRGb3JtYXQoZm9ybWF0LCBtLmxvY2FsZURhdGEoKSk7XG5cbiAgICAgICAgaWYgKCFmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSkge1xuICAgICAgICAgICAgZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0gPSBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XShtKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBhbmRGb3JtYXQoZm9ybWF0LCBsb2NhbGUpIHtcbiAgICAgICAgdmFyIGkgPSA1O1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZS5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XG4gICAgICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFBhcnNpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIGdldCB0aGUgcmVnZXggdG8gZmluZCB0aGUgbmV4dCB0b2tlblxuICAgIGZ1bmN0aW9uIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSB7XG4gICAgICAgIHZhciBhLCBzdHJpY3QgPSBjb25maWcuX3N0cmljdDtcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICBjYXNlICdRJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lRGlnaXQ7XG4gICAgICAgIGNhc2UgJ0REREQnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaHJlZURpZ2l0cztcbiAgICAgICAgY2FzZSAnWVlZWSc6XG4gICAgICAgIGNhc2UgJ0dHR0cnOlxuICAgICAgICBjYXNlICdnZ2dnJzpcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuRm91ckRpZ2l0cyA6IHBhcnNlVG9rZW5PbmVUb0ZvdXJEaWdpdHM7XG4gICAgICAgIGNhc2UgJ1knOlxuICAgICAgICBjYXNlICdHJzpcbiAgICAgICAgY2FzZSAnZyc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblNpZ25lZE51bWJlcjtcbiAgICAgICAgY2FzZSAnWVlZWVlZJzpcbiAgICAgICAgY2FzZSAnWVlZWVknOlxuICAgICAgICBjYXNlICdHR0dHRyc6XG4gICAgICAgIGNhc2UgJ2dnZ2dnJzpcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuU2l4RGlnaXRzIDogcGFyc2VUb2tlbk9uZVRvU2l4RGlnaXRzO1xuICAgICAgICBjYXNlICdTJzpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZURpZ2l0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdTUyc6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5Ud29EaWdpdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ1NTUyc6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaHJlZURpZ2l0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnREREJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lVG9UaHJlZURpZ2l0cztcbiAgICAgICAgY2FzZSAnTU1NJzpcbiAgICAgICAgY2FzZSAnTU1NTSc6XG4gICAgICAgIGNhc2UgJ2RkJzpcbiAgICAgICAgY2FzZSAnZGRkJzpcbiAgICAgICAgY2FzZSAnZGRkZCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbldvcmQ7XG4gICAgICAgIGNhc2UgJ2EnOlxuICAgICAgICBjYXNlICdBJzpcbiAgICAgICAgICAgIHJldHVybiBjb25maWcuX2xvY2FsZS5fbWVyaWRpZW1QYXJzZTtcbiAgICAgICAgY2FzZSAnWCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRpbWVzdGFtcE1zO1xuICAgICAgICBjYXNlICdaJzpcbiAgICAgICAgY2FzZSAnWlonOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaW1lem9uZTtcbiAgICAgICAgY2FzZSAnVCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblQ7XG4gICAgICAgIGNhc2UgJ1NTU1MnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5EaWdpdHM7XG4gICAgICAgIGNhc2UgJ01NJzpcbiAgICAgICAgY2FzZSAnREQnOlxuICAgICAgICBjYXNlICdZWSc6XG4gICAgICAgIGNhc2UgJ0dHJzpcbiAgICAgICAgY2FzZSAnZ2cnOlxuICAgICAgICBjYXNlICdISCc6XG4gICAgICAgIGNhc2UgJ2hoJzpcbiAgICAgICAgY2FzZSAnbW0nOlxuICAgICAgICBjYXNlICdzcyc6XG4gICAgICAgIGNhc2UgJ3d3JzpcbiAgICAgICAgY2FzZSAnV1cnOlxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IHBhcnNlVG9rZW5Ud29EaWdpdHMgOiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XG4gICAgICAgIGNhc2UgJ00nOlxuICAgICAgICBjYXNlICdEJzpcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgIGNhc2UgJ0gnOlxuICAgICAgICBjYXNlICdoJzpcbiAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgY2FzZSAnVyc6XG4gICAgICAgIGNhc2UgJ2UnOlxuICAgICAgICBjYXNlICdFJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lT3JUd29EaWdpdHM7XG4gICAgICAgIGNhc2UgJ0RvJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT3JkaW5hbDtcbiAgICAgICAgZGVmYXVsdCA6XG4gICAgICAgICAgICBhID0gbmV3IFJlZ0V4cChyZWdleHBFc2NhcGUodW5lc2NhcGVGb3JtYXQodG9rZW4ucmVwbGFjZSgnXFxcXCcsICcnKSksICdpJykpO1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKHN0cmluZykge1xuICAgICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgJyc7XG4gICAgICAgIHZhciBwb3NzaWJsZVR6TWF0Y2hlcyA9IChzdHJpbmcubWF0Y2gocGFyc2VUb2tlblRpbWV6b25lKSB8fCBbXSksXG4gICAgICAgICAgICB0ekNodW5rID0gcG9zc2libGVUek1hdGNoZXNbcG9zc2libGVUek1hdGNoZXMubGVuZ3RoIC0gMV0gfHwgW10sXG4gICAgICAgICAgICBwYXJ0cyA9ICh0ekNodW5rICsgJycpLm1hdGNoKHBhcnNlVGltZXpvbmVDaHVua2VyKSB8fCBbJy0nLCAwLCAwXSxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSArKHBhcnRzWzFdICogNjApICsgdG9JbnQocGFydHNbMl0pO1xuXG4gICAgICAgIHJldHVybiBwYXJ0c1swXSA9PT0gJysnID8gLW1pbnV0ZXMgOiBtaW51dGVzO1xuICAgIH1cblxuICAgIC8vIGZ1bmN0aW9uIHRvIGNvbnZlcnQgc3RyaW5nIGlucHV0IHRvIGRhdGVcbiAgICBmdW5jdGlvbiBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgaW5wdXQsIGNvbmZpZykge1xuICAgICAgICB2YXIgYSwgZGF0ZVBhcnRBcnJheSA9IGNvbmZpZy5fYTtcblxuICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgIC8vIFFVQVJURVJcbiAgICAgICAgY2FzZSAnUSc6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTU9OVEhdID0gKHRvSW50KGlucHV0KSAtIDEpICogMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBNT05USFxuICAgICAgICBjYXNlICdNJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBNTVxuICAgICAgICBjYXNlICdNTScgOlxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9IHRvSW50KGlucHV0KSAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTU1NJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBNTU1NXG4gICAgICAgIGNhc2UgJ01NTU0nIDpcbiAgICAgICAgICAgIGEgPSBjb25maWcuX2xvY2FsZS5tb250aHNQYXJzZShpbnB1dCk7XG4gICAgICAgICAgICAvLyBpZiB3ZSBkaWRuJ3QgZmluZCBhIG1vbnRoIG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZC5cbiAgICAgICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9IGE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZE1vbnRoID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gREFZIE9GIE1PTlRIXG4gICAgICAgIGNhc2UgJ0QnIDogLy8gZmFsbCB0aHJvdWdoIHRvIEREXG4gICAgICAgIGNhc2UgJ0REJyA6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbREFURV0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnRG8nIDpcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtEQVRFXSA9IHRvSW50KHBhcnNlSW50KGlucHV0LCAxMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIERBWSBPRiBZRUFSXG4gICAgICAgIGNhc2UgJ0RERCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gRERERFxuICAgICAgICBjYXNlICdEREREJyA6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fZGF5T2ZZZWFyID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gWUVBUlxuICAgICAgICBjYXNlICdZWScgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtZRUFSXSA9IG1vbWVudC5wYXJzZVR3b0RpZ2l0WWVhcihpbnB1dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnWVlZWScgOlxuICAgICAgICBjYXNlICdZWVlZWScgOlxuICAgICAgICBjYXNlICdZWVlZWVknIDpcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbWUVBUl0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gQU0gLyBQTVxuICAgICAgICBjYXNlICdhJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBBXG4gICAgICAgIGNhc2UgJ0EnIDpcbiAgICAgICAgICAgIGNvbmZpZy5faXNQbSA9IGNvbmZpZy5fbG9jYWxlLmlzUE0oaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIDI0IEhPVVJcbiAgICAgICAgY2FzZSAnSCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gaGhcbiAgICAgICAgY2FzZSAnSEgnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXG4gICAgICAgIGNhc2UgJ2gnIDogLy8gZmFsbCB0aHJvdWdoIHRvIGhoXG4gICAgICAgIGNhc2UgJ2hoJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1JTlVURVxuICAgICAgICBjYXNlICdtJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBtbVxuICAgICAgICBjYXNlICdtbScgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIFNFQ09ORFxuICAgICAgICBjYXNlICdzJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBzc1xuICAgICAgICBjYXNlICdzcycgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIE1JTExJU0VDT05EXG4gICAgICAgIGNhc2UgJ1MnIDpcbiAgICAgICAgY2FzZSAnU1MnIDpcbiAgICAgICAgY2FzZSAnU1NTJyA6XG4gICAgICAgIGNhc2UgJ1NTU1MnIDpcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTUlMTElTRUNPTkRdID0gdG9JbnQoKCcwLicgKyBpbnB1dCkgKiAxMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBVTklYIFRJTUVTVEFNUCBXSVRIIE1TXG4gICAgICAgIGNhc2UgJ1gnOlxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUocGFyc2VGbG9hdChpbnB1dCkgKiAxMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBUSU1FWk9ORVxuICAgICAgICBjYXNlICdaJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBaWlxuICAgICAgICBjYXNlICdaWicgOlxuICAgICAgICAgICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl90em0gPSB0aW1lem9uZU1pbnV0ZXNGcm9tU3RyaW5nKGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBXRUVLREFZIC0gaHVtYW5cbiAgICAgICAgY2FzZSAnZGQnOlxuICAgICAgICBjYXNlICdkZGQnOlxuICAgICAgICBjYXNlICdkZGRkJzpcbiAgICAgICAgICAgIGEgPSBjb25maWcuX2xvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgICAgIC8vIGlmIHdlIGRpZG4ndCBnZXQgYSB3ZWVrZGF5IG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZFxuICAgICAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25maWcuX3dbJ2QnXSA9IGE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZFdlZWtkYXkgPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBXRUVLLCBXRUVLIERBWSAtIG51bWVyaWNcbiAgICAgICAgY2FzZSAndyc6XG4gICAgICAgIGNhc2UgJ3d3JzpcbiAgICAgICAgY2FzZSAnVyc6XG4gICAgICAgIGNhc2UgJ1dXJzpcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgIGNhc2UgJ2UnOlxuICAgICAgICBjYXNlICdFJzpcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDEpO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdnZ2dnJzpcbiAgICAgICAgY2FzZSAnR0dHRyc6XG4gICAgICAgIGNhc2UgJ0dHR0dHJzpcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDIpO1xuICAgICAgICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fd1t0b2tlbl0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZ2cnOlxuICAgICAgICBjYXNlICdHRyc6XG4gICAgICAgICAgICBjb25maWcuX3cgPSBjb25maWcuX3cgfHwge307XG4gICAgICAgICAgICBjb25maWcuX3dbdG9rZW5dID0gbW9tZW50LnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpIHtcbiAgICAgICAgdmFyIHcsIHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSwgdGVtcDtcblxuICAgICAgICB3ID0gY29uZmlnLl93O1xuICAgICAgICBpZiAody5HRyAhPSBudWxsIHx8IHcuVyAhPSBudWxsIHx8IHcuRSAhPSBudWxsKSB7XG4gICAgICAgICAgICBkb3cgPSAxO1xuICAgICAgICAgICAgZG95ID0gNDtcblxuICAgICAgICAgICAgLy8gVE9ETzogV2UgbmVlZCB0byB0YWtlIHRoZSBjdXJyZW50IGlzb1dlZWtZZWFyLCBidXQgdGhhdCBkZXBlbmRzIG9uXG4gICAgICAgICAgICAvLyBob3cgd2UgaW50ZXJwcmV0IG5vdyAobG9jYWwsIHV0YywgZml4ZWQgb2Zmc2V0KS4gU28gY3JlYXRlXG4gICAgICAgICAgICAvLyBhIG5vdyB2ZXJzaW9uIG9mIGN1cnJlbnQgY29uZmlnICh0YWtlIGxvY2FsL3V0Yy9vZmZzZXQgZmxhZ3MsIGFuZFxuICAgICAgICAgICAgLy8gY3JlYXRlIG5vdykuXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRmbCh3LkdHLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIobW9tZW50KCksIDEsIDQpLnllYXIpO1xuICAgICAgICAgICAgd2VlayA9IGRmbCh3LlcsIDEpO1xuICAgICAgICAgICAgd2Vla2RheSA9IGRmbCh3LkUsIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG93ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG93O1xuICAgICAgICAgICAgZG95ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG95O1xuXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRmbCh3LmdnLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIobW9tZW50KCksIGRvdywgZG95KS55ZWFyKTtcbiAgICAgICAgICAgIHdlZWsgPSBkZmwody53LCAxKTtcblxuICAgICAgICAgICAgaWYgKHcuZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gd2Vla2RheSAtLSBsb3cgZGF5IG51bWJlcnMgYXJlIGNvbnNpZGVyZWQgbmV4dCB3ZWVrXG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IHcuZDtcbiAgICAgICAgICAgICAgICBpZiAod2Vla2RheSA8IGRvdykge1xuICAgICAgICAgICAgICAgICAgICArK3dlZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGxvY2FsIHdlZWtkYXkgLS0gY291bnRpbmcgc3RhcnRzIGZyb20gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmUgKyBkb3c7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSBkb3c7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG95LCBkb3cpO1xuXG4gICAgICAgIGNvbmZpZy5fYVtZRUFSXSA9IHRlbXAueWVhcjtcbiAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0ZW1wLmRheU9mWWVhcjtcbiAgICB9XG5cbiAgICAvLyBjb252ZXJ0IGFuIGFycmF5IHRvIGEgZGF0ZS5cbiAgICAvLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xuICAgIC8vIG5vdGU6IGFsbCB2YWx1ZXMgcGFzdCB0aGUgeWVhciBhcmUgb3B0aW9uYWwgYW5kIHdpbGwgZGVmYXVsdCB0byB0aGUgbG93ZXN0IHBvc3NpYmxlIHZhbHVlLlxuICAgIC8vIFt5ZWFyLCBtb250aCwgZGF5ICwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kXVxuICAgIGZ1bmN0aW9uIGRhdGVGcm9tQ29uZmlnKGNvbmZpZykge1xuICAgICAgICB2YXIgaSwgZGF0ZSwgaW5wdXQgPSBbXSwgY3VycmVudERhdGUsIHllYXJUb1VzZTtcblxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcblxuICAgICAgICAvL2NvbXB1dGUgZGF5IG9mIHRoZSB5ZWFyIGZyb20gd2Vla3MgYW5kIHdlZWtkYXlzXG4gICAgICAgIGlmIChjb25maWcuX3cgJiYgY29uZmlnLl9hW0RBVEVdID09IG51bGwgJiYgY29uZmlnLl9hW01PTlRIXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaWYgdGhlIGRheSBvZiB0aGUgeWVhciBpcyBzZXQsIGZpZ3VyZSBvdXQgd2hhdCBpdCBpc1xuICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIpIHtcbiAgICAgICAgICAgIHllYXJUb1VzZSA9IGRmbChjb25maWcuX2FbWUVBUl0sIGN1cnJlbnREYXRlW1lFQVJdKTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyVG9Vc2UpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRlID0gbWFrZVVUQ0RhdGUoeWVhclRvVXNlLCAwLCBjb25maWcuX2RheU9mWWVhcik7XG4gICAgICAgICAgICBjb25maWcuX2FbTU9OVEhdID0gZGF0ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgY29uZmlnLl9hW0RBVEVdID0gZGF0ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgLy8gKiBpZiBubyB5ZWFyLCBtb250aCwgZGF5IG9mIG1vbnRoIGFyZSBnaXZlbiwgZGVmYXVsdCB0byB0b2RheVxuICAgICAgICAvLyAqIGlmIGRheSBvZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBtb250aCBhbmQgeWVhclxuICAgICAgICAvLyAqIGlmIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG9ubHkgeWVhclxuICAgICAgICAvLyAqIGlmIHllYXIgaXMgZ2l2ZW4sIGRvbid0IGRlZmF1bHQgYW55dGhpbmdcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDMgJiYgY29uZmlnLl9hW2ldID09IG51bGw7ICsraSkge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSBjdXJyZW50RGF0ZVtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFplcm8gb3V0IHdoYXRldmVyIHdhcyBub3QgZGVmYXVsdGVkLCBpbmNsdWRpbmcgdGltZVxuICAgICAgICBmb3IgKDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSAoY29uZmlnLl9hW2ldID09IG51bGwpID8gKGkgPT09IDIgPyAxIDogMCkgOiBjb25maWcuX2FbaV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcuX2QgPSAoY29uZmlnLl91c2VVVEMgPyBtYWtlVVRDRGF0ZSA6IG1ha2VEYXRlKS5hcHBseShudWxsLCBpbnB1dCk7XG4gICAgICAgIC8vIEFwcGx5IHRpbWV6b25lIG9mZnNldCBmcm9tIGlucHV0LiBUaGUgYWN0dWFsIHpvbmUgY2FuIGJlIGNoYW5nZWRcbiAgICAgICAgLy8gd2l0aCBwYXJzZVpvbmUuXG4gICAgICAgIGlmIChjb25maWcuX3R6bSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2Quc2V0VVRDTWludXRlcyhjb25maWcuX2QuZ2V0VVRDTWludXRlcygpICsgY29uZmlnLl90em0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF0ZUZyb21PYmplY3QoY29uZmlnKSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQ7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9ybWFsaXplZElucHV0ID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoY29uZmlnLl9pKTtcbiAgICAgICAgY29uZmlnLl9hID0gW1xuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LnllYXIsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQubW9udGgsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuZGF5LFxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LmhvdXIsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQubWludXRlLFxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0LnNlY29uZCxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZFxuICAgICAgICBdO1xuXG4gICAgICAgIGRhdGVGcm9tQ29uZmlnKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3VycmVudERhdGVBcnJheShjb25maWcpIHtcbiAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGlmIChjb25maWcuX3VzZVVUQykge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDRnVsbFllYXIoKSxcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDTW9udGgoKSxcbiAgICAgICAgICAgICAgICBub3cuZ2V0VVRDRGF0ZSgpXG4gICAgICAgICAgICBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtub3cuZ2V0RnVsbFllYXIoKSwgbm93LmdldE1vbnRoKCksIG5vdy5nZXREYXRlKCldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgZm9ybWF0IHN0cmluZ1xuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5fZiA9PT0gbW9tZW50LklTT184NjAxKSB7XG4gICAgICAgICAgICBwYXJzZUlTTyhjb25maWcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLl9hID0gW107XG4gICAgICAgIGNvbmZpZy5fcGYuZW1wdHkgPSB0cnVlO1xuXG4gICAgICAgIC8vIFRoaXMgYXJyYXkgaXMgdXNlZCB0byBtYWtlIGEgRGF0ZSwgZWl0aGVyIHdpdGggYG5ldyBEYXRlYCBvciBgRGF0ZS5VVENgXG4gICAgICAgIHZhciBzdHJpbmcgPSAnJyArIGNvbmZpZy5faSxcbiAgICAgICAgICAgIGksIHBhcnNlZElucHV0LCB0b2tlbnMsIHRva2VuLCBza2lwcGVkLFxuICAgICAgICAgICAgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcbiAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggPSAwO1xuXG4gICAgICAgIHRva2VucyA9IGV4cGFuZEZvcm1hdChjb25maWcuX2YsIGNvbmZpZy5fbG9jYWxlKS5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSB8fCBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICAgICAgICAgIHBhcnNlZElucHV0ID0gKHN0cmluZy5tYXRjaChnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpIHx8IFtdKVswXTtcbiAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgIHNraXBwZWQgPSBzdHJpbmcuc3Vic3RyKDAsIHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSk7XG4gICAgICAgICAgICAgICAgaWYgKHNraXBwZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZElucHV0LnB1c2goc2tpcHBlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5zbGljZShzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkgKyBwYXJzZWRJbnB1dC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGggKz0gcGFyc2VkSW5wdXQubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZG9uJ3QgcGFyc2UgaWYgaXQncyBub3QgYSBrbm93biB0b2tlblxuICAgICAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLmVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIHBhcnNlZElucHV0LCBjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY29uZmlnLl9zdHJpY3QgJiYgIXBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgcmVtYWluaW5nIHVucGFyc2VkIGlucHV0IGxlbmd0aCB0byB0aGUgc3RyaW5nXG4gICAgICAgIGNvbmZpZy5fcGYuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XG4gICAgICAgIGlmIChzdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uZmlnLl9wZi51bnVzZWRJbnB1dC5wdXNoKHN0cmluZyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBoYW5kbGUgYW0gcG1cbiAgICAgICAgaWYgKGNvbmZpZy5faXNQbSAmJiBjb25maWcuX2FbSE9VUl0gPCAxMikge1xuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdICs9IDEyO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIGlzIDEyIGFtLCBjaGFuZ2UgaG91cnMgdG8gMFxuICAgICAgICBpZiAoY29uZmlnLl9pc1BtID09PSBmYWxzZSAmJiBjb25maWcuX2FbSE9VUl0gPT09IDEyKSB7XG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICAgICAgY2hlY2tPdmVyZmxvdyhjb25maWcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuZXNjYXBlRm9ybWF0KHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXFxcXChcXFspfFxcXFwoXFxdKXxcXFsoW15cXF1cXFtdKilcXF18XFxcXCguKS9nLCBmdW5jdGlvbiAobWF0Y2hlZCwgcDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgICAgIHJldHVybiBwMSB8fCBwMiB8fCBwMyB8fCBwNDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzU2MTQ5My9pcy10aGVyZS1hLXJlZ2V4cC1lc2NhcGUtZnVuY3Rpb24taW4tamF2YXNjcmlwdFxuICAgIGZ1bmN0aW9uIHJlZ2V4cEVzY2FwZShzKSB7XG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGFycmF5IG9mIGZvcm1hdCBzdHJpbmdzXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKSB7XG4gICAgICAgIHZhciB0ZW1wQ29uZmlnLFxuICAgICAgICAgICAgYmVzdE1vbWVudCxcblxuICAgICAgICAgICAgc2NvcmVUb0JlYXQsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgY3VycmVudFNjb3JlO1xuXG4gICAgICAgIGlmIChjb25maWcuX2YubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLmludmFsaWRGb3JtYXQgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoTmFOKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb25maWcuX2YubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSA9IDA7XG4gICAgICAgICAgICB0ZW1wQ29uZmlnID0gY29weUNvbmZpZyh7fSwgY29uZmlnKTtcbiAgICAgICAgICAgIGlmIChjb25maWcuX3VzZVVUQyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGVtcENvbmZpZy5fdXNlVVRDID0gY29uZmlnLl91c2VVVEM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcbiAgICAgICAgICAgIHRlbXBDb25maWcuX2YgPSBjb25maWcuX2ZbaV07XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21TdHJpbmdBbmRGb3JtYXQodGVtcENvbmZpZyk7XG5cbiAgICAgICAgICAgIGlmICghaXNWYWxpZCh0ZW1wQ29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbnkgaW5wdXQgdGhhdCB3YXMgbm90IHBhcnNlZCBhZGQgYSBwZW5hbHR5IGZvciB0aGF0IGZvcm1hdFxuICAgICAgICAgICAgY3VycmVudFNjb3JlICs9IHRlbXBDb25maWcuX3BmLmNoYXJzTGVmdE92ZXI7XG5cbiAgICAgICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gdGVtcENvbmZpZy5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCAqIDEwO1xuXG4gICAgICAgICAgICB0ZW1wQ29uZmlnLl9wZi5zY29yZSA9IGN1cnJlbnRTY29yZTtcblxuICAgICAgICAgICAgaWYgKHNjb3JlVG9CZWF0ID09IG51bGwgfHwgY3VycmVudFNjb3JlIDwgc2NvcmVUb0JlYXQpIHtcbiAgICAgICAgICAgICAgICBzY29yZVRvQmVhdCA9IGN1cnJlbnRTY29yZTtcbiAgICAgICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXRcbiAgICBmdW5jdGlvbiBwYXJzZUlTTyhjb25maWcpIHtcbiAgICAgICAgdmFyIGksIGwsXG4gICAgICAgICAgICBzdHJpbmcgPSBjb25maWcuX2ksXG4gICAgICAgICAgICBtYXRjaCA9IGlzb1JlZ2V4LmV4ZWMoc3RyaW5nKTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fcGYuaXNvID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29EYXRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNvRGF0ZXNbaV1bMV0uZXhlYyhzdHJpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzVdIHNob3VsZCBiZSAnVCcgb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZiA9IGlzb0RhdGVzW2ldWzBdICsgKG1hdGNoWzZdIHx8ICcgJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29UaW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNvVGltZXNbaV1bMV0uZXhlYyhzdHJpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZiArPSBpc29UaW1lc1tpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0cmluZy5tYXRjaChwYXJzZVRva2VuVGltZXpvbmUpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9mICs9ICdaJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkYXRlIGZyb20gaXNvIGZvcm1hdCBvciBmYWxsYmFja1xuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbVN0cmluZyhjb25maWcpIHtcbiAgICAgICAgcGFyc2VJU08oY29uZmlnKTtcbiAgICAgICAgaWYgKGNvbmZpZy5faXNWYWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBjb25maWcuX2lzVmFsaWQ7XG4gICAgICAgICAgICBtb21lbnQuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2soY29uZmlnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hcChhcnIsIGZuKSB7XG4gICAgICAgIHZhciByZXMgPSBbXSwgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgcmVzLnB1c2goZm4oYXJyW2ldLCBpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLCBtYXRjaGVkO1xuICAgICAgICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgraW5wdXQpO1xuICAgICAgICB9IGVsc2UgaWYgKChtYXRjaGVkID0gYXNwTmV0SnNvblJlZ2V4LmV4ZWMoaW5wdXQpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK21hdGNoZWRbMV0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZyhjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuX2EgPSBtYXAoaW5wdXQuc2xpY2UoMCksIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQob2JqLCAxMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRhdGVGcm9tQ29uZmlnKGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGRhdGVGcm9tT2JqZWN0KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIC8vIGZyb20gbWlsbGlzZWNvbmRzXG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShpbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb21lbnQuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2soY29uZmlnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlKHksIG0sIGQsIGgsIE0sIHMsIG1zKSB7XG4gICAgICAgIC8vY2FuJ3QganVzdCBhcHBseSgpIHRvIGNyZWF0ZSBhIGRhdGU6XG4gICAgICAgIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xODEzNDgvaW5zdGFudGlhdGluZy1hLWphdmFzY3JpcHQtb2JqZWN0LWJ5LWNhbGxpbmctcHJvdG90eXBlLWNvbnN0cnVjdG9yLWFwcGx5XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpO1xuXG4gICAgICAgIC8vdGhlIGRhdGUgY29uc3RydWN0b3IgZG9lc24ndCBhY2NlcHQgeWVhcnMgPCAxOTcwXG4gICAgICAgIGlmICh5IDwgMTk3MCkge1xuICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlVVRDRGF0ZSh5KSB7XG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG4gICAgICAgIGlmICh5IDwgMTk3MCkge1xuICAgICAgICAgICAgZGF0ZS5zZXRVVENGdWxsWWVhcih5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVdlZWtkYXkoaW5wdXQsIGxvY2FsZSkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFpc05hTihpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IHBhcnNlSW50KGlucHV0LCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgUmVsYXRpdmUgVGltZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcbiAgICBmdW5jdGlvbiBzdWJzdGl0dXRlVGltZUFnbyhzdHJpbmcsIG51bWJlciwgd2l0aG91dFN1ZmZpeCwgaXNGdXR1cmUsIGxvY2FsZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLnJlbGF0aXZlVGltZShudW1iZXIgfHwgMSwgISF3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWxhdGl2ZVRpbWUocG9zTmVnRHVyYXRpb24sIHdpdGhvdXRTdWZmaXgsIGxvY2FsZSkge1xuICAgICAgICB2YXIgZHVyYXRpb24gPSBtb21lbnQuZHVyYXRpb24ocG9zTmVnRHVyYXRpb24pLmFicygpLFxuICAgICAgICAgICAgc2Vjb25kcyA9IHJvdW5kKGR1cmF0aW9uLmFzKCdzJykpLFxuICAgICAgICAgICAgbWludXRlcyA9IHJvdW5kKGR1cmF0aW9uLmFzKCdtJykpLFxuICAgICAgICAgICAgaG91cnMgPSByb3VuZChkdXJhdGlvbi5hcygnaCcpKSxcbiAgICAgICAgICAgIGRheXMgPSByb3VuZChkdXJhdGlvbi5hcygnZCcpKSxcbiAgICAgICAgICAgIG1vbnRocyA9IHJvdW5kKGR1cmF0aW9uLmFzKCdNJykpLFxuICAgICAgICAgICAgeWVhcnMgPSByb3VuZChkdXJhdGlvbi5hcygneScpKSxcblxuICAgICAgICAgICAgYXJncyA9IHNlY29uZHMgPCByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLnMgJiYgWydzJywgc2Vjb25kc10gfHxcbiAgICAgICAgICAgICAgICBtaW51dGVzID09PSAxICYmIFsnbSddIHx8XG4gICAgICAgICAgICAgICAgbWludXRlcyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMubSAmJiBbJ21tJywgbWludXRlc10gfHxcbiAgICAgICAgICAgICAgICBob3VycyA9PT0gMSAmJiBbJ2gnXSB8fFxuICAgICAgICAgICAgICAgIGhvdXJzIDwgcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5oICYmIFsnaGgnLCBob3Vyc10gfHxcbiAgICAgICAgICAgICAgICBkYXlzID09PSAxICYmIFsnZCddIHx8XG4gICAgICAgICAgICAgICAgZGF5cyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMuZCAmJiBbJ2RkJywgZGF5c10gfHxcbiAgICAgICAgICAgICAgICBtb250aHMgPT09IDEgJiYgWydNJ10gfHxcbiAgICAgICAgICAgICAgICBtb250aHMgPCByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLk0gJiYgWydNTScsIG1vbnRoc10gfHxcbiAgICAgICAgICAgICAgICB5ZWFycyA9PT0gMSAmJiBbJ3knXSB8fCBbJ3l5JywgeWVhcnNdO1xuXG4gICAgICAgIGFyZ3NbMl0gPSB3aXRob3V0U3VmZml4O1xuICAgICAgICBhcmdzWzNdID0gK3Bvc05lZ0R1cmF0aW9uID4gMDtcbiAgICAgICAgYXJnc1s0XSA9IGxvY2FsZTtcbiAgICAgICAgcmV0dXJuIHN1YnN0aXR1dGVUaW1lQWdvLmFwcGx5KHt9LCBhcmdzKTtcbiAgICB9XG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgV2VlayBvZiBZZWFyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBmaXJzdERheU9mV2VlayAgICAgICAwID0gc3VuLCA2ID0gc2F0XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgdGhlIGRheSBvZiB0aGUgd2VlayB0aGF0IHN0YXJ0cyB0aGUgd2Vla1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICh1c3VhbGx5IHN1bmRheSBvciBtb25kYXkpXG4gICAgLy8gZmlyc3REYXlPZldlZWtPZlllYXIgMCA9IHN1biwgNiA9IHNhdFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIHRoZSBmaXJzdCB3ZWVrIGlzIHRoZSB3ZWVrIHRoYXQgY29udGFpbnMgdGhlIGZpcnN0XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgb2YgdGhpcyBkYXkgb2YgdGhlIHdlZWtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAoZWcuIElTTyB3ZWVrcyB1c2UgdGh1cnNkYXkgKDQpKVxuICAgIGZ1bmN0aW9uIHdlZWtPZlllYXIobW9tLCBmaXJzdERheU9mV2VlaywgZmlyc3REYXlPZldlZWtPZlllYXIpIHtcbiAgICAgICAgdmFyIGVuZCA9IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIC0gZmlyc3REYXlPZldlZWssXG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgPSBmaXJzdERheU9mV2Vla09mWWVhciAtIG1vbS5kYXkoKSxcbiAgICAgICAgICAgIGFkanVzdGVkTW9tZW50O1xuXG5cbiAgICAgICAgaWYgKGRheXNUb0RheU9mV2VlayA+IGVuZCkge1xuICAgICAgICAgICAgZGF5c1RvRGF5T2ZXZWVrIC09IDc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF5c1RvRGF5T2ZXZWVrIDwgZW5kIC0gNykge1xuICAgICAgICAgICAgZGF5c1RvRGF5T2ZXZWVrICs9IDc7XG4gICAgICAgIH1cblxuICAgICAgICBhZGp1c3RlZE1vbWVudCA9IG1vbWVudChtb20pLmFkZChkYXlzVG9EYXlPZldlZWssICdkJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3ZWVrOiBNYXRoLmNlaWwoYWRqdXN0ZWRNb21lbnQuZGF5T2ZZZWFyKCkgLyA3KSxcbiAgICAgICAgICAgIHllYXI6IGFkanVzdGVkTW9tZW50LnllYXIoKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9JU09fd2Vla19kYXRlI0NhbGN1bGF0aW5nX2FfZGF0ZV9naXZlbl90aGVfeWVhci4yQ193ZWVrX251bWJlcl9hbmRfd2Vla2RheVxuICAgIGZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrcyh5ZWFyLCB3ZWVrLCB3ZWVrZGF5LCBmaXJzdERheU9mV2Vla09mWWVhciwgZmlyc3REYXlPZldlZWspIHtcbiAgICAgICAgdmFyIGQgPSBtYWtlVVRDRGF0ZSh5ZWFyLCAwLCAxKS5nZXRVVENEYXkoKSwgZGF5c1RvQWRkLCBkYXlPZlllYXI7XG5cbiAgICAgICAgZCA9IGQgPT09IDAgPyA3IDogZDtcbiAgICAgICAgd2Vla2RheSA9IHdlZWtkYXkgIT0gbnVsbCA/IHdlZWtkYXkgOiBmaXJzdERheU9mV2VlaztcbiAgICAgICAgZGF5c1RvQWRkID0gZmlyc3REYXlPZldlZWsgLSBkICsgKGQgPiBmaXJzdERheU9mV2Vla09mWWVhciA/IDcgOiAwKSAtIChkIDwgZmlyc3REYXlPZldlZWsgPyA3IDogMCk7XG4gICAgICAgIGRheU9mWWVhciA9IDcgKiAod2VlayAtIDEpICsgKHdlZWtkYXkgLSBmaXJzdERheU9mV2VlaykgKyBkYXlzVG9BZGQgKyAxO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB5ZWFyOiBkYXlPZlllYXIgPiAwID8geWVhciA6IHllYXIgLSAxLFxuICAgICAgICAgICAgZGF5T2ZZZWFyOiBkYXlPZlllYXIgPiAwID8gIGRheU9mWWVhciA6IGRheXNJblllYXIoeWVhciAtIDEpICsgZGF5T2ZZZWFyXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBUb3AgTGV2ZWwgRnVuY3Rpb25zXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gbWFrZU1vbWVudChjb25maWcpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICAgICAgZm9ybWF0ID0gY29uZmlnLl9mO1xuXG4gICAgICAgIGNvbmZpZy5fbG9jYWxlID0gY29uZmlnLl9sb2NhbGUgfHwgbW9tZW50LmxvY2FsZURhdGEoY29uZmlnLl9sKTtcblxuICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgKGZvcm1hdCA9PT0gdW5kZWZpbmVkICYmIGlucHV0ID09PSAnJykpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQuaW52YWxpZCh7bnVsbElucHV0OiB0cnVlfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uZmlnLl9pID0gaW5wdXQgPSBjb25maWcuX2xvY2FsZS5wcmVwYXJzZShpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9tZW50LmlzTW9tZW50KGlucHV0KSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNb21lbnQoaW5wdXQsIHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkoZm9ybWF0KSkge1xuICAgICAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWFrZURhdGVGcm9tSW5wdXQoY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgbW9tZW50ID0gZnVuY3Rpb24gKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KSB7XG4gICAgICAgIHZhciBjO1xuXG4gICAgICAgIGlmICh0eXBlb2YobG9jYWxlKSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBzdHJpY3QgPSBsb2NhbGU7XG4gICAgICAgICAgICBsb2NhbGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXG4gICAgICAgIGMgPSB7fTtcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcbiAgICAgICAgYy5faSA9IGlucHV0O1xuICAgICAgICBjLl9mID0gZm9ybWF0O1xuICAgICAgICBjLl9sID0gbG9jYWxlO1xuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG4gICAgICAgIGMuX2lzVVRDID0gZmFsc2U7XG4gICAgICAgIGMuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuXG4gICAgICAgIHJldHVybiBtYWtlTW9tZW50KGMpO1xuICAgIH07XG5cbiAgICBtb21lbnQuc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID0gZmFsc2U7XG5cbiAgICBtb21lbnQuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQgY29uc3RydWN0aW9uIGZhbGxzIGJhY2sgdG8ganMgRGF0ZS4gVGhpcyBpcyAnICtcbiAgICAgICAgJ2Rpc2NvdXJhZ2VkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdXBjb21pbmcgbWFqb3IgJyArXG4gICAgICAgICdyZWxlYXNlLiBQbGVhc2UgcmVmZXIgdG8gJyArXG4gICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQwNyBmb3IgbW9yZSBpbmZvLicsXG4gICAgICAgIGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5faSk7XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gUGljayBhIG1vbWVudCBtIGZyb20gbW9tZW50cyBzbyB0aGF0IG1bZm5dKG90aGVyKSBpcyB0cnVlIGZvciBhbGxcbiAgICAvLyBvdGhlci4gVGhpcyByZWxpZXMgb24gdGhlIGZ1bmN0aW9uIGZuIHRvIGJlIHRyYW5zaXRpdmUuXG4gICAgLy9cbiAgICAvLyBtb21lbnRzIHNob3VsZCBlaXRoZXIgYmUgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMgb3IgYW4gYXJyYXksIHdob3NlXG4gICAgLy8gZmlyc3QgZWxlbWVudCBpcyBhbiBhcnJheSBvZiBtb21lbnQgb2JqZWN0cy5cbiAgICBmdW5jdGlvbiBwaWNrQnkoZm4sIG1vbWVudHMpIHtcbiAgICAgICAgdmFyIHJlcywgaTtcbiAgICAgICAgaWYgKG1vbWVudHMubGVuZ3RoID09PSAxICYmIGlzQXJyYXkobW9tZW50c1swXSkpIHtcbiAgICAgICAgICAgIG1vbWVudHMgPSBtb21lbnRzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbW9tZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXMgPSBtb21lbnRzWzBdO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbW9tZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKG1vbWVudHNbaV1bZm5dKHJlcykpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBtb21lbnRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgbW9tZW50Lm1pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNCZWZvcmUnLCBhcmdzKTtcbiAgICB9O1xuXG4gICAgbW9tZW50Lm1heCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xuICAgIH07XG5cbiAgICAvLyBjcmVhdGluZyB3aXRoIHV0Y1xuICAgIG1vbWVudC51dGMgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICAgICAgdmFyIGM7XG5cbiAgICAgICAgaWYgKHR5cGVvZihsb2NhbGUpID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHN0cmljdCA9IGxvY2FsZTtcbiAgICAgICAgICAgIGxvY2FsZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYyA9IHt9O1xuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xuICAgICAgICBjLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICBjLl9pc1VUQyA9IHRydWU7XG4gICAgICAgIGMuX2wgPSBsb2NhbGU7XG4gICAgICAgIGMuX2kgPSBpbnB1dDtcbiAgICAgICAgYy5fZiA9IGZvcm1hdDtcbiAgICAgICAgYy5fc3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBjLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcblxuICAgICAgICByZXR1cm4gbWFrZU1vbWVudChjKS51dGMoKTtcbiAgICB9O1xuXG4gICAgLy8gY3JlYXRpbmcgd2l0aCB1bml4IHRpbWVzdGFtcCAoaW4gc2Vjb25kcylcbiAgICBtb21lbnQudW5peCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0ICogMTAwMCk7XG4gICAgfTtcblxuICAgIC8vIGR1cmF0aW9uXG4gICAgbW9tZW50LmR1cmF0aW9uID0gZnVuY3Rpb24gKGlucHV0LCBrZXkpIHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gaW5wdXQsXG4gICAgICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsLFxuICAgICAgICAgICAgc2lnbixcbiAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgIHBhcnNlSXNvLFxuICAgICAgICAgICAgZGlmZlJlcztcblxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBtczogaW5wdXQuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgICAgICBNOiBpbnB1dC5fbW9udGhzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb25ba2V5XSA9IGlucHV0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGFzcE5ldFRpbWVTcGFuSnNvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gJy0nKSA/IC0xIDogMTtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgZDogdG9JbnQobWF0Y2hbREFURV0pICogc2lnbixcbiAgICAgICAgICAgICAgICBoOiB0b0ludChtYXRjaFtIT1VSXSkgKiBzaWduLFxuICAgICAgICAgICAgICAgIG06IHRvSW50KG1hdGNoW01JTlVURV0pICogc2lnbixcbiAgICAgICAgICAgICAgICBzOiB0b0ludChtYXRjaFtTRUNPTkRdKSAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbXM6IHRvSW50KG1hdGNoW01JTExJU0VDT05EXSkgKiBzaWduXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gaXNvRHVyYXRpb25SZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09ICctJykgPyAtMSA6IDE7XG4gICAgICAgICAgICBwYXJzZUlzbyA9IGZ1bmN0aW9uIChpbnApIHtcbiAgICAgICAgICAgICAgICAvLyBXZSdkIG5vcm1hbGx5IHVzZSB+fmlucCBmb3IgdGhpcywgYnV0IHVuZm9ydHVuYXRlbHkgaXQgYWxzb1xuICAgICAgICAgICAgICAgIC8vIGNvbnZlcnRzIGZsb2F0cyB0byBpbnRzLlxuICAgICAgICAgICAgICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cbiAgICAgICAgICAgICAgICB2YXIgcmVzID0gaW5wICYmIHBhcnNlRmxvYXQoaW5wLnJlcGxhY2UoJywnLCAnLicpKTtcbiAgICAgICAgICAgICAgICAvLyBhcHBseSBzaWduIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHk6IHBhcnNlSXNvKG1hdGNoWzJdKSxcbiAgICAgICAgICAgICAgICBNOiBwYXJzZUlzbyhtYXRjaFszXSksXG4gICAgICAgICAgICAgICAgZDogcGFyc2VJc28obWF0Y2hbNF0pLFxuICAgICAgICAgICAgICAgIGg6IHBhcnNlSXNvKG1hdGNoWzVdKSxcbiAgICAgICAgICAgICAgICBtOiBwYXJzZUlzbyhtYXRjaFs2XSksXG4gICAgICAgICAgICAgICAgczogcGFyc2VJc28obWF0Y2hbN10pLFxuICAgICAgICAgICAgICAgIHc6IHBhcnNlSXNvKG1hdGNoWzhdKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICAgICAgKCdmcm9tJyBpbiBkdXJhdGlvbiB8fCAndG8nIGluIGR1cmF0aW9uKSkge1xuICAgICAgICAgICAgZGlmZlJlcyA9IG1vbWVudHNEaWZmZXJlbmNlKG1vbWVudChkdXJhdGlvbi5mcm9tKSwgbW9tZW50KGR1cmF0aW9uLnRvKSk7XG5cbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgICAgICBkdXJhdGlvbi5tcyA9IGRpZmZSZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgZHVyYXRpb24uTSA9IGRpZmZSZXMubW9udGhzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0ID0gbmV3IER1cmF0aW9uKGR1cmF0aW9uKTtcblxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpICYmIGhhc093blByb3AoaW5wdXQsICdfbG9jYWxlJykpIHtcbiAgICAgICAgICAgIHJldC5fbG9jYWxlID0gaW5wdXQuX2xvY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbW9tZW50LnZlcnNpb24gPSBWRVJTSU9OO1xuXG4gICAgLy8gZGVmYXVsdCBmb3JtYXRcbiAgICBtb21lbnQuZGVmYXVsdEZvcm1hdCA9IGlzb0Zvcm1hdDtcblxuICAgIC8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBJU08gc3RhbmRhcmRcbiAgICBtb21lbnQuSVNPXzg2MDEgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIC8vIFBsdWdpbnMgdGhhdCBhZGQgcHJvcGVydGllcyBzaG91bGQgYWxzbyBhZGQgdGhlIGtleSBoZXJlIChudWxsIHZhbHVlKSxcbiAgICAvLyBzbyB3ZSBjYW4gcHJvcGVybHkgY2xvbmUgb3Vyc2VsdmVzLlxuICAgIG1vbWVudC5tb21lbnRQcm9wZXJ0aWVzID0gbW9tZW50UHJvcGVydGllcztcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBtb21lbnQgaXMgbXV0YXRlZC5cbiAgICAvLyBJdCBpcyBpbnRlbmRlZCB0byBrZWVwIHRoZSBvZmZzZXQgaW4gc3luYyB3aXRoIHRoZSB0aW1lem9uZS5cbiAgICBtb21lbnQudXBkYXRlT2Zmc2V0ID0gZnVuY3Rpb24gKCkge307XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IGEgdGhyZXNob2xkIGZvciByZWxhdGl2ZSB0aW1lIHN0cmluZ3NcbiAgICBtb21lbnQucmVsYXRpdmVUaW1lVGhyZXNob2xkID0gZnVuY3Rpb24gKHRocmVzaG9sZCwgbGltaXQpIHtcbiAgICAgICAgaWYgKHJlbGF0aXZlVGltZVRocmVzaG9sZHNbdGhyZXNob2xkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbWl0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzW3RocmVzaG9sZF07XG4gICAgICAgIH1cbiAgICAgICAgcmVsYXRpdmVUaW1lVGhyZXNob2xkc1t0aHJlc2hvbGRdID0gbGltaXQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBtb21lbnQubGFuZyA9IGRlcHJlY2F0ZShcbiAgICAgICAgJ21vbWVudC5sYW5nIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlIGluc3RlYWQuJyxcbiAgICAgICAgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQubG9jYWxlKGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxvY2FsZSBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsb2NhbGUuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXG4gICAgLy8gbG9jYWxlIGtleS5cbiAgICBtb21lbnQubG9jYWxlID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIHZhciBkYXRhO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mKHZhbHVlcykgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IG1vbWVudC5kZWZpbmVMb2NhbGUoa2V5LCB2YWx1ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IG1vbWVudC5sb2NhbGVEYXRhKGtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgbW9tZW50LmR1cmF0aW9uLl9sb2NhbGUgPSBtb21lbnQuX2xvY2FsZSA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbW9tZW50Ll9sb2NhbGUuX2FiYnI7XG4gICAgfTtcblxuICAgIG1vbWVudC5kZWZpbmVMb2NhbGUgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWVzKSB7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlcy5hYmJyID0gbmFtZTtcbiAgICAgICAgICAgIGlmICghbG9jYWxlc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvY2FsZXNbbmFtZV0gPSBuZXcgTG9jYWxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdLnNldCh2YWx1ZXMpO1xuXG4gICAgICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgICAgIG1vbWVudC5sb2NhbGUobmFtZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBsb2NhbGVzW25hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXNlZnVsIGZvciB0ZXN0aW5nXG4gICAgICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG1vbWVudC5sYW5nRGF0YSA9IGRlcHJlY2F0ZShcbiAgICAgICAgJ21vbWVudC5sYW5nRGF0YSBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50LmxvY2FsZURhdGEgaW5zdGVhZC4nLFxuICAgICAgICBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmxvY2FsZURhdGEoa2V5KTtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvLyByZXR1cm5zIGxvY2FsZSBkYXRhXG4gICAgbW9tZW50LmxvY2FsZURhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHZhciBsb2NhbGU7XG5cbiAgICAgICAgaWYgKGtleSAmJiBrZXkuX2xvY2FsZSAmJiBrZXkuX2xvY2FsZS5fYWJicikge1xuICAgICAgICAgICAga2V5ID0ga2V5Ll9sb2NhbGUuX2FiYnI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5fbG9jYWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc0FycmF5KGtleSkpIHtcbiAgICAgICAgICAgIC8vc2hvcnQtY2lyY3VpdCBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgICAgIGxvY2FsZSA9IGxvYWRMb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jYWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2V5ID0gW2tleV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hvb3NlTG9jYWxlKGtleSk7XG4gICAgfTtcblxuICAgIC8vIGNvbXBhcmUgbW9tZW50IG9iamVjdFxuICAgIG1vbWVudC5pc01vbWVudCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1vbWVudCB8fFxuICAgICAgICAgICAgKG9iaiAhPSBudWxsICYmIGhhc093blByb3Aob2JqLCAnX2lzQU1vbWVudE9iamVjdCcpKTtcbiAgICB9O1xuXG4gICAgLy8gZm9yIHR5cGVjaGVja2luZyBEdXJhdGlvbiBvYmplY3RzXG4gICAgbW9tZW50LmlzRHVyYXRpb24gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEdXJhdGlvbjtcbiAgICB9O1xuXG4gICAgZm9yIChpID0gbGlzdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgbWFrZUxpc3QobGlzdHNbaV0pO1xuICAgIH1cblxuICAgIG1vbWVudC5ub3JtYWxpemVVbml0cyA9IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgIH07XG5cbiAgICBtb21lbnQuaW52YWxpZCA9IGZ1bmN0aW9uIChmbGFncykge1xuICAgICAgICB2YXIgbSA9IG1vbWVudC51dGMoTmFOKTtcbiAgICAgICAgaWYgKGZsYWdzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGV4dGVuZChtLl9wZiwgZmxhZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbS5fcGYudXNlckludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG5cbiAgICBtb21lbnQucGFyc2Vab25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cykucGFyc2Vab25lKCk7XG4gICAgfTtcblxuICAgIG1vbWVudC5wYXJzZVR3b0RpZ2l0WWVhciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gdG9JbnQoaW5wdXQpICsgKHRvSW50KGlucHV0KSA+IDY4ID8gMTkwMCA6IDIwMDApO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIE1vbWVudCBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGV4dGVuZChtb21lbnQuZm4gPSBNb21lbnQucHJvdG90eXBlLCB7XG5cbiAgICAgICAgY2xvbmUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZhbHVlT2YgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gK3RoaXMuX2QgKyAoKHRoaXMuX29mZnNldCB8fCAwKSAqIDYwMDAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bml4IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoK3RoaXMgLyAxMDAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkubG9jYWxlKCdlbicpLmZvcm1hdCgnZGRkIE1NTSBERCBZWVlZIEhIOm1tOnNzIFtHTVRdWlonKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b0RhdGUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb2Zmc2V0ID8gbmV3IERhdGUoK3RoaXMpIDogdGhpcy5fZDtcbiAgICAgICAgfSxcblxuICAgICAgICB0b0lTT1N0cmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtID0gbW9tZW50KHRoaXMpLnV0YygpO1xuICAgICAgICAgICAgaWYgKDAgPCBtLnllYXIoKSAmJiBtLnllYXIoKSA8PSA5OTk5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE1vbWVudChtLCAnWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB0b0FycmF5IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG0gPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBtLnllYXIoKSxcbiAgICAgICAgICAgICAgICBtLm1vbnRoKCksXG4gICAgICAgICAgICAgICAgbS5kYXRlKCksXG4gICAgICAgICAgICAgICAgbS5ob3VycygpLFxuICAgICAgICAgICAgICAgIG0ubWludXRlcygpLFxuICAgICAgICAgICAgICAgIG0uc2Vjb25kcygpLFxuICAgICAgICAgICAgICAgIG0ubWlsbGlzZWNvbmRzKClcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNWYWxpZCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpc1ZhbGlkKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzRFNUU2hpZnRlZCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpICYmIGNvbXBhcmVBcnJheXModGhpcy5fYSwgKHRoaXMuX2lzVVRDID8gbW9tZW50LnV0Yyh0aGlzLl9hKSA6IG1vbWVudCh0aGlzLl9hKSkudG9BcnJheSgpKSA+IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzaW5nRmxhZ3MgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5kKHt9LCB0aGlzLl9wZik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52YWxpZEF0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGYub3ZlcmZsb3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXRjIDogZnVuY3Rpb24gKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmUoMCwga2VlcExvY2FsVGltZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9jYWwgOiBmdW5jdGlvbiAoa2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzVVRDKSB7XG4gICAgICAgICAgICAgICAgdGhpcy56b25lKDAsIGtlZXBMb2NhbFRpbWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lzVVRDID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpZiAoa2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZCh0aGlzLl9kYXRlVHpPZmZzZXQoKSwgJ20nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBmb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSBmb3JtYXRNb21lbnQodGhpcywgaW5wdXRTdHJpbmcgfHwgbW9tZW50LmRlZmF1bHRGb3JtYXQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBjcmVhdGVBZGRlcigxLCAnYWRkJyksXG5cbiAgICAgICAgc3VidHJhY3QgOiBjcmVhdGVBZGRlcigtMSwgJ3N1YnRyYWN0JyksXG5cbiAgICAgICAgZGlmZiA6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMsIGFzRmxvYXQpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gbWFrZUFzKGlucHV0LCB0aGlzKSxcbiAgICAgICAgICAgICAgICB6b25lRGlmZiA9ICh0aGlzLnpvbmUoKSAtIHRoYXQuem9uZSgpKSAqIDZlNCxcbiAgICAgICAgICAgICAgICBkaWZmLCBvdXRwdXQsIGRheXNBZGp1c3Q7XG5cbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICd5ZWFyJyB8fCB1bml0cyA9PT0gJ21vbnRoJykge1xuICAgICAgICAgICAgICAgIC8vIGF2ZXJhZ2UgbnVtYmVyIG9mIGRheXMgaW4gdGhlIG1vbnRocyBpbiB0aGUgZ2l2ZW4gZGF0ZXNcbiAgICAgICAgICAgICAgICBkaWZmID0gKHRoaXMuZGF5c0luTW9udGgoKSArIHRoYXQuZGF5c0luTW9udGgoKSkgKiA0MzJlNTsgLy8gMjQgKiA2MCAqIDYwICogMTAwMCAvIDJcbiAgICAgICAgICAgICAgICAvLyBkaWZmZXJlbmNlIGluIG1vbnRoc1xuICAgICAgICAgICAgICAgIG91dHB1dCA9ICgodGhpcy55ZWFyKCkgLSB0aGF0LnllYXIoKSkgKiAxMikgKyAodGhpcy5tb250aCgpIC0gdGhhdC5tb250aCgpKTtcbiAgICAgICAgICAgICAgICAvLyBhZGp1c3QgYnkgdGFraW5nIGRpZmZlcmVuY2UgaW4gZGF5cywgYXZlcmFnZSBudW1iZXIgb2YgZGF5c1xuICAgICAgICAgICAgICAgIC8vIGFuZCBkc3QgaW4gdGhlIGdpdmVuIG1vbnRocy5cbiAgICAgICAgICAgICAgICBkYXlzQWRqdXN0ID0gKHRoaXMgLSBtb21lbnQodGhpcykuc3RhcnRPZignbW9udGgnKSkgLVxuICAgICAgICAgICAgICAgICAgICAodGhhdCAtIG1vbWVudCh0aGF0KS5zdGFydE9mKCdtb250aCcpKTtcbiAgICAgICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aXRoIHpvbmVzLCB0byBuZWdhdGUgYWxsIGRzdFxuICAgICAgICAgICAgICAgIGRheXNBZGp1c3QgLT0gKCh0aGlzLnpvbmUoKSAtIG1vbWVudCh0aGlzKS5zdGFydE9mKCdtb250aCcpLnpvbmUoKSkgLVxuICAgICAgICAgICAgICAgICAgICAgICAgKHRoYXQuem9uZSgpIC0gbW9tZW50KHRoYXQpLnN0YXJ0T2YoJ21vbnRoJykuem9uZSgpKSkgKiA2ZTQ7XG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9IGRheXNBZGp1c3QgLyBkaWZmO1xuICAgICAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3llYXInKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCAvIDEyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlmZiA9ICh0aGlzIC0gdGhhdCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdW5pdHMgPT09ICdzZWNvbmQnID8gZGlmZiAvIDFlMyA6IC8vIDEwMDBcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPT09ICdtaW51dGUnID8gZGlmZiAvIDZlNCA6IC8vIDEwMDAgKiA2MFxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ2hvdXInID8gZGlmZiAvIDM2ZTUgOiAvLyAxMDAwICogNjAgKiA2MFxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ2RheScgPyAoZGlmZiAtIHpvbmVEaWZmKSAvIDg2NGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCwgbmVnYXRlIGRzdFxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ3dlZWsnID8gKGRpZmYgLSB6b25lRGlmZikgLyA2MDQ4ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0ICogNywgbmVnYXRlIGRzdFxuICAgICAgICAgICAgICAgICAgICBkaWZmO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFzRmxvYXQgPyBvdXRwdXQgOiBhYnNSb3VuZChvdXRwdXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZyb20gOiBmdW5jdGlvbiAodGltZSwgd2l0aG91dFN1ZmZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5kdXJhdGlvbih7dG86IHRoaXMsIGZyb206IHRpbWV9KS5sb2NhbGUodGhpcy5sb2NhbGUoKSkuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZyb21Ob3cgOiBmdW5jdGlvbiAod2l0aG91dFN1ZmZpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJvbShtb21lbnQoKSwgd2l0aG91dFN1ZmZpeCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsZW5kYXIgOiBmdW5jdGlvbiAodGltZSkge1xuICAgICAgICAgICAgLy8gV2Ugd2FudCB0byBjb21wYXJlIHRoZSBzdGFydCBvZiB0b2RheSwgdnMgdGhpcy5cbiAgICAgICAgICAgIC8vIEdldHRpbmcgc3RhcnQtb2YtdG9kYXkgZGVwZW5kcyBvbiB3aGV0aGVyIHdlJ3JlIHpvbmUnZCBvciBub3QuXG4gICAgICAgICAgICB2YXIgbm93ID0gdGltZSB8fCBtb21lbnQoKSxcbiAgICAgICAgICAgICAgICBzb2QgPSBtYWtlQXMobm93LCB0aGlzKS5zdGFydE9mKCdkYXknKSxcbiAgICAgICAgICAgICAgICBkaWZmID0gdGhpcy5kaWZmKHNvZCwgJ2RheXMnLCB0cnVlKSxcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBkaWZmIDwgLTYgPyAnc2FtZUVsc2UnIDpcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IC0xID8gJ2xhc3RXZWVrJyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAwID8gJ2xhc3REYXknIDpcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDEgPyAnc2FtZURheScgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMiA/ICduZXh0RGF5JyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCA3ID8gJ25leHRXZWVrJyA6ICdzYW1lRWxzZSc7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXQodGhpcy5sb2NhbGVEYXRhKCkuY2FsZW5kYXIoZm9ybWF0LCB0aGlzKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNMZWFwWWVhciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpc0xlYXBZZWFyKHRoaXMueWVhcigpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0RTVCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy56b25lKCkgPCB0aGlzLmNsb25lKCkubW9udGgoMCkuem9uZSgpIHx8XG4gICAgICAgICAgICAgICAgdGhpcy56b25lKCkgPCB0aGlzLmNsb25lKCkubW9udGgoNSkuem9uZSgpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkYXkgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBkYXkgPSB0aGlzLl9pc1VUQyA/IHRoaXMuX2QuZ2V0VVRDRGF5KCkgOiB0aGlzLl9kLmdldERheSgpO1xuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IHBhcnNlV2Vla2RheShpbnB1dCwgdGhpcy5sb2NhbGVEYXRhKCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZChpbnB1dCAtIGRheSwgJ2QnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRheTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBtb250aCA6IG1ha2VBY2Nlc3NvcignTW9udGgnLCB0cnVlKSxcblxuICAgICAgICBzdGFydE9mIDogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIC8vIHRoZSBmb2xsb3dpbmcgc3dpdGNoIGludGVudGlvbmFsbHkgb21pdHMgYnJlYWsga2V5d29yZHNcbiAgICAgICAgICAgIC8vIHRvIHV0aWxpemUgZmFsbGluZyB0aHJvdWdoIHRoZSBjYXNlcy5cbiAgICAgICAgICAgIHN3aXRjaCAodW5pdHMpIHtcbiAgICAgICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgICAgIHRoaXMubW9udGgoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAncXVhcnRlcic6XG4gICAgICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRlKDEpO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnaXNvV2Vlayc6XG4gICAgICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XG4gICAgICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3ZWVrcyBhcmUgYSBzcGVjaWFsIGNhc2VcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ3dlZWsnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh1bml0cyA9PT0gJ2lzb1dlZWsnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc29XZWVrZGF5KDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBxdWFydGVycyBhcmUgYWxzbyBzcGVjaWFsXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgICAgIHRoaXMubW9udGgoTWF0aC5mbG9vcih0aGlzLm1vbnRoKCkgLyAzKSAqIDMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBlbmRPZjogZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0T2YodW5pdHMpLmFkZCgxLCAodW5pdHMgPT09ICdpc29XZWVrJyA/ICd3ZWVrJyA6IHVuaXRzKSkuc3VidHJhY3QoMSwgJ21zJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNBZnRlcjogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh0eXBlb2YgdW5pdHMgIT09ICd1bmRlZmluZWQnID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbW9tZW50LmlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogbW9tZW50KGlucHV0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gK3RoaXMgPiAraW5wdXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiArdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpID4gK21vbWVudChpbnB1dCkuc3RhcnRPZih1bml0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNCZWZvcmU6IGZ1bmN0aW9uIChpbnB1dCwgdW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModHlwZW9mIHVuaXRzICE9PSAndW5kZWZpbmVkJyA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJyk7XG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG1vbWVudC5pc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IG1vbWVudChpbnB1dCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICt0aGlzIDwgK2lucHV0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gK3RoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKSA8ICttb21lbnQoaW5wdXQpLnN0YXJ0T2YodW5pdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGlzU2FtZTogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyB8fCAnbWlsbGlzZWNvbmQnKTtcbiAgICAgICAgICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbW9tZW50LmlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogbW9tZW50KGlucHV0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gK3RoaXMgPT09ICtpbnB1dDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICt0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykgPT09ICttYWtlQXMoaW5wdXQsIHRoaXMpLnN0YXJ0T2YodW5pdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG1pbjogZGVwcmVjYXRlKFxuICAgICAgICAgICAgICAgICAnbW9tZW50KCkubWluIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWluIGluc3RlYWQuIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNTQ4JyxcbiAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICBvdGhlciA9IG1vbWVudC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG90aGVyIDwgdGhpcyA/IHRoaXMgOiBvdGhlcjtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgKSxcblxuICAgICAgICBtYXg6IGRlcHJlY2F0ZShcbiAgICAgICAgICAgICAgICAnbW9tZW50KCkubWF4IGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWF4IGluc3RlYWQuIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNTQ4JyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgb3RoZXIgPSBtb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG90aGVyID4gdGhpcyA/IHRoaXMgOiBvdGhlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICksXG5cbiAgICAgICAgLy8ga2VlcExvY2FsVGltZSA9IHRydWUgbWVhbnMgb25seSBjaGFuZ2UgdGhlIHRpbWV6b25lLCB3aXRob3V0XG4gICAgICAgIC8vIGFmZmVjdGluZyB0aGUgbG9jYWwgaG91ci4gU28gNTozMToyNiArMDMwMCAtLVt6b25lKDIsIHRydWUpXS0tPlxuICAgICAgICAvLyA1OjMxOjI2ICswMjAwIEl0IGlzIHBvc3NpYmxlIHRoYXQgNTozMToyNiBkb2Vzbid0IGV4aXN0IGludCB6b25lXG4gICAgICAgIC8vICswMjAwLCBzbyB3ZSBhZGp1c3QgdGhlIHRpbWUgYXMgbmVlZGVkLCB0byBiZSB2YWxpZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gS2VlcGluZyB0aGUgdGltZSBhY3R1YWxseSBhZGRzL3N1YnRyYWN0cyAob25lIGhvdXIpXG4gICAgICAgIC8vIGZyb20gdGhlIGFjdHVhbCByZXByZXNlbnRlZCB0aW1lLiBUaGF0IGlzIHdoeSB3ZSBjYWxsIHVwZGF0ZU9mZnNldFxuICAgICAgICAvLyBhIHNlY29uZCB0aW1lLiBJbiBjYXNlIGl0IHdhbnRzIHVzIHRvIGNoYW5nZSB0aGUgb2Zmc2V0IGFnYWluXG4gICAgICAgIC8vIF9jaGFuZ2VJblByb2dyZXNzID09IHRydWUgY2FzZSwgdGhlbiB3ZSBoYXZlIHRvIGFkanVzdCwgYmVjYXVzZVxuICAgICAgICAvLyB0aGVyZSBpcyBubyBzdWNoIHRpbWUgaW4gdGhlIGdpdmVuIHRpbWV6b25lLlxuICAgICAgICB6b25lIDogZnVuY3Rpb24gKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fb2Zmc2V0IHx8IDAsXG4gICAgICAgICAgICAgICAgbG9jYWxBZGp1c3Q7XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gdGltZXpvbmVNaW51dGVzRnJvbVN0cmluZyhpbnB1dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNikge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IGlucHV0ICogNjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5faXNVVEMgJiYga2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbEFkanVzdCA9IHRoaXMuX2RhdGVUek9mZnNldCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1VUQyA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2FsQWRqdXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdChsb2NhbEFkanVzdCwgJ20nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCAhPT0gaW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFrZWVwTG9jYWxUaW1lIHx8IHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZE9yU3VidHJhY3REdXJhdGlvbkZyb21Nb21lbnQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9tZW50LmR1cmF0aW9uKG9mZnNldCAtIGlucHV0LCAnbScpLCAxLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9tZW50LnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBvZmZzZXQgOiB0aGlzLl9kYXRlVHpPZmZzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHpvbmVBYmJyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gJ1VUQycgOiAnJztcbiAgICAgICAgfSxcblxuICAgICAgICB6b25lTmFtZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/ICdDb29yZGluYXRlZCBVbml2ZXJzYWwgVGltZScgOiAnJztcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZVpvbmUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdHptKSB7XG4gICAgICAgICAgICAgICAgdGhpcy56b25lKHRoaXMuX3R6bSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLl9pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMuem9uZSh0aGlzLl9pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhc0FsaWduZWRIb3VyT2Zmc2V0IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICBpZiAoIWlucHV0KSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBtb21lbnQoaW5wdXQpLnpvbmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnpvbmUoKSAtIGlucHV0KSAlIDYwID09PSAwO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRheXNJbk1vbnRoIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRheXNJbk1vbnRoKHRoaXMueWVhcigpLCB0aGlzLm1vbnRoKCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRheU9mWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIGRheU9mWWVhciA9IHJvdW5kKChtb21lbnQodGhpcykuc3RhcnRPZignZGF5JykgLSBtb21lbnQodGhpcykuc3RhcnRPZigneWVhcicpKSAvIDg2NGU1KSArIDE7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IGRheU9mWWVhciA6IHRoaXMuYWRkKChpbnB1dCAtIGRheU9mWWVhciksICdkJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcXVhcnRlciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSArIDEpIC8gMykgOiB0aGlzLm1vbnRoKChpbnB1dCAtIDEpICogMyArIHRoaXMubW9udGgoKSAlIDMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93LCB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3kpLnllYXI7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSB5ZWFyKSwgJ3knKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc29XZWVrWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHllYXIgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLnllYXI7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSB5ZWFyKSwgJ3knKTtcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgd2VlayA9IHRoaXMubG9jYWxlRGF0YSgpLndlZWsodGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNvV2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWsgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLndlZWs7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2Vla2RheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWtkYXkgPSAodGhpcy5kYXkoKSArIDcgLSB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3cpICUgNztcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2Vla2RheSA6IHRoaXMuYWRkKGlucHV0IC0gd2Vla2RheSwgJ2QnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc29XZWVrZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICAvLyBiZWhhdmVzIHRoZSBzYW1lIGFzIG1vbWVudCNkYXkgZXhjZXB0XG4gICAgICAgICAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxuICAgICAgICAgICAgLy8gYXMgYSBzZXR0ZXIsIHN1bmRheSBzaG91bGQgYmVsb25nIHRvIHRoZSBwcmV2aW91cyB3ZWVrLlxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB0aGlzLmRheSgpIHx8IDcgOiB0aGlzLmRheSh0aGlzLmRheSgpICUgNyA/IGlucHV0IDogaW5wdXQgLSA3KTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc29XZWVrc0luWWVhciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgMSwgNCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2Vla3NJblllYXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgd2Vla0luZm8gPSB0aGlzLmxvY2FsZURhdGEoKS5fd2VlaztcbiAgICAgICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgd2Vla0luZm8uZG93LCB3ZWVrSW5mby5kb3kpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldCA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1t1bml0c10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodW5pdHMsIHZhbHVlKSB7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1t1bml0c10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3VuaXRzXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBJZiBwYXNzZWQgYSBsb2NhbGUga2V5LCBpdCB3aWxsIHNldCB0aGUgbG9jYWxlIGZvciB0aGlzXG4gICAgICAgIC8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbG9jYWxlIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgLy8gdmFyaWFibGVzIGZvciB0aGlzIGluc3RhbmNlLlxuICAgICAgICBsb2NhbGUgOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgbmV3TG9jYWxlRGF0YTtcblxuICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZS5fYWJicjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV3TG9jYWxlRGF0YSA9IG1vbWVudC5sb2NhbGVEYXRhKGtleSk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld0xvY2FsZURhdGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2NhbGUgPSBuZXdMb2NhbGVEYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBsYW5nIDogZGVwcmVjYXRlKFxuICAgICAgICAgICAgJ21vbWVudCgpLmxhbmcoKSBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50KCkubG9jYWxlRGF0YSgpIGluc3RlYWQuJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZShrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKSxcblxuICAgICAgICBsb2NhbGVEYXRhIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZGF0ZVR6T2Zmc2V0IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT24gRmlyZWZveC4yNCBEYXRlI2dldFRpbWV6b25lT2Zmc2V0IHJldHVybnMgYSBmbG9hdGluZyBwb2ludC5cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L3B1bGwvMTg3MVxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5fZC5nZXRUaW1lem9uZU9mZnNldCgpIC8gMTUpICogMTU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHJhd01vbnRoU2V0dGVyKG1vbSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGRheU9mTW9udGg7XG5cbiAgICAgICAgLy8gVE9ETzogTW92ZSB0aGlzIG91dCBvZiBoZXJlIVxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFsdWUgPSBtb20ubG9jYWxlRGF0YSgpLm1vbnRoc1BhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgIC8vIFRPRE86IEFub3RoZXIgc2lsZW50IGZhaWx1cmU/XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb207XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkYXlPZk1vbnRoID0gTWF0aC5taW4obW9tLmRhdGUoKSxcbiAgICAgICAgICAgICAgICBkYXlzSW5Nb250aChtb20ueWVhcigpLCB2YWx1ZSkpO1xuICAgICAgICBtb20uX2RbJ3NldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgJ01vbnRoJ10odmFsdWUsIGRheU9mTW9udGgpO1xuICAgICAgICByZXR1cm4gbW9tO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJhd0dldHRlcihtb20sIHVuaXQpIHtcbiAgICAgICAgcmV0dXJuIG1vbS5fZFsnZ2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJhd1NldHRlcihtb20sIHVuaXQsIHZhbHVlKSB7XG4gICAgICAgIGlmICh1bml0ID09PSAnTW9udGgnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmF3TW9udGhTZXR0ZXIobW9tLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArIHVuaXRdKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VBY2Nlc3Nvcih1bml0LCBrZWVwVGltZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJhd1NldHRlcih0aGlzLCB1bml0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgbW9tZW50LnVwZGF0ZU9mZnNldCh0aGlzLCBrZWVwVGltZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiByYXdHZXR0ZXIodGhpcywgdW5pdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgbW9tZW50LmZuLm1pbGxpc2Vjb25kID0gbW9tZW50LmZuLm1pbGxpc2Vjb25kcyA9IG1ha2VBY2Nlc3NvcignTWlsbGlzZWNvbmRzJywgZmFsc2UpO1xuICAgIG1vbWVudC5mbi5zZWNvbmQgPSBtb21lbnQuZm4uc2Vjb25kcyA9IG1ha2VBY2Nlc3NvcignU2Vjb25kcycsIGZhbHNlKTtcbiAgICBtb21lbnQuZm4ubWludXRlID0gbW9tZW50LmZuLm1pbnV0ZXMgPSBtYWtlQWNjZXNzb3IoJ01pbnV0ZXMnLCBmYWxzZSk7XG4gICAgLy8gU2V0dGluZyB0aGUgaG91ciBzaG91bGQga2VlcCB0aGUgdGltZSwgYmVjYXVzZSB0aGUgdXNlciBleHBsaWNpdGx5XG4gICAgLy8gc3BlY2lmaWVkIHdoaWNoIGhvdXIgaGUgd2FudHMuIFNvIHRyeWluZyB0byBtYWludGFpbiB0aGUgc2FtZSBob3VyIChpblxuICAgIC8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xuICAgIC8vIHRoaXMgcnVsZS5cbiAgICBtb21lbnQuZm4uaG91ciA9IG1vbWVudC5mbi5ob3VycyA9IG1ha2VBY2Nlc3NvcignSG91cnMnLCB0cnVlKTtcbiAgICAvLyBtb21lbnQuZm4ubW9udGggaXMgZGVmaW5lZCBzZXBhcmF0ZWx5XG4gICAgbW9tZW50LmZuLmRhdGUgPSBtYWtlQWNjZXNzb3IoJ0RhdGUnLCB0cnVlKTtcbiAgICBtb21lbnQuZm4uZGF0ZXMgPSBkZXByZWNhdGUoJ2RhdGVzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBkYXRlIGluc3RlYWQuJywgbWFrZUFjY2Vzc29yKCdEYXRlJywgdHJ1ZSkpO1xuICAgIG1vbWVudC5mbi55ZWFyID0gbWFrZUFjY2Vzc29yKCdGdWxsWWVhcicsIHRydWUpO1xuICAgIG1vbWVudC5mbi55ZWFycyA9IGRlcHJlY2F0ZSgneWVhcnMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIHllYXIgaW5zdGVhZC4nLCBtYWtlQWNjZXNzb3IoJ0Z1bGxZZWFyJywgdHJ1ZSkpO1xuXG4gICAgLy8gYWRkIHBsdXJhbCBtZXRob2RzXG4gICAgbW9tZW50LmZuLmRheXMgPSBtb21lbnQuZm4uZGF5O1xuICAgIG1vbWVudC5mbi5tb250aHMgPSBtb21lbnQuZm4ubW9udGg7XG4gICAgbW9tZW50LmZuLndlZWtzID0gbW9tZW50LmZuLndlZWs7XG4gICAgbW9tZW50LmZuLmlzb1dlZWtzID0gbW9tZW50LmZuLmlzb1dlZWs7XG4gICAgbW9tZW50LmZuLnF1YXJ0ZXJzID0gbW9tZW50LmZuLnF1YXJ0ZXI7XG5cbiAgICAvLyBhZGQgYWxpYXNlZCBmb3JtYXQgbWV0aG9kc1xuICAgIG1vbWVudC5mbi50b0pTT04gPSBtb21lbnQuZm4udG9JU09TdHJpbmc7XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIER1cmF0aW9uIFByb3RvdHlwZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgZnVuY3Rpb24gZGF5c1RvWWVhcnMgKGRheXMpIHtcbiAgICAgICAgLy8gNDAwIHllYXJzIGhhdmUgMTQ2MDk3IGRheXMgKHRha2luZyBpbnRvIGFjY291bnQgbGVhcCB5ZWFyIHJ1bGVzKVxuICAgICAgICByZXR1cm4gZGF5cyAqIDQwMCAvIDE0NjA5NztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB5ZWFyc1RvRGF5cyAoeWVhcnMpIHtcbiAgICAgICAgLy8geWVhcnMgKiAzNjUgKyBhYnNSb3VuZCh5ZWFycyAvIDQpIC1cbiAgICAgICAgLy8gICAgIGFic1JvdW5kKHllYXJzIC8gMTAwKSArIGFic1JvdW5kKHllYXJzIC8gNDAwKTtcbiAgICAgICAgcmV0dXJuIHllYXJzICogMTQ2MDk3IC8gNDAwO1xuICAgIH1cblxuICAgIGV4dGVuZChtb21lbnQuZHVyYXRpb24uZm4gPSBEdXJhdGlvbi5wcm90b3R5cGUsIHtcblxuICAgICAgICBfYnViYmxlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyxcbiAgICAgICAgICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMsXG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2RhdGEsXG4gICAgICAgICAgICAgICAgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzID0gMDtcblxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxuICAgICAgICAgICAgLy8gZXhhbXBsZXMgb2Ygd2hhdCB0aGF0IG1lYW5zLlxuICAgICAgICAgICAgZGF0YS5taWxsaXNlY29uZHMgPSBtaWxsaXNlY29uZHMgJSAxMDAwO1xuXG4gICAgICAgICAgICBzZWNvbmRzID0gYWJzUm91bmQobWlsbGlzZWNvbmRzIC8gMTAwMCk7XG4gICAgICAgICAgICBkYXRhLnNlY29uZHMgPSBzZWNvbmRzICUgNjA7XG5cbiAgICAgICAgICAgIG1pbnV0ZXMgPSBhYnNSb3VuZChzZWNvbmRzIC8gNjApO1xuICAgICAgICAgICAgZGF0YS5taW51dGVzID0gbWludXRlcyAlIDYwO1xuXG4gICAgICAgICAgICBob3VycyA9IGFic1JvdW5kKG1pbnV0ZXMgLyA2MCk7XG4gICAgICAgICAgICBkYXRhLmhvdXJzID0gaG91cnMgJSAyNDtcblxuICAgICAgICAgICAgZGF5cyArPSBhYnNSb3VuZChob3VycyAvIDI0KTtcblxuICAgICAgICAgICAgLy8gQWNjdXJhdGVseSBjb252ZXJ0IGRheXMgdG8geWVhcnMsIGFzc3VtZSBzdGFydCBmcm9tIHllYXIgMC5cbiAgICAgICAgICAgIHllYXJzID0gYWJzUm91bmQoZGF5c1RvWWVhcnMoZGF5cykpO1xuICAgICAgICAgICAgZGF5cyAtPSBhYnNSb3VuZCh5ZWFyc1RvRGF5cyh5ZWFycykpO1xuXG4gICAgICAgICAgICAvLyAzMCBkYXlzIHRvIGEgbW9udGhcbiAgICAgICAgICAgIC8vIFRPRE8gKGlza3Jlbik6IFVzZSBhbmNob3IgZGF0ZSAobGlrZSAxc3QgSmFuKSB0byBjb21wdXRlIHRoaXMuXG4gICAgICAgICAgICBtb250aHMgKz0gYWJzUm91bmQoZGF5cyAvIDMwKTtcbiAgICAgICAgICAgIGRheXMgJT0gMzA7XG5cbiAgICAgICAgICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICAgICAgICAgIHllYXJzICs9IGFic1JvdW5kKG1vbnRocyAvIDEyKTtcbiAgICAgICAgICAgIG1vbnRocyAlPSAxMjtcblxuICAgICAgICAgICAgZGF0YS5kYXlzID0gZGF5cztcbiAgICAgICAgICAgIGRhdGEubW9udGhzID0gbW9udGhzO1xuICAgICAgICAgICAgZGF0YS55ZWFycyA9IHllYXJzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFicyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9IE1hdGguYWJzKHRoaXMuX21pbGxpc2Vjb25kcyk7XG4gICAgICAgICAgICB0aGlzLl9kYXlzID0gTWF0aC5hYnModGhpcy5fZGF5cyk7XG4gICAgICAgICAgICB0aGlzLl9tb250aHMgPSBNYXRoLmFicyh0aGlzLl9tb250aHMpO1xuXG4gICAgICAgICAgICB0aGlzLl9kYXRhLm1pbGxpc2Vjb25kcyA9IE1hdGguYWJzKHRoaXMuX2RhdGEubWlsbGlzZWNvbmRzKTtcbiAgICAgICAgICAgIHRoaXMuX2RhdGEuc2Vjb25kcyA9IE1hdGguYWJzKHRoaXMuX2RhdGEuc2Vjb25kcyk7XG4gICAgICAgICAgICB0aGlzLl9kYXRhLm1pbnV0ZXMgPSBNYXRoLmFicyh0aGlzLl9kYXRhLm1pbnV0ZXMpO1xuICAgICAgICAgICAgdGhpcy5fZGF0YS5ob3VycyA9IE1hdGguYWJzKHRoaXMuX2RhdGEuaG91cnMpO1xuICAgICAgICAgICAgdGhpcy5fZGF0YS5tb250aHMgPSBNYXRoLmFicyh0aGlzLl9kYXRhLm1vbnRocyk7XG4gICAgICAgICAgICB0aGlzLl9kYXRhLnllYXJzID0gTWF0aC5hYnModGhpcy5fZGF0YS55ZWFycyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFic1JvdW5kKHRoaXMuZGF5cygpIC8gNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9taWxsaXNlY29uZHMgK1xuICAgICAgICAgICAgICB0aGlzLl9kYXlzICogODY0ZTUgK1xuICAgICAgICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcbiAgICAgICAgICAgICAgdG9JbnQodGhpcy5fbW9udGhzIC8gMTIpICogMzE1MzZlNjtcbiAgICAgICAgfSxcblxuICAgICAgICBodW1hbml6ZSA6IGZ1bmN0aW9uICh3aXRoU3VmZml4KSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gcmVsYXRpdmVUaW1lKHRoaXMsICF3aXRoU3VmZml4LCB0aGlzLmxvY2FsZURhdGEoKSk7XG5cbiAgICAgICAgICAgIGlmICh3aXRoU3VmZml4KSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5sb2NhbGVEYXRhKCkucGFzdEZ1dHVyZSgrdGhpcywgb3V0cHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgYWRkKDEsICdzJykgb3IgYWRkKG1vbWVudClcbiAgICAgICAgICAgIHZhciBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XG5cbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArPSBkdXIuX21pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIHRoaXMuX2RheXMgKz0gZHVyLl9kYXlzO1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzICs9IGR1ci5fbW9udGhzO1xuXG4gICAgICAgICAgICB0aGlzLl9idWJibGUoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgdmFyIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcblxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzIC09IGR1ci5fbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgdGhpcy5fZGF5cyAtPSBkdXIuX2RheXM7XG4gICAgICAgICAgICB0aGlzLl9tb250aHMgLT0gZHVyLl9tb250aHM7XG5cbiAgICAgICAgICAgIHRoaXMuX2J1YmJsZSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBnZXQgOiBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHMudG9Mb3dlckNhc2UoKSArICdzJ10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcyA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdmFyIGRheXMsIG1vbnRocztcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdtb250aCcgfHwgdW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgICAgIGRheXMgPSB0aGlzLl9kYXlzICsgdGhpcy5fbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgICAgICAgICAgbW9udGhzID0gdGhpcy5fbW9udGhzICsgZGF5c1RvWWVhcnMoZGF5cykgKiAxMjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5pdHMgPT09ICdtb250aCcgPyBtb250aHMgOiBtb250aHMgLyAxMjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIG1pbGxpc2Vjb25kcyBzZXBhcmF0ZWx5IGJlY2F1c2Ugb2YgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgKGlzc3VlICMxODY3KVxuICAgICAgICAgICAgICAgIGRheXMgPSB0aGlzLl9kYXlzICsgeWVhcnNUb0RheXModGhpcy5fbW9udGhzIC8gMTIpO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodW5pdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnd2Vlayc6IHJldHVybiBkYXlzIC8gNyArIHRoaXMuX21pbGxpc2Vjb25kcyAvIDYwNDhlNTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGF5JzogcmV0dXJuIGRheXMgKyB0aGlzLl9taWxsaXNlY29uZHMgLyA4NjRlNTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaG91cic6IHJldHVybiBkYXlzICogMjQgKyB0aGlzLl9taWxsaXNlY29uZHMgLyAzNmU1O1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdtaW51dGUnOiByZXR1cm4gZGF5cyAqIDI0ICogNjAgKyB0aGlzLl9taWxsaXNlY29uZHMgLyA2ZTQ7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NlY29uZCc6IHJldHVybiBkYXlzICogMjQgKiA2MCAqIDYwICsgdGhpcy5fbWlsbGlzZWNvbmRzIC8gMTAwMDtcbiAgICAgICAgICAgICAgICAgICAgLy8gTWF0aC5mbG9vciBwcmV2ZW50cyBmbG9hdGluZyBwb2ludCBtYXRoIGVycm9ycyBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21pbGxpc2Vjb25kJzogcmV0dXJuIE1hdGguZmxvb3IoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApICsgdGhpcy5fbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdW5pdCAnICsgdW5pdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBsYW5nIDogbW9tZW50LmZuLmxhbmcsXG4gICAgICAgIGxvY2FsZSA6IG1vbWVudC5mbi5sb2NhbGUsXG5cbiAgICAgICAgdG9Jc29TdHJpbmcgOiBkZXByZWNhdGUoXG4gICAgICAgICAgICAndG9Jc29TdHJpbmcoKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIHRvSVNPU3RyaW5nKCkgaW5zdGVhZCAnICtcbiAgICAgICAgICAgICcobm90aWNlIHRoZSBjYXBpdGFscyknLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICksXG5cbiAgICAgICAgdG9JU09TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgICAgICAgICAgdmFyIHllYXJzID0gTWF0aC5hYnModGhpcy55ZWFycygpKSxcbiAgICAgICAgICAgICAgICBtb250aHMgPSBNYXRoLmFicyh0aGlzLm1vbnRocygpKSxcbiAgICAgICAgICAgICAgICBkYXlzID0gTWF0aC5hYnModGhpcy5kYXlzKCkpLFxuICAgICAgICAgICAgICAgIGhvdXJzID0gTWF0aC5hYnModGhpcy5ob3VycygpKSxcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gTWF0aC5hYnModGhpcy5taW51dGVzKCkpLFxuICAgICAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLmFicyh0aGlzLnNlY29uZHMoKSArIHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFzU2Vjb25kcygpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgc2FtZSBhcyBDIydzIChOb2RhKSBhbmQgcHl0aG9uIChpc29kYXRlKS4uLlxuICAgICAgICAgICAgICAgIC8vIGJ1dCBub3Qgb3RoZXIgSlMgKGdvb2cuZGF0ZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAodGhpcy5hc1NlY29uZHMoKSA8IDAgPyAnLScgOiAnJykgK1xuICAgICAgICAgICAgICAgICdQJyArXG4gICAgICAgICAgICAgICAgKHllYXJzID8geWVhcnMgKyAnWScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChtb250aHMgPyBtb250aHMgKyAnTScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChkYXlzID8gZGF5cyArICdEJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKChob3VycyB8fCBtaW51dGVzIHx8IHNlY29uZHMpID8gJ1QnIDogJycpICtcbiAgICAgICAgICAgICAgICAoaG91cnMgPyBob3VycyArICdIJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKG1pbnV0ZXMgPyBtaW51dGVzICsgJ00nIDogJycpICtcbiAgICAgICAgICAgICAgICAoc2Vjb25kcyA/IHNlY29uZHMgKyAnUycgOiAnJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9jYWxlRGF0YSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2NhbGU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG1vbWVudC5kdXJhdGlvbi5mbi50b1N0cmluZyA9IG1vbWVudC5kdXJhdGlvbi5mbi50b0lTT1N0cmluZztcblxuICAgIGZ1bmN0aW9uIG1ha2VEdXJhdGlvbkdldHRlcihuYW1lKSB7XG4gICAgICAgIG1vbWVudC5kdXJhdGlvbi5mbltuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZvciAoaSBpbiB1bml0TWlsbGlzZWNvbmRGYWN0b3JzKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKHVuaXRNaWxsaXNlY29uZEZhY3RvcnMsIGkpKSB7XG4gICAgICAgICAgICBtYWtlRHVyYXRpb25HZXR0ZXIoaS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hc01pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXMoJ21zJyk7XG4gICAgfTtcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYXNTZWNvbmRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygncycpO1xuICAgIH07XG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzTWludXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXMoJ20nKTtcbiAgICB9O1xuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hc0hvdXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygnaCcpO1xuICAgIH07XG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzRGF5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXMoJ2QnKTtcbiAgICB9O1xuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hc1dlZWtzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygnd2Vla3MnKTtcbiAgICB9O1xuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hc01vbnRocyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXMoJ00nKTtcbiAgICB9O1xuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hc1llYXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygneScpO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIERlZmF1bHQgTG9jYWxlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBTZXQgZGVmYXVsdCBsb2NhbGUsIG90aGVyIGxvY2FsZSB3aWxsIGluaGVyaXQgZnJvbSBFbmdsaXNoLlxuICAgIG1vbWVudC5sb2NhbGUoJ2VuJywge1xuICAgICAgICBvcmRpbmFsIDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMCxcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSAodG9JbnQobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlciArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyogRU1CRURfTE9DQUxFUyAqL1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBFeHBvc2luZyBNb21lbnRcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBtYWtlR2xvYmFsKHNob3VsZERlcHJlY2F0ZSkge1xuICAgICAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgICAgICBpZiAodHlwZW9mIGVuZGVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9sZEdsb2JhbE1vbWVudCA9IGdsb2JhbFNjb3BlLm1vbWVudDtcbiAgICAgICAgaWYgKHNob3VsZERlcHJlY2F0ZSkge1xuICAgICAgICAgICAgZ2xvYmFsU2NvcGUubW9tZW50ID0gZGVwcmVjYXRlKFxuICAgICAgICAgICAgICAgICAgICAnQWNjZXNzaW5nIE1vbWVudCB0aHJvdWdoIHRoZSBnbG9iYWwgc2NvcGUgaXMgJyArXG4gICAgICAgICAgICAgICAgICAgICdkZXByZWNhdGVkLCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nICcgK1xuICAgICAgICAgICAgICAgICAgICAncmVsZWFzZS4nLFxuICAgICAgICAgICAgICAgICAgICBtb21lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2xvYmFsU2NvcGUubW9tZW50ID0gbW9tZW50O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcbiAgICBpZiAoaGFzTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbW9tZW50O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZSgnbW9tZW50JywgZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuICAgICAgICAgICAgaWYgKG1vZHVsZS5jb25maWcgJiYgbW9kdWxlLmNvbmZpZygpICYmIG1vZHVsZS5jb25maWcoKS5ub0dsb2JhbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIHJlbGVhc2UgdGhlIGdsb2JhbCB2YXJpYWJsZVxuICAgICAgICAgICAgICAgIGdsb2JhbFNjb3BlLm1vbWVudCA9IG9sZEdsb2JhbE1vbWVudDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudDtcbiAgICAgICAgfSk7XG4gICAgICAgIG1ha2VHbG9iYWwodHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbWFrZUdsb2JhbCgpO1xuICAgIH1cbn0pLmNhbGwodGhpcyk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNJbnB1dCA9IHJlcXVpcmUoJy4vaXNJbnB1dCcpO1xudmFyIGJpbmRpbmdzID0ge307XG5cbmZ1bmN0aW9uIGhhcyAoc291cmNlLCB0YXJnZXQpIHtcbiAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tzb3VyY2UuaWRdO1xuICByZXR1cm4gYmluZGluZyAmJiBiaW5kaW5nW3RhcmdldC5pZF07XG59XG5cbmZ1bmN0aW9uIGluc2VydCAoc291cmNlLCB0YXJnZXQpIHtcbiAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tzb3VyY2UuaWRdO1xuICBpZiAoIWJpbmRpbmcpIHtcbiAgICBiaW5kaW5nID0gYmluZGluZ3Nbc291cmNlLmlkXSA9IHt9O1xuICB9XG4gIHZhciBpbnZhbGlkYXRlID0gaW52YWxpZGF0b3IodGFyZ2V0KTtcbiAgYmluZGluZ1t0YXJnZXQuaWRdID0gaW52YWxpZGF0ZTtcbiAgc291cmNlLm9uKCdkYXRhJywgaW52YWxpZGF0ZSk7XG4gIHNvdXJjZS5vbignZGVzdHJveWVkJywgcmVtb3ZlLmJpbmQobnVsbCwgc291cmNlLCB0YXJnZXQpKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlIChzb3VyY2UsIHRhcmdldCkge1xuICB2YXIgYmluZGluZyA9IGJpbmRpbmdzW3NvdXJjZS5pZF07XG4gIGlmICghYmluZGluZykge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaW52YWxpZGF0ZSA9IGJpbmRpbmdbdGFyZ2V0LmlkXTtcbiAgc291cmNlLm9mZignZGF0YScsIGludmFsaWRhdGUpO1xuICBkZWxldGUgYmluZGluZ1t0YXJnZXQuaWRdO1xufVxuXG5mdW5jdGlvbiBpbnZhbGlkYXRvciAodGFyZ2V0KSB7XG4gIHJldHVybiBmdW5jdGlvbiBpbnZhbGlkYXRlICgpIHtcbiAgICB0YXJnZXQucmVmcmVzaCgpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhZGQgKHNvdXJjZSwgdGFyZ2V0KSB7XG4gIGlmIChpc0lucHV0KHRhcmdldC5hc3NvY2lhdGVkKSB8fCBoYXMoc291cmNlLCB0YXJnZXQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGluc2VydChzb3VyY2UsIHRhcmdldCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZCxcbiAgcmVtb3ZlOiByZW1vdmVcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKTtcbnZhciBlbWl0dGVyID0gcmVxdWlyZSgnY29udHJhLmVtaXR0ZXInKTtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbScpO1xudmFyIHRleHQgPSByZXF1aXJlKCcuL3RleHQnKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2UnKTtcbnZhciBjbG9uZSA9IHJlcXVpcmUoJy4vY2xvbmUnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJy4vZGVmYXVsdHMnKTtcbnZhciBtb21lbnR1bSA9IHJlcXVpcmUoJy4vbW9tZW50dW0nKTtcbnZhciBjbGFzc2VzID0gcmVxdWlyZSgnLi9jbGFzc2VzJyk7XG52YXIgbm9vcCA9IHJlcXVpcmUoJy4vbm9vcCcpO1xudmFyIG5vO1xuXG5mdW5jdGlvbiBjYWxlbmRhciAoY2FsZW5kYXJPcHRpb25zKSB7XG4gIHZhciBvO1xuICB2YXIgcmVmO1xuICB2YXIgcmVmQ2FsO1xuICB2YXIgY29udGFpbmVyO1xuICB2YXIgcmVuZGVyZWQgPSBmYWxzZTtcblxuICAvLyBkYXRlIHZhcmlhYmxlc1xuICB2YXIgbW9udGhPZmZzZXRBdHRyaWJ1dGUgPSAnZGF0YS1yb21lLW9mZnNldCc7XG4gIHZhciB3ZWVrZGF5cztcbiAgdmFyIHdlZWtkYXlDb3VudDtcbiAgdmFyIGNhbGVuZGFyTW9udGhzID0gW107XG4gIHZhciBsYXN0WWVhcjtcbiAgdmFyIGxhc3RNb250aDtcbiAgdmFyIGxhc3REYXk7XG4gIHZhciBsYXN0RGF5RWxlbWVudDtcbiAgdmFyIGRhdGV3cmFwcGVyO1xuICB2YXIgYmFjaztcbiAgdmFyIG5leHQ7XG5cbiAgLy8gdGltZSB2YXJpYWJsZXNcbiAgdmFyIHNlY29uZHNJbkRheSA9IDYwICogNjAgKiAyNDtcbiAgdmFyIHRpbWU7XG4gIHZhciB0aW1lbGlzdDtcblxuICB2YXIgYXBpID0gZW1pdHRlcih7XG4gICAgYXNzb2NpYXRlZDogY2FsZW5kYXJPcHRpb25zLmFzc29jaWF0ZWRcbiAgfSk7XG5cbiAgaW5pdCgpO1xuICBzZXRUaW1lb3V0KHJlYWR5LCAwKTtcblxuICByZXR1cm4gYXBpO1xuXG4gIGZ1bmN0aW9uIG5hcGkgKCkgeyByZXR1cm4gYXBpOyB9XG5cbiAgZnVuY3Rpb24gaW5pdCAoaW5pdE9wdGlvbnMpIHtcbiAgICBvID0gZGVmYXVsdHMoaW5pdE9wdGlvbnMgfHwgY2FsZW5kYXJPcHRpb25zLCBhcGkpO1xuICAgIGlmICghY29udGFpbmVyKSB7IGNvbnRhaW5lciA9IGRvbSh7IGNsYXNzTmFtZTogby5zdHlsZXMuY29udGFpbmVyIH0pOyB9XG4gICAgd2Vla2RheXMgPSBvLndlZWtkYXlGb3JtYXQ7XG4gICAgd2Vla2RheUNvdW50ID0gd2Vla2RheXMubGVuZ3RoO1xuICAgIGxhc3RNb250aCA9IG5vO1xuICAgIGxhc3RZZWFyID0gbm87XG4gICAgbGFzdERheSA9IG5vO1xuICAgIGxhc3REYXlFbGVtZW50ID0gbm87XG4gICAgby5hcHBlbmRUby5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuXG4gICAgcmVtb3ZlQ2hpbGRyZW4oY29udGFpbmVyKTtcbiAgICByZW5kZXJlZCA9IGZhbHNlO1xuICAgIHJlZiA9IG8uaW5pdGlhbFZhbHVlID8gby5pbml0aWFsVmFsdWUgOiBtb21lbnR1bS5tb21lbnQoKTtcbiAgICByZWZDYWwgPSByZWYuY2xvbmUoKTtcblxuICAgIGFwaS5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgYXBpLmRlc3Ryb3llZCA9IGZhbHNlO1xuICAgIGFwaS5kZXN0cm95ID0gZGVzdHJveS5iaW5kKGFwaSwgZmFsc2UpO1xuICAgIGFwaS5lbWl0VmFsdWVzID0gZW1pdFZhbHVlcztcbiAgICBhcGkuZ2V0RGF0ZSA9IGdldERhdGU7XG4gICAgYXBpLmdldERhdGVTdHJpbmcgPSBnZXREYXRlU3RyaW5nO1xuICAgIGFwaS5nZXRNb21lbnQgPSBnZXRNb21lbnQ7XG4gICAgYXBpLmhpZGUgPSBoaWRlO1xuICAgIGFwaS5vcHRpb25zID0gY2hhbmdlT3B0aW9ucztcbiAgICBhcGkub3B0aW9ucy5yZXNldCA9IHJlc2V0T3B0aW9ucztcbiAgICBhcGkucmVmcmVzaCA9IHJlZnJlc2g7XG4gICAgYXBpLnJlc3RvcmUgPSBuYXBpO1xuICAgIGFwaS5zZXRWYWx1ZSA9IHNldFZhbHVlO1xuICAgIGFwaS5zaG93ID0gc2hvdztcblxuICAgIGV2ZW50TGlzdGVuaW5nKCk7XG4gICAgcmVhZHkoKTtcblxuICAgIHJldHVybiBhcGk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkeSAoKSB7XG4gICAgYXBpLmVtaXQoJ3JlYWR5JywgY2xvbmUobykpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoc2lsZW50KSB7XG4gICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgY29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICBpZiAobykge1xuICAgICAgZXZlbnRMaXN0ZW5pbmcodHJ1ZSk7XG4gICAgfVxuXG4gICAgdmFyIGRlc3Ryb3llZCA9IGFwaS5lbWl0dGVyU25hcHNob3QoJ2Rlc3Ryb3llZCcpO1xuICAgIGFwaS5kZXN0cm95ZWQgPSB0cnVlO1xuICAgIGFwaS5kZXN0cm95ID0gbmFwaTtcbiAgICBhcGkuZW1pdFZhbHVlcyA9IG5hcGk7XG4gICAgYXBpLmdldERhdGUgPSBub29wO1xuICAgIGFwaS5nZXREYXRlU3RyaW5nID0gbm9vcDtcbiAgICBhcGkuZ2V0TW9tZW50ID0gbm9vcDtcbiAgICBhcGkuaGlkZSA9IG5hcGk7XG4gICAgYXBpLm9wdGlvbnMgPSBuYXBpO1xuICAgIGFwaS5vcHRpb25zLnJlc2V0ID0gbmFwaTtcbiAgICBhcGkucmVmcmVzaCA9IG5hcGk7XG4gICAgYXBpLnJlc3RvcmUgPSBpbml0O1xuICAgIGFwaS5zZXRWYWx1ZSA9IG5hcGk7XG4gICAgYXBpLnNob3cgPSBuYXBpO1xuICAgIGFwaS5vZmYoKTtcblxuICAgIGlmIChzaWxlbnQgIT09IHRydWUpIHtcbiAgICAgIGRlc3Ryb3llZCgpO1xuICAgIH1cblxuICAgIHJldHVybiBhcGk7XG4gIH1cblxuICBmdW5jdGlvbiBldmVudExpc3RlbmluZyAocmVtb3ZlKSB7XG4gICAgdmFyIG9wID0gcmVtb3ZlID8gJ3JlbW92ZScgOiAnYWRkJztcbiAgICBpZiAoby5hdXRvSGlkZU9uQmx1cikgeyBjcm9zc3ZlbnRbb3BdKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ2ZvY3VzJywgaGlkZU9uQmx1ciwgdHJ1ZSk7IH1cbiAgICBpZiAoby5hdXRvSGlkZU9uQ2xpY2spIHsgY3Jvc3N2ZW50W29wXShkb2N1bWVudCwgJ2NsaWNrJywgaGlkZU9uQ2xpY2spOyB9XG4gIH1cblxuICBmdW5jdGlvbiBjaGFuZ2VPcHRpb25zIChvcHRpb25zKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBjbG9uZShvKTtcbiAgICB9XG4gICAgZGVzdHJveSgpO1xuICAgIGluaXQob3B0aW9ucyk7XG4gICAgcmV0dXJuIGFwaTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2V0T3B0aW9ucyAoKSB7XG4gICAgcmV0dXJuIGNoYW5nZU9wdGlvbnMoeyBhcHBlbmRUbzogby5hcHBlbmRUbyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgaWYgKHJlbmRlcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlbmRlcmVkID0gdHJ1ZTtcbiAgICByZW5kZXJEYXRlcygpO1xuICAgIHJlbmRlclRpbWUoKTtcbiAgICBhcGkuZW1pdCgncmVuZGVyJyk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJEYXRlcyAoKSB7XG4gICAgaWYgKCFvLmRhdGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgY2FsZW5kYXJNb250aHMgPSBbXTtcblxuICAgIGRhdGV3cmFwcGVyID0gZG9tKHsgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXRlLCBwYXJlbnQ6IGNvbnRhaW5lciB9KTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBvLm1vbnRoc0luQ2FsZW5kYXI7IGkrKykge1xuICAgICAgcmVuZGVyTW9udGgoaSk7XG4gICAgfVxuXG4gICAgY3Jvc3N2ZW50LmFkZChiYWNrLCAnY2xpY2snLCBzdWJ0cmFjdE1vbnRoKTtcbiAgICBjcm9zc3ZlbnQuYWRkKG5leHQsICdjbGljaycsIGFkZE1vbnRoKTtcbiAgICBjcm9zc3ZlbnQuYWRkKGRhdGV3cmFwcGVyLCAnY2xpY2snLCBwaWNrRGF5KTtcblxuICAgIGZ1bmN0aW9uIHJlbmRlck1vbnRoIChpKSB7XG4gICAgICB2YXIgbW9udGggPSBkb20oeyBjbGFzc05hbWU6IG8uc3R5bGVzLm1vbnRoLCBwYXJlbnQ6IGRhdGV3cmFwcGVyIH0pO1xuICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgYmFjayA9IGRvbSh7IHR5cGU6IG8ubW9udGhzSW5wdXRzLCBjbGFzc05hbWU6IG8uc3R5bGVzLmJhY2ssIGF0dHJpYnV0ZXM6IHsgdHlwZTogJ2J1dHRvbicgfSwgcGFyZW50OiBtb250aCB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChpID09PSBvLm1vbnRoc0luQ2FsZW5kYXIgLTEpIHtcbiAgICAgICAgbmV4dCA9IGRvbSh7IHR5cGU6IG8ubW9udGhzSW5wdXRzLCBjbGFzc05hbWU6IG8uc3R5bGVzLm5leHQsIGF0dHJpYnV0ZXM6IHsgdHlwZTogJ2J1dHRvbicgfSwgcGFyZW50OiBtb250aCB9KTtcbiAgICAgIH1cbiAgICAgIHZhciBsYWJlbCA9IGRvbSh7IGNsYXNzTmFtZTogby5zdHlsZXMubW9udGhMYWJlbCwgcGFyZW50OiBtb250aCB9KTtcbiAgICAgIHZhciBkYXRlID0gZG9tKHsgdHlwZTogJ3RhYmxlJywgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXlUYWJsZSwgcGFyZW50OiBtb250aCB9KTtcbiAgICAgIHZhciBkYXRlaGVhZCA9IGRvbSh7IHR5cGU6ICd0aGVhZCcsIGNsYXNzTmFtZTogby5zdHlsZXMuZGF5SGVhZCwgcGFyZW50OiBkYXRlIH0pO1xuICAgICAgdmFyIGRhdGVoZWFkcm93ID0gZG9tKHsgdHlwZTogJ3RyJywgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXlSb3csIHBhcmVudDogZGF0ZWhlYWQgfSk7XG4gICAgICB2YXIgZGF0ZWJvZHkgPSBkb20oeyB0eXBlOiAndGJvZHknLCBjbGFzc05hbWU6IG8uc3R5bGVzLmRheUJvZHksIHBhcmVudDogZGF0ZSB9KTtcbiAgICAgIHZhciBqO1xuXG4gICAgICBmb3IgKGogPSAwOyBqIDwgd2Vla2RheUNvdW50OyBqKyspIHtcbiAgICAgICAgZG9tKHsgdHlwZTogJ3RoJywgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXlIZWFkRWxlbSwgcGFyZW50OiBkYXRlaGVhZHJvdywgdGV4dDogd2Vla2RheXNbd2Vla2RheShqKV0gfSk7XG4gICAgICB9XG5cbiAgICAgIGRhdGVib2R5LnNldEF0dHJpYnV0ZShtb250aE9mZnNldEF0dHJpYnV0ZSwgaSk7XG4gICAgICBjYWxlbmRhck1vbnRocy5wdXNoKHtcbiAgICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgICBib2R5OiBkYXRlYm9keVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyVGltZSAoKSB7XG4gICAgaWYgKCFvLnRpbWUgfHwgIW8udGltZUludGVydmFsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1ld3JhcHBlciA9IGRvbSh7IGNsYXNzTmFtZTogby5zdHlsZXMudGltZSwgcGFyZW50OiBjb250YWluZXIgfSk7XG4gICAgdGltZSA9IGRvbSh7IGNsYXNzTmFtZTogby5zdHlsZXMuc2VsZWN0ZWRUaW1lLCBwYXJlbnQ6IHRpbWV3cmFwcGVyLCB0ZXh0OiByZWYuZm9ybWF0KG8udGltZUZvcm1hdCkgfSk7XG4gICAgY3Jvc3N2ZW50LmFkZCh0aW1lLCAnY2xpY2snLCB0b2dnbGVUaW1lTGlzdCk7XG4gICAgdGltZWxpc3QgPSBkb20oeyBjbGFzc05hbWU6IG8uc3R5bGVzLnRpbWVMaXN0LCBwYXJlbnQ6IHRpbWV3cmFwcGVyIH0pO1xuICAgIGNyb3NzdmVudC5hZGQodGltZWxpc3QsICdjbGljaycsIHBpY2tUaW1lKTtcbiAgICB2YXIgbmV4dCA9IG1vbWVudHVtLm1vbWVudCgnMDA6MDA6MDAnLCAnSEg6bW06c3MnKTtcbiAgICB2YXIgbGF0ZXN0ID0gbmV4dC5jbG9uZSgpLmFkZCgxLCAnZGF5cycpO1xuICAgIHdoaWxlIChuZXh0LmlzQmVmb3JlKGxhdGVzdCkpIHtcbiAgICAgIGRvbSh7IGNsYXNzTmFtZTogby5zdHlsZXMudGltZU9wdGlvbiwgcGFyZW50OiB0aW1lbGlzdCwgdGV4dDogbmV4dC5mb3JtYXQoby50aW1lRm9ybWF0KSB9KTtcbiAgICAgIG5leHQuYWRkKG8udGltZUludGVydmFsLCAnc2Vjb25kcycpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdlZWtkYXkgKGluZGV4LCBiYWNrd2FyZHMpIHtcbiAgICB2YXIgZmFjdG9yID0gYmFja3dhcmRzID8gLTEgOiAxO1xuICAgIHZhciBvZmZzZXQgPSBpbmRleCArIG8ud2Vla1N0YXJ0ICogZmFjdG9yO1xuICAgIGlmIChvZmZzZXQgPj0gd2Vla2RheUNvdW50IHx8IG9mZnNldCA8IDApIHtcbiAgICAgIG9mZnNldCArPSB3ZWVrZGF5Q291bnQgKiAtZmFjdG9yO1xuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9XG5cbiAgZnVuY3Rpb24gZGlzcGxheVZhbGlkVGltZXNPbmx5ICgpIHtcbiAgICBpZiAoIW8udGltZSB8fCAhcmVuZGVyZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVzID0gdGltZWxpc3QuY2hpbGRyZW47XG4gICAgdmFyIGxlbmd0aCA9IHRpbWVzLmxlbmd0aDtcbiAgICB2YXIgZGF0ZTtcbiAgICB2YXIgdGltZTtcbiAgICB2YXIgaXRlbTtcbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGl0ZW0gPSB0aW1lc1tpXTtcbiAgICAgIHRpbWUgPSBtb21lbnR1bS5tb21lbnQodGV4dChpdGVtKSwgby50aW1lRm9ybWF0KTtcbiAgICAgIGRhdGUgPSBzZXRUaW1lKHJlZi5jbG9uZSgpLCB0aW1lKTtcbiAgICAgIGl0ZW0uc3R5bGUuZGlzcGxheSA9IGlzSW5SYW5nZShkYXRlLCBmYWxzZSwgby50aW1lVmFsaWRhdG9yKSA/ICdibG9jaycgOiAnbm9uZSc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdG9nZ2xlVGltZUxpc3QgKHNob3cpIHtcbiAgICB2YXIgZGlzcGxheSA9IHR5cGVvZiBzaG93ID09PSAnYm9vbGVhbicgPyBzaG93IDogdGltZWxpc3Quc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnO1xuICAgIGlmIChkaXNwbGF5KSB7XG4gICAgICBzaG93VGltZUxpc3QoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZVRpbWVMaXN0KCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd1RpbWVMaXN0ICgpIHsgaWYgKHRpbWVsaXN0KSB7IHRpbWVsaXN0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOyB9IH1cbiAgZnVuY3Rpb24gaGlkZVRpbWVMaXN0ICgpIHsgaWYgKHRpbWVsaXN0KSB7IHRpbWVsaXN0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0gfVxuICBmdW5jdGlvbiBzaG93Q2FsZW5kYXIgKCkgeyBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUtYmxvY2snOyBhcGkuZW1pdCgnc2hvdycpOyB9XG4gIGZ1bmN0aW9uIGhpZGVDYWxlbmRhciAoKSB7IGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBhcGkuZW1pdCgnaGlkZScpOyB9XG5cbiAgZnVuY3Rpb24gc2hvdyAoKSB7XG4gICAgcmVuZGVyKCk7XG4gICAgcmVmcmVzaCgpO1xuICAgIHRvZ2dsZVRpbWVMaXN0KCFvLmRhdGUpO1xuICAgIHNob3dDYWxlbmRhcigpO1xuICAgIHJldHVybiBhcGk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlICgpIHtcbiAgICBoaWRlVGltZUxpc3QoKTtcbiAgICBzZXRUaW1lb3V0KGhpZGVDYWxlbmRhciwgMCk7XG4gICAgcmV0dXJuIGFwaTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVDb25kaXRpb25hbGx5ICgpIHtcbiAgICBoaWRlVGltZUxpc3QoKTtcblxuICAgIHZhciBwb3MgPSBjbGFzc2VzLmNvbnRhaW5zKGNvbnRhaW5lciwgby5zdHlsZXMucG9zaXRpb25lZCk7XG4gICAgaWYgKHBvcykge1xuICAgICAgc2V0VGltZW91dChoaWRlQ2FsZW5kYXIsIDApO1xuICAgIH1cbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FsZW5kYXJFdmVudFRhcmdldCAoZSkge1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICBpZiAodGFyZ2V0ID09PSBhcGkuYXNzb2NpYXRlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHdoaWxlICh0YXJnZXQpIHtcbiAgICAgIGlmICh0YXJnZXQgPT09IGNvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVPbkJsdXIgKGUpIHtcbiAgICBpZiAoY2FsZW5kYXJFdmVudFRhcmdldChlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoaWRlQ29uZGl0aW9uYWxseSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZU9uQ2xpY2sgKGUpIHtcbiAgICBpZiAoY2FsZW5kYXJFdmVudFRhcmdldChlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoaWRlQ29uZGl0aW9uYWxseSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3VidHJhY3RNb250aCAoKSB7IGNoYW5nZU1vbnRoKCdzdWJ0cmFjdCcpOyB9XG4gIGZ1bmN0aW9uIGFkZE1vbnRoICgpIHsgY2hhbmdlTW9udGgoJ2FkZCcpOyB9XG4gIGZ1bmN0aW9uIGNoYW5nZU1vbnRoIChvcCkge1xuICAgIHZhciBib3VuZDtcbiAgICB2YXIgZGlyZWN0aW9uID0gb3AgPT09ICdhZGQnID8gLTEgOiAxO1xuICAgIHZhciBvZmZzZXQgPSBvLm1vbnRoc0luQ2FsZW5kYXIgKyBkaXJlY3Rpb24gKiBnZXRNb250aE9mZnNldChsYXN0RGF5RWxlbWVudCk7XG4gICAgcmVmQ2FsW29wXShvZmZzZXQsICdtb250aHMnKTtcbiAgICBib3VuZCA9IGluUmFuZ2UocmVmQ2FsLmNsb25lKCkpO1xuICAgIHJlZiA9IGJvdW5kIHx8IHJlZjtcbiAgICBpZiAoYm91bmQpIHsgcmVmQ2FsID0gYm91bmQuY2xvbmUoKTsgfVxuICAgIHVwZGF0ZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlIChzaWxlbnQpIHtcbiAgICB1cGRhdGVDYWxlbmRhcigpO1xuICAgIHVwZGF0ZVRpbWUoKTtcbiAgICBpZiAoc2lsZW50ICE9PSB0cnVlKSB7IGVtaXRWYWx1ZXMoKTsgfVxuICAgIGRpc3BsYXlWYWxpZFRpbWVzT25seSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ2FsZW5kYXIgKCkge1xuICAgIGlmICghby5kYXRlIHx8ICFyZW5kZXJlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgeSA9IHJlZkNhbC55ZWFyKCk7XG4gICAgdmFyIG0gPSByZWZDYWwubW9udGgoKTtcbiAgICB2YXIgZCA9IHJlZkNhbC5kYXRlKCk7XG4gICAgaWYgKGQgPT09IGxhc3REYXkgJiYgbSA9PT0gbGFzdE1vbnRoICYmIHkgPT09IGxhc3RZZWFyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjYW5TdGF5ID0gaXNEaXNwbGF5ZWQoKTtcbiAgICBsYXN0RGF5ID0gcmVmQ2FsLmRhdGUoKTtcbiAgICBsYXN0TW9udGggPSByZWZDYWwubW9udGgoKTtcbiAgICBsYXN0WWVhciA9IHJlZkNhbC55ZWFyKCk7XG4gICAgaWYgKGNhblN0YXkpIHsgdXBkYXRlQ2FsZW5kYXJTZWxlY3Rpb24oKTsgcmV0dXJuOyB9XG4gICAgY2FsZW5kYXJNb250aHMuZm9yRWFjaCh1cGRhdGVNb250aCk7XG4gICAgcmVuZGVyQWxsRGF5cygpO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlTW9udGggKG1vbnRoLCBpKSB7XG4gICAgICB2YXIgb2Zmc2V0Q2FsID0gcmVmQ2FsLmNsb25lKCkuYWRkKGksICdtb250aHMnKTtcbiAgICAgIHRleHQobW9udGgubGFiZWwsIG9mZnNldENhbC5mb3JtYXQoby5tb250aEZvcm1hdCkpO1xuICAgICAgcmVtb3ZlQ2hpbGRyZW4obW9udGguYm9keSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ2FsZW5kYXJTZWxlY3Rpb24gKCkge1xuICAgIHZhciBkYXkgPSByZWZDYWwuZGF0ZSgpIC0gMTtcbiAgICBzZWxlY3REYXlFbGVtZW50KGZhbHNlKTtcbiAgICBjYWxlbmRhck1vbnRocy5mb3JFYWNoKGZ1bmN0aW9uIChjYWwpIHtcbiAgICAgIHZhciBkYXlzO1xuICAgICAgaWYgKHNhbWVDYWxlbmRhck1vbnRoKGNhbC5kYXRlLCByZWZDYWwpKSB7XG4gICAgICAgIGRheXMgPSBjYXN0KGNhbC5ib2R5LmNoaWxkcmVuKS5tYXAoYWdncmVnYXRlKTtcbiAgICAgICAgZGF5cyA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGRheXMpLmZpbHRlcihpbnNpZGUpO1xuICAgICAgICBzZWxlY3REYXlFbGVtZW50KGRheXNbZGF5XSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBjYXN0IChsaWtlKSB7XG4gICAgICB2YXIgZGVzdCA9IFtdO1xuICAgICAgdmFyIGk7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGlrZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBkZXN0LnB1c2gobGlrZVtpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVzdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZ2dyZWdhdGUgKGNoaWxkKSB7XG4gICAgICByZXR1cm4gY2FzdChjaGlsZC5jaGlsZHJlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zaWRlIChjaGlsZCkge1xuICAgICAgcmV0dXJuICFjbGFzc2VzLmNvbnRhaW5zKGNoaWxkLCBvLnN0eWxlcy5kYXlQcmV2TW9udGgpICYmXG4gICAgICAgICAgICAgIWNsYXNzZXMuY29udGFpbnMoY2hpbGQsIG8uc3R5bGVzLmRheU5leHRNb250aCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNEaXNwbGF5ZWQgKCkge1xuICAgIHJldHVybiBjYWxlbmRhck1vbnRocy5zb21lKG1hdGNoZXMpO1xuXG4gICAgZnVuY3Rpb24gbWF0Y2hlcyAoY2FsKSB7XG4gICAgICBpZiAoIWxhc3RZZWFyKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgcmV0dXJuIHNhbWVDYWxlbmRhck1vbnRoKGNhbC5kYXRlLCByZWZDYWwpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNhbWVDYWxlbmRhck1vbnRoIChsZWZ0LCByaWdodCkge1xuICAgIHJldHVybiBsZWZ0ICYmIHJpZ2h0ICYmIGxlZnQueWVhcigpID09PSByaWdodC55ZWFyKCkgJiYgbGVmdC5tb250aCgpID09PSByaWdodC5tb250aCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlVGltZSAoKSB7XG4gICAgaWYgKCFvLnRpbWUgfHwgIXJlbmRlcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRleHQodGltZSwgcmVmLmZvcm1hdChvLnRpbWVGb3JtYXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVtaXRWYWx1ZXMgKCkge1xuICAgIGFwaS5lbWl0KCdkYXRhJywgZ2V0RGF0ZVN0cmluZygpKTtcbiAgICBhcGkuZW1pdCgneWVhcicsIHJlZi55ZWFyKCkpO1xuICAgIGFwaS5lbWl0KCdtb250aCcsIHJlZi5tb250aCgpKTtcbiAgICBhcGkuZW1pdCgnZGF5JywgcmVmLmRheSgpKTtcbiAgICBhcGkuZW1pdCgndGltZScsIHJlZi5mb3JtYXQoby50aW1lRm9ybWF0KSk7XG4gICAgcmV0dXJuIGFwaTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZnJlc2ggKCkge1xuICAgIGxhc3RZZWFyID0gZmFsc2U7XG4gICAgbGFzdE1vbnRoID0gZmFsc2U7XG4gICAgbGFzdERheSA9IGZhbHNlO1xuICAgIHVwZGF0ZSh0cnVlKTtcbiAgICByZXR1cm4gYXBpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0VmFsdWUgKHZhbHVlKSB7XG4gICAgdmFyIGRhdGUgPSBwYXJzZSh2YWx1ZSwgby5pbnB1dEZvcm1hdCk7XG4gICAgaWYgKGRhdGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVmID0gaW5SYW5nZShkYXRlKSB8fCByZWY7XG4gICAgcmVmQ2FsID0gcmVmLmNsb25lKCk7XG4gICAgdXBkYXRlKHRydWUpO1xuXG4gICAgcmV0dXJuIGFwaTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUNoaWxkcmVuIChlbGVtLCBzZWxmKSB7XG4gICAgd2hpbGUgKGVsZW0gJiYgZWxlbS5maXJzdENoaWxkKSB7XG4gICAgICBlbGVtLnJlbW92ZUNoaWxkKGVsZW0uZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIGlmIChzZWxmID09PSB0cnVlKSB7XG4gICAgICBlbGVtLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyQWxsRGF5cyAoKSB7XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IG8ubW9udGhzSW5DYWxlbmRhcjsgaSsrKSB7XG4gICAgICByZW5kZXJEYXlzKGkpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlckRheXMgKG9mZnNldCkge1xuICAgIHZhciBtb250aCA9IGNhbGVuZGFyTW9udGhzW29mZnNldF07XG4gICAgdmFyIG9mZnNldENhbCA9IHJlZkNhbC5jbG9uZSgpLmFkZChvZmZzZXQsICdtb250aHMnKTtcbiAgICB2YXIgdG90YWwgPSBvZmZzZXRDYWwuZGF5c0luTW9udGgoKTtcbiAgICB2YXIgY3VycmVudCA9IG9mZnNldENhbC5tb250aCgpICE9PSByZWYubW9udGgoKSA/IC0xIDogcmVmLmRhdGUoKTsgLy8gLTEgOiAxLi4zMVxuICAgIHZhciBmaXJzdCA9IG9mZnNldENhbC5jbG9uZSgpLmRhdGUoMSk7XG4gICAgdmFyIGZpcnN0RGF5ID0gd2Vla2RheShmaXJzdC5kYXkoKSwgdHJ1ZSk7IC8vIDAuLjZcbiAgICB2YXIgdHIgPSBkb20oeyB0eXBlOiAndHInLCBjbGFzc05hbWU6IG8uc3R5bGVzLmRheVJvdywgcGFyZW50OiBtb250aC5ib2R5IH0pO1xuICAgIHZhciBwcmV2TW9udGggPSBoaWRkZW5XaGVuKG9mZnNldCAhPT0gMCwgW28uc3R5bGVzLmRheUJvZHlFbGVtLCBvLnN0eWxlcy5kYXlQcmV2TW9udGhdKTtcbiAgICB2YXIgbmV4dE1vbnRoID0gaGlkZGVuV2hlbihvZmZzZXQgIT09IG8ubW9udGhzSW5DYWxlbmRhciAtIDEsIFtvLnN0eWxlcy5kYXlCb2R5RWxlbSwgby5zdHlsZXMuZGF5TmV4dE1vbnRoXSk7XG4gICAgdmFyIGRpc2FibGVkID0gby5zdHlsZXMuZGF5RGlzYWJsZWQ7XG4gICAgdmFyIGxhc3REYXk7XG5cbiAgICBwYXJ0KHtcbiAgICAgIGJhc2U6IGZpcnN0LmNsb25lKCkuc3VidHJhY3QoZmlyc3REYXksICdkYXlzJyksXG4gICAgICBsZW5ndGg6IGZpcnN0RGF5LFxuICAgICAgY2VsbDogcHJldk1vbnRoXG4gICAgfSk7XG5cbiAgICBwYXJ0KHtcbiAgICAgIGJhc2U6IGZpcnN0LmNsb25lKCksXG4gICAgICBsZW5ndGg6IHRvdGFsLFxuICAgICAgY2VsbDogW28uc3R5bGVzLmRheUJvZHlFbGVtXSxcbiAgICAgIHNlbGVjdGFibGU6IHRydWVcbiAgICB9KTtcblxuICAgIGxhc3REYXkgPSBmaXJzdC5jbG9uZSgpLmFkZCh0b3RhbCwgJ2RheXMnKTtcblxuICAgIHBhcnQoe1xuICAgICAgYmFzZTogbGFzdERheSxcbiAgICAgIGxlbmd0aDogd2Vla2RheUNvdW50IC0gdHIuY2hpbGRyZW4ubGVuZ3RoLFxuICAgICAgY2VsbDogbmV4dE1vbnRoXG4gICAgfSk7XG5cbiAgICBiYWNrLmRpc2FibGVkID0gIWlzSW5SYW5nZUxlZnQoZmlyc3QsIHRydWUpO1xuICAgIG5leHQuZGlzYWJsZWQgPSAhaXNJblJhbmdlUmlnaHQobGFzdERheSwgdHJ1ZSk7XG4gICAgbW9udGguZGF0ZSA9IG9mZnNldENhbC5jbG9uZSgpO1xuXG4gICAgZnVuY3Rpb24gcGFydCAoZGF0YSkge1xuICAgICAgdmFyIGksIGRheSwgbm9kZTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0ci5jaGlsZHJlbi5sZW5ndGggPT09IHdlZWtkYXlDb3VudCkge1xuICAgICAgICAgIHRyID0gZG9tKHsgdHlwZTogJ3RyJywgY2xhc3NOYW1lOiBvLnN0eWxlcy5kYXlSb3csIHBhcmVudDogbW9udGguYm9keSB9KTtcbiAgICAgICAgfVxuICAgICAgICBkYXkgPSBkYXRhLmJhc2UuY2xvbmUoKS5hZGQoaSwgJ2RheXMnKTtcbiAgICAgICAgbm9kZSA9IGRvbSh7XG4gICAgICAgICAgdHlwZTogJ3RkJyxcbiAgICAgICAgICBwYXJlbnQ6IHRyLFxuICAgICAgICAgIHRleHQ6IGRheS5mb3JtYXQoby5kYXlGb3JtYXQpLFxuICAgICAgICAgIGNsYXNzTmFtZTogdmFsaWRhdGlvblRlc3QoZGF5LCBkYXRhLmNlbGwuam9pbignICcpLnNwbGl0KCcgJykpLmpvaW4oJyAnKVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGRhdGEuc2VsZWN0YWJsZSAmJiBkYXkuZGF0ZSgpID09PSBjdXJyZW50KSB7XG4gICAgICAgICAgc2VsZWN0RGF5RWxlbWVudChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZhbGlkYXRpb25UZXN0IChkYXksIGNlbGwpIHtcbiAgICAgIGlmICghaXNJblJhbmdlKGRheSwgdHJ1ZSwgby5kYXRlVmFsaWRhdG9yKSkgeyBjZWxsLnB1c2goZGlzYWJsZWQpOyB9XG4gICAgICByZXR1cm4gY2VsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRkZW5XaGVuICh2YWx1ZSwgY2VsbCkge1xuICAgICAgaWYgKHZhbHVlKSB7IGNlbGwucHVzaChvLnN0eWxlcy5kYXlDb25jZWFsZWQpOyB9XG4gICAgICByZXR1cm4gY2VsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpc0luUmFuZ2UgKGRhdGUsIGFsbGRheSwgdmFsaWRhdG9yKSB7XG4gICAgaWYgKCFpc0luUmFuZ2VMZWZ0KGRhdGUsIGFsbGRheSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFpc0luUmFuZ2VSaWdodChkYXRlLCBhbGxkYXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciB2YWxpZCA9ICh2YWxpZGF0b3IgfHwgRnVuY3Rpb24ucHJvdG90eXBlKS5jYWxsKGFwaSwgZGF0ZS50b0RhdGUoKSk7XG4gICAgcmV0dXJuIHZhbGlkICE9PSBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSW5SYW5nZUxlZnQgKGRhdGUsIGFsbGRheSkge1xuICAgIHZhciBtaW4gPSAhby5taW4gPyBmYWxzZSA6IChhbGxkYXkgPyBvLm1pbi5jbG9uZSgpLnN0YXJ0T2YoJ2RheScpIDogby5taW4pO1xuICAgIHJldHVybiAhbWluIHx8ICFkYXRlLmlzQmVmb3JlKG1pbik7XG4gIH1cblxuICBmdW5jdGlvbiBpc0luUmFuZ2VSaWdodCAoZGF0ZSwgYWxsZGF5KSB7XG4gICAgdmFyIG1heCA9ICFvLm1heCA/IGZhbHNlIDogKGFsbGRheSA/IG8ubWF4LmNsb25lKCkuZW5kT2YoJ2RheScpIDogby5tYXgpO1xuICAgIHJldHVybiAhbWF4IHx8ICFkYXRlLmlzQWZ0ZXIobWF4KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluUmFuZ2UgKGRhdGUpIHtcbiAgICBpZiAoby5taW4gJiYgZGF0ZS5pc0JlZm9yZShvLm1pbikpIHtcbiAgICAgIHJldHVybiBpblJhbmdlKG8ubWluLmNsb25lKCkpO1xuICAgIH0gZWxzZSBpZiAoby5tYXggJiYgZGF0ZS5pc0FmdGVyKG8ubWF4KSkge1xuICAgICAgcmV0dXJuIGluUmFuZ2Uoby5tYXguY2xvbmUoKSk7XG4gICAgfVxuICAgIHZhciB2YWx1ZSA9IGRhdGUuY2xvbmUoKS5zdWJ0cmFjdCgxLCAnZGF5cycpO1xuICAgIGlmICh2YWxpZGF0ZVRvd2FyZHModmFsdWUsIGRhdGUsICdhZGQnKSkge1xuICAgICAgcmV0dXJuIGluVGltZVJhbmdlKHZhbHVlKTtcbiAgICB9XG4gICAgdmFsdWUgPSBkYXRlLmNsb25lKCk7XG4gICAgaWYgKHZhbGlkYXRlVG93YXJkcyh2YWx1ZSwgZGF0ZSwgJ3N1YnRyYWN0JykpIHtcbiAgICAgIHJldHVybiBpblRpbWVSYW5nZSh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5UaW1lUmFuZ2UgKHZhbHVlKSB7XG4gICAgdmFyIGNvcHkgPSB2YWx1ZS5jbG9uZSgpLnN1YnRyYWN0KG8udGltZUludGVydmFsLCAnc2Vjb25kcycpO1xuICAgIHZhciB0aW1lcyA9IE1hdGguY2VpbChzZWNvbmRzSW5EYXkgLyBvLnRpbWVJbnRlcnZhbCk7XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IHRpbWVzOyBpKyspIHtcbiAgICAgIGNvcHkuYWRkKG8udGltZUludGVydmFsLCAnc2Vjb25kcycpO1xuICAgICAgaWYgKGNvcHkuZGF0ZSgpID4gdmFsdWUuZGF0ZSgpKSB7XG4gICAgICAgIGNvcHkuc3VidHJhY3QoMSwgJ2RheXMnKTtcbiAgICAgIH1cbiAgICAgIGlmIChvLnRpbWVWYWxpZGF0b3IuY2FsbChhcGksIGNvcHkudG9EYXRlKCkpICE9PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gY29weTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2YWxpZGF0ZVRvd2FyZHMgKHZhbHVlLCBkYXRlLCBvcCkge1xuICAgIHZhciB2YWxpZCA9IGZhbHNlO1xuICAgIHdoaWxlICh2YWxpZCA9PT0gZmFsc2UpIHtcbiAgICAgIHZhbHVlW29wXSgxLCAnZGF5cycpO1xuICAgICAgaWYgKHZhbHVlLm1vbnRoKCkgIT09IGRhdGUubW9udGgoKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHZhbGlkID0gby5kYXRlVmFsaWRhdG9yLmNhbGwoYXBpLCB2YWx1ZS50b0RhdGUoKSk7XG4gICAgfVxuICAgIHJldHVybiB2YWxpZCAhPT0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBwaWNrRGF5IChlKSB7XG4gICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgIGlmIChjbGFzc2VzLmNvbnRhaW5zKHRhcmdldCwgby5zdHlsZXMuZGF5RGlzYWJsZWQpIHx8ICFjbGFzc2VzLmNvbnRhaW5zKHRhcmdldCwgby5zdHlsZXMuZGF5Qm9keUVsZW0pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBkYXkgPSBwYXJzZUludCh0ZXh0KHRhcmdldCksIDEwKTtcbiAgICB2YXIgcHJldiA9IGNsYXNzZXMuY29udGFpbnModGFyZ2V0LCBvLnN0eWxlcy5kYXlQcmV2TW9udGgpO1xuICAgIHZhciBuZXh0ID0gY2xhc3Nlcy5jb250YWlucyh0YXJnZXQsIG8uc3R5bGVzLmRheU5leHRNb250aCk7XG4gICAgdmFyIG9mZnNldCA9IGdldE1vbnRoT2Zmc2V0KHRhcmdldCkgLSBnZXRNb250aE9mZnNldChsYXN0RGF5RWxlbWVudCk7XG4gICAgcmVmLmFkZChvZmZzZXQsICdtb250aHMnKTtcbiAgICBpZiAocHJldiB8fCBuZXh0KSB7XG4gICAgICByZWYuYWRkKHByZXYgPyAtMSA6IDEsICdtb250aHMnKTtcbiAgICB9XG4gICAgc2VsZWN0RGF5RWxlbWVudCh0YXJnZXQpO1xuICAgIHJlZi5kYXRlKGRheSk7IC8vIG11c3QgcnVuIGFmdGVyIHNldHRpbmcgdGhlIG1vbnRoXG4gICAgc2V0VGltZShyZWYsIGluUmFuZ2UocmVmKSB8fCByZWYpO1xuICAgIHJlZkNhbCA9IHJlZi5jbG9uZSgpO1xuICAgIGlmIChvLmF1dG9DbG9zZSA9PT0gdHJ1ZSkgeyBoaWRlQ29uZGl0aW9uYWxseSgpOyB9XG4gICAgdXBkYXRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZWxlY3REYXlFbGVtZW50IChub2RlKSB7XG4gICAgaWYgKGxhc3REYXlFbGVtZW50KSB7XG4gICAgICBjbGFzc2VzLnJlbW92ZShsYXN0RGF5RWxlbWVudCwgby5zdHlsZXMuc2VsZWN0ZWREYXkpO1xuICAgIH1cbiAgICBpZiAobm9kZSkge1xuICAgICAgY2xhc3Nlcy5hZGQobm9kZSwgby5zdHlsZXMuc2VsZWN0ZWREYXkpO1xuICAgIH1cbiAgICBsYXN0RGF5RWxlbWVudCA9IG5vZGU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRNb250aE9mZnNldCAoZWxlbSkge1xuICAgIHZhciBvZmZzZXQ7XG4gICAgd2hpbGUgKGVsZW0gJiYgZWxlbS5nZXRBdHRyaWJ1dGUpIHtcbiAgICAgIG9mZnNldCA9IGVsZW0uZ2V0QXR0cmlidXRlKG1vbnRoT2Zmc2V0QXR0cmlidXRlKTtcbiAgICAgIGlmICh0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQob2Zmc2V0LCAxMCk7XG4gICAgICB9XG4gICAgICBlbGVtID0gZWxlbS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFRpbWUgKHRvLCBmcm9tKSB7XG4gICAgdG8uaG91cihmcm9tLmhvdXIoKSkubWludXRlKGZyb20ubWludXRlKCkpLnNlY29uZChmcm9tLnNlY29uZCgpKTtcbiAgICByZXR1cm4gdG87XG4gIH1cblxuICBmdW5jdGlvbiBwaWNrVGltZSAoZSkge1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICBpZiAoIWNsYXNzZXMuY29udGFpbnModGFyZ2V0LCBvLnN0eWxlcy50aW1lT3B0aW9uKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdmFsdWUgPSBtb21lbnR1bS5tb21lbnQodGV4dCh0YXJnZXQpLCBvLnRpbWVGb3JtYXQpO1xuICAgIHNldFRpbWUocmVmLCB2YWx1ZSk7XG4gICAgcmVmQ2FsID0gcmVmLmNsb25lKCk7XG4gICAgZW1pdFZhbHVlcygpO1xuICAgIHVwZGF0ZVRpbWUoKTtcbiAgICBpZiAoKCFvLmRhdGUgJiYgby5hdXRvQ2xvc2UgPT09IHRydWUpIHx8IG8uYXV0b0Nsb3NlID09PSAndGltZScpIHtcbiAgICAgIGhpZGVDb25kaXRpb25hbGx5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVUaW1lTGlzdCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERhdGUgKCkge1xuICAgIHJldHVybiByZWYudG9EYXRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREYXRlU3RyaW5nIChmb3JtYXQpIHtcbiAgICByZXR1cm4gcmVmLmZvcm1hdChmb3JtYXQgfHwgby5pbnB1dEZvcm1hdCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRNb21lbnQgKCkge1xuICAgIHJldHVybiByZWYuY2xvbmUoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNhbGVuZGFyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHJpbSA9IC9eXFxzK3xcXHMrJC9nO1xudmFyIHdoaXRlc3BhY2UgPSAvXFxzKy87XG5cbmZ1bmN0aW9uIGNsYXNzZXMgKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUuY2xhc3NOYW1lLnJlcGxhY2UodHJpbSwgJycpLnNwbGl0KHdoaXRlc3BhY2UpO1xufVxuXG5mdW5jdGlvbiBzZXQgKG5vZGUsIHZhbHVlKSB7XG4gIG5vZGUuY2xhc3NOYW1lID0gdmFsdWUuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiBhZGQgKG5vZGUsIHZhbHVlKSB7XG4gIHZhciB2YWx1ZXMgPSByZW1vdmUobm9kZSwgdmFsdWUpO1xuICB2YWx1ZXMucHVzaCh2YWx1ZSk7XG4gIHNldChub2RlLCB2YWx1ZXMpO1xufVxuXG5mdW5jdGlvbiByZW1vdmUgKG5vZGUsIHZhbHVlKSB7XG4gIHZhciB2YWx1ZXMgPSBjbGFzc2VzKG5vZGUpO1xuICB2YXIgaSA9IHZhbHVlcy5pbmRleE9mKHZhbHVlKTtcbiAgaWYgKGkgIT09IC0xKSB7XG4gICAgdmFsdWVzLnNwbGljZShpLCAxKTtcbiAgICBzZXQobm9kZSwgdmFsdWVzKTtcbiAgfVxuICByZXR1cm4gdmFsdWVzO1xufVxuXG5mdW5jdGlvbiBjb250YWlucyAobm9kZSwgdmFsdWUpIHtcbiAgcmV0dXJuIGNsYXNzZXMobm9kZSkuaW5kZXhPZih2YWx1ZSkgIT09IC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkOiBhZGQsXG4gIHJlbW92ZTogcmVtb3ZlLFxuICBjb250YWluczogY29udGFpbnNcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtb21lbnR1bSA9IHJlcXVpcmUoJy4vbW9tZW50dW0nKTtcblxuLy8gbmHDr3ZlIGltcGxlbWVudGF0aW9uLCBzcGVjaWZpY2FsbHkgbWVhbnQgdG8gY2xvbmUgYG9wdGlvbnNgIG9iamVjdHNcbmZ1bmN0aW9uIGNsb25lICh0aGluZykge1xuICB2YXIgY29weSA9IHt9O1xuICB2YXIgdmFsdWU7XG5cbiAgZm9yICh2YXIga2V5IGluIHRoaW5nKSB7XG4gICAgdmFsdWUgPSB0aGluZ1trZXldO1xuXG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgY29weVtrZXldID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChtb21lbnR1bS5pc01vbWVudCh2YWx1ZSkpIHtcbiAgICAgIGNvcHlba2V5XSA9IHZhbHVlLmNsb25lKCk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZS5faXNTdHlsZXNDb25maWd1cmF0aW9uKSB7XG4gICAgICBjb3B5W2tleV0gPSBjbG9uZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvcHlba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb3B5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5kZXggPSByZXF1aXJlKCcuL2luZGV4Jyk7XG52YXIgaW5wdXQgPSByZXF1aXJlKCcuL2lucHV0Jyk7XG52YXIgaW5saW5lID0gcmVxdWlyZSgnLi9pbmxpbmUnKTtcbnZhciBpc0lucHV0ID0gcmVxdWlyZSgnLi9pc0lucHV0Jyk7XG5cbmZ1bmN0aW9uIGNvcmUgKGVsZW0sIG9wdGlvbnMpIHtcbiAgdmFyIGNhbDtcbiAgdmFyIGV4aXN0aW5nID0gaW5kZXguZmluZChlbGVtKTtcbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nO1xuICB9XG5cbiAgaWYgKGlzSW5wdXQoZWxlbSkpIHtcbiAgICBjYWwgPSBpbnB1dChlbGVtLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICBjYWwgPSBpbmxpbmUoZWxlbSwgb3B0aW9ucyk7XG4gIH1cbiAgaW5kZXguYXNzaWduKGVsZW0sIGNhbCk7XG5cbiAgcmV0dXJuIGNhbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb3JlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG52YXIgaXNJbnB1dCA9IHJlcXVpcmUoJy4vaXNJbnB1dCcpO1xudmFyIG1vbWVudHVtID0gcmVxdWlyZSgnLi9tb21lbnR1bScpO1xuXG5mdW5jdGlvbiBkZWZhdWx0cyAob3B0aW9ucywgY2FsKSB7XG4gIHZhciB0ZW1wO1xuICB2YXIgbm87XG4gIHZhciBvID0gb3B0aW9ucyB8fCB7fTtcbiAgaWYgKG8uYXV0b0hpZGVPbkNsaWNrID09PSBubykgeyBvLmF1dG9IaWRlT25DbGljayA9IHRydWU7IH1cbiAgaWYgKG8uYXV0b0hpZGVPbkJsdXIgPT09IG5vKSB7IG8uYXV0b0hpZGVPbkJsdXIgPSB0cnVlOyB9XG4gIGlmIChvLmF1dG9DbG9zZSA9PT0gbm8pIHsgby5hdXRvQ2xvc2UgPSB0cnVlOyB9XG4gIGlmIChvLmFwcGVuZFRvID09PSBubykgeyBvLmFwcGVuZFRvID0gZG9jdW1lbnQuYm9keTsgfVxuICBpZiAoby5hcHBlbmRUbyA9PT0gJ3BhcmVudCcpIHtcbiAgICBpZiAoaXNJbnB1dChjYWwuYXNzb2NpYXRlZCkpIHtcbiAgICAgIG8uYXBwZW5kVG8gPSBjYWwuYXNzb2NpYXRlZC5wYXJlbnROb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lubGluZSBjYWxlbmRhcnMgbXVzdCBiZSBhcHBlbmRlZCB0byBhIHBhcmVudCBub2RlIGV4cGxpY2l0bHkuJyk7XG4gICAgfVxuICB9XG4gIGlmIChvLmludmFsaWRhdGUgPT09IG5vKSB7IG8uaW52YWxpZGF0ZSA9IHRydWU7IH1cbiAgaWYgKG8ucmVxdWlyZWQgPT09IG5vKSB7IG8ucmVxdWlyZWQgPSBmYWxzZTsgfVxuICBpZiAoby5kYXRlID09PSBubykgeyBvLmRhdGUgPSB0cnVlOyB9XG4gIGlmIChvLnRpbWUgPT09IG5vKSB7IG8udGltZSA9IHRydWU7IH1cbiAgaWYgKG8uZGF0ZSA9PT0gZmFsc2UgJiYgby50aW1lID09PSBmYWxzZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ0F0IGxlYXN0IG9uZSBvZiBgZGF0ZWAgb3IgYHRpbWVgIG11c3QgYmUgYHRydWVgLicpOyB9XG4gIGlmIChvLmlucHV0Rm9ybWF0ID09PSBubykge1xuICAgIGlmIChvLmRhdGUgJiYgby50aW1lKSB7XG4gICAgICBvLmlucHV0Rm9ybWF0ID0gJ1lZWVktTU0tREQgSEg6bW0nO1xuICAgIH0gZWxzZSBpZiAoby5kYXRlKSB7XG4gICAgICBvLmlucHV0Rm9ybWF0ID0gJ1lZWVktTU0tREQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBvLmlucHV0Rm9ybWF0ID0gJ0hIOm1tJztcbiAgICB9XG4gIH1cbiAgaWYgKG8uaW5pdGlhbFZhbHVlID09PSBubykge1xuICAgIG8uaW5pdGlhbFZhbHVlID0gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBvLmluaXRpYWxWYWx1ZSA9IHBhcnNlKG8uaW5pdGlhbFZhbHVlLCBvLmlucHV0Rm9ybWF0KTtcbiAgfVxuICBpZiAoby5taW4gPT09IG5vKSB7IG8ubWluID0gbnVsbDsgfSBlbHNlIHsgby5taW4gPSBwYXJzZShvLm1pbiwgby5pbnB1dEZvcm1hdCk7IH1cbiAgaWYgKG8ubWF4ID09PSBubykgeyBvLm1heCA9IG51bGw7IH0gZWxzZSB7IG8ubWF4ID0gcGFyc2Uoby5tYXgsIG8uaW5wdXRGb3JtYXQpOyB9XG4gIGlmIChvLnRpbWVJbnRlcnZhbCA9PT0gbm8pIHsgby50aW1lSW50ZXJ2YWwgPSA2MCAqIDMwOyB9IC8vIDMwIG1pbnV0ZXMgYnkgZGVmYXVsdFxuICBpZiAoby5taW4gJiYgby5tYXgpIHtcbiAgICBpZiAoby5tYXguaXNCZWZvcmUoby5taW4pKSB7XG4gICAgICB0ZW1wID0gby5tYXg7XG4gICAgICBvLm1heCA9IG8ubWluO1xuICAgICAgby5taW4gPSB0ZW1wO1xuICAgIH1cbiAgICBpZiAoby5kYXRlID09PSB0cnVlKSB7XG4gICAgICBpZiAoby5tYXguY2xvbmUoKS5zdWJ0cmFjdCgxLCAnZGF5cycpLmlzQmVmb3JlKG8ubWluKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BtYXhgIG11c3QgYmUgYXQgbGVhc3Qgb25lIGRheSBhZnRlciBgbWluYCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoby50aW1lSW50ZXJ2YWwgKiAxMDAwIC0gby5taW4gJSAoby50aW1lSW50ZXJ2YWwgKiAxMDAwKSA+IG8ubWF4IC0gby5taW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYG1pbmAgdG8gYG1heGAgcmFuZ2UgbXVzdCBhbGxvdyBmb3IgYXQgbGVhc3Qgb25lIHRpbWUgb3B0aW9uIHRoYXQgbWF0Y2hlcyBgdGltZUludGVydmFsYCcpO1xuICAgIH1cbiAgfVxuICBpZiAoby5kYXRlVmFsaWRhdG9yID09PSBubykgeyBvLmRhdGVWYWxpZGF0b3IgPSBGdW5jdGlvbi5wcm90b3R5cGU7IH1cbiAgaWYgKG8udGltZVZhbGlkYXRvciA9PT0gbm8pIHsgby50aW1lVmFsaWRhdG9yID0gRnVuY3Rpb24ucHJvdG90eXBlOyB9XG4gIGlmIChvLnRpbWVGb3JtYXQgPT09IG5vKSB7IG8udGltZUZvcm1hdCA9ICdISDptbSc7IH1cbiAgaWYgKG8ud2Vla1N0YXJ0ID09PSBubykgeyBvLndlZWtTdGFydCA9IG1vbWVudHVtLm1vbWVudCgpLndlZWtkYXkoMCkuZGF5KCk7IH1cbiAgaWYgKG8ud2Vla2RheUZvcm1hdCA9PT0gbm8pIHsgby53ZWVrZGF5Rm9ybWF0ID0gJ21pbic7IH1cbiAgaWYgKG8ud2Vla2RheUZvcm1hdCA9PT0gJ2xvbmcnKSB7XG4gICAgby53ZWVrZGF5Rm9ybWF0ID0gbW9tZW50dW0ubW9tZW50LndlZWtkYXlzKCk7XG4gIH0gZWxzZSBpZiAoby53ZWVrZGF5Rm9ybWF0ID09PSAnc2hvcnQnKSB7XG4gICAgby53ZWVrZGF5Rm9ybWF0ID0gbW9tZW50dW0ubW9tZW50LndlZWtkYXlzU2hvcnQoKTtcbiAgfSBlbHNlIGlmIChvLndlZWtkYXlGb3JtYXQgPT09ICdtaW4nKSB7XG4gICAgby53ZWVrZGF5Rm9ybWF0ID0gbW9tZW50dW0ubW9tZW50LndlZWtkYXlzTWluKCk7XG4gIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoby53ZWVrZGF5Rm9ybWF0KSB8fCBvLndlZWtkYXlGb3JtYXQubGVuZ3RoIDwgNykge1xuICAgIHRocm93IG5ldyBFcnJvcignYHdlZWtkYXlzYCBtdXN0IGJlIGBtaW5gLCBgc2hvcnRgLCBvciBgbG9uZ2AnKTtcbiAgfVxuICBpZiAoby5tb250aHNJbkNhbGVuZGFyID09PSBubykgeyBvLm1vbnRoc0luQ2FsZW5kYXIgPSAxOyB9XG4gIGlmIChvLm1vbnRoRm9ybWF0ID09PSBubykgeyBvLm1vbnRoRm9ybWF0ID0gJ01NTU0gWVlZWSc7IH1cbiAgaWYgKG8uZGF5Rm9ybWF0ID09PSBubykgeyBvLmRheUZvcm1hdCA9ICdERCc7IH1cbiAgaWYgKG8uc3R5bGVzID09PSBubykgeyBvLnN0eWxlcyA9IHt9OyB9XG4gIGlmIChvLm1vbnRoc0lucHV0cyA9PT0gbm8pe28ubW9udGhzSW5wdXRzID0gJ2J1dHRvbid9XG5cbiAgby5zdHlsZXMuX2lzU3R5bGVzQ29uZmlndXJhdGlvbiA9IHRydWU7XG5cbiAgdmFyIHN0eWwgPSBvLnN0eWxlcztcbiAgaWYgKHN0eWwuYmFjayA9PT0gbm8pIHsgc3R5bC5iYWNrID0gJ3JkLWJhY2snOyB9XG4gIGlmIChzdHlsLmNvbnRhaW5lciA9PT0gbm8pIHsgc3R5bC5jb250YWluZXIgPSAncmQtY29udGFpbmVyJzsgfVxuICBpZiAoc3R5bC5wb3NpdGlvbmVkID09PSBubykgeyBzdHlsLnBvc2l0aW9uZWQgPSAncmQtY29udGFpbmVyLWF0dGFjaG1lbnQnOyB9XG4gIGlmIChzdHlsLmRhdGUgPT09IG5vKSB7IHN0eWwuZGF0ZSA9ICdyZC1kYXRlJzsgfVxuICBpZiAoc3R5bC5kYXlCb2R5ID09PSBubykgeyBzdHlsLmRheUJvZHkgPSAncmQtZGF5cy1ib2R5JzsgfVxuICBpZiAoc3R5bC5kYXlCb2R5RWxlbSA9PT0gbm8pIHsgc3R5bC5kYXlCb2R5RWxlbSA9ICdyZC1kYXktYm9keSc7IH1cbiAgaWYgKHN0eWwuZGF5UHJldk1vbnRoID09PSBubykgeyBzdHlsLmRheVByZXZNb250aCA9ICdyZC1kYXktcHJldi1tb250aCc7IH1cbiAgaWYgKHN0eWwuZGF5TmV4dE1vbnRoID09PSBubykgeyBzdHlsLmRheU5leHRNb250aCA9ICdyZC1kYXktbmV4dC1tb250aCc7IH1cbiAgaWYgKHN0eWwuZGF5RGlzYWJsZWQgPT09IG5vKSB7IHN0eWwuZGF5RGlzYWJsZWQgPSAncmQtZGF5LWRpc2FibGVkJzsgfVxuICBpZiAoc3R5bC5kYXlDb25jZWFsZWQgPT09IG5vKSB7IHN0eWwuZGF5Q29uY2VhbGVkID0gJ3JkLWRheS1jb25jZWFsZWQnOyB9XG4gIGlmIChzdHlsLmRheUhlYWQgPT09IG5vKSB7IHN0eWwuZGF5SGVhZCA9ICdyZC1kYXlzLWhlYWQnOyB9XG4gIGlmIChzdHlsLmRheUhlYWRFbGVtID09PSBubykgeyBzdHlsLmRheUhlYWRFbGVtID0gJ3JkLWRheS1oZWFkJzsgfVxuICBpZiAoc3R5bC5kYXlSb3cgPT09IG5vKSB7IHN0eWwuZGF5Um93ID0gJ3JkLWRheXMtcm93JzsgfVxuICBpZiAoc3R5bC5kYXlUYWJsZSA9PT0gbm8pIHsgc3R5bC5kYXlUYWJsZSA9ICdyZC1kYXlzJzsgfVxuICBpZiAoc3R5bC5tb250aCA9PT0gbm8pIHsgc3R5bC5tb250aCA9ICdyZC1tb250aCc7IH1cbiAgaWYgKHN0eWwubW9udGhMYWJlbCA9PT0gbm8pIHsgc3R5bC5tb250aExhYmVsID0gJ3JkLW1vbnRoLWxhYmVsJzsgfVxuICBpZiAoc3R5bC5uZXh0ID09PSBubykgeyBzdHlsLm5leHQgPSAncmQtbmV4dCc7IH1cbiAgaWYgKHN0eWwuc2VsZWN0ZWREYXkgPT09IG5vKSB7IHN0eWwuc2VsZWN0ZWREYXkgPSAncmQtZGF5LXNlbGVjdGVkJzsgfVxuICBpZiAoc3R5bC5zZWxlY3RlZFRpbWUgPT09IG5vKSB7IHN0eWwuc2VsZWN0ZWRUaW1lID0gJ3JkLXRpbWUtc2VsZWN0ZWQnOyB9XG4gIGlmIChzdHlsLnRpbWUgPT09IG5vKSB7IHN0eWwudGltZSA9ICdyZC10aW1lJzsgfVxuICBpZiAoc3R5bC50aW1lTGlzdCA9PT0gbm8pIHsgc3R5bC50aW1lTGlzdCA9ICdyZC10aW1lLWxpc3QnOyB9XG4gIGlmIChzdHlsLnRpbWVPcHRpb24gPT09IG5vKSB7IHN0eWwudGltZU9wdGlvbiA9ICdyZC10aW1lLW9wdGlvbic7IH1cblxuICByZXR1cm4gbztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gZG9tIChvcHRpb25zKSB7XG4gIHZhciBvID0gb3B0aW9ucyB8fCB7fTtcbiAgaWYgKCFvLnR5cGUpIHsgby50eXBlID0gJ2Rpdic7IH1cbiAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG8udHlwZSk7XG4gIGlmIChvLmNsYXNzTmFtZSkgeyBlbGVtLmNsYXNzTmFtZSA9IG8uY2xhc3NOYW1lOyB9XG4gIGlmIChvLnRleHQpIHsgZWxlbS5pbm5lclRleHQgPSBlbGVtLnRleHRDb250ZW50ID0gby50ZXh0OyB9XG4gIGlmIChvLmF0dHJpYnV0ZXMpIHtcbiAgICBPYmplY3Qua2V5cyhvLmF0dHJpYnV0ZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICBlbGVtLnNldEF0dHJpYnV0ZShrZXksIG8uYXR0cmlidXRlc1trZXldKTtcbiAgICB9KTtcbiAgfVxuICBpZiAoby5wYXJlbnQpIHsgby5wYXJlbnQuYXBwZW5kQ2hpbGQoZWxlbSk7IH1cbiAgcmV0dXJuIGVsZW07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZG9tO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIG5vO1xudmFyIGlrZXkgPSAnZGF0YS1yb21lLWlkJztcbnZhciBpbmRleCA9IFtdO1xuXG5mdW5jdGlvbiBmaW5kICh0aGluZykgeyAvLyBjYW4gYmUgYSBET00gZWxlbWVudCBvciBhIG51bWJlclxuICBpZiAodHlwZW9mIHRoaW5nICE9PSAnbnVtYmVyJyAmJiB0aGluZyAmJiB0aGluZy5nZXRBdHRyaWJ1dGUpIHtcbiAgICByZXR1cm4gZmluZCh0aGluZy5nZXRBdHRyaWJ1dGUoaWtleSkpO1xuICB9XG4gIHZhciBleGlzdGluZyA9IGluZGV4W3RoaW5nXTtcbiAgaWYgKGV4aXN0aW5nICE9PSBubykge1xuICAgIHJldHVybiBleGlzdGluZztcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gYXNzaWduIChlbGVtLCBpbnN0YW5jZSkge1xuICBlbGVtLnNldEF0dHJpYnV0ZShpa2V5LCBpbnN0YW5jZS5pZCA9IGluZGV4LnB1c2goaW5zdGFuY2UpIC0gMSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBmaW5kOiBmaW5kLFxuICBhc3NpZ246IGFzc2lnblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhbGVuZGFyID0gcmVxdWlyZSgnLi9jYWxlbmRhcicpO1xuXG5mdW5jdGlvbiBpbmxpbmUgKGVsZW0sIGNhbGVuZGFyT3B0aW9ucykge1xuICB2YXIgbyA9IGNhbGVuZGFyT3B0aW9ucyB8fCB7fTtcblxuICBvLmFwcGVuZFRvID0gZWxlbTtcbiAgby5hc3NvY2lhdGVkID0gZWxlbTtcblxuICB2YXIgY2FsID0gY2FsZW5kYXIobyk7XG4gIGNhbC5zaG93KCk7XG4gIHJldHVybiBjYWw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5saW5lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50Jyk7XG52YXIgYnVsbHNleWUgPSByZXF1aXJlKCcuL3BvcHVwJyk7XG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCcuL3Rocm90dGxlJyk7XG52YXIgY2xvbmUgPSByZXF1aXJlKCcuL2Nsb25lJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyk7XG52YXIgY2FsZW5kYXIgPSByZXF1aXJlKCcuL2NhbGVuZGFyJyk7XG52YXIgbW9tZW50dW0gPSByZXF1aXJlKCcuL21vbWVudHVtJyk7XG52YXIgY2xhc3NlcyA9IHJlcXVpcmUoJy4vY2xhc3NlcycpO1xuXG5mdW5jdGlvbiBpbnB1dENhbGVuZGFyIChpbnB1dCwgY2FsZW5kYXJPcHRpb25zKSB7XG4gIHZhciBvID0gY2FsZW5kYXJPcHRpb25zIHx8IHt9O1xuXG4gIG8uYXNzb2NpYXRlZCA9IGlucHV0O1xuXG4gIHZhciBhcGkgPSBjYWxlbmRhcihvKTtcbiAgdmFyIHRocm90dGxlZFRha2VJbnB1dCA9IHRocm90dGxlKHRha2VJbnB1dCwgMzApO1xuICB2YXIgaWdub3JlSW52YWxpZGF0aW9uO1xuICB2YXIgaWdub3JlU2hvdztcbiAgdmFyIGV5ZTtcblxuICBpbml0KG8pO1xuXG4gIHJldHVybiBhcGk7XG5cbiAgZnVuY3Rpb24gaW5pdCAoaW5pdE9wdGlvbnMpIHtcbiAgICBvID0gZGVmYXVsdHMoaW5pdE9wdGlvbnMgfHwgbywgYXBpKTtcblxuICAgIGNsYXNzZXMuYWRkKGFwaS5jb250YWluZXIsIG8uc3R5bGVzLnBvc2l0aW9uZWQpO1xuICAgIGNyb3NzdmVudC5hZGQoYXBpLmNvbnRhaW5lciwgJ21vdXNlZG93bicsIGNvbnRhaW5lck1vdXNlRG93bik7XG4gICAgY3Jvc3N2ZW50LmFkZChhcGkuY29udGFpbmVyLCAnY2xpY2snLCBjb250YWluZXJDbGljayk7XG5cbiAgICBhcGkuZ2V0RGF0ZSA9IHVucmVxdWlyZShhcGkuZ2V0RGF0ZSk7XG4gICAgYXBpLmdldERhdGVTdHJpbmcgPSB1bnJlcXVpcmUoYXBpLmdldERhdGVTdHJpbmcpO1xuICAgIGFwaS5nZXRNb21lbnQgPSB1bnJlcXVpcmUoYXBpLmdldE1vbWVudCk7XG5cbiAgICBpZiAoby5pbml0aWFsVmFsdWUpIHtcbiAgICAgIGlucHV0LnZhbHVlID0gby5pbml0aWFsVmFsdWUuZm9ybWF0KG8uaW5wdXRGb3JtYXQpO1xuICAgIH1cblxuICAgIGV5ZSA9IGJ1bGxzZXllKGFwaS5jb250YWluZXIsIGlucHV0KTtcbiAgICBhcGkub24oJ2RhdGEnLCB1cGRhdGVJbnB1dCk7XG4gICAgYXBpLm9uKCdzaG93JywgZXllLnJlZnJlc2gpO1xuXG4gICAgZXZlbnRMaXN0ZW5pbmcoKTtcbiAgICB0aHJvdHRsZWRUYWtlSW5wdXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICAgIGV2ZW50TGlzdGVuaW5nKHRydWUpO1xuICAgIGV5ZS5kZXN0cm95KCk7XG4gICAgZXllID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV2ZW50TGlzdGVuaW5nIChyZW1vdmUpIHtcbiAgICB2YXIgb3AgPSByZW1vdmUgPyAncmVtb3ZlJyA6ICdhZGQnO1xuICAgIGNyb3NzdmVudFtvcF0oaW5wdXQsICdjbGljaycsIHNob3cpO1xuICAgIGNyb3NzdmVudFtvcF0oaW5wdXQsICd0b3VjaGVuZCcsIHNob3cpO1xuICAgIGNyb3NzdmVudFtvcF0oaW5wdXQsICdmb2N1c2luJywgc2hvdyk7XG4gICAgY3Jvc3N2ZW50W29wXShpbnB1dCwgJ2NoYW5nZScsIHRocm90dGxlZFRha2VJbnB1dCk7XG4gICAgY3Jvc3N2ZW50W29wXShpbnB1dCwgJ2tleXByZXNzJywgdGhyb3R0bGVkVGFrZUlucHV0KTtcbiAgICBjcm9zc3ZlbnRbb3BdKGlucHV0LCAna2V5ZG93bicsIHRocm90dGxlZFRha2VJbnB1dCk7XG4gICAgY3Jvc3N2ZW50W29wXShpbnB1dCwgJ2lucHV0JywgdGhyb3R0bGVkVGFrZUlucHV0KTtcbiAgICBpZiAoby5pbnZhbGlkYXRlKSB7IGNyb3NzdmVudFtvcF0oaW5wdXQsICdibHVyJywgaW52YWxpZGF0ZUlucHV0KTsgfVxuXG4gICAgaWYgKHJlbW92ZSkge1xuICAgICAgYXBpLm9uY2UoJ3JlYWR5JywgaW5pdCk7XG4gICAgICBhcGkub2ZmKCdkZXN0cm95ZWQnLCBkZXN0cm95KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXBpLm9mZigncmVhZHknLCBpbml0KTtcbiAgICAgIGFwaS5vbmNlKCdkZXN0cm95ZWQnLCBkZXN0cm95KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjb250YWluZXJDbGljayAoKSB7XG4gICAgaWdub3JlU2hvdyA9IHRydWU7XG4gICAgaW5wdXQuZm9jdXMoKTtcbiAgICBpZ25vcmVTaG93ID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBjb250YWluZXJNb3VzZURvd24gKCkge1xuICAgIGlnbm9yZUludmFsaWRhdGlvbiA9IHRydWU7XG4gICAgc2V0VGltZW91dCh1bmlnbm9yZSwgMCk7XG5cbiAgICBmdW5jdGlvbiB1bmlnbm9yZSAoKSB7XG4gICAgICBpZ25vcmVJbnZhbGlkYXRpb24gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbnZhbGlkYXRlSW5wdXQgKCkge1xuICAgIGlmICghaWdub3JlSW52YWxpZGF0aW9uICYmICFpc0VtcHR5KCkpIHtcbiAgICAgIGFwaS5lbWl0VmFsdWVzKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvdyAoKSB7XG4gICAgaWYgKGlnbm9yZVNob3cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXBpLnNob3coKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRha2VJbnB1dCAoKSB7XG4gICAgdmFyIHZhbHVlID0gaW5wdXQudmFsdWUudHJpbSgpO1xuICAgIGlmIChpc0VtcHR5KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGUgPSBtb21lbnR1bS5tb21lbnQodmFsdWUsIG8uaW5wdXRGb3JtYXQsIG8uc3RyaWN0UGFyc2UpO1xuICAgIGFwaS5zZXRWYWx1ZShkYXRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUlucHV0IChkYXRhKSB7XG4gICAgaW5wdXQudmFsdWUgPSBkYXRhO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNFbXB0eSAoKSB7XG4gICAgcmV0dXJuIG8ucmVxdWlyZWQgPT09IGZhbHNlICYmIGlucHV0LnZhbHVlLnRyaW0oKSA9PT0gJyc7XG4gIH1cblxuICBmdW5jdGlvbiB1bnJlcXVpcmUgKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1heWJlICgpIHtcbiAgICAgIHJldHVybiBpc0VtcHR5KCkgPyBudWxsIDogZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5wdXRDYWxlbmRhcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaXNJbnB1dCAoZWxlbSkge1xuICByZXR1cm4gZWxlbSAmJiBlbGVtLm5vZGVOYW1lICYmIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2lucHV0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0lucHV0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpc01vbWVudCAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ19pc0FNb21lbnRPYmplY3QnKTtcbn1cblxudmFyIGFwaSA9IHtcbiAgbW9tZW50OiBudWxsLFxuICBpc01vbWVudDogaXNNb21lbnRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBub29wICgpIHt9XG5cbm1vZHVsZS5leHBvcnRzID0gbm9vcDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1vbWVudHVtID0gcmVxdWlyZSgnLi9tb21lbnR1bScpO1xuXG5mdW5jdGlvbiByYXcgKGRhdGUsIGZvcm1hdCkge1xuICBpZiAodHlwZW9mIGRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIG1vbWVudHVtLm1vbWVudChkYXRlLCBmb3JtYXQpO1xuICB9XG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0ZSkgPT09ICdbb2JqZWN0IERhdGVdJykge1xuICAgIHJldHVybiBtb21lbnR1bS5tb21lbnQoZGF0ZSk7XG4gIH1cbiAgaWYgKG1vbWVudHVtLmlzTW9tZW50KGRhdGUpKSB7XG4gICAgcmV0dXJuIGRhdGUuY2xvbmUoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZSAoZGF0ZSwgZm9ybWF0KSB7XG4gIHZhciBtID0gcmF3KGRhdGUsIHR5cGVvZiBmb3JtYXQgPT09ICdzdHJpbmcnID8gZm9ybWF0IDogbnVsbCk7XG4gIHJldHVybiBtICYmIG0uaXNWYWxpZCgpID8gbSA6IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbmlmICghQXJyYXkucHJvdG90eXBlLmZpbHRlcikge1xuICBBcnJheS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGZuLCBjdHgpIHtcbiAgICB2YXIgZiA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSwgdCkge1xuICAgICAgaWYgKGZuLmNhbGwoY3R4LCB2LCBpLCB0KSkgeyBmLnB1c2godik7IH1cbiAgICB9LCBjdHgpO1xuICAgIHJldHVybiBmO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIUFycmF5LnByb3RvdHlwZS5mb3JFYWNoKSB7XG4gIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGZuLCBjdHgpIHtcbiAgICBpZiAodGhpcyA9PT0gdm9pZCAwIHx8IHRoaXMgPT09IG51bGwgfHwgdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgfVxuICAgIHZhciB0ID0gdGhpcztcbiAgICB2YXIgbGVuID0gdC5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKGkgaW4gdCkgeyBmbi5jYWxsKGN0eCwgdFtpXSwgaSwgdCk7IH1cbiAgICB9XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAod2hhdCwgc3RhcnQpIHtcbiAgICBpZiAodGhpcyA9PT0gdW5kZWZpbmVkIHx8IHRoaXMgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgIHN0YXJ0ID0gK3N0YXJ0IHx8IDA7XG4gICAgaWYgKE1hdGguYWJzKHN0YXJ0KSA9PT0gSW5maW5pdHkpIHtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0IDwgMCkge1xuICAgICAgc3RhcnQgKz0gbGVuZ3RoO1xuICAgICAgaWYgKHN0YXJ0IDwgMCkgeyBzdGFydCA9IDA7IH1cbiAgICB9XG4gICAgZm9yICg7IHN0YXJ0IDwgbGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAodGhpc1tzdGFydF0gPT09IHdoYXQpIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbkFycmF5LmlzQXJyYXkgfHwgKEFycmF5LmlzQXJyYXkgPSBmdW5jdGlvbiAoYSkge1xuICByZXR1cm4gJycgKyBhICE9PSBhICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIUFycmF5LnByb3RvdHlwZS5tYXApIHtcbiAgQXJyYXkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChmbiwgY3R4KSB7XG4gICAgdmFyIGNvbnRleHQsIHJlc3VsdCwgaTtcblxuICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3RoaXMgaXMgbnVsbCBvciBub3QgZGVmaW5lZCcpO1xuICAgIH1cblxuICAgIHZhciBzb3VyY2UgPSBPYmplY3QodGhpcyk7XG4gICAgdmFyIGxlbiA9IHNvdXJjZS5sZW5ndGggPj4+IDA7XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGZuICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgIH1cblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgY29udGV4dCA9IGN0eDtcbiAgICB9XG5cbiAgICByZXN1bHQgPSBuZXcgQXJyYXkobGVuKTtcbiAgICBpID0gMDtcblxuICAgIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgICBpZiAoaSBpbiBzb3VyY2UpIHtcbiAgICAgICAgcmVzdWx0W2ldID0gZm4uY2FsbChjb250ZXh0LCBzb3VyY2VbaV0sIGksIHNvdXJjZSk7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmlmICghQXJyYXkucHJvdG90eXBlLnNvbWUpIHtcbiAgQXJyYXkucHJvdG90eXBlLnNvbWUgPSBmdW5jdGlvbiAoZm4sIGN0eCkge1xuICAgIHZhciBjb250ZXh0LCBpO1xuXG4gICAgaWYgKHRoaXMgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndGhpcyBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgdmFyIHNvdXJjZSA9IE9iamVjdCh0aGlzKTtcbiAgICB2YXIgbGVuID0gc291cmNlLmxlbmd0aCA+Pj4gMDtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoZm4gKyAnIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICBjb250ZXh0ID0gY3R4O1xuICAgIH1cblxuICAgIGkgPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICAgIGlmIChpIGluIHNvdXJjZSkge1xuICAgICAgICB2YXIgdGVzdCA9IGZuLmNhbGwoY29udGV4dCwgc291cmNlW2ldLCBpLCBzb3VyY2UpO1xuICAgICAgICBpZiAodGVzdCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgIH1cbiAgICB2YXIgY3VycmllZCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIG9yaWdpbmFsID0gdGhpcztcbiAgICB2YXIgTm9PcCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIHZhciBib3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjdHggPSB0aGlzIGluc3RhbmNlb2YgTm9PcCAmJiBjb250ZXh0ID8gdGhpcyA6IGNvbnRleHQ7XG4gICAgICB2YXIgYXJncyA9IGN1cnJpZWQuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KGN0eCwgYXJncyk7XG4gICAgfTtcbiAgICBOb09wLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgIGJvdW5kLnByb3RvdHlwZSA9IG5ldyBOb09wKCk7XG4gICAgcmV0dXJuIGJvdW5kO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBoYXNEb250RW51bUJ1ZyA9ICEoeyB0b1N0cmluZzogbnVsbCB9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKTtcbnZhciBkb250RW51bXMgPSBbXG4gICd0b1N0cmluZycsXG4gICd0b0xvY2FsZVN0cmluZycsXG4gICd2YWx1ZU9mJyxcbiAgJ2hhc093blByb3BlcnR5JyxcbiAgJ2lzUHJvdG90eXBlT2YnLFxuICAncHJvcGVydHlJc0VudW1lcmFibGUnLFxuICAnY29uc3RydWN0b3InXG5dO1xudmFyIGRvbnRFbnVtc0xlbmd0aCA9IGRvbnRFbnVtcy5sZW5ndGg7XG5cbmlmICghT2JqZWN0LmtleXMpIHtcbiAgT2JqZWN0LmtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgJiYgKHR5cGVvZiBvYmogIT09ICdmdW5jdGlvbicgfHwgb2JqID09PSBudWxsKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmtleXMgY2FsbGVkIG9uIG5vbi1vYmplY3QnKTtcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gW10sIHByb3AsIGk7XG5cbiAgICBmb3IgKHByb3AgaW4gb2JqKSB7XG4gICAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBwcm9wKSkge1xuICAgICAgICByZXN1bHQucHVzaChwcm9wKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGFzRG9udEVudW1CdWcpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBkb250RW51bXNMZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBkb250RW51bXNbaV0pKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goZG9udEVudW1zW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIVN0cmluZy5wcm90b3R5cGUudHJpbSkge1xuICBTdHJpbmcucHJvdG90eXBlLnRyaW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50Jyk7XG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCcuL3Rocm90dGxlJyk7XG5cbmZ1bmN0aW9uIHBvcHVwIChlbCwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gIHZhciBvID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIGRlc3Ryb3llZCA9IGZhbHNlO1xuICB2YXIgdGhyb3R0bGVkUG9zaXRpb24gPSB0aHJvdHRsZShwb3NpdGlvbiwgMzApO1xuXG4gIHBvc2l0aW9uKCk7XG5cbiAgaWYgKG8udHJhY2tpbmcgIT09IGZhbHNlKSB7XG4gICAgY3Jvc3N2ZW50LmFkZCh3aW5kb3csICdyZXNpemUnLCB0aHJvdHRsZWRQb3NpdGlvbik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlZnJlc2g6IHBvc2l0aW9uLFxuICAgIGRlc3Ryb3k6IGRlc3Ryb3lcbiAgfTtcblxuICBmdW5jdGlvbiBwb3NpdGlvbiAoKSB7XG4gICAgaWYgKGRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQb3B1cCBjYW5cXCd0IHJlZnJlc2ggYWZ0ZXIgYmVpbmcgZGVzdHJveWVkLiBDcmVhdGUgYW5vdGhlciBpbnN0YW5jZSBpbnN0ZWFkLicpO1xuICAgIH1cbiAgICB2YXIgYm91bmRzID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuXHR2YXIgcGFnZUhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQrc2Nyb2xsVG9wO1xuXHQgIHZhciBlbFNpemUgPSBnZXRFbGVtZW50U2l6ZShlbCk7XG5cdCAgdmFyIHRvcCA9IGJvdW5kcy50b3AgKyBzY3JvbGxUb3AgKyB0YXJnZXQub2Zmc2V0SGVpZ2h0O1xuXHQgIHZhciBlbEJvdHRvbSA9IGJvdW5kcy5ib3R0b20gKyBlbFNpemUuaDtcblx0ICBpZiAoZWxCb3R0b20gPiBwYWdlSGVpZ2h0KXtcblx0XHQgIHRvcCA9IHRvcCAtIGVsU2l6ZS5oIC0gdGFyZ2V0Lm9mZnNldEhlaWdodDsvLyBib3VuZHMudG9wICsgc2Nyb2xsVG9wICsgdGFyZ2V0Lm9mZnNldEhlaWdodDtcblx0ICB9XG4gICAgZWwuc3R5bGUudG9wICA9IHRvcCArJ3B4JztcbiAgICBlbC5zdHlsZS5sZWZ0ID0gYm91bmRzLmxlZnQgKyAncHgnO1xuXG4gIH1cblxuXHRmdW5jdGlvbiBnZXRFbGVtZW50U2l6ZShlbGVtZW50KXtcblx0XHQvL0NyZWF0ZSB1bmlxdWUgY2xhc3Ncblx0XHR2YXIgdGVtcElkID0gJ3RtcC0nK01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSo5OTk5OSk7XG5cdFx0Ly9DbG9uZUVsIGFuZCBpbnNlcnQganVzdCBhZnRlclxuXHRcdHZhciBjbG9uZSA9IGVsZW1lbnQuY2xvbmVOb2RlKHRydWUpO1xuXHRcdGVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChjbG9uZSk7XG5cdFx0Ly9Qb3NpdGlvbiBzb21ld2hlcmUgZmFyIGF3YXlcblx0XHRjbG9uZS5zdHlsZS5sZWZ0ID0gJy0xMDAwZW0nO1xuXHRcdC8vIEFkZCBDbGFzc1xuXHRcdHZhciBjbGFzc2VzID0gY2xvbmUuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cdFx0Y2xhc3Nlcy5wdXNoKHRlbXBJZCk7XG5cdFx0Y2xvbmUuY2xhc3NOYW1lID0gY2xhc3Nlcy5qb2luKCcgJyk7XG5cdFx0Ly9EaXNwbGF5IGFuZCBnZXQgdGhlIHNpemVcblx0XHRjbG9uZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHR2YXIgdGVtcEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSh0ZW1wSWQpWzBdO1xuXHRcdHZhciBlbGVtZW50U2l6ZSA9IHsgaDogdGVtcEVsLmNsaWVudEhlaWdodCxcblx0XHRcdFx0XHRcdFx0IHc6IHRlbXBFbC5jbGllbnRXaWR0aH07XG5cdFx0Ly9yZW1vdmVcblx0XHR0ZW1wRWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0ZW1wRWwpO1xuXG5cdFx0cmV0dXJuIGVsZW1lbnRTaXplO1xuXHR9XG5cbiAgZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gICAgY3Jvc3N2ZW50LnJlbW92ZSh3aW5kb3csICdyZXNpemUnLCB0aHJvdHRsZWRQb3NpdGlvbik7XG4gICAgZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBvcHVwO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyB0aGVzZSBhcmUgb25seSByZXF1aXJlZCBmb3IgSUUgPCA5XG4vLyBtYXliZSBtb3ZlIHRvIElFLXNwZWNpZmljIGRpc3Rybz9cbnJlcXVpcmUoJy4vcG9seWZpbGxzL2Z1bmN0aW9uLmJpbmQnKTtcbnJlcXVpcmUoJy4vcG9seWZpbGxzL2FycmF5LmZvcmVhY2gnKTtcbnJlcXVpcmUoJy4vcG9seWZpbGxzL2FycmF5Lm1hcCcpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbHMvYXJyYXkuZmlsdGVyJyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxscy9hcnJheS5pc2FycmF5Jyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxscy9hcnJheS5pbmRleG9mJyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxscy9hcnJheS5zb21lJyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxscy9zdHJpbmcudHJpbScpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbHMvb2JqZWN0LmtleXMnKTtcblxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUnKTtcbnZhciBpbmRleCA9IHJlcXVpcmUoJy4vaW5kZXgnKTtcbnZhciB1c2UgPSByZXF1aXJlKCcuL3VzZScpO1xuXG5jb3JlLnVzZSA9IHVzZS5iaW5kKGNvcmUpO1xuY29yZS5maW5kID0gaW5kZXguZmluZDtcbmNvcmUudmFsID0gcmVxdWlyZSgnLi92YWxpZGF0b3JzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY29yZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xudmFyIHJvbWUgPSByZXF1aXJlKCcuL3JvbWUnKTtcblxucm9tZS51c2UobW9tZW50KTtcblxubW9kdWxlLmV4cG9ydHMgPSByb21lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiB0ZXh0IChlbGVtLCB2YWx1ZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIGVsZW0uaW5uZXJUZXh0ID0gZWxlbS50ZXh0Q29udGVudCA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBlbGVtLmlubmVyVGV4dCB8fCBlbGVtLnRleHRDb250ZW50O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRleHQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGhyb3R0bGUgKGZuLCBib3VuZGFyeSkge1xuICB2YXIgbGFzdCA9IC1JbmZpbml0eTtcbiAgdmFyIHRpbWVyO1xuICByZXR1cm4gZnVuY3Rpb24gYm91bmNlZCAoKSB7XG4gICAgaWYgKHRpbWVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHVuYm91bmQoKTtcblxuICAgIGZ1bmN0aW9uIHVuYm91bmQgKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIHZhciBuZXh0ID0gbGFzdCArIGJvdW5kYXJ5O1xuICAgICAgdmFyIG5vdyA9ICtuZXcgRGF0ZSgpO1xuICAgICAgaWYgKG5vdyA+IG5leHQpIHtcbiAgICAgICAgbGFzdCA9IG5vdztcbiAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dCh1bmJvdW5kLCBuZXh0IC0gbm93KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbW9tZW50dW0gPSByZXF1aXJlKCcuL21vbWVudHVtJyk7XG5cbmZ1bmN0aW9uIHVzZSAobW9tZW50KSB7XG4gIHRoaXMubW9tZW50ID0gbW9tZW50dW0ubW9tZW50ID0gbW9tZW50O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVzZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGluZGV4ID0gcmVxdWlyZSgnLi9pbmRleCcpO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi9wYXJzZScpO1xudmFyIGFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi9hc3NvY2lhdGlvbicpO1xuXG5mdW5jdGlvbiBjb21wYXJlQnVpbGRlciAoY29tcGFyZSkge1xuICByZXR1cm4gZnVuY3Rpb24gZmFjdG9yeSAodmFsdWUpIHtcbiAgICB2YXIgZml4ZWQgPSBwYXJzZSh2YWx1ZSk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gdmFsaWRhdGUgKGRhdGUpIHtcbiAgICAgIHZhciBjYWwgPSBpbmRleC5maW5kKHZhbHVlKTtcbiAgICAgIHZhciBsZWZ0ID0gcGFyc2UoZGF0ZSk7XG4gICAgICB2YXIgcmlnaHQgPSBmaXhlZCB8fCBjYWwgJiYgY2FsLmdldE1vbWVudCgpO1xuICAgICAgaWYgKCFyaWdodCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWwpIHtcbiAgICAgICAgYXNzb2NpYXRpb24uYWRkKHRoaXMsIGNhbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29tcGFyZShsZWZ0LCByaWdodCk7XG4gICAgfTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmFuZ2VCdWlsZGVyIChob3csIGNvbXBhcmUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZhY3RvcnkgKHN0YXJ0LCBlbmQpIHtcbiAgICB2YXIgZGF0ZXM7XG4gICAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShzdGFydCkpIHtcbiAgICAgIGRhdGVzID0gc3RhcnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChsZW4gPT09IDEpIHtcbiAgICAgICAgZGF0ZXMgPSBbc3RhcnRdO1xuICAgICAgfSBlbHNlIGlmIChsZW4gPT09IDIpIHtcbiAgICAgICAgZGF0ZXMgPSBbW3N0YXJ0LCBlbmRdXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gdmFsaWRhdGUgKGRhdGUpIHtcbiAgICAgIHJldHVybiBkYXRlcy5tYXAoZXhwYW5kLmJpbmQodGhpcykpW2hvd10oY29tcGFyZS5iaW5kKHRoaXMsIGRhdGUpKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZXhwYW5kICh2YWx1ZSkge1xuICAgICAgdmFyIHN0YXJ0LCBlbmQ7XG4gICAgICB2YXIgY2FsID0gaW5kZXguZmluZCh2YWx1ZSk7XG4gICAgICBpZiAoY2FsKSB7XG4gICAgICAgIHN0YXJ0ID0gZW5kID0gY2FsLmdldE1vbWVudCgpO1xuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBzdGFydCA9IHZhbHVlWzBdOyBlbmQgPSB2YWx1ZVsxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0ID0gZW5kID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAoY2FsKSB7XG4gICAgICAgIGFzc29jaWF0aW9uLmFkZChjYWwsIHRoaXMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IHBhcnNlKHN0YXJ0KS5zdGFydE9mKCdkYXknKS50b0RhdGUoKSxcbiAgICAgICAgZW5kOiBwYXJzZShlbmQpLmVuZE9mKCdkYXknKS50b0RhdGUoKVxuICAgICAgfTtcbiAgICB9XG4gIH07XG59XG5cbnZhciBhZnRlckVxICA9IGNvbXBhcmVCdWlsZGVyKGZ1bmN0aW9uIChsZWZ0LCByaWdodCkgeyByZXR1cm4gbGVmdCA+PSByaWdodDsgfSk7XG52YXIgYWZ0ZXIgICAgPSBjb21wYXJlQnVpbGRlcihmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHsgcmV0dXJuIGxlZnQgID4gcmlnaHQ7IH0pO1xudmFyIGJlZm9yZUVxID0gY29tcGFyZUJ1aWxkZXIoZnVuY3Rpb24gKGxlZnQsIHJpZ2h0KSB7IHJldHVybiBsZWZ0IDw9IHJpZ2h0OyB9KTtcbnZhciBiZWZvcmUgICA9IGNvbXBhcmVCdWlsZGVyKGZ1bmN0aW9uIChsZWZ0LCByaWdodCkgeyByZXR1cm4gbGVmdCAgPCByaWdodDsgfSk7XG5cbnZhciBleGNlcHQgICA9IHJhbmdlQnVpbGRlcignZXZlcnknLCBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHsgcmV0dXJuIHJpZ2h0LnN0YXJ0ICA+IGxlZnQgfHwgcmlnaHQuZW5kICA8IGxlZnQ7IH0pO1xudmFyIG9ubHkgICAgID0gcmFuZ2VCdWlsZGVyKCdzb21lJywgIGZ1bmN0aW9uIChsZWZ0LCByaWdodCkgeyByZXR1cm4gcmlnaHQuc3RhcnQgPD0gbGVmdCAmJiByaWdodC5lbmQgPj0gbGVmdDsgfSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZnRlckVxOiBhZnRlckVxLFxuICBhZnRlcjogYWZ0ZXIsXG4gIGJlZm9yZUVxOiBiZWZvcmVFcSxcbiAgYmVmb3JlOiBiZWZvcmUsXG4gIGV4Y2VwdDogZXhjZXB0LFxuICBvbmx5OiBvbmx5XG59O1xuIl19
(31)
});
