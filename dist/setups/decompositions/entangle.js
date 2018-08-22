'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _control = require('../../meta/control');

var _metagates = require('../../ops/metagates');

var _gates = require('../../ops/gates');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Decompose the entangle gate.
var _decompose_entangle = function _decompose_entangle(cmd) {
  var qr = cmd.qubits[0];
  var eng = cmd.engine;

  (0, _control.Control)(eng, cmd.controlQubits, function () {
    _gates.H.or(qr[0]);
    (0, _control.Control)(eng, qr[0], function () {
      return new _metagates.All(_gates.X).or(qr.slice(1));
    });
  });
};

exports.default = [new _decompositionrule2.default(_gates.EntangleGate, _decompose_entangle)];