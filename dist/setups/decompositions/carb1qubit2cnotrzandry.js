'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports._recognize_carb1qubit = _recognize_carb1qubit;
exports._recognize_v = _recognize_v;

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _ops = require('../../ops');

var _meta = require('../../meta');

var _polyfill = require('../../libs/polyfill');

var _arb1qubit2rzandry = require('./arb1qubit2rzandry');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mm = _mathjs2.default.multiply;
var mc = _mathjs2.default.complex;
var TOLERANCE = 1e-12;

/**
 * @ignore
 * Recognize single controlled one qubit gates with a matrix.
 * @param {Command} cmd
 * @return {boolean}
 * @private
 */
function _recognize_carb1qubit(cmd) {
  if (cmd.controlCount === 1) {
    try {
      var m = cmd.gate.matrix;
      if ((0, _polyfill.len)(m) === 2) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
It builds matrix V with parameters (a, b, c/2) and compares against
matrix.

    V = [[-sin(c/2) * exp(j*a), exp(j*(a-b)) * cos(c/2)],
  [exp(j*(a+b)) * cos(c/2), exp(j*a) * sin(c/2)]]

  @param {Array.<number[]>} matrix 2x2 matrix
  @param {number} a Parameter of V
  @param {number} b Parameter of V
  @param {number} c_half c/2. Parameter of V

  @return {boolean} true if matrix elements of V and `matrix` are TOLERANCE close.
 */
function _test_parameters(matrix, a, b, c_half) {
  var exp = _mathjs2.default.exp;

  var cosc = _mathjs2.default.cos(c_half);
  var sinc = _mathjs2.default.sin(c_half);
  var V = [[mm(mm(sinc, exp(mc(0, a))), -1), mm(exp(mc(0, a - b)), cosc)], [mm(exp(mc(0, a + b)), cosc), mm(exp(mc(0, a)), sinc)]];
  return _mathjs2.default.deepEqual(V, matrix);
}

/**
 * @ignore
Recognizes a matrix which can be written in the following form:

    V = [[-sin(c/2) * exp(j*a), exp(j*(a-b)) * cos(c/2)],
      [exp(j*(a+b)) * cos(c/2), exp(j*a) * sin(c/2)]]

  @param {Array.<number[]>} matrix 2x2 matrix
  @return {boolean} false if it is not possible otherwise (a, b, c/2)
 */
function _recognize_v(matrix) {
  var a = void 0;
  var b = void 0;
  var c_half = void 0;
  if (_mathjs2.default.abs(matrix[0][0]) < TOLERANCE) {
    var t = (0, _arb1qubit2rzandry.phase)(mm(matrix[0][1], matrix[1][0]));
    var two_a = _mathjs2.default.mod(t, 2 * _mathjs2.default.pi);
    if (_mathjs2.default.abs(two_a) < TOLERANCE || _mathjs2.default.abs(two_a) > 2 * _mathjs2.default.pi - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0;
    } else {
      a = two_a / 2.0;
    }
    var two_b = (0, _arb1qubit2rzandry.phase)(matrix[1][0]) - (0, _arb1qubit2rzandry.phase)(matrix[0][1]);
    var possible_b = [_mathjs2.default.mod(two_b / 2.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(two_b / 2.0 + _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
    var possible_c_half = [0, _mathjs2.default.pi];
    var found = false;
    (0, _polyfill.productLoop)(possible_b, possible_c_half, function (_b, _c) {
      b = _b;
      c_half = _c;
      if (_test_parameters(matrix, a, b, c_half)) {
        found = true;
        return true;
      }
    });

    (0, _assert2.default)(found); // It should work for all matrices with matrix[0][0]==0.
    return [a, b, c_half];
  } else if (_mathjs2.default.abs(matrix[0][1]) < TOLERANCE) {
    var _t = (0, _arb1qubit2rzandry.phase)(mm(mm(matrix[0][0], matrix[1][1]), -1));
    var _two_a = _mathjs2.default.mod(_t, 2 * _mathjs2.default.pi);
    if (_mathjs2.default.abs(_two_a) < TOLERANCE || _mathjs2.default.abs(_two_a) > 2 * _mathjs2.default.pi - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0;
    } else {
      a = _two_a / 2.0;
    }
    b = 0;
    var _possible_c_half = [_mathjs2.default.pi / 2.0, 3.0 / 2.0 * _mathjs2.default.pi];
    var _found = false;
    for (var i = 0; i < _possible_c_half.length; ++i) {
      c_half = _possible_c_half[i];
      if (_test_parameters(matrix, a, b, c_half)) {
        return [a, b, c_half];
      }
    }
    return [];
  } else {
    var _t2 = mm(mm(-1.0, matrix[0][0]), matrix[1][1]);
    var _two_a2 = _mathjs2.default.mod((0, _arb1qubit2rzandry.phase)(_t2), 2 * _mathjs2.default.pi);
    if (_mathjs2.default.abs(_two_a2) < TOLERANCE || _mathjs2.default.abs(_two_a2) > 2 * _mathjs2.default.pi - TOLERANCE) {
      // from 2a==0 (mod 2pi), it follows that a==0 or a==pi,
      // w.l.g. we can choose a==0 because (see U above)
      // c/2 -> c/2 + pi would have the same effect as as a==0 -> a==pi.
      a = 0;
    } else {
      a = _two_a2 / 2.0;
    }
    var _two_b = (0, _arb1qubit2rzandry.phase)(matrix[1][0]) - (0, _arb1qubit2rzandry.phase)(matrix[0][1]);
    var _possible_b = [_mathjs2.default.mod(_two_b / 2.0, 2 * _mathjs2.default.pi), _mathjs2.default.mod(_two_b / 2.0 + _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
    var tmp = _mathjs2.default.acos(_mathjs2.default.abs(matrix[1][0]));
    var _possible_c_half2 = [_mathjs2.default.mod(tmp, 2 * _mathjs2.default.pi), _mathjs2.default.mod(tmp + _mathjs2.default.pi, 2 * _mathjs2.default.pi), _mathjs2.default.mod(-1.0 * tmp, 2 * _mathjs2.default.pi), _mathjs2.default.mod(-1.0 * tmp + _mathjs2.default.pi, 2 * _mathjs2.default.pi)];
    var _found2 = false;
    (0, _polyfill.productLoop)(_possible_b, _possible_c_half2, function (_b, _c) {
      b = _b;
      c_half = _c;
      if (_test_parameters(matrix, a, b, c_half)) {
        _found2 = true;
        return true;
      }
    });
    if (!_found2) {
      return [];
    }
    return [a, b, c_half];
  }
}

/**
Decompose the single controlled 1 qubit gate into CNOT, Rz, Ry, C(Ph).

    See Nielsen and Chuang chapter 4.3.

    An arbitrary one qubit gate matrix can be writen as
U = [[exp(j*(a-b/2-d/2))*cos(c/2), -exp(j*(a-b/2+d/2))*sin(c/2)],
  [exp(j*(a+b/2-d/2))*sin(c/2), exp(j*(a+b/2+d/2))*cos(c/2)]]
where a,b,c,d are real numbers.
    Then U = exp(j*a) Rz(b) Ry(c) Rz(d).

    Then C(U) = C(exp(ja)) * A * CNOT * B * CNOT * C with
    A = Rz(b) * Ry(c/2)
  B = Ry(-c/2) * Rz(-(d+b)/2)
C = Rz((d-b)/2)
Note that a == 0 if U is element of SU(2). Also note that
the controlled phase C(exp(ia)) can be implemented with single
  qubit gates.

    If the one qubit gate matrix can be writen as
V = [[-sin(c/2) * exp(j*a), exp(j*(a-b)) * cos(c/2)],
  [exp(j*(a+b)) * cos(c/2), exp(j*a) * sin(c/2)]]
Then C(V) = C(exp(ja))* E * CNOT * D with
    E = Rz(b)Ry(c/2)
D = Ry(-c/2)Rz(-b)
This improvement is important for C(Y) or C(Z)

For a proof follow Lemma 5.5 of Barenco et al.
 @param {Command} cmd
 */
function _decompose_carb1qubit(cmd) {
  var matrix = cmd.gate.matrix._data;
  var qb = cmd.qubits;
  var eng = cmd.engine;

  // Case 1: Unitary matrix which can be written in the form of V:
  var parameters_for_v = _recognize_v(matrix);
  if (parameters_for_v.length > 0) {
    var _parameters_for_v = _slicedToArray(parameters_for_v, 3),
        a = _parameters_for_v[0],
        b = _parameters_for_v[1],
        c_half = _parameters_for_v[2];

    if (!new _ops.Rz(-b).equal(new _ops.Rz(0))) {
      new _ops.Rz(-b).or(qb);
    }
    if (!new _ops.Ry(-c_half).equal(new _ops.Ry(0))) {
      new _ops.Ry(-c_half).or(qb);
    }
    (0, _meta.Control)(eng, cmd.controlQubits, function () {
      return _ops.X.or(qb);
    });
    if (!new _ops.Ry(c_half).equal(new _ops.Ry(0))) {
      new _ops.Ry(c_half).or(qb);
    }
    if (!new _ops.Rz(b).equal(new _ops.Rz(0))) {
      new _ops.Rz(b).or(qb);
    }
    if (a !== 0) {
      (0, _meta.Control)(eng, cmd.controlQubits, function () {
        return new _ops.Ph(a).or(qb);
      });
    }
    // Case 2: General matrix U:
  } else {
    var _find_parameters2 = (0, _arb1qubit2rzandry._find_parameters)(matrix),
        _find_parameters3 = _slicedToArray(_find_parameters2, 4),
        _a = _find_parameters3[0],
        b_half = _find_parameters3[1],
        _c_half = _find_parameters3[2],
        d_half = _find_parameters3[3];

    var d = 2 * d_half;
    var _b2 = 2 * b_half;
    if (!new _ops.Rz((d - _b2) / 2.0).equal(new _ops.Rz(0))) {
      new _ops.Rz((d - _b2) / 2.0).or(qb);
    }
    (0, _meta.Control)(eng, cmd.controlQubits, function () {
      return _ops.X.or(qb);
    });
    if (!new _ops.Rz(-(d + _b2) / 2.0).equal(new _ops.Rz(0))) {
      new _ops.Rz(-(d + _b2) / 2.0).or(qb);
    }
    if (!new _ops.Ry(-_c_half).equal(new _ops.Ry(0))) {
      new _ops.Ry(-_c_half).or(qb);
    }
    (0, _meta.Control)(eng, cmd.controlQubits, function () {
      return _ops.X.or(qb);
    });
    if (!new _ops.Ry(_c_half).equal(new _ops.Ry(0))) {
      new _ops.Ry(_c_half).or(qb);
    }
    if (!new _ops.Rz(_b2).equal(new _ops.Rz(0))) {
      new _ops.Rz(_b2).or(qb);
    }
    if (_a !== 0) {
      (0, _meta.Control)(eng, cmd.controlQubits, function () {
        return new _ops.Ph(_a).or(qb);
      });
    }
  }
}

exports.default = [new _decompositionrule2.default(_ops.BasicGate, _decompose_carb1qubit, _recognize_carb1qubit)];