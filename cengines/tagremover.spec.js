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
import TagRemover from './tagremover'
import {ComputeTag, UncomputeTag} from '../meta/tag'
import {tuple} from '../libs/util'
import {H} from '../ops/gates'
import {Command} from '../ops/command'
import {DummyEngine} from './testengine'
import MainEngine from './main'

describe('tag remover test', () => {
  it('should test_tagremover_default', () => {
    const tag_remover = new TagRemover()
    expect(tag_remover._tags).to.deep.equal([ComputeTag, UncomputeTag])
  });

  it('should test_tagremover', () => {
    const backend = new DummyEngine(true)
    const tag_remover = new TagRemover([String])
    const eng = new MainEngine(backend, [tag_remover])
    // Create a command_list and check if "NewTag" is removed
    const qubit = eng.allocateQubit()
    const cmd0 = new Command(eng, H, tuple(qubit))
    cmd0.tags = ['NewTag']
    const cmd1 = new Command(eng, H, tuple(qubit))
    cmd1.tags = [1, 2, 'NewTag', 3]
    const cmd_list = [cmd0, cmd1, cmd0]
    expect(backend.receivedCommands.length).to.equal(1) // AllocateQubitGate
    tag_remover.receive(cmd_list)

    expect(backend.receivedCommands.length).to.equal(4)
    expect(backend.receivedCommands[1].tags).to.deep.equal([])
    expect(backend.receivedCommands[2].tags).to.deep.equal([1, 2, 3])
  });
})
