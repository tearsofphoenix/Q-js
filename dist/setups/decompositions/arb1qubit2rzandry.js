'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._find_parameters = exports._recognize_arb1qubit = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.phase = phase;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _meta = require('../../meta');

var _polyfill = require('../../libs/polyfill');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _ops = require('../../ops');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TOLERANCE = 1e-12;

/**
 * @ignore
 * @param {number|{{re: number, im: number}}} c
 * @return {number}
 */
function phase(c) {
  if (typeof c === 'number') {
    return Math.atan2(0, c);
  }
  return Math.atan2(c.im, c.re);
}

/**
 * @ignore
Recognize an arbitrary one qubit gate which has a matrix property.

    It does not allow gates which have control qubits as otherwise the
AutoReplacer might go into an infinite loop. Use
carb1qubit2cnotrzandry instead.
 @param {Command} cmd
 @return {boolean}
 */
var _recognize_arb1qubit = exports._recognize_arb1qubit = function _recognize_arb1qubit(cmd) {
  try {
    var m = cmd.gate.matrix;
    return (0, _polyfill.len)(m) === 2 && cmd.controlCount === 0;
  } catch (e) {
    return false;
  }
};

/**
 * @ignore
It builds matrix U with parameters (a, b/2, c/2, d/2) and compares against
matrix.

    U = [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]

  @param {Array.<number[]>} matrix 2x2 matrix
  @param {number} a parameter of U
  @param {number} b_half b/2. parameter of U
  @param {number} c_half c/2. parameter of U
  @param {number} d_half d/2. parameter of U

@return {boolean} true if matrix elements of U and `matrix` are TOLERANCE close.
 */
var _test_parameters = function _test_parameters(matrix, a, b_half, c_half, d_half) {
  var mc = _mathjs2.default.complex;
  var mm = _mathjs2.default.multiply;
  var U = [[mm(_mathjs2.default.exp(mc(0, a - b_half - d_half)), _mathjs2.default.cos(c_half)), mm(mm(_mathjs2.default.exp(mc(0, a - b_half + d_half)), -1), _mathjs2.default.sin(c_half))], [mm(_mathjs2.default.exp(mc(0, a + b_half - d_half)), _mathjs2.default.sin(c_half)), mm(_mathjs2.default.exp(mc(0, a + b_half + d_half)), _mathjs2.default.cos(c_half))]];
  return _mathjs2.default.deepEqual(U, matrix);
};

/**
 * @ignore
Given a 2x2 unitary matrix, find the parameters
a, b/2, c/2, and d/2 such that
matrix == [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]

Note:
    If the matrix is element of SU(2) (determinant == 1), then
we can choose a = 0.

@param {Array.<number[]>} matrix 2x2 unitary matrix

@return {number[]} parameters of the matrix: (a, b/2, c/2, d/2)
 */
