'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _control = require('../../meta/control');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _gates = require('../../ops/gates');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _decompose_R = function _decompose_R(cmd) {
  var ctrl = cmd.controlQubits;
  var eng = cmd.engine;
  var gate = cmd.gate;

  (0, _control.Control)(eng, ctrl, function () {
    new _gates.Ph(0.5 * gate.angle).or(cmd.qubits);
    new _gates.Rz(gate.angle).or(cmd.qubits);
  });
};

exports.default = [new _decompositionrule2.default(_gates.R, _decompose_R)];