'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _basics = require('./basics');

var _tag = require('../meta/tag');

var _util = require('../libs/util');

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
 *  @class TagRemover
 *  @desc is a compiler engine which removes temporary command tags (see the tag classes such as LoopTag in `loop`).

Removing tags is important (after having handled them if necessary) in
order to enable optimizations across meta-function boundaries (compute/
action/uncompute or loops after unrolling)
 */
var TagRemover = function (_BasicEngine) {
  _inherits(TagRemover, _BasicEngine);

  /**
    @constructor
    @param {Array.<function>} tags A list of meta tag classes (e.g., [ComputeTag, UncomputeTag])
    denoting the tags to remove
  */
  function TagRemover() {
    var tags = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [_tag.ComputeTag, _tag.UncomputeTag];

    _classCallCheck(this, TagRemover);

    var _this = _possibleConstructorReturn(this, (TagRemover.__proto__ || Object.getPrototypeOf(TagRemover)).call(this));

    (0, _assert2.default)(Array.isArray(tags));
    _this._tags = tags;
    return _this;
  }

  /**
   * @param {function} tag
   */


  _createClass(TagRemover, [{
    key: '_isTagIn',
    value: function _isTagIn(tag) {
      return (0, _util.instanceOf)(tag, this._tags);
    }

    /**
      Receive a list of commands from the previous engine, remove all tags
    which are an instance of at least one of the meta tags provided in the
    constructor, and then send them on to the next compiler engine.
        @param {Command[]} commandList List of commands to receive and then (after removing tags) send on.
    */

  }, {
    key: 'receive',
    value: function receive(commandList) {
      var _this2 = this;

      commandList.forEach(function (cmd) {
        cmd.tags = cmd.tags.filter(function (t) {
          return !_this2._isTagIn(t);
        });
        _this2.send([cmd]);
      });
    }
  }]);

  return TagRemover;
}(_basics.BasicEngine);

exports.default = TagRemover;