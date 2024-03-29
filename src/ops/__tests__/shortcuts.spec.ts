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

import { expect } from 'chai'
import { CRz } from '@/ops/shortcuts'
import { Rz } from '@/ops/gates'
import { ControlledGate } from '@/ops/metagates'

describe('shortcuts test', () => {
  it('should test crz', () => {
    const gate = CRz(0.5);
    expect(gate instanceof ControlledGate).to.equal(true)
    expect(gate.gate.equal(new Rz(0.5))).to.equal(true)
    expect(gate.n).to.equal(1)
  });
})
