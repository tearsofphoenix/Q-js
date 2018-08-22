'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rule_individual_terms = exports.rule_commuting_terms = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();
/*
Registers decomposition for the TimeEvolution gates.

    An exact straight forward decomposition of a TimeEvolution gate is possible
if the hamiltonian has only one term or if all the terms commute with each
  other in which case one can implement each term individually.
*/

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _qubitoperator = require('../../ops/qubitoperator');

var _qubitoperator2 = _interopRequireDefault(_qubitoperator);

var _polyfill = require('../../libs/polyfill');

var _meta = require('../../meta');

var _timeevolution = require('../../ops/timeevolution');

var _timeevolution2 = _interopRequireDefault(_timeevolution);

var _util = require('../../libs/util');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _ops = require('../../ops');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Recognize all TimeEvolution gates with >1 terms but which all commute.
function _recognize_time_evolution_commuting_terms(cmd) {
  var hamiltonian = cmd.gate.hamiltonian;

  if ((0, _polyfill.len)(hamiltonian.terms) === 1) {
    return false;
  } else {
    var id_op = new _qubitoperator2.default([], 0.0);
    var keys = Object.keys(hamiltonian.terms);
    for (var i = 0; i < keys.length; ++i) {
      var k = keys[i];
      var term = (0, _qubitoperator.stringToArray)(k);
      var coefficient = hamiltonian.terms[k];
      var test_op = new _qubitoperator2.default(term, coefficient);
      for (var j = 0; j < keys.length; ++j) {
        var other = keys[j];
        var other_op = new _qubitoperator2.default((0, _qubitoperator.stringToArray)(other), hamiltonian.terms[other]);
        var commutator = test_op.mul(other_op).sub(other_op.mul(test_op));
        if (!commutator.isClose(id_op, 1e-9, 1e-9)) {
          return false;
        }
      }
    }
  }
  return true;
}

function _decompose_time_evolution_commuting_terms(cmd) {
  var qureg = cmd.qubits;
  var eng = cmd.engine;
  var _cmd$gate = cmd.gate,
      hamiltonian = _cmd$gate.hamiltonian,
      time = _cmd$gate.time;

  (0, _meta.Control)(eng, cmd.controlQubits, function () {
    Object.keys(hamiltonian.terms).forEach(function (key) {
      var coefficient = hamiltonian.terms[key];
      var term = (0, _qubitoperator.stringToArray)(key);
      var ind_operator = new _qubitoperator2.default(term, coefficient);
      new _timeevolution2.default(time, ind_operator).or(qureg);
    });
  });
}

function _recognize_time_evolution_individual_terms(cmd) {
  return (0, _polyfill.len)(cmd.gate.hamiltonian.terms) === 1;
}

/**
Implements a TimeEvolution gate with a hamiltonian having only one term.

    To implement exp(-i * t * hamiltonian), where the hamiltonian is only one
term, e.g., hamiltonian = X0 x Y1 X Z2, we first perform local
transformations to in order that all Pauli operators in the hamiltonian
are Z. We then implement  exp(-i * t * (Z1 x Z2 x Z3) and transform the
basis back to the original. For more details see, e.g.,

    James D. Whitfield, Jacob Biamonte & Aspuru-Guzik
Simulation of electronic structure Hamiltonians using quantum computers,
    Molecular Physics, 109:5, 735-750 (2011).

    or

Nielsen and Chuang, Quantum Computation and Information.
 @param {Command} cmd
 */
function _decompose_time_evolution_individual_terms(cmd) {
  (0, _assert2.default)((0, _polyfill.len)(cmd.qubits) === 1);
  var qureg = cmd.qubits[0];
  var eng = cmd.engine;
  var _cmd$gate2 = cmd.gate,
      time = _cmd$gate2.time,
      hamiltonian = _cmd$gate2.hamiltonian;

  (0, _assert2.default)((0, _polyfill.len)(hamiltonian.terms) === 1);
  var term = Object.keys(hamiltonian.terms)[0];
  term = (0, _qubitoperator.stringToArray)(term);
  var coefficient = hamiltonian.terms[term];
  var check_indices = new Set();

  // Check that hamiltonian is not identity term,
  // Previous __or__ operator should have apply a global phase instead:
  (0, _assert2.default)(term.length !== 0);

  // hamiltonian has only a single local operator
  if ((0, _polyfill.len)(term) === 1) {
    (0, _meta.Control)(eng, cmd.controlQubits, function () {
      var _term$ = _slicedToArray(term[0], 2),
          idx = _term$[0],
          action = _term$[1];

      if (action === 'X') {
        new _ops.Rx(time * coefficient * 2.0).or(qureg[idx]);
      } else if (action === 'Y') {
        new _ops.Ry(time * coefficient * 2.0).or(qureg[idx]);
      } else {
        new _ops.Rz(time * coefficient * 2.0).or(qureg[idx]);
      }
    });

    // hamiltonian has more than one local operator
  } else {
    (0, _meta.Control)(eng, cmd.controlQubits, function () {
      (0, _meta.Compute)(eng, function () {
        // Apply local basis rotations
        term.forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              index = _ref2[0],
              action = _ref2[1];

          check_indices.add(index);
          if (action === 'X') {
            _ops.H.or(qureg[index]);
          } else if (action === 'Y') {
            new _ops.Rx(Math.PI / 2.0).or(qureg[index]);
          }
        });

        // Check that qureg had exactly as many qubits as indices:
        (0, _assert2.default)((0, _polyfill.setEqual)(check_indices, (0, _polyfill.setFromRange)(qureg.length)));
        // Compute parity
        for (var i = 0; i < qureg.length - 1; ++i) {
          _ops.CNOT.or((0, _util.tuple)(qureg[i], qureg[i + 1]));
        }
      });

      new _ops.Rz(time * coefficient * 2.0).or(qureg[qureg.length - 1]);
      // Uncompute parity and basis change
      (0, _meta.Uncompute)(eng);
    });
  }
}

/**
 * @ignore
 * @type {DecompositionRule}
 */
var rule_commuting_terms = exports.rule_commuting_terms = new _decompositionrule2.default(_timeevolution2.default, _decompose_time_evolution_commuting_terms, _recognize_time_evolution_commuting_terms);

/**
 * @ignore
 * @type {DecompositionRule}
 */
var rule_individual_terms = exports.rule_individual_terms = new _decompositionrule2.default(_timeevolution2.default, _decompose_time_evolution_individual_terms, _recognize_time_evolution_individual_terms);

exports.default = [rule_commuting_terms, rule_individual_terms];