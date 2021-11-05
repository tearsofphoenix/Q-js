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

import { add_constant, add_constant_modN, mul_by_constant_modN } from './constantmath';
import { Control } from '@/meta/control';
import DecompositionRule from '@/cengines/replacer/decompositionrule';
import { AddConstant, AddConstantModN, MultiplyByConstantModN } from './gates';
import { ICommand, IMathGate } from '@/interfaces';

function _replace_addconstant(cmd: ICommand) {
  const eng = cmd.engine;
  const c = (cmd.gate as IMathGate).a;
  const quint = cmd.qubits[0];

  Control(eng, cmd.controlQubits, () => add_constant(eng, c, quint));
}


function _replace_addconstmodN(cmd: ICommand) {
  const eng = cmd.engine;
  const c = (cmd.gate as IMathGate).a;
  const N = (cmd.gate as IMathGate).N;
  const quint = cmd.qubits[0];

  Control(eng, cmd.controlQubits, () => add_constant_modN(eng, c, N, quint));
}


function _replace_multiplybyconstantmodN(cmd: ICommand) {
  const eng = cmd.engine;
  const c = (cmd.gate as IMathGate).a;
  const N = (cmd.gate as IMathGate).N;
  const quint = cmd.qubits[0];

  Control(eng, cmd.controlQubits, () => mul_by_constant_modN(eng, c, N, quint));
}

export default [
  new DecompositionRule(AddConstant, _replace_addconstant),
  new DecompositionRule(AddConstantModN, _replace_addconstmodN),
  new DecompositionRule(MultiplyByConstantModN, _replace_multiplybyconstantmodN),
]
