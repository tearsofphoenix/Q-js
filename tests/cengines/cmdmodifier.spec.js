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

import {expect} from 'chai'
import { ClassicalInstructionGate, FastForwardingGate } from '../../src/ops/basics'
import {H} from '../../src/ops/gates'
import {DummyEngine} from '../../src/cengines/testengine'
import MainEngine from '../../src/cengines/main'
import CommandModifier from '../../src/cengines/cmdmodifier'

describe('cmdmodifier test', () => {
  it('should test_command_modifier', () => {
    const cmd_mod_fun = (cmd) => {
      cmd.tags = 'NewTag'
      return cmd
    }

    const backend = new DummyEngine(true)
    const cmd_modifier = new CommandModifier(cmd_mod_fun)
    const main_engine = new MainEngine(backend, [cmd_modifier])
    const qubit = main_engine.allocateQubit()
    H.or(qubit)
    // Test if H gate was sent through forwarder_eng and tag was added
    const received_commands = []
    // Remove Allocate and Deallocate gates
    backend.receivedCommands.forEach((cmd) => {
      if (!(cmd.gate instanceof FastForwardingGate || cmd.gate instanceof ClassicalInstructionGate)) {
        received_commands.push(cmd)
      }
    })

    expect(received_commands.length).to.equal(1)
    expect(received_commands[0].gate.equal(H)).to.equal(true)
    expect(received_commands[0].tags).to.equal('NewTag')
  });
})
