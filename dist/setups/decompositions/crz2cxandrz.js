'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gates = require('../../ops/gates');

var _metagates = require('../../ops/metagates');

var _util = require('../../libs/util');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;


var _decompose_CRz = function _decompose_CRz(cmd) {
  var qubit = cmd.qubits[0];
  var ctrl = cmd.controlQubits;
  var gate = cmd.gate;
  var n = cmd.controlCount;

  new _gates.Rz(0.5 * gate.angle).or(qubit);
  (0, _metagates.C)(_gates.NOT, n).or((0, _util.tuple)(ctrl, qubit));
  new _gates.Rz(-0.5 * gate.angle).or(qubit);
  (0, _metagates.C)(_gates.NOT, n).or((0, _util.tuple)(ctrl, qubit));
};

var _recognize_CRz = function _recognize_CRz(cmd) {
  return cmd.controlCount >= 1;
};

exports.default = [new _decompositionrule2.default(_gates.Rz, _decompose_CRz, _recognize_CRz)];