'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _basics = require('./basics');

var _basics2 = require('../ops/basics');

var _gates = require('../ops/gates');

var _util = require('../libs/util');

var _error = require('../meta/error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Licensed under the Apache License, Version 2.0 (the "License");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * You may obtain a copy of the License at
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * limitations under the License.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * @class LocalOptimizer
 * @desc is a compiler engine which optimizes locally (merging
rotations, cancelling gates with their inverse) in a local window of user-
defined size.

    It stores all commands in a dict of lists, where each qubit has its own
gate pipeline. After adding a gate, it tries to merge / cancel successive
gates using the get_merged and getInverse functions of the gate (if
    available). For examples, see BasicRotationGate. Once a list corresponding
to a qubit contains >=m gates, the pipeline is sent on to the next engine.
 */
var LocalOptimizer = function (_BasicEngine) {
  _inherits(LocalOptimizer, _BasicEngine);

  /**
   * @constructor
   * @param {number} m Number of gates to cache per qubit, before sending on the first gate.
   */
  function LocalOptimizer() {
    var m = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;

    _classCallCheck(this, LocalOptimizer);

    var _this = _possibleConstructorReturn(this, (LocalOptimizer.__proto__ || Object.getPrototypeOf(LocalOptimizer)).call(this));

    _this._l = {}; // dict of lists containing operations for each qubit
    _this._m = m; // wait for m gates before sending on
    return _this;
  }

  /**
   * Send n gate operations of the qubit with index idx to the next engine.
   * @param {number} idx qubit index
   * @param {number} n command position in qubit idx's command list
   */


  _createClass(LocalOptimizer, [{
    key: 'sendQubitPipeline',
    value: function sendQubitPipeline(idx, n) {
      var _this2 = this;

      if (typeof idx !== 'number') {
        idx = parseInt(idx, 10);
      }
      // temporary label for readability
      var il = this._l[idx];
      var count = Math.min(n, il.length);

      // loop over first n operations
      // send all gates before n-qubit gate for other qubits involved
      // --> recursively call send_helper

      var _loop = function _loop(i) {
        var other_involved_qubits = [];
        il[i].allQubits.forEach(function (qreg) {
          return qreg.forEach(function (qb) {
            if (qb.id !== idx) {
              other_involved_qubits.push(qb);
            }
          });
        });

        other_involved_qubits.forEach(function (qb) {
          var idLooper = qb.id;
          try {
            var gateloc = 0;
            // find location of this gate within its list
            while (!_this2._l[idLooper][gateloc].equal(il[i])) {
              gateloc += 1;
            }

            gateloc = _this2.optimize(idLooper, gateloc);
            // flush the gates before the n-qubit gate
            _this2.sendQubitPipeline(idLooper, gateloc);
            // delete the n-qubit gate, we're taking care of it
            // and don't want the other qubit to do so
            _this2._l[idLooper] = _this2._l[idLooper].slice(1);
          } catch (e) {
            console.log(e);
            console.log('Invalid qubit pipeline encountered (in the  process of shutting down?).');
          }
        });
        // all qubits that need to be flushed have been flushed
        // --> send on the n-qubit gate
        _this2.send([il[i]]);
      };

      for (var i = 0; i < count; ++i) {
        _loop(i);
      }
      // n operations have been sent on --> resize our gate list
      this._l[idx] = this._l[idx].slice(n);
    }

    /**
      Return all indices of a command, each index corresponding to the
      command's index in one of the qubits' command lists.
        @param {number} idx qubit index
      @param {number} i command position in qubit idx's command list
      @param {number[]} IDs IDs of all qubits involved in the command
      @return {number[]}
    */

  }, {
    key: 'getGateIndices',
    value: function getGateIndices(idx, i, IDs) {
      var _this3 = this;

      if (typeof idx !== 'number') {
        idx = parseInt(idx, 10);
      }
      var N = IDs.length;
      // 1-qubit gate: only gate at index i in list #idx is involved
      if (N === 1) {
        return [i];
      }

      // When the same gate appears multiple time, we need to make sure not to
      // match earlier instances of the gate applied to the same qubits. So we
      // count how many there are, and skip over them when looking in the
      // other lists.
      var cmd = this._l[idx][i];
      var num_identical_to_skip = 0;
      this._l[idx].slice(0, i).forEach(function (prev_cmd) {
        if (prev_cmd.equal(cmd)) {
          num_identical_to_skip += 1;
        }
      });

      var indices = [];
      IDs.forEach(function (Id) {
        var identical_indices = [];
        _this3._l[Id].forEach(function (c, j) {
          if (c.equal(cmd)) {
            identical_indices.push(j);
          }
        });
        indices.push(identical_indices[num_identical_to_skip]);
      });
      return indices;
    }

    /**
    Try to merge or even cancel successive gates using the get_merged and
    getInverse functions of the gate (see, e.g., BasicRotationGate).
        It does so for all qubit command lists.
     @param {number} idx
     @param {number} lim
     */

  }, {
    key: 'optimize',
    value: function optimize(idx, lim) {
      var _this4 = this;

      if (typeof idx !== 'number') {
        idx = parseInt(idx, 10);
      }
      // loop over all qubit indices
      var i = 0;
      var new_gateloc = 0;
      var limit = this._l[idx].length;
      if (typeof lim !== 'undefined') {
        limit = lim;
        new_gateloc = limit;
      }

      var _loop2 = function _loop2() {
        // can be dropped if two in a row are self-inverses
        var cmd = _this4._l[idx][i];
        var inv = cmd.getInverse();

        if (inv.equal(_this4._l[idx][i + 1])) {
          // determine index of this gate on all qubits
          var qubitids = [];
          cmd.allQubits.forEach(function (sublist) {
            return sublist.forEach(function (qb) {
              return qubitids.push(qb.id);
            });
          });
          var gid = _this4.getGateIndices(idx, i, qubitids);
          // check that there are no other gates between this and its
          // inverse on any of the other qubits involved
          var erase = true;
          qubitids.forEach(function (looper, j) {
            erase = inv.equal(_this4._l[looper][gid[j] + 1]);
          });

          // drop these two gates if possible and goto next iteration
          if (erase) {
            var new_list = [];
            qubitids.forEach(function (looper, j) {
              new_list = _this4._l[looper].slice(0, gid[j]).concat(_this4._l[looper].slice(gid[j] + 2));
              _this4._l[looper] = new_list;
            });
            i = 0;
            limit -= 2;
            return 'continue';
          }
        }
        // gates are not each other's inverses --> check if they're
        // mergeable
        try {
          var merged_command = _this4._l[idx][i].getMerged(_this4._l[idx][i + 1]);
          // determine index of this gate on all qubits
          var _qubitids = [];
          var c = _this4._l[idx][i];
          c.allQubits.forEach(function (sublist) {
            return sublist.forEach(function (qb) {
              return _qubitids.push(qb.id);
            });
          });

          var _gid = _this4.getGateIndices(idx, i, _qubitids);

          var merge = true;
          _qubitids.forEach(function (looper, j) {
            var m = _this4._l[looper][_gid[j]].getMerged(_this4._l[looper][_gid[j] + 1]);
            merge = m.equal(merged_command);
          });
          if (merge) {
            _qubitids.forEach(function (looper, j) {
              _this4._l[looper][_gid[j]] = merged_command;
              var new_list = _this4._l[looper].slice(0, _gid[j] + 1).concat(_this4._l[looper].slice(_gid[j] + 2));
              _this4._l[looper] = new_list;
            });
            i = 0;
            limit -= 1;
            return 'continue';
          }
        } catch (e) {
          if (!(e instanceof _error.NotMergeable)) {
            throw e;
          }
        }
        i += 1; // next iteration: look at next gate
      };

      while (i < limit - 1) {
        var _ret2 = _loop2();

        if (_ret2 === 'continue') continue;
      }
      return limit;
    }

    /**
    Check whether a qubit pipeline must be sent on and, if so,
      optimize the pipeline and then send it on.
     */

  }, {
    key: 'checkAndSend',
    value: function checkAndSend() {
      var _this5 = this;

      Object.keys(this._l).forEach(function (i) {
        var v = _this5._l[i];
        var lastCMD = v.length > 0 ? v[v.length - 1] : {};
        var gateFlag = (0, _util.instanceOf)(lastCMD.gate, _basics2.FastForwardingGate);
        if (v.length >= _this5._m || v.length > 0 && gateFlag) {
          _this5.optimize(i);
          v = _this5._l[i];
          lastCMD = v.length > 0 ? v[v.length - 1] : {};
          gateFlag = (0, _util.instanceOf)(lastCMD.gate, _basics2.FastForwardingGate);

          if (v.length >= _this5._m && !gateFlag) {
            _this5.sendQubitPipeline(i, v.length - _this5._m + 1);
          } else if (v.length > 0 && gateFlag) {
            _this5.sendQubitPipeline(i, v.length);
          }
        }
      });
      var newDict = {};
      Object.keys(this._l).forEach(function (key) {
        var v = _this5._l[key];
        if (v.length > 0) {
          newDict[key] = v;
        }
      });

      this._l = newDict;
    }

    /**
      Cache a command, i.e., inserts it into the command lists of all qubits involved.
      @param {Command} cmd
    */

  }, {
    key: 'cacheCMD',
    value: function cacheCMD(cmd) {
      var _this6 = this;

      // are there qubit ids that haven't been added to the list?
      var ids = [];
      cmd.allQubits.forEach(function (sublist) {
        return sublist.forEach(function (qubit) {
          return ids.push(qubit.id);
        });
      });

      // add gate command to each of the qubits involved
      ids.forEach(function (ID) {
        var v = _this6._l[ID];
        if (typeof v === 'undefined') {
          _this6._l[ID] = [];
        }
        _this6._l[ID].push(cmd);
      });
      this.checkAndSend();
    }

    /**
      Receive commands from the previous engine and cache them.
      If a flush gate arrives, the entire buffer is sent on.
    */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this7 = this;

      commandList.forEach(function (cmd) {
        if ((0, _util.instanceOf)(cmd.gate, _gates.FlushGate)) {
          Object.keys(_this7._l).forEach(function (idx) {
            var v = _this7._l[idx];
            _this7.optimize(idx);
            _this7.sendQubitPipeline(idx, v.length);
          });

          var newDict = {};
          Object.keys(_this7._l).forEach(function (idx) {
            var v = _this7._l[idx];
            if (v.length > 0) {
              newDict[idx] = v;
            }
          });
          _this7._l = newDict;
          (0, _assert2.default)(Object.keys(_this7._l).length === 0);
          _this7.send([cmd]);
        } else {
          _this7.cacheCMD(cmd);
        }
      });
    }
  }]);

  return LocalOptimizer;
}(_basics.BasicEngine);

exports.default = LocalOptimizer;