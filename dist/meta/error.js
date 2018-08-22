"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var NotMergeable = exports.NotMergeable = function (_Error) {
  _inherits(NotMergeable, _Error);

  function NotMergeable() {
    var _ref;

    _classCallCheck(this, NotMergeable);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = NotMergeable.__proto__ || Object.getPrototypeOf(NotMergeable)).call.apply(_ref, [this].concat(args)));

    _this.__proto__ = NotMergeable.prototype;
    return _this;
  }

  return NotMergeable;
}(Error);

var LastEngineError = exports.LastEngineError = function (_Error2) {
  _inherits(LastEngineError, _Error2);

  function LastEngineError() {
    var _ref2;

    _classCallCheck(this, LastEngineError);

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var _this2 = _possibleConstructorReturn(this, (_ref2 = LastEngineError.__proto__ || Object.getPrototypeOf(LastEngineError)).call.apply(_ref2, [this].concat(args)));

    _this2.__proto__ = LastEngineError.prototype;
    return _this2;
  }

  return LastEngineError;
}(Error);

var QubitManagementError = exports.QubitManagementError = function (_Error3) {
  _inherits(QubitManagementError, _Error3);

  function QubitManagementError() {
    var _ref3;

    _classCallCheck(this, QubitManagementError);

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    var _this3 = _possibleConstructorReturn(this, (_ref3 = QubitManagementError.__proto__ || Object.getPrototypeOf(QubitManagementError)).call.apply(_ref3, [this].concat(args)));

    _this3.__proto__ = QubitManagementError.prototype;
    return _this3;
  }

  return QubitManagementError;
}(Error);

var NotYetMeasuredError = exports.NotYetMeasuredError = function (_Error4) {
  _inherits(NotYetMeasuredError, _Error4);

  function NotYetMeasuredError() {
    var _ref4;

    _classCallCheck(this, NotYetMeasuredError);

    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    var _this4 = _possibleConstructorReturn(this, (_ref4 = NotYetMeasuredError.__proto__ || Object.getPrototypeOf(NotYetMeasuredError)).call.apply(_ref4, [this].concat(args)));

    _this4.__proto__ = NotYetMeasuredError.prototype;
    return _this4;
  }

  return NotYetMeasuredError;
}(Error);

var NoGateDecompositionError = exports.NoGateDecompositionError = function (_Error5) {
  _inherits(NoGateDecompositionError, _Error5);

  function NoGateDecompositionError() {
    var _ref5;

    _classCallCheck(this, NoGateDecompositionError);

    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    var _this5 = _possibleConstructorReturn(this, (_ref5 = NoGateDecompositionError.__proto__ || Object.getPrototypeOf(NoGateDecompositionError)).call.apply(_ref5, [this].concat(args)));

    _this5.__proto__ = NoGateDecompositionError.prototype;
    return _this5;
  }

  return NoGateDecompositionError;
}(Error);