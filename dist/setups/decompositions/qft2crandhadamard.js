'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _control = require('../../meta/control');

var _gates = require('../../ops/gates');

var _decompositionrule = require('../../cengines/replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

var _qftgate = require('../../ops/qftgate');

var _qftgate2 = _interopRequireDefault(_qftgate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _decompose_QFT = function _decompose_QFT(cmd) {
  var qb = cmd.qubits[0];
  var eng = cmd.engine;
  (0, _control.Control)(eng, cmd.controlQubits, function () {
    var _loop = function _loop(i) {
      var count = qb.length - 1 - i;
      _gates.H.or(qb[count]);

      var _loop2 = function _loop2(j) {
        (0, _control.Control)(eng, qb[qb.length - 1 - (j + i + 1)], function () {
          new _gates.R(_mathjs2.default.pi / (1 << 1 + j)).or(qb[count]);
        });
      };

      for (var j = 0; j < count; ++j) {
        _loop2(j);
      }
    };

    for (var i = 0; i < qb.length; ++i) {
      _loop(i);
    }
  });
};

exports.default = [new _decompositionrule2.default(_qftgate2.default, _decompose_QFT)];