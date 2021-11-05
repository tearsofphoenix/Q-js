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

// Decompose CNOT gates
import { Compute, Uncompute } from '../../meta/compute';
import { H, XGate } from '../../ops/gates';
import { tuple } from '../../libs/util';

import { CZ } from '../../ops/shortcuts'
import DecompositionRule from '../../cengines/replacer/decompositionrule';

const _decompose_cnot = (cmd) => {
  const ctrl = cmd.controlQubits
  const eng = cmd.engine
  Compute(eng, () => {
    H.or(cmd.qubits[0])
  })
  CZ.or(tuple(ctrl[0], cmd.qubits[0][0]))
  Uncompute(eng)
}

/**
 * @ignore
 * @param cmd
 * @return {boolean}
 * @private
 */
export const _recognize_cnot = cmd => (cmd.controlCount === 1)

export default [
  new DecompositionRule(XGate, _decompose_cnot, _recognize_cnot)
]
