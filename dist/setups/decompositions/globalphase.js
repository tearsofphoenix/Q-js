'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _gates = require('../../ops/gates');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Throw out global phases (no controls).
;


var _decompose_PhNoCtrl = function _decompose_PhNoCtrl(cmd) {};

// Recognize global phases (no controls).
var _recognize_PhNoCtrl = function _recognize_PhNoCtrl(cmd) {
  return cmd.controlCount === 0;
};

exports.default = [new _decompositionrule2.default(_gates.Ph, _decompose_PhNoCtrl, _recognize_PhNoCtrl)];