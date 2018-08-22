'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /*
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


exports.zeros = zeros;
exports.arrayIsTuple = arrayIsTuple;
exports.markTuple = markTuple;
exports.tuple = tuple;
exports.ObjectCopy = ObjectCopy;
exports.classHierachy = classHierachy;
exports.isSubclassOf = isSubclassOf;
exports.isKindclassOf = isKindclassOf;
exports.instanceOf = instanceOf;
exports.genString = genString;
exports.matrixRangeAssign = matrixRangeAssign;
exports.matrixRangeIndicesAssign = matrixRangeIndicesAssign;
exports.matrixGetRow = matrixGetRow;
exports.matrixDot = matrixDot;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @ignore
 * generate a n-Length Array filled by `0`
 * @param {number} n
 * @return {number[]}
 */
function zeros(n) {
  var array = new Array(n);
  for (var i = 0; i < n; ++i) {
    array[i] = 0;
  }
  return array;
}

/**
 * @ignore
 * check if an array is `tuple`
 * @param {Array} value
 * @return {boolean}
 */
function arrayIsTuple(value) {
  var isTuple = false;
  if (typeof value.$$__tuple !== 'undefined') {
    isTuple = value.$$__tuple;
    return isTuple;
  }
  if (Array.isArray(value)) {
    isTuple = value.some(function (item) {
      return item instanceof Array;
    });
  }
  return isTuple;
}

/**
 * @ignore
 * force mark a value as `tuple`, internal usage only
 * @param value
 */
function markTuple(value) {
  value.$$__tuple = true;
}

/**
 * create `tuple` from arguments
 * @param args
 * @return {Array}
 */
function tuple() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var result = new (Function.prototype.bind.apply(Array, [null].concat(args)))();
  markTuple(result);
  return result;
}

/**
 * @ignore
 * create copy of object, with same `class`
 * @param {Object} obj
 * @return {Object}
 */
function ObjectCopy(obj) {
  var copy = Object.create(obj.__proto__);
  Object.assign(copy, obj);
  return copy;
}

/**
 * return class hierachy of `cls`
 * @param {function} cls
 * @return {function[]}
 */
function classHierachy(cls) {
  var result = [];
  if (typeof cls === 'function') {
    var _cls = cls,
        name = _cls.name;

    while (name.length > 0) {
      result.push({ name: name, class: cls });
      cls = cls.__proto__;
      name = cls.name;
    }
  }
  return result;
}

/**
 * check if `cls` is subclass of `superClass`, will return false if cls is superClass
 * @param {function} cls
 * @param {function} superClass
 * @return {boolean}
 */
function isSubclassOf(cls, superClass) {
  if (typeof cls === 'function' && typeof superClass === 'function') {
    var targetName = superClass.name;
    var _cls2 = cls,
        name = _cls2.name;

    var level = 0;
    while (name.length > 0) {
      if (name === targetName && level > 0) {
        return true;
      }
      cls = cls.__proto__;
      name = cls.name;
      ++level;
    }
  }
  return false;
}

/**
 * check if `cls` is kind of `superClass`, will return true if cls is superClass
 * @param {function} cls
 * @param {function} superClass
 * @return {boolean}
 */
function isKindclassOf(cls, superClass) {
  if (typeof cls === 'function' && typeof superClass === 'function') {
    var targetName = superClass.name;
    var _cls3 = cls,
        name = _cls3.name;

    while (name.length > 0) {
      if (name === targetName) {
        return true;
      }
      cls = cls.__proto__;
      name = cls.name;
    }
  }
  return false;
}

/**
 * check if `inst` is instance of `cls`, specialized for some class
 * @param {any} inst
 * @param {function} cls
 * @return {boolean}
 */
function instanceOf(inst, cls) {
  if (Array.isArray(cls)) {
    return cls.some(function (looper) {
      return instanceOf(inst, looper);
    });
  }
  switch (cls.name) {
    case 'String':
      {
        return typeof inst === 'string' || inst instanceof cls;
      }
    case 'Number':
      {
        return typeof inst === 'number' || inst instanceof cls;
      }
    default:
      {
        return inst instanceof cls;
      }
  }
}

/**
 * @ignore
 * return item * n string like python does.
 * @param {string} item
 * @param {number} n
 * @return {string}
 */
function genString(item, n) {
  var str = '';
  for (var i = 0; i < n; ++i) {
    str += item;
  }
  return str;
}

/**
 * @ignore
 * assign value in `vector` into `matrix` by index in `indices`
 * @param {math.matrix} matrix
 * @param {number[]} indices
 * @param {number[]} vector
 */
function matrixRangeAssign(matrix, indices, vector) {
  if (Array.isArray(vector)) {
    indices.forEach(function (idx) {
      return matrix.subset(_mathjs2.default.index(idx), vector[idx]);
    });
  } else {
    indices.forEach(function (idx, i) {
      return matrix.subset(_mathjs2.default.index(idx), vector.subset(_mathjs2.default.index(i)));
    });
  }
}

/**
 * @ignore
 * @param matrix
 * @param mstart
 * @param mend
 * @param vector
 * @param vstart
 */
function matrixRangeIndicesAssign(matrix, mstart, mend, vector, vstart) {
  if (Array.isArray(vector)) {
    for (var i = 0; i + mstart < mend; ++i) {
      matrix.subset(_mathjs2.default.index(i + mstart), vector[vstart + i]);
    }
  } else {
    for (var _i = 0; _i + mstart < mend; ++_i) {
      matrix.subset(_mathjs2.default.index(_i + mstart), vector.subset(_mathjs2.default.index(vstart + _i)));
    }
  }
}

/**
 * @ignore
 * return a row of matrix
 * @param {math.matrix} matrix
 * @param {number} index
 * @return {number[]}
 */
function matrixGetRow(matrix, index) {
  var rows = _mathjs2.default.size(matrix).valueOf()[1];
  return _mathjs2.default.flatten(_mathjs2.default.subset(matrix, _mathjs2.default.index(index, _mathjs2.default.range(0, rows))));
}

/**
 * @ignore
 * dot product of matrix & vector
 * @param {math.matrix} matrix
 * @param {number[]} vector
 * @return {math.matrix}
 */
function matrixDot(matrix, vector) {
  var _matrix$size = matrix.size(),
      _matrix$size2 = _slicedToArray(_matrix$size, 1),
      rows = _matrix$size2[0];

  var result = [];
  for (var i = 0; i < rows; ++i) {
    var row = matrixGetRow(matrix, i);
    result.push(_mathjs2.default.dot(row, vector));
  }
  return _mathjs2.default.matrix(result);
}