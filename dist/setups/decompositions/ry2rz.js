'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._recognize_RyNoCtrl = exports._decompose_ry = undefined;

var _control = require('../../meta/control');

var _compute = require('../../meta/compute');

var _gates = require('../../ops/gates');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @ignore
 * @param {Command} cmd
 * @private
 */
var _decompose_ry = exports._decompose_ry = function _decompose_ry(cmd) {
  var qubit = cmd.qubits[0];
  var eng = cmd.engine;
  var angle = cmd.gate.angle;

  (0, _control.Control)(eng, cmd.controlQubits, function () {
    (0, _compute.Compute)(eng, function () {
      new _gates.Rx(Math.PI / 2.0).or(qubit);
    });
    new _gates.Rz(angle).or(qubit);
    (0, _compute.Uncompute)(eng);
  });
};

/**
 * @ignore
 * @param {Command} cmd
 * @return {boolean}
 * @private
 */
var _recognize_RyNoCtrl = exports._recognize_RyNoCtrl = function _recognize_RyNoCtrl(cmd) {
  return cmd.controlCount === 0;
};

exports.default = [new _decompositionrule2.default(_gates.Ry, _decompose_ry, _recognize_RyNoCtrl)];