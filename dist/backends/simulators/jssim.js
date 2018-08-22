'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
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

/*
Contains a (slow) JavaScript simulator.

    Please compile the c++ simulator for large-scale simulations.
*/


var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _mathjs = require('mathjs');

var _mathjs2 = _interopRequireDefault(_mathjs);

var _util = require('../../libs/util');

var _polyfill = require('../../libs/polyfill');

var _qubitoperator = require('../../ops/qubitoperator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class JSSimulator
 * @desc
NodeJS implementation of a quantum computer simulator.

    This Simulator can be used as a backup if compiling the c++ simulator is
not an option (for some reason). It has the same features but is much
slower, so please consider building the c++ version for larger experiments.
 */
var Simulator = function () {
  /**
   * @constructor
   */
  function Simulator() {
    _classCallCheck(this, Simulator);

    // ignore seed
    this._state = _mathjs2.default.ones(1);
    this._map = {};
    this._numQubits = 0;
  }

  /**
  Return the qubit index to bit location map and the corresponding state
  vector.
      This function can be used to measure expectation values more efficiently (emulation).
      @return {Array}
  A tuple where the first entry is a dictionary mapping qubit indices
  to bit-locations and the second entry is the corresponding state
  vector
   */


  _createClass(Simulator, [{
    key: 'cheat',
    value: function cheat() {
      return [this._map, this._state._data.slice(0)];
    }

    /**
    Measure the qubits with IDs ids and return a list of measurement
    outcomes (true/false).
        @param {number[]} ids List of qubit IDs to measure.
        @return {boolean[]} List of measurement results (containing either true or false).
     */

  }, {
    key: 'measureQubits',
    value: function measureQubits(ids) {
      var _this = this;

      var P = Math.random();
      var val = 0.0;
      var i_picked = 0;
      while (val < P && i_picked < (0, _polyfill.len)(this._state)) {
        val = _mathjs2.default.add(val, Math.pow(_mathjs2.default.abs(this._getState(i_picked) || _mathjs2.default.complex(0, 0)), 2));
        i_picked += 1;
      }

      i_picked -= 1;

      var res = [];
      var pos = ids.map(function (ID) {
        res.push(false);
        return _this._map[ID];
      });

      var mask = 0;
      val = 0;

      pos.forEach(function (looper, i) {
        res[i] = (i_picked >> looper & 1) === 1;
        mask |= 1 << looper;
        val |= (res[i] & 1) << looper;
      });

      var nrm = 0.0;
      this._state.forEach(function (looper, _i) {
        var i = _i[0];
        if ((mask & i) !== val) {
          _this._setState(i, 0.0);
        } else {
          var tmp = _mathjs2.default.abs(looper);
          nrm = _mathjs2.default.add(nrm, _mathjs2.default.multiply(tmp, tmp));
        }
      });
      // normalize
      var scale = 1.0 / Math.sqrt(nrm);
      this._state = _mathjs2.default.multiply(this._state, scale);
      return res;
    }

    /**
    Allocate a qubit.
        @param {number} ID ID of the qubit which is being allocated.
     */

  }, {
    key: 'allocateQubit',
    value: function allocateQubit(ID) {
      this._map[ID] = this._numQubits;
      this._numQubits += 1;
      this._state.resize([1 << this._numQubits], 0);
    }

    /**
    Return the classical value of a classical bit (i.e., a qubit which has
    been measured / uncomputed).
       @param {number} ID ID of the qubit of which to get the classical value.
     @param {number} tolerance Tolerance for numerical errors when determining
    whether the qubit is indeed classical.
        @throws {Error} If the qubit is in a superposition, i.e., has not been measured / uncomputed.
    */

  }, {
    key: 'getClassicalValue',
    value: function getClassicalValue(ID) {
      var tolerance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.e-10;

      var pos = this._map[ID];
      var up = false;
      var down = false;

      for (var i = 0; i < (0, _polyfill.len)(this._state); i += 1 << pos + 1) {
        for (var j = 0; j < 1 << pos; ++j) {
          if (_mathjs2.default.abs(this._getState(i + j)) > tolerance) {
            up = true;
          }

          if (_mathjs2.default.abs(this._getState(i + j + (1 << pos)) || 0) > tolerance) {
            down = true;
          }

          if (up && down) {
            throw new Error('Qubit has not been measured / ' + 'uncomputed. Cannot access its ' + 'classical value and/or deallocate a ' + 'qubit in superposition!');
          }
        }
      }

      return down;
    }

    /**
    Deallocate a qubit (if it has been measured / uncomputed).
       @param {number} ID ID of the qubit to deallocate.
       @throws {Error} If the qubit is in a superposition, i.e., has not been measured / uncomputed.
     */

  }, {
    key: 'deallocateQubit',
    value: function deallocateQubit(ID) {
      var _this2 = this;

      var pos = this._map[ID];
      var cv = this.getClassicalValue(ID);
      var newstate = _mathjs2.default.zeros(1 << this._numQubits - 1);
      var k = 0;
      for (var i = (1 << pos) * cv; i < (0, _polyfill.len)(this._state); i += 1 << pos + 1) {
        (0, _util.matrixRangeIndicesAssign)(newstate, k, k + (1 << pos), this._state, i);
        k += 1 << pos;
      }

      var newmap = {};
      Object.keys(this._map).forEach(function (key) {
        var value = _this2._map[key];
        if (value > pos) {
          newmap[key] = value - 1;
        } else if (parseInt(key, 10) !== ID) {
          newmap[key] = value;
        }
      });

      this._map = newmap;
      this._state = newstate;
      this._numQubits -= 1;
    }

    /**
    Get control mask from list of control qubit IDs.
        @return {number} A mask which represents the control qubits in binary.
     */

  }, {
    key: 'getControlMask',
    value: function getControlMask(ctrlids) {
      var _this3 = this;

      var mask = 0;
      ctrlids.forEach(function (ctrlid) {
        var ctrlpos = _this3._map[ctrlid];
        mask |= 1 << ctrlpos;
      });
      return mask;
    }

    /**
    Emulate a math function (e.g., BasicMathGate).
        @param {function} f Function executing the operation to emulate.
      @param {Array.<number[]>} qubitIDs List of lists of qubit IDs to which
          the gate is being applied. Every gate is applied to a tuple of
          quantum registers, which corresponds to this 'list of lists'.
      @param {number[]} ctrlQubitIDs List of control qubit ids.
     */

  }, {
    key: 'emulateMath',
    value: function emulateMath(f, qubitIDs, ctrlQubitIDs) {
      var _this4 = this;

      var mask = this.getControlMask(ctrlQubitIDs);
      // determine qubit locations from their IDs
      var qb_locs = [];
      qubitIDs.forEach(function (qureg) {
        qb_locs.push([]);
        qureg.forEach(function (qubitID) {
          qb_locs[qb_locs.length - 1].push(_this4._map[qubitID]);
        });
      });

      var newstate = _mathjs2.default.zeros((0, _polyfill.len)(this._state));

      this._state.forEach(function (looper, _i) {
        var i = _i[0];
        if ((mask & i) === mask) {
          var argList = (0, _util.zeros)(qb_locs.length);
          qb_locs.forEach(function (qb, qri) {
            qb.forEach(function (il, qi) {
              argList[qri] |= (i >> il & 1) << qi;
            });
          });

          var res = f(argList);
          var newI = i;

          qb_locs.forEach(function (qb, qri) {
            qb.forEach(function (il, qi) {
              if (!((newI >> il & 1) == (res[qri] >> qi & 1))) {
                newI ^= 1 << il;
              }
            });
          });
          newstate.subset(_mathjs2.default.index(newI), looper);
        } else {
          newstate.subset(_mathjs2.default.index(i), looper);
        }
      });

      this._state = newstate;
    }

    /**
    Return the expectation value of a qubit operator w.r.t. qubit ids.
        @param {Array.<Array>} termsArray Operator Array (see QubitOperator.terms)
      @param {number[]} IDs List of qubit ids upon which the operator acts.
        @return Expectation value
     */

  }, {
    key: 'getExpectationValue',
    value: function getExpectationValue(termsArray, IDs) {
      var _this5 = this;

      var expectation = 0.0;
      var current_state = _mathjs2.default.clone(this._state);
      termsArray.forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            term = _ref2[0],
            coefficient = _ref2[1];

        _this5.applyTerm(term, IDs);
        var tmp = (0, _polyfill.complexVectorDot)(current_state, _this5._state);
        var delta = _mathjs2.default.multiply(coefficient, tmp);
        expectation = _mathjs2.default.add(expectation, delta);
        _this5._state = _mathjs2.default.clone(current_state);
      });
      if (_mathjs2.default.im(expectation) === 0) {
        return _mathjs2.default.re(expectation);
      }
      return expectation;
    }

    /**
    Apply a (possibly non-unitary) qubit operator to qubits.
        @param {Array.<Array>} termsArray Operator array (see QubitOperator.terms)
      @param {number[]} IDs List of qubit ids upon which the operator acts.
    */

  }, {
    key: 'applyQubitOperator',
    value: function applyQubitOperator(termsArray, IDs) {
      var _this6 = this;

      var new_state = _mathjs2.default.zeros((0, _polyfill.len)(this._state));
      var current_state = _mathjs2.default.clone(this._state);
      termsArray.forEach(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            term = _ref4[0],
            coefficient = _ref4[1];

        _this6.applyTerm(term, IDs);
        var temp = _mathjs2.default.multiply(_this6._state, coefficient);
        new_state = _mathjs2.default.add(new_state, temp);
        _this6._state = _mathjs2.default.clone(current_state);
      });
      this._state = new_state;
    }

    /**
    Return the probability of the outcome `bit_string` when measuring
    the qubits given by the list of ids.
        @param {boolean[]|number[]} bitString Measurement outcome.
      @param {number[]} IDs List of qubit ids determining the ordering.
        @return Probability of measuring the provided bit string.
        @throws {Error} if an unknown qubit id was provided.
     */

  }, {
    key: 'getProbability',
    value: function getProbability(bitString, IDs) {
      var n = IDs.length;
      for (var i = 0; i < n; ++i) {
        var id = IDs[i];
        var v = this._map[id];
        if (typeof v === 'undefined') {
          throw new Error('get_probability(): Unknown qubit id. ' + 'Please make sure you have called ' + 'eng.flush().');
        }
      }
      var mask = 0;
      var bit_str = 0;
      for (var _i2 = 0; _i2 < n; ++_i2) {
        mask |= 1 << this._map[IDs[_i2]];
        bit_str |= bitString[_i2] << this._map[IDs[_i2]];
      }

      var probability = 0.0;

      this._state.forEach(function (val, _i) {
        var i = _i[0];
        if ((i & mask) === bit_str) {
          var e = val;
          probability += Math.pow(_mathjs2.default.re(e), 2) + Math.pow(_mathjs2.default.im(e), 2);
        }
      });
      return probability;
    }

    /**
     * @ignore
     * @param i
     * @return {*}
     * @private
     */

  }, {
    key: '_getState',
    value: function _getState(i) {
      return this._state.subset(_mathjs2.default.index(i));
    }

    /**
     * @ignore
     * @param i
     * @param value
     * @private
     */

  }, {
    key: '_setState',
    value: function _setState(i, value) {
      this._state.subset(_mathjs2.default.index(i), value);
    }

    /**
    Return the probability amplitude of the supplied `bit_string`.
      The ordering is given by the list of qubit ids.
       @param {boolean[]|number[]} bitString Computational basis state
     @param {number[]} IDs List of qubit ids determining the ordering. Must contain all allocated qubits.
        @return Probability amplitude of the provided bit string.
        @throws {Error} if the second argument is not a permutation of all allocated qubits.
     */

  }, {
    key: 'getAmplitude',
    value: function getAmplitude(bitString, IDs) {
      var _this7 = this;

      var s1 = new Set(IDs);
      var s2 = new Set(Object.keys(this._map).map(function (k) {
        return parseInt(k, 10);
      }));
      if (!(0, _polyfill.setEqual)(s1, s2)) {
        throw new Error('The second argument to get_amplitude() must' + ' be a permutation of all allocated qubits. ' + 'Please make sure you have called ' + 'eng.flush().');
      }
      var index = 0;
      IDs.forEach(function (item, i) {
        item = parseInt(item, 10);
        index |= bitString[i] << _this7._map[item];
      });
      var ret = this._getState(index);
      return ret;
    }

    /**
    Applies exp(-i*time*H) to the wave function, i.e., evolves under
    the Hamiltonian H for a given time. The terms in the Hamiltonian
    are not required to commute.
        This function computes the action of the matrix exponential using
    ideas from Al-Mohy and Higham, 2011.
    TODO: Implement better estimates for s.
       @param {Array.<Array>} terms_dict Operator dictionary (see QubitOperator.terms) defining the Hamiltonian.
     @param {number} time Time to evolve for
     @param {number[]} ids A list of qubit IDs to which to apply the evolution.
     @param {number[]} ctrlids A list of control qubit IDs.
    */

  }, {
    key: 'emulateTimeEvolution',
    value: function emulateTimeEvolution(terms_dict, time, ids, ctrlids) {
      var _this8 = this;

      // Determine the (normalized) trace, which is nonzero only for identity
      // terms:
      var tr = 0;
      var sum = 0;
      var newTerms = [];
      terms_dict.forEach(function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            t = _ref6[0],
            c = _ref6[1];

        if (t.length === 0) {
          tr += c;
        } else {
          newTerms.push([t, c]);
          sum += Math.abs(c);
        }
      });

      terms_dict = newTerms;
      var op_nrm = _mathjs2.default.abs(time) * sum;
      // rescale the operator by s:
      var s = Math.floor(op_nrm + 1);
      var correction = _mathjs2.default.exp(_mathjs2.default.complex(0, -time * tr / (s * 1.0)));
      var output_state = _mathjs2.default.clone(this._state);
      var mask = this.getControlMask(ctrlids);

      var _loop = function _loop(i) {
        var j = 0;
        var nrm_change = 1.0;
        var update = void 0;

        var _loop2 = function _loop2() {
          var coeff = _mathjs2.default.divide(_mathjs2.default.complex(0, -time), s * (j + 1));
          var current_state = _mathjs2.default.clone(_this8._state);
          update = 0;
          terms_dict.forEach(function (_ref9) {
            var _ref10 = _slicedToArray(_ref9, 2),
                t = _ref10[0],
                c = _ref10[1];

            _this8.applyTerm(t, ids);
            _this8._state = _mathjs2.default.multiply(_this8._state, c);

            update = _mathjs2.default.add(_this8._state, update);
            // update += this._state
            _this8._state = _mathjs2.default.clone(current_state);
          });
          update = _mathjs2.default.multiply(update, coeff);
          _this8._state = update;

          update.forEach(function (value, _ref11) {
            var _ref12 = _slicedToArray(_ref11, 1),
                m = _ref12[0];

            if ((m & mask) === mask) {
              var idx = _mathjs2.default.index(m);
              var v = _mathjs2.default.add(output_state.subset(idx), value);
              output_state.subset(idx, v);
            }
          });
          nrm_change = _mathjs2.default.norm(update);
          j += 1;
        };

        while (nrm_change > 1.e-12) {
          _loop2();
        }

        update.forEach(function (value, _ref7) {
          var _ref8 = _slicedToArray(_ref7, 1),
              k = _ref8[0];

          if ((k & mask) === mask) {
            var idx = _mathjs2.default.index(k);
            var v = _mathjs2.default.multiply(output_state.subset(idx), correction);
            output_state.subset(idx, v);
          }
        });
        _this8._state = _mathjs2.default.clone(output_state);
      };

      for (var i = 0; i < s; ++i) {
        _loop(i);
      }
    }

    /**
     * leave it empty to keep same API with cpp simulator
     */

  }, {
    key: 'run',
    value: function run() {}
    //


    /**
    Applies a QubitOperator term to the state vector. (Helper function for time evolution & expectation)
        @param {Array} term One term of QubitOperator.terms
      @param {number[]} ids Term index to Qubit ID mapping
      @param {number[]} controlIDs Control qubit IDs
    */

  }, {
    key: 'applyTerm',
    value: function applyTerm(term, ids) {
      var _this9 = this;

      var controlIDs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      var X = [[0.0, 1.0], [1.0, 0.0]];
      var Y = [[0.0, _mathjs2.default.complex(0, -1)], [_mathjs2.default.complex(0, 1), 0.0]];
      var Z = [[1.0, 0.0], [0.0, -1.0]];
      var gates = { X: X, Y: Y, Z: Z };
      term.forEach(function (local_op) {
        var qb_id = ids[local_op[0]];
        _this9.applyControlledGate(gates[local_op[1]], [qb_id], controlIDs);
      });
    }

    /**
    Applies the k-qubit gate matrix m to the qubits with indices ids,
      using ctrlids as control qubits.
        @param {Array.<Array.<number>>} m 2^k x 2^k complex matrix describing the k-qubit gate.
      @param {number[]} ids A list containing the qubit IDs to which to apply the gate.
      @param {number[]} ctrlids A list of control qubit IDs (i.e., the gate is only applied where these qubits are 1).
     */

  }, {
    key: 'applyControlledGate',
    value: function applyControlledGate(m, ids, ctrlids) {
      var _this10 = this;

      var mask = this.getControlMask(ctrlids);
      if ((0, _polyfill.len)(m) === 2) {
        var k = ids[0];
        var pos = this._map[k] || this._map[k.toString()];
        this._singleQubitGate(m, pos, mask);
      } else {
        var _pos = ids.map(function (ID) {
          return _this10._map[ID];
        });
        this._multiQubitGate(m, _pos, mask);
      }
    }

    /**
    Applies the single qubit gate matrix m to the qubit at position `pos`
    using `mask` to identify control qubits.
       @param {Array.<Array.<number>>} m 2x2 complex matrix describing the single-qubit gate.
      @param {number} pos Bit-position of the qubit.
      @param {number} mask Bit-mask where set bits indicate control qubits.
     */

  }, {
    key: '_singleQubitGate',
    value: function _singleQubitGate(m, pos, mask) {
      var kernel = function kernel(u, d, m) {
        var ma = _mathjs2.default.add;
        var mm = _mathjs2.default.multiply;
        d = d || _mathjs2.default.complex(0, 0);
        u = u || _mathjs2.default.complex(0, 0);
        var r1 = ma(mm(u, m[0][0]), mm(d, m[0][1]));
        var r2 = ma(mm(u, m[1][0]), mm(d, m[1][1]));
        return [r1, r2];
      };

      var step = 1 << pos + 1;
      for (var i = 0; i < (0, _polyfill.len)(this._state); i += step) {
        for (var _j = 0; _j < 1 << pos; ++_j) {
          if ((i + _j & mask) === mask) {
            var id1 = i + _j;
            var id2 = id1 + (1 << pos);

            var _kernel = kernel(this._getState(id1), this._getState(id2), m),
                _kernel2 = _slicedToArray(_kernel, 2),
                r1 = _kernel2[0],
                r2 = _kernel2[1];

            this._setState(id1, r1);
            this._setState(id2, r2);
          }
        }
      }
    }

    /**
    Applies the k-qubit gate matrix m to the qubits at `pos`
    using `mask` to identify control qubits.
       @param {Array.<number[]>} m 2^k x 2^k complex matrix describing the k-qubit gate.
     @param {number[]} pos List of bit-positions of the qubits.
     @param {number} mask Bit-mask where set bits indicate control qubits.
     see follows the description in https://arxiv.org/abs/1704.01127
     */

  }, {
    key: '_multiQubitGate',
    value: function _multiQubitGate(m, pos, mask) {
      var inactive = Object.keys(this._map).map(function (k) {
        return parseInt(k, 10);
      }).filter(function (p) {
        return !pos.includes(p);
      });

      var matrix = _mathjs2.default.matrix(m);
      var subvec = (0, _util.zeros)(1 << pos.length);
      var subvec_idx = (0, _util.zeros)(subvec.length);
      for (var c = 0; c < 1 << inactive.length; ++c) {
        // determine base index (state of inactive qubits)
        var base = 0;
        for (var i = 0; i < inactive.length; ++i) {
          base |= (c >> i & 1) << inactive[i];
        }

        // check the control mask
        if (mask !== (base & mask)) {
          continue;
        }
        // now gather all elements involved in mat-vec mul
        for (var x = 0; x < subvec_idx.length; ++x) {
          var offset = 0;
          for (var _i3 = 0; _i3 < pos.length; ++_i3) {
            offset |= (x >> _i3 & 1) << pos[_i3];
          }
          subvec_idx[x] = base | offset;
          subvec[x] = this._getState(subvec_idx[x]) || _mathjs2.default.complex(0, 0);
        }

        // perform mat-vec mul
        (0, _util.matrixRangeAssign)(this._state, subvec_idx, (0, _util.matrixDot)(matrix, subvec));
      }
    }

    /**
    Set wavefunction and qubit ordering.
        @param {Complex[]} wavefunction Array of complex amplitudes describing the wavefunction (must be normalized).
      @param {Array} ordering List of ids describing the new ordering of qubits
    (i.e., the ordering of the provided wavefunction).
     */

  }, {
    key: 'setWavefunction',
    value: function setWavefunction(wavefunction, ordering) {
      var _this11 = this;

      // wavefunction contains 2^n values for n qubits
      (0, _assert2.default)(wavefunction.length === 1 << ordering.length);

      // all qubits must have been allocated before
      var f1 = ordering.filter(function (Id) {
        var v = _this11._map[Id];
        return typeof v !== 'undefined';
      }).length === ordering.length;
      var f2 = (0, _polyfill.len)(this._map) === ordering.length;
      if (!f1 || !f2) {
        throw new Error('set_wavefunction(): Invalid mapping provided.' + ' Please make sure all qubits have been ' + 'allocated previously (call eng.flush()).');
      }

      this._state = _mathjs2.default.matrix(wavefunction);
      var map = {};
      for (var i = 0; i < ordering.length; ++i) {
        map[ordering[i]] = i;
      }
      this._map = map;
    }

    /**
    Collapse a quantum register onto a classical basis state.
        @param {number[]} ids Qubit IDs to collapse.
      @param {boolean[]} values Measurement outcome for each of the qubit IDs in `ids`.
      @throws {Error} If probability of outcome is ~0 or unknown qubits are provided.
     */

  }, {
    key: 'collapseWavefunction',
    value: function collapseWavefunction(ids, values) {
      var _this12 = this;

      (0, _assert2.default)(ids.length === values.length);

      // all qubits must have been allocated before
      var f1 = ids.filter(function (Id) {
        return typeof _this12._map[Id] !== 'undefined';
      }).length === ids.length;
      if (!f1) {
        throw new Error('collapse_wavefunction(): Unknown qubit id(s)' + ' provided. Try calling eng.flush() before ' + 'invoking this function.');
      }

      var mask = 0;
      var val = 0;
      ids.forEach(function (looper, i) {
        var pos = _this12._map[looper];
        mask |= 1 << pos;
        val |= Math.floor(values[i]) << pos;
      });

      var nrm = 0.0;
      this._state.forEach(function (looper, _i) {
        var i = _i[0];
        if ((mask & i) === val) {
          nrm += Math.pow(_mathjs2.default.abs(_this12._getState(i)), 2);
        }
      });

      if (nrm < 1.e-12) {
        throw new Error('collapse_wavefunction(): Invalid collapse! Probability is ~0.');
      }
      var inv_nrm = 1.0 / _mathjs2.default.sqrt(nrm);
      this._state.forEach(function (looper, _i) {
        var i = _i[0];
        if ((mask & i) !== val) {
          _this12._setState(i, 0);
        } else {
          _this12._setState(i, _mathjs2.default.multiply(looper, inv_nrm));
        }
      });
    }
  }]);

  return Simulator;
}();

exports.default = Simulator;