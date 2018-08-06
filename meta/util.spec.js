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
import {DummyEngine} from '../cengines/testengine'
import MainEngine from '../cengines/main'
import {dropEngineAfter, insertEngine} from './util'

describe('util test', () => {
  it('should test_insert_then_drop', () => {
    const d1 = new DummyEngine()
    const d2 = new DummyEngine()
    const d3 = new DummyEngine()
    const eng = new MainEngine(d3, [d1])

    expect(d1.next === d3).to.equal(true)
    expect(typeof d2.next === 'undefined').to.equal(true)
    expect(typeof d3.next === 'undefined').to.equal(true)
    expect(d1.main).to.equal(eng)
    expect(typeof d2.main === 'undefined').to.equal(true)
    expect(d3.main).to.equal(eng)

    insertEngine(d1, d2)
    expect(d1.next === d2).to.equal(true)
    expect(d2.next === d3).to.equal(true)
    expect(d3.next === undefined).to.equal(true)
    expect(d1.main === eng).to.equal(true)
    expect(d2.main === eng).to.equal(true)
    expect(d3.main === eng).to.equal(true)

    dropEngineAfter(d1)
    expect(d1.next === d3).to.equal(true)
    expect(d2.next === undefined).to.equal(true)
    expect(d3.next === undefined).to.equal(true)
    expect(d1.main === eng).to.equal(true)
    expect(d2.main === undefined).to.equal(true)
    expect(d3.main === eng).to.equal(true)
  });
})
