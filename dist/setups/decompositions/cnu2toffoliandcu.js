'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._decompose_CnU = exports._recognize_CnU = undefined;

var _control = require('../../meta/control');

var _gates = require('../../ops/gates');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _basics = require('../../ops/basics');

var _compute = require('../../meta/compute');

var _shortcuts = require('../../ops/shortcuts');

var _util = require('../../libs/util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @ignore
 Recognize an arbitrary gate which has n>=2 control qubits, except a Toffoli gate.
*/
var _recognize_CnU = exports._recognize_CnU = function _recognize_CnU(cmd) {
  var count = cmd.controlCount;
  if (count === 2) {
    if (!(cmd.gate instanceof _gates.XGate)) {
      return true;
    }
  } else if (count > 2) {
    return true;
  }
  return false;
};

/**
 * @ignore
Decompose a multi-controlled gate U into a single-controlled U.
    It uses (n-1) work qubits and 2 * (n-1) Toffoli gates.
 */
var _decompose_CnU = exports._decompose_CnU = function _decompose_CnU(cmd) {
  var eng = cmd.engine;
  var ctrl_qureg = cmd.controlQubits;
  var qubits = cmd.qubits,
      gate = cmd.gate;

  var n = cmd.controlCount;
  var ancilla_qureg = eng.allocateQureg(n - 1);

  (0, _compute.Compute)(eng, function () {
    _shortcuts.Toffoli.or((0, _util.tuple)(ctrl_qureg[0], ctrl_qureg[1], ancilla_qureg[0]));
    for (var ctrl_index = 2; ctrl_index < n; ++ctrl_index) {
      _shortcuts.Toffoli.or((0, _util.tuple)(ctrl_qureg[ctrl_index], ancilla_qureg[ctrl_index - 2], ancilla_qureg[ctrl_index - 1]));
    }
  });

  (0, _control.Control)(eng, ancilla_qureg[ancilla_qureg.length - 1], function () {
    return gate.or(qubits);
  });
  (0, _compute.Uncompute)(eng);
};

exports.default = [new _decompositionrule2.default(_basics.BasicGate, _decompose_CnU, _recognize_CnU)];