var _find_parameters = exports._find_parameters = function _find_parameters(matrix) {
  // Determine a, b/2, c/2 and d/2 (3 different cases).
  // Note: everything is modulo 2pi.
  var a = void 0;
  var b_half = void 0;
  var c_half = void 0;
  var d_half = void 0;
  var mm = _mathjs2.default.multiply;
  // Case 1: sin(c/2) == 0:
  if (_mathjs2.default.abs(matrix[0][1]) < TOLERANCE) {
    var t = phase(mm(matrix[0][0], matrix[1][1]));
    var two_a = _mathjs2.default.mod(t, 2 * _mathjs2.default.pi);
    if (_mathjs2.default.abs(two_a) < TOLERANCE || _mathjs2.default.abs(two_a) > 2 * _mathjs2.default.pi - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0;
    } else {
      a = two_a / 2.0;
    }
    d_half = 0; // w.l.g
    var b = phase(matrix[1][1]) - phase(matrix[0][0]);
    var possible_b_half = [_mathjs2.default.mod(b / 2.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(b / 2.0 + _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
    // As we have fixed a, we need to find correct sign for cos(c/2)
    var possible_c_half = [0.0, _mathjs2.default.pi];
    var found = false;
    (0, _polyfill.productLoop)(possible_b_half, possible_c_half, function (_b, _c) {
      b_half = _b;
      c_half = _c;
      if (_test_parameters(matrix, a, b_half, c_half, d_half)) {
        found = true;
        return true;
      }
    });

    if (!found) {
      throw new Error('Couldn\'t find parameters for matrix ' + matrix + ',\n        This shouldn\'t happen. Maybe the matrix is \n        not unitary?');
    }
  }
  // Case 2: cos(c/2) == 0:
  else if (_mathjs2.default.abs(matrix[0][0]) < TOLERANCE) {
      var _t = phase(mm(mm(matrix[0][1], matrix[1][0]), -1));
      var _two_a = _mathjs2.default.mod(_t, 2 * _mathjs2.default.pi);
      if (_mathjs2.default.abs(_two_a) < TOLERANCE || _mathjs2.default.abs(_two_a) > 2 * _mathjs2.default.pi - TOLERANCE) {
        // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
        // w.l.g. we can choose a==0 because (see U above)
        // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
        a = 0;
      } else {
        a = _two_a / 2.0;
      }
      d_half = 0; // w.l.g
      var _b2 = phase(matrix[1][0]) - phase(matrix[0][1]) + _mathjs2.default.pi;
      var _possible_b_half = [_mathjs2.default.mod(_b2 / 2.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(_b2 / 2.0 + _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
      // As we have fixed a, we need to find correct sign for sin(c/2)
      var _possible_c_half = [_mathjs2.default.pi / 2.0, 3.0 / 2.0 * _mathjs2.default.pi];
      var _found = false;
      (0, _polyfill.productLoop)(_possible_b_half, _possible_c_half, function (_b, _c) {
        b_half = _b;
        c_half = _c;
        if (_test_parameters(matrix, a, b_half, c_half, d_half)) {
          _found = true;
          return true;
        }
      });
      if (!_found) {
        throw new Error('Couldn\'t find parameters for matrix ' + matrix + ',\n        This shouldn\'t happen. Maybe the matrix is \n        not unitary?');
      }
    }
    // Case 3: sin(c/2) != 0 and cos(c/2) !=0:
    else {
        var _t2 = phase(mm(matrix[0][0], matrix[1][1]));
        var _two_a2 = _mathjs2.default.mod(_t2, 2 * _mathjs2.default.pi);
        if (_mathjs2.default.abs(_two_a2) < TOLERANCE || _mathjs2.default.abs(_two_a2) > 2 * _mathjs2.default.pi - TOLERANCE) {
          // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
          // w.l.g. we can choose a==0 because (see U above)
          // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
          a = 0;
        } else {
          a = _two_a2 / 2.0;
        }
        var two_d = 2.0 * phase(matrix[0][1]) - 2.0 * phase(matrix[0][0]);
        var possible_d_half = [_mathjs2.default.mod(two_d / 4.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(two_d / 4.0 + _mathjs2.default.pi / 2.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(two_d / 4.0 + _mathjs2.default.pi, 2 * _mathjs2.default.pi), _mathjs2.default.mod(two_d / 4.0 + 3.0 / 2.0 * _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
        var two_b = 2.0 * phase(matrix[1][0]) - 2.0 * phase(matrix[0][0]);
        var _possible_b_half2 = [_mathjs2.default.mod(two_b / 4.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(two_b / 4.0 + _mathjs2.default.pi / 2.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(two_b / 4.0 + _mathjs2.default.pi, 2 * _mathjs2.default.pi), _mathjs2.default.mod(two_b / 4.0 + 3.0 / 2.0 * _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
        var tmp = _mathjs2.default.acos(_mathjs2.default.abs(matrix[1][1]));
        var _possible_c_half2 = [_mathjs2.default.mod(tmp, 2 * _mathjs2.default.pi), _mathjs2.default.mod(tmp + _mathjs2.default.pi, 2 * _mathjs2.default.pi), _mathjs2.default.mod(-1.0 * tmp, 2 * _mathjs2.default.pi), _mathjs2.default.mod(-1.0 * tmp + _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
        var _found2 = false;
        (0, _polyfill.productLoop3)(_possible_b_half2, _possible_c_half2, possible_d_half, function (_b, _c, _d) {
          b_half = _b;
          c_half = _c;
          d_half = _d;
          if (_test_parameters(matrix, a, b_half, c_half, d_half)) {
            _found2 = true;
            return true;
          }
        });
        if (!_found2) {
          throw new Error('Couldn\'t find parameters for matrix ' + matrix + ',\n        This shouldn\'t happen. Maybe the matrix is \n        not unitary?');
        }
      }
  return [a, b_half, c_half, d_half];
};

/**
 * @param {Command} cmd
Use Z-Y decomposition of Nielsen and Chuang (Theorem 4.1).

An arbitrary one qubit gate matrix can be writen as
U = [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]
where a,b,c,d are real numbers.
    Then U = exp(j*a) Rz(b) Ry(c) Rz(d).
    If the matrix is element of SU(2) (determinant == 1), then
we can choose a = 0.
 */
var _decompose_arb1qubit = function _decompose_arb1qubit(cmd) {
  var matrix = cmd.gate.matrix._data.slice(0);

  var _find_parameters2 = _find_parameters(matrix),
      _find_parameters3 = _slicedToArray(_find_parameters2, 4),
      a = _find_parameters3[0],
      b_half = _find_parameters3[1],
      c_half = _find_parameters3[2],
      d_half = _find_parameters3[3];

  var qb = cmd.qubits;
  var eng = cmd.engine;
  (0, _meta.Control)(eng, cmd.controlQubits, function () {
    if (!new _ops.Rz(2 * d_half).equal(new _ops.Rz(0))) {
      new _ops.Rz(2 * d_half).or(qb);
    }

    if (!new _ops.Ry(2 * c_half).equal(new _ops.Ry(0))) {
      new _ops.Ry(2 * c_half).or(qb);
    }
    if (!new _ops.Rz(2 * b_half).equal(new _ops.Rz(0))) {
      new _ops.Rz(2 * b_half).or(qb);
    }
    if (a !== 0) {
      new _ops.Ph(a).or(qb);
    }
  });
};

exports.default = [new _decompositionrule2.default(_ops.BasicGate, _decompose_arb1qubit, _recognize_arb1qubit)];