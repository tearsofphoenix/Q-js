"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
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
 * @class ComputeTag
 */
var ComputeTag = exports.ComputeTag = function () {
  function ComputeTag() {
    _classCallCheck(this, ComputeTag);
  }

  _createClass(ComputeTag, [{
    key: "equal",
    value: function equal(other) {
      return other instanceof ComputeTag;
    }
  }]);

  return ComputeTag;
}();

/**
 * @class UncomputeTag
 */


var UncomputeTag = exports.UncomputeTag = function () {
  function UncomputeTag() {
    _classCallCheck(this, UncomputeTag);
  }

  _createClass(UncomputeTag, [{
    key: "equal",
    value: function equal(other) {
      return other instanceof UncomputeTag;
    }
  }]);

  return UncomputeTag;
}();

/**
 * @class DirtyQubitTag
 */


var DirtyQubitTag = exports.DirtyQubitTag = function () {
  function DirtyQubitTag() {
    _classCallCheck(this, DirtyQubitTag);
  }

  _createClass(DirtyQubitTag, [{
    key: "equal",
    value: function equal(other) {
      return other instanceof DirtyQubitTag;
    }
  }]);

  return DirtyQubitTag;
}();

/**
 * @class LogicalQubitIDTag
 */


var LogicalQubitIDTag = exports.LogicalQubitIDTag = function () {
  /**
   * @constructor
   * @param {number} logical_qubit_id
   */
  function LogicalQubitIDTag(logical_qubit_id) {
    _classCallCheck(this, LogicalQubitIDTag);

    this.logical_qubit_id = logical_qubit_id;
  }

  _createClass(LogicalQubitIDTag, [{
    key: "equal",
    value: function equal(other) {
      return other instanceof LogicalQubitIDTag && other.logical_qubit_id === this.logical_qubit_id;
    }

    /**
     * check if self is in `array`
     * @param array
     * @return {boolean}
     */

  }, {
    key: "isInArray",
    value: function isInArray(array) {
      if (Array.isArray(array)) {
        for (var i = 0; i < array.length; ++i) {
          if (this.equal(array[i])) {
            return true;
          }
        }
      }
      return false;
    }
  }]);

  return LogicalQubitIDTag;
}();