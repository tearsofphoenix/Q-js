'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('../../libs/util');

var _gates = require('../../ops/gates');

var _gates2 = _interopRequireDefault(_gates);

var _shortcuts = require('../../ops/shortcuts');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

; // """ Decompose the Toffoli gate into CNOT, H, T, and Tdagger gates. """
var Tdag = _gates2.default.Tdag;


var _decompose_toffoli = function _decompose_toffoli(cmd) {
  var ctrl = cmd.controlQubits;

  var target = cmd.qubits[0];
  var c1 = ctrl[0];
  var c2 = ctrl[1];

  _gates.H.or(target);
  _shortcuts.CNOT.or((0, _util.tuple)(c1, target));
  _gates.T.or(c1);
  Tdag.or(target);
  _shortcuts.CNOT.or((0, _util.tuple)(c2, target));
  _shortcuts.CNOT.or((0, _util.tuple)(c2, c1));
  Tdag.or(c1);
  _gates.T.or(target);
  _shortcuts.CNOT.or((0, _util.tuple)(c2, c1));
  _shortcuts.CNOT.or((0, _util.tuple)(c1, target));
  Tdag.or(target);
  _shortcuts.CNOT.or((0, _util.tuple)(c2, target));
  _gates.T.or(target);
  _gates.T.or(c2);
  _gates.H.or(target);
};

var _recognize_toffoli = function _recognize_toffoli(cmd) {
  return cmd.controlCount === 2;
};

exports.default = [new _decompositionrule2.default(_gates.NOT.constructor, _decompose_toffoli, _recognize_toffoli)];