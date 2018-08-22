'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _control = require('../../meta/control');

var _gates = require('../../ops/gates');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Decompose the controlled phase gate (C^nPh(phase)).
var _decompose_Ph = function _decompose_Ph(cmd) {
  var ctrl = cmd.controlQubits;
  var gate = cmd.gate;
  var eng = cmd.engine;

  (0, _control.Control)(eng, ctrl.slice(1), function () {
    return new _gates.R(gate.angle).or(ctrl[0]);
  });
};

// Recognize the controlled phase gate.
var _recognize_Ph = function _recognize_Ph(cmd) {
  return cmd.controlCount >= 1;
};

exports.default = [new _decompositionrule2.default(_gates.Ph, _decompose_Ph, _recognize_Ph)];