'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _basics = require('./basics');

var _tag = require('../meta/tag');

var _util = require('../meta/util');

var _gates = require('../ops/gates');

var _cmdmodifier = require('./cmdmodifier');

var _cmdmodifier2 = _interopRequireDefault(_cmdmodifier);

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
 * @class BasicMapperEngine
 * @desc
Defines the parent class from which all mappers should be derived.

    There is only one engine currently allowed to be derived from
BasicMapperEngine. This allows the simulator to automatically translate
logical qubit ids to mapped ids.
*/
var BasicMapperEngine = function (_BasicEngine) {
  _inherits(BasicMapperEngine, _BasicEngine);

  /**
   * @constructor
  Parent class for all Mappers.
  this.current_mapping (dict): Keys are the logical qubit ids and values
  are the mapped qubit ids.
   */
  function BasicMapperEngine() {
    _classCallCheck(this, BasicMapperEngine);

    var _this = _possibleConstructorReturn(this, (BasicMapperEngine.__proto__ || Object.getPrototypeOf(BasicMapperEngine)).call(this));

    _this._currentMapping = null;
    return _this;
  }

  _createClass(BasicMapperEngine, [{
    key: 'sendCMDWithMappedIDs',


    /**
    Send this Command using the mapped qubit ids of this.current_mapping.
        If it is a Measurement gate, then it adds a LogicalQubitID tag.
        @param {Command} cmd Command object with logical qubit ids.
     */
    value: function sendCMDWithMappedIDs(cmd) {
      var _this2 = this;

      var newCMD = cmd.copy();
      var qubits = newCMD.qubits;
      qubits.forEach(function (qureg) {
        qureg.forEach(function (qubit) {
          if (qubit.id !== -1) {
            qubit.id = _this2._currentMapping[qubit.id];
          }
        });
      });
      var controlQubits = newCMD.controlQubits;
      controlQubits.forEach(function (qubit) {
        qubit.id = _this2._currentMapping[qubit.id];
      });
      if (newCMD.gate instanceof _gates.MeasureGate) {
        if (!(newCMD.qubits.length === 1 && newCMD.qubits[0].length === 1)) {
          throw new Error('assert error');
        }
        // Add LogicalQubitIDTag to MeasureGate
        var add_logical_id = function add_logical_id(command) {
          var old_tags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : cmd.tags.slice(0);

          old_tags.push(new _tag.LogicalQubitIDTag(cmd.qubits[0][0].id));
          command.tags = old_tags;
          return command;
        };

        var tagger_eng = new _cmdmodifier2.default(add_logical_id);
        (0, _util.insertEngine)(this, tagger_eng);
        this.send([newCMD]);
        (0, _util.dropEngineAfter)(this);
      } else {
        this.send([newCMD]);
      }
    }
  }, {
    key: 'currentMapping',
    get: function get() {
      return Object.assign({}, this._currentMapping);
    },
    set: function set(newMap) {
      this._currentMapping = newMap;
    }
  }]);

  return BasicMapperEngine;
}(_basics.BasicEngine);

exports.default = BasicMapperEngine;