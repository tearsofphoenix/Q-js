'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _dagger = require('../../meta/dagger');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class DecompositionRuleSet
 * A collection of indexed decomposition rules.
 */
var DecompositionRuleSet = function () {
  /**
    @param {Array.<DecompositionRule>} rules Initial decomposition rules.
    @param {?Array} modules A list of things with an "all_defined_decomposition_rules" property
      containing decomposition rules to add to the rule set.
  */
  function DecompositionRuleSet(rules) {
    var _this = this;

    var modules = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, DecompositionRuleSet);

    this.decompositions = {};
    if (rules) {
      this.addDecompositionRules(rules);
    }
    if (modules) {
      modules.forEach(function (module) {
        _this.addDecompositionRules(module.allDefinedDecompositionRules);
      });
    }
  }

  _createClass(DecompositionRuleSet, [{
    key: 'addDecompositionRules',
    value: function addDecompositionRules(rules) {
      var _this2 = this;

      rules.forEach(function (rule) {
        return _this2.addDecompositionRule(rule);
      });
    }

    /**
      Add a decomposition rule to the rule set.
        @param {DecompositionRule} rule The decomposition rule to add.
       */

  }, {
    key: 'addDecompositionRule',
    value: function addDecompositionRule(rule) {
      var decomp_obj = new _Decomposition(rule.gateDecomposer, rule.gateRecognizer);
      var cls = rule.gateClass.name;
      if (!(cls in this.decompositions)) {
        this.decompositions[cls] = [];
      }
      this.decompositions[cls].push(decomp_obj);
    }
  }]);

  return DecompositionRuleSet;
}();

/**
 * @class ModuleWithDecompositionRuleSet
 * Interface type for explaining one of the parameters that can be given to DecompositionRuleSet.
 */


exports.default = DecompositionRuleSet;

var ModuleWithDecompositionRuleSet = function ModuleWithDecompositionRuleSet(allDefinedDecompositionRules) {
  _classCallCheck(this, ModuleWithDecompositionRuleSet);

  this.allDefinedDecompositionRules = allDefinedDecompositionRules;
};

/**
 * @private
 * @class _Decomposition
 * @desc
The Decomposition class can be used to register a decomposition rule (by calling register_decomposition)
 */


var _Decomposition = function () {
  /**
   * @constructor
    Construct the Decomposition object.
      @param {function} replacementFunc when called with a `Command` object, decomposes this command.
    @param {function(cmd: Command): boolean} recognizerFunc when called with a `Command` object,
      returns true if and only if the replacement rule can handle this command.
      Every Decomposition is registered with the gate class. The
  Decomposition rule is then potentially valid for all objects which are
  an instance of that same class
  (i.e., instance of gate_object.constructor). All other parameters have
  to be checked by the recogn_fun, i.e., it has to decide whether the
  decomposition rule can indeed be applied to replace the given Command.
      As an example, consider recognizing the Toffoli gate, which is a
  Pauli-X gate with 2 control qubits. The recognizer function would then
  be:
      @example
    function recogn_toffoli(cmd) {
    // can be applied if the gate is an X-gate with 2 controls
        return len(cmd.control_qubits) == 2
    }
  and, given a replacement function `replace_toffoli`, the decomposition
  rule can be registered as
     @example
    register_decomposition(X.constructor, decompose_toffoli, recogn_toffoli)
  Note:
    See projectq.setups.decompositions for more example codes.
     */
  function _Decomposition(replacementFunc, recognizerFunc) {
    _classCallCheck(this, _Decomposition);

    this.decompose = replacementFunc;
    this.check = recognizerFunc;
  }

  /**
    Return the Decomposition object which handles the inverse of the original command.
      This simulates the user having added a decomposition rule for the
    inverse as well. Since decomposing the inverse of a command can be
  achieved by running the original decomposition inside a
    `Dagger(engine)` statement, this is not necessary
  (and will be done automatically by the framework).
    @return {_Decomposition} Decomposition handling the inverse of the original command.
  */


  _createClass(_Decomposition, [{
    key: 'getInverseDecomposition',
    value: function getInverseDecomposition() {
      var _this3 = this;

      var decomp = function decomp(cmd) {
        (0, _dagger.Dagger)(cmd.engine, function () {
          return _this3.decompose(cmd.getInverse());
        });
      };
      var recogn = function recogn(cmd) {
        return _this3.check(cmd.getInverse());
      };
      return new _Decomposition(decomp, recogn);
    }
  }]);

  return _Decomposition;
}();