'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _compute = require('../../meta/compute');

var _shortcuts = require('../../ops/shortcuts');

var _util = require('../../libs/util');

var _control = require('../../meta/control');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _gates = require('../../ops/gates');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _decompose_swap = function _decompose_swap(cmd) {
  var ctrl = cmd.controlQubits;
  var eng = cmd.engine;
  (0, _compute.Compute)(eng, function () {
    _shortcuts.CNOT.or((0, _util.tuple)(cmd.qubits[0], cmd.qubits[1]));
  });
  (0, _control.Control)(eng, ctrl, function () {
    _shortcuts.CNOT.or((0, _util.tuple)(cmd.qubits[1], cmd.qubits[0]));
  });
  (0, _compute.Uncompute)(eng);
};

exports.default = [new _decompositionrule2.default(_gates.SwapGate, _decompose_swap)];