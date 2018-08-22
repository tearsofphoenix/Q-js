'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._recognize_RxNoCtrl = undefined;

var _control = require('../../meta/control');

var _compute = require('../../meta/compute');

var _gates = require('../../ops/gates');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _decompose_rx = function _decompose_rx(cmd) {
  var qubit = cmd.qubits[0];
  var eng = cmd.engine;
  var angle = cmd.gate.angle;

  (0, _control.Control)(eng, cmd.controlQubits, function () {
    (0, _compute.Compute)(eng, function () {
      _gates.H.or(qubit);
    });
    new _gates.Rz(angle).or(qubit);
    (0, _compute.Uncompute)(eng);
  });
};
/**
 * @ignore
 * @param cmd
 * @return {boolean}
 * @private
 */
var _recognize_RxNoCtrl = exports._recognize_RxNoCtrl = function _recognize_RxNoCtrl(cmd) {
  return cmd.controlCount === 0;
};

exports.default = [new _decompositionrule2.default(_gates.Rx, _decompose_rx, _recognize_RxNoCtrl)];