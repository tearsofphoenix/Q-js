'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _basics = require('./basics');

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
Contains a CommandModifier engine, which can be used to, e.g., modify the tags
of all commands which pass by (see the AutoReplacer for an example).
*/

/**
 * @class CommandModifier
 * @desc
CommandModifier is a compiler engine which applies a function to all
incoming commands, sending on the resulting command instead of the original one.
 */
var CommandModifier = function (_BasicEngine) {
  _inherits(CommandModifier, _BasicEngine);

  /**
   * @constructor
  Initialize the CommandModifier.
      @param {function} cmdModFunc Function which, given a command cmd,
    returns the command it should send instead.
      @example
  function cmd_mod_fun(cmd)
  cmd.tags += [new MyOwnTag()]
  compiler_engine = new CommandModifier(cmd_mod_fun)
   */
  function CommandModifier(cmdModFunc) {
    _classCallCheck(this, CommandModifier);

    var _this = _possibleConstructorReturn(this, (CommandModifier.__proto__ || Object.getPrototypeOf(CommandModifier)).call(this));

    _this._cmdModFunc = cmdModFunc;
    return _this;
  }

  /**
  Receive a list of commands from the previous engine, modify all
   commands, and send them on to the next engine.
      @param {Command[]} cmdList List of commands to receive and then (after modification) send on.
   */


  _createClass(CommandModifier, [{
    key: 'receive',
    value: function receive(cmdList) {
      var _this2 = this;

      var newList = cmdList.map(function (cmd) {
        return _this2._cmdModFunc(cmd);
      });
      this.send(newList);
    }
  }]);

  return CommandModifier;
}(_basics.BasicEngine);

exports.default = CommandModifier;