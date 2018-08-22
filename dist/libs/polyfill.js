'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.isComplex = isComplex;
exports.isNumeric = isNumeric;
exports.intersection = intersection;
exports.unionSet = unionSet;
exports.symmetricDifference = symmetricDifference;
exports.setEqual = setEqual;
exports.setIsSuperSet = setIsSuperSet;
exports.setDifference = setDifference;
exports.setFromRange = setFromRange;
exports.arrayFromRange = arrayFromRange;
exports.randomSample = randomSample;
exports.arrayEqual = arrayEqual;
exports.len = len;
exports.stringToBitArray = stringToBitArray;
exports.complexVectorDot = complexVectorDot;
exports.narray = narray;
exports.productLoop = productLoop;
exports.productLoop3 = productLoop3;
exports.expmod = expmod;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /*
                                                                                                                                                                                                     * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
                                                                                                                                                                                                     *
                                                                                                                                                                                                     * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                     * you may not use this file except in compliance with the License.
                                                                                                                                                                                                     * You may obtain a copy of the License at
                                                                                                                                                                                                     *
                                                                                                                                                                                                     * http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                     *
                                                                                                                                                                                                     * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                     * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                     * See the License for the specific language governing permissions and
                                                                                                                                                                                                     * limitations under the License.
                                                                                                                                                                                                     */

var Complex = _mathjs2.default.complex().constructor;
var Matrix = _mathjs2.default.matrix().constructor;

/**
 * @ignore
 * check if value is complex number
 * @param {Object} value
 * @return {boolean}
 */
function isComplex(value) {
  return value instanceof Complex;
}

/**
 * @ignore
 * check if value is number or complex number
 * @param {Object} value
 * @return {boolean}
 */
function isNumeric(value) {
  return typeof value === 'number' || value instanceof Complex;
}

/**
 * @ignore
 * return intersection of s1 & s2
 * @param {Set} s1
 * @param {Set} s2
 * @return {Set}
 */
function intersection(s1, s2) {
  return new Set([].concat(_toConsumableArray(s1)).filter(function (x) {
    return s2.has(x);
  }));
}

/**
 * @ignore
 * return union set of s1 & s2
 * @param {Set} s1
 * @param {Set} s2
 * @return {Set<any>}
 */
function unionSet(s1, s2) {
  var s = [].concat(_toConsumableArray(s2)).filter(function (x) {
    return !s1.has(x);
  });
  var result = new Set(s1);
  s.forEach(function (x) {
    return result.add(x);
  });
  return result;
}

/**
 * @ignore
 * return symmetric difference of s1 & s2
 * @param {Set} s1
 * @param {Set} s2
 * @return {Set<*>}
 */
function symmetricDifference(s1, s2) {
  var inset = intersection(s1, s2);
  var a = [].concat(_toConsumableArray(s1)).filter(function (x) {
    return !inset.has(x);
  });
  var b = [].concat(_toConsumableArray(s2)).filter(function (x) {
    return !inset.has(x);
  });
  return new Set([].concat(_toConsumableArray(a), _toConsumableArray(b)));
}

/**
 * @ignore
 * check if s1 is equal to s2
 * @param {Set} s1
 * @param {Set} s2
 * @return {boolean}
 */
function setEqual(s1, s2) {
  return symmetricDifference(s1, s2).size === 0;
}

/**
 * @ignore
 * check if `superset` is the super set of `s`
 * @param {Set} superset
 * @param {Set} s
 * @return {boolean}
 */
function setIsSuperSet(superset, s) {
  var result = [].concat(_toConsumableArray(s)).filter(function (x) {
    return !superset.has(x);
  });
  return result.length === 0;
}

/**
 * @ignore
 * @param {Set<*>} s1
 * @param {Set<*>} s2
 * @return {Set<*>}
 */
function setDifference(s1, s2) {
  return new Set([].concat(_toConsumableArray(s1)).filter(function (x) {
    return !s2.has(x);
  }));
}

