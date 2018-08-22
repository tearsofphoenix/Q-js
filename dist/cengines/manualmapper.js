'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _basicmapper = require('./basicmapper');

var _basicmapper2 = _interopRequireDefault(_basicmapper);

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
 * @class ManualMapper
 * @desc
Manual Mapper which adds QubitPlacementTags to Allocate gate commands
according to a user-specified mapping.
    @property {function} map The function which maps a given qubit id to its
    location. It gets set when initializing the mapper.
 */
var ManualMapper = function (_BasicMapperEngine) {
  _inherits(ManualMapper, _BasicMapperEngine);

  /**
   * @constructor
    Initialize the mapper to a given mapping. If no mapping function is
  provided, the qubit id is used as the location.
      @param {function} mapFunc Function which, given the qubit id, returns
  an integer describing the physical location (must be constant).
     */
  function ManualMapper() {
    var mapFunc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function (x) {
      return x;
    };

    _classCallCheck(this, ManualMapper);

    var _this = _possibleConstructorReturn(this, (ManualMapper.__proto__ || Object.getPrototypeOf(ManualMapper)).call(this));

    _this.map = mapFunc;
    _this.currentMapping = {};
    return _this;
  }

  /**
    Receives a command list and passes it to the next engine, adding
    qubit placement tags to allocate gates.
      @param {Command[]} command_list list of commands to receive.
  */


  _createClass(ManualMapper, [{
    key: 'receive',
    value: function receive(command_list) {
      var _this2 = this;

      command_list.forEach(function (cmd) {
        var ids = [];
        cmd.qubits.forEach(function (qr) {
          qr.forEach(function (qb) {
            return ids.push(qb.id);
          });
        });
        ids.forEach(function (id) {
          var v = _this2._currentMapping[id];
          if (typeof v === 'undefined') {
            _this2._currentMapping[id] = _this2.map(id);
          }
        });
        _this2.sendCMDWithMappedIDs(cmd);
      });
    }
  }]);

  return ManualMapper;
}(_basicmapper2.default);

exports.default = ManualMapper;