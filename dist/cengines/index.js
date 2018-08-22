'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InstructionFilter = exports.AutoReplacer = exports.DecompositionRule = exports.DecompositionRuleSet = exports.CompareEngine = exports.DummyEngine = exports.SwapAndCNOTFlipper = exports.Optimize = exports.ManualMapper = exports.MainEngine = exports.CommandModifier = exports.ForwarderEngine = exports.BasicEngine = exports.IBM5QubitMapper = exports.TagRemover = undefined;

var _basics = require('./basics');

Object.defineProperty(exports, 'BasicEngine', {
  enumerable: true,
  get: function get() {
    return _basics.BasicEngine;
  }
});
Object.defineProperty(exports, 'ForwarderEngine', {
  enumerable: true,
  get: function get() {
    return _basics.ForwarderEngine;
  }
});

var _testengine = require('./testengine');

Object.defineProperty(exports, 'DummyEngine', {
  enumerable: true,
  get: function get() {
    return _testengine.DummyEngine;
  }
});
Object.defineProperty(exports, 'CompareEngine', {
  enumerable: true,
  get: function get() {
    return _testengine.CompareEngine;
  }
});

var _replacer = require('./replacer/replacer');

Object.defineProperty(exports, 'AutoReplacer', {
  enumerable: true,
  get: function get() {
    return _replacer.AutoReplacer;
  }
});
Object.defineProperty(exports, 'InstructionFilter', {
  enumerable: true,
  get: function get() {
    return _replacer.InstructionFilter;
  }
});

var _tagremover = require('./tagremover');

var _tagremover2 = _interopRequireDefault(_tagremover);

var _ibm5qubitmapper = require('./ibm5qubitmapper');

var _ibm5qubitmapper2 = _interopRequireDefault(_ibm5qubitmapper);

var _cmdmodifier = require('./cmdmodifier');

var _cmdmodifier2 = _interopRequireDefault(_cmdmodifier);

var _main = require('./main');

var _main2 = _interopRequireDefault(_main);

var _manualmapper = require('./manualmapper');

var _manualmapper2 = _interopRequireDefault(_manualmapper);

var _optimize = require('./optimize');

var _optimize2 = _interopRequireDefault(_optimize);

var _swapandcnotflipper = require('./swapandcnotflipper');

var _swapandcnotflipper2 = _interopRequireDefault(_swapandcnotflipper);

var _decompositionruleset = require('./replacer/decompositionruleset');

var _decompositionruleset2 = _interopRequireDefault(_decompositionruleset);

var _decompositionrule = require('./replacer/decompositionrule');

var _decompositionrule2 = _interopRequireDefault(_decompositionrule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.TagRemover = _tagremover2.default; /*
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

exports.IBM5QubitMapper = _ibm5qubitmapper2.default;
exports.CommandModifier = _cmdmodifier2.default;
exports.MainEngine = _main2.default;
exports.ManualMapper = _manualmapper2.default;
exports.Optimize = _optimize2.default;
exports.SwapAndCNOTFlipper = _swapandcnotflipper2.default;
exports.DecompositionRuleSet = _decompositionruleset2.default;
exports.DecompositionRule = _decompositionrule2.default;