/**
 * @ignore
 * create a Set contains numbers in range from 0 to n
 * @param {number} n
 * @return {Set<number>}
 */
function setFromRange(n) {
  var result = new Set();
  for (var i = 0; i < n; i++) {
    result.add(i);
  }
  return result;
}

/**
 * @ignore
 * create an array filled by number in range, active like python does
 * @param {number} start
 * @param {number} end
 * @param {number} step
 * @return {number[]}
 */
function arrayFromRange(start, end, step) {
  if (typeof end === 'undefined') {
    end = start;
    start = 0;
  }
  if (typeof step === 'undefined') {
    step = 1;
  }
  var n = end - start;
  var result = new Array(n);
  for (var i = 0; i < n; i += step) {
    result[i] = i + start;
  }
  return result;
}

/**
 * @ignore
 * return a random sample from `array` which length is `count`
 * @param {any[]} array
 * @param {number} count
 * @return {any[]}
 */
function randomSample(array, count) {
  var result = [];
  var length = array.length;

  if (length >= count) {
    var copy = array.slice(0);
    while (result.length < count) {
      var idx = Math.floor(Math.random() * copy.length);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
  }
  return result;
}

/**
 * @ignore
 * test if two array(a1, a2) are equal, support instance of classes in this library
 * @param {Array} a1
 * @param {Array} a2
 * @param {function} itemCompareFunc
 * @return {boolean}
 */
function arrayEqual(a1, a2, itemCompareFunc) {
  if (a1 === a2) {
    return true;
  }

  if (Array.isArray(a1) && Array.isArray(a2)) {
    var l1 = a1.length;
    var l2 = a2.length;
    if (l1 === l2) {
      var _loop = function _loop(i) {
        var c = a1[i];
        var d = a2[i];
        var func = itemCompareFunc;
        if (!func && c.__proto__.equal) {
          func = function func(x, y) {
            return Reflect.apply(c.__proto__.equal, x, [y]);
          };
        }
        if (Array.isArray(c) && Array.isArray(d)) {
          func = arrayEqual;
        }
        if (!func) {
          func = function func(x, y) {
            return x === y;
          };
        }
        var f = func(c, d);
        if (!f) {
          return {
            v: false
          };
        }
      };

      for (var i = 0; i < l1; ++i) {
        var _ret = _loop(i);

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }
      return true;
    }
  }
  return false;
}

/**
 * @ignore
 * @function
 * reverse version of `forEach`
 * @param {function} callbackFunc
 */
Array.prototype.rforEach = function (callbackFunc) {
  if (typeof callbackFunc === 'function') {
    var count = this.length;
    for (var i = count - 1; i >= 0; --i) {
      callbackFunc(this[i]);
    }
  }
};

/**
 * @ignore
 * @function
 * reverse version of `map`
 * @param {function} callbackFunc
 * @return {any[]}
 */
Array.prototype.rmap = function (callbackFunc) {
  var result = [];
  if (typeof callbackFunc === 'function') {
    var count = this.length;
    for (var i = count - 1; i >= 0; --i) {
      result.push(callbackFunc(this[i]));
    }
  }
  return result;
};

/**
 * @ignore
 * @function
 * return total exist count of `item` in array
 * @param {any} item
 */
Array.prototype.count = function (item) {
  var count = 0;
  for (var i = 0; i < this.length; ++i) {
    if (this[i] === item) {
      ++count;
    }
  }
  return count;
};

/**
 * @ignore
 * remove all existance of `target` from array
 * @param {any} target
 */
Array.prototype.remove = function (target) {
  var idx = -1;
  for (var i = 0; i < this.length; ++i) {
    if (arrayEqual(this[i], target)) {
      idx = i;
      break;
    }
  }
  if (idx !== -1) {
    this.splice(idx, 1);
  }
};

/**
 * @ignore
 * return all regular expression match count of `substring` in string
 * @param {string} substring
 * @return {number}
 */
String.prototype.count = function (substring) {
  var exp = new RegExp(substring, 'g');
  var result = this.match(exp);
  if (result) return result.length;
  return 0;
};

/**
 * return `length` of v, act like python
 * @param {any} v
 * @return {number}
 */
function len(v) {
  if (typeof v === 'undefined' || v === null) {
    return 0;
  }
  if (Array.isArray(v)) {
    return v.length;
  }
  if (v instanceof Set) {
    return v.size;
  }
  if (v instanceof Matrix) {
    return v.size()[0];
  }
  if ((0, _util.instanceOf)(v, String)) {
    return v.length;
  }
  if (typeof v.length !== 'undefined') {
    if (typeof v.length === 'function') {
      return v.length();
    } else {
      return v.length;
    }
  }
  if ((typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object') {
    return Object.keys(v).length;
  }
  return 0;
}

/**
 * @ignore
 * parse string contains 1/0 into bit array
 * @param {string} str
 * @return {boolean[]}
 */
function stringToBitArray(str) {
  if (Array.isArray(str)) {
    return str;
  }
  var result = [];
  if ((0, _util.instanceOf)(str, String)) {
    for (var i = 0; i < str.length; ++i) {
      result.push(str.charAt(i) !== '0');
    }
  }
  return result;
}

/**
 * @ignore
 * return dot product of two complex vector(a1, a2)
 * @param {Complex[]} a1
 * @param {Complex[]} a2
 * @return {Complex}
 */
function complexVectorDot(a1, a2) {
  var real = 0;
  var image = 0;
  a1.forEach(function (c1, _ref) {
    var _ref2 = _slicedToArray(_ref, 1),
        i = _ref2[0];

    var c2 = a2.subset(_mathjs2.default.index(i));
    var r1 = _mathjs2.default.re(c1);
    var i1 = _mathjs2.default.im(c1);
    var r2 = _mathjs2.default.re(c2);
    var i2 = _mathjs2.default.im(c2);
    real += r1 * r2 - -i1 * i2;
    image += r1 * i2 - r2 * i1;
  });
  return _mathjs2.default.complex(real, image);
}

/**
 * @ignore
 * return n-length Array filled by item
 * @param {Function|any} item
 * @param {number} count
 * @return {Array}
 */
function narray(item, count) {
  var result = [];
  if (typeof item === 'function') {
    for (var i = 0; i < count; ++i) {
      result.push(item());
    }
  } else {
    for (var _i = 0; _i < count; ++_i) {
      result.push(item);
    }
  }
  return result;
}

/**
 * @ignore
 * product loop on two Arrays p1 & p2
 * @param {Array} p1
 * @param {Array} p2
 * @param {function} func
 */
function productLoop(p1, p2, func) {
  for (var i = 0; i < p1.length; ++i) {
    for (var j = 0; j < p2.length; ++j) {
      var stop = func(p1[i], p2[j]);
      if (stop) {
        return;
      }
    }
  }
}

/**
 * @ignore
 * product loop on three Arrays p1 & p2 & p3
 * @param {Array} p1
 * @param {Array} p2
 * @param {Array} p3
 * @param {function} func
 */
function productLoop3(p1, p2, p3, func) {
  for (var i = 0; i < p1.length; ++i) {
    for (var j = 0; j < p2.length; ++j) {
      for (var k = 0; k < p3.length; ++k) {
        var stop = func(p1[i], p2[j], p3[k]);
        if (stop) {
          return;
        }
      }
    }
  }
}

/**
 * @ignore
 * return (base ^ exp) % mod, it's fast and support big number
 * @param {number} base
 * @param {number}  exp
 * @param  {number} mod
 * @return {number}
 */
function expmod(base, exp, mod) {
  if (exp === 0) return 1;
  if (exp % 2 === 0) {
    return Math.pow(expmod(base, exp / 2, mod), 2) % mod;
  } else {
    return base * expmod(base, exp - 1, mod) % mod;
  }
}