'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEngineList = getEngineList;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _ops = require('../ops');

var _cycle = require('../ops/_cycle');

var _decompositionruleset = require('../cengines/replacer/decompositionruleset');

var _decompositionruleset2 = _interopRequireDefault(_decompositionruleset);

var _util = require('../libs/util');

var _polyfill = require('../libs/polyfill');

var _cengines = require('../cengines');

var _tagremover = require('../cengines/tagremover');

var _tagremover2 = _interopRequireDefault(_tagremover);

var _optimize = require('../cengines/optimize');

var _optimize2 = _interopRequireDefault(_optimize);

var _defaultrules = require('../libs/math/defaultrules');

var _defaultrules2 = _interopRequireDefault(_defaultrules);

var _decompositions = require('./decompositions');

var _decompositions2 = _interopRequireDefault(_decompositions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function high_level_gates(eng, cmd) {
  var g = cmd.gate;
  if (eng.next.isAvailable(cmd)) {
    return true;
  }
  if (_ops.QFT.equal(g) || _ops.QFT.equal((0, _cycle.getInverse)(g)) || _ops.Swap.equal(g)) {
    return true;
  }
  if (g instanceof _ops.BasicMathGate) {
    return false;
  }
  return true;
}

function one_and_two_qubit_gates(eng, cmd) {
  var all_qubits = [];
  cmd.allQubits.forEach(function (qr) {
    return qr.forEach(function (q) {
      return all_qubits.push(q);
    });
  });

  if (cmd.gate instanceof _ops.ClassicalInstructionGate) {
    // This is required to allow Measure, Allocate, Deallocate, Flush
    return true;
  } else if (eng.next.isAvailable(cmd)) {
    return true;
  } else if (all_qubits.length <= 2) {
    return true;
  } else {
    return false;
  }
}

/**
Returns an engine list to compile to a restricted gate set.

    Note:
If you choose a new gate set for which the compiler does not yet have
standard rules, it raises an `NoGateDecompositionError` or a
    `RuntimeError: maximum recursion depth exceeded...`. Also note that
even the gate sets which work might not yet be optimized. So make sure
to double check and potentially extend the decomposition rules.
    This implemention currently requires that the one qubit gates must
contain Rz and at least one of {Ry(best), Rx, H} and the two qubit gate
must contain CNOT (recommended) or CZ.

    Note:
Classical instructions gates such as e.g. Flush and Measure are
automatically allowed.

    @example
    getEngineList(tuple(Rz, Ry, Rx, H), tuple(CNOT), tuple(TimeEvolution))

@param {string|Array.<BasicGate>} one_qubit_gates "any" allows any one qubit gate, otherwise provide
a tuple of the allowed gates. If the gates are instances of a class (e.g. X), it allows all gates
which are equal to it. If the gate is a class (Rz), it allows all instances of this class. Default is "any"
 @param {string|Array.<BasicGate>} two_qubit_gates "any" allows any two qubit gate, otherwise provide
a tuple of the allowed gates. If the gates are instances of a class (e.g. CNOT), it allows all gates
which are equal to it. If the gate is a class, it allows all instances of this class.
Default is (CNOT,).
 @param {string|Array.<BasicGate>} other_gates A tuple of the allowed gates. If the gates are
instances of a class (e.g. QFT), it allows all gates which are equal to it. If the gate is a
class, it allows all instances of this class.

@throws {Error} If input is for the gates is not "any" or a tuple.
    @return {Array<BasicEngine>} A list of suitable compiler engines.
 */
function getEngineList() {
  var one_qubit_gates = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'any';
  var two_qubit_gates = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [_ops.CNOT];
  var other_gates = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (two_qubit_gates !== 'any' && !Array.isArray(two_qubit_gates)) {
    throw new Error("two_qubit_gates parameter must be 'any' or a tuple. " + 'When supplying only one gate, make sure to correctly ' + "create the tuple (don't miss the comma), " + 'e.g. tuple(CNOT)');
  }
  if (one_qubit_gates !== 'any' && !Array.isArray(one_qubit_gates)) {
    throw new Error("one_qubit_gates parameter must be 'any' or a tuple.");
  }

  if (!Array.isArray(other_gates)) {
    throw new Error('other_gates parameter must be a tuple.');
  }
  var rule_set = new _decompositionruleset2.default([].concat(_toConsumableArray(_defaultrules2.default), _toConsumableArray(_decompositions2.default)));
  var allowed_gate_classes = [];
  var allowed_gate_instances = [];
  if (one_qubit_gates !== 'any') {
    one_qubit_gates.forEach(function (gate) {
      if (typeof gate === 'function') {
        allowed_gate_classes.push(gate);
      } else {
        allowed_gate_instances.push([gate, 0]);
      }
    });
  }
  if (two_qubit_gates !== 'any') {
    two_qubit_gates.forEach(function (gate) {
      if (typeof gate === 'function') {
        //  Controlled gate classes don't yet exists and would require
        //  separate treatment
        (0, _assert2.default)(!(0, _util.isKindclassOf)(gate, _ops.ControlledGate));
        allowed_gate_classes.push(gate);
      } else if (gate instanceof _ops.ControlledGate) {
        allowed_gate_instances.push([gate.gate, gate.n]);
      } else {
        allowed_gate_instances.push([gate, 0]);
      }
    });
  }

  other_gates.forEach(function (gate) {
    if (typeof gate === 'function') {
      //  Controlled gate classes don't yet exists and would require
      //  separate treatment
      (0, _assert2.default)(!(0, _util.isKindclassOf)(gate, _ops.ControlledGate));
      allowed_gate_classes.push(gate);
    } else if (gate instanceof _ops.ControlledGate) {
      allowed_gate_instances.push([gate.gate, gate.n]);
    } else {
      allowed_gate_instances.push([gate, 0]);
    }
  });

  function low_level_gates(eng, cmd) {
    var all_qubits = [];
    cmd.allQubits.forEach(function (qr) {
      return qr.forEach(function (q) {
        return all_qubits.push(q);
      });
    });

    if (cmd.gate instanceof _ops.ClassicalInstructionGate) {
      // This is required to allow Measure, Allocate, Deallocate, Flush
      return true;
    } else if (one_qubit_gates === 'any' && (0, _polyfill.len)(all_qubits) === 1) {
      return true;
    } else if (two_qubit_gates === 'any' && (0, _polyfill.len)(all_qubits) === 2) {
      return true;
    } else if ((0, _util.instanceOf)(cmd.gate, allowed_gate_classes)) {
      return true;
    } else {
      var cn = cmd.controlQubits.length;
      var idx = allowed_gate_instances.findIndex(function (looper) {
        try {
          return cmd.gate.equal(looper[0]) && cn === looper[1];
        } catch (e) {
          return false;
        }
      });
      if (idx !== -1) {
        return true;
      }
    }
    return false;
  }

  return [new _cengines.AutoReplacer(rule_set), new _tagremover2.default(), new _cengines.InstructionFilter(high_level_gates), new _optimize2.default(5), new _cengines.AutoReplacer(rule_set), new _tagremover2.default(), new _cengines.InstructionFilter(one_and_two_qubit_gates), new _optimize2.default(5), new _cengines.AutoReplacer(rule_set), new _tagremover2.default(), new _cengines.InstructionFilter(low_level_gates), new _optimize2.default(5)];
}