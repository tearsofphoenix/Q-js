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

// A collection of indexed decomposition rules.
import {Dagger} from '../../meta/dagger'

/**
 * @class DecompositionRuleSet
 */
export default class DecompositionRuleSet {
  /**
    @param {Array.<DecompositionRule>} rules Initial decomposition rules.
    @param {Array} modules A list of
things with an "all_defined_decomposition_rules" property
containing decomposition rules to add to the rule set.
     */
  constructor(rules, modules) {
    this.decompositions = {}
    if (rules) {
      this.addDecompositionRules(rules)
    }
    if (modules) {
      modules.forEach((module) => {
        this.addDecompositionRules(module.allDefinedDecompositionRules)
      })
    }
  }

  addDecompositionRules(rules) {
    rules.forEach(rule => this.addDecompositionRule(rule))
  }

  /**
    Add a decomposition rule to the rule set.

    @param {DecompositionRule} rule The decomposition rule to add.
     */
  addDecompositionRule(rule) {
    const decomp_obj = new _Decomposition(rule.gateDecomposer, rule.gateRecognizer)
    const cls = rule.gateClass.name
    if (!(cls in this.decompositions)) {
      this.decompositions[cls] = []
    }
    this.decompositions[cls].push(decomp_obj)
  }
}

/**
 * @class ModuleWithDecompositionRuleSet
 * @desc
Interface type for explaining one of the parameters that can be given to
DecompositionRuleSet.
 */
class ModuleWithDecompositionRuleSet {
  constructor(allDefinedDecompositionRules) {
    this.allDefinedDecompositionRules = allDefinedDecompositionRules
  }
}

/**
 * @private
 * @class _Decomposition
 * @desc
The Decomposition class can be used to register a decomposition rule (by
calling register_decomposition)
 */
class _Decomposition {
  /**
   * @constructor
    Construct the Decomposition object.

    @param {function} replacementFunc Function that, when called with a `Command` object, decomposes this command.
    @param {function} recognizerFunc Function that, when called with a `Command` object,
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

function recogn_toffoli(cmd)
// can be applied if the gate is an X-gate with 2 controls
    return len(cmd.control_qubits) == 2

and, given a replacement function `replace_toffoli`, the decomposition
rule can be registered as

   @example

register_decomposition(X.constructor, decompose_toffoli,
    recogn_toffoli)

Note:
    See projectq.setups.decompositions for more example codes.
     */
  constructor(replacementFunc, recognizerFunc) {
    this.decompose = replacementFunc
    this.check = recognizerFunc
  }

  /**
    Return the Decomposition object which handles the inverse of the
original command.

    This simulates the user having added a decomposition rule for the
    inverse as well. Since decomposing the inverse of a command can be
achieved by running the original decomposition inside a
    `with Dagger(engine)` statement, this is not necessary
(and will be done automatically by the framework).

  @return {_Decomposition} Decomposition handling the inverse of the original command.
  */
  getInverseDecomposition() {
    const decomp = (cmd) => {
      Dagger(cmd.engine, () => this.decompose(cmd.getInverse()))
    }
    const recogn = (cmd) => {
      return this.check(cmd.getInverse())
    }
    return new _Decomposition(decomp, recogn)
  }
}
