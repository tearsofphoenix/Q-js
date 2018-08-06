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
import CommandPrinter from './printer'
import {InstructionFilter} from '../cengines/replacer/replacer'
import MainEngine from '../cengines/main'
import {DummyEngine} from '../cengines/testengine'
import {Command} from '../ops/command'
import { tuple } from '../libs/util'
import {H, T, Measure, NOT, Allocate} from '../ops/gates'
import { BasicQubit } from '../types/qubit'
import {LogicalQubitIDTag} from '../meta/tag'

describe('printer test', () => {

  it('should test_command_printer_is_available', function () {
    const inline_cmd_printer = new CommandPrinter()
    const cmd_printer = new CommandPrinter()

    const available_cmd = function(cmd) {
      return cmd.gate.equal(H)
    }

    const filter = new InstructionFilter(available_cmd)
    const eng = new MainEngine(cmd_printer, [inline_cmd_printer, filter])
    const qubit = eng.allocateQubit()
    const cmd0 = new Command(eng, H, tuple(qubit))
    const cmd1 = new Command(eng, T, tuple(qubit))

    expect(inline_cmd_printer.isAvailable(cmd0)).to.equal(true)
    expect(inline_cmd_printer.isAvailable(cmd1)).to.equal(false)
    expect(cmd_printer.isAvailable(cmd0)).to.equal(true)
    expect(cmd_printer.isAvailable(cmd1)).to.equal(true)
  });

  it('should test_command_printer_no_input_default_measure', function () {
    const cmd_printer = new CommandPrinter(false)
    const eng = new MainEngine(cmd_printer, [new DummyEngine()])
    const qubit = eng.allocateQubit()
    NOT.or(qubit)
    Measure.or(qubit)
    expect(qubit.toNumber()).to.equal(0)
  });

  it('should test_command_printer_measure_mapped_qubit', function () {
    const eng = new MainEngine(new CommandPrinter(false), [])
    const qb1 = new BasicQubit(eng, 1)
    const qb2 = new BasicQubit(eng, 2)
    const cmd0 = new Command(eng, Allocate, tuple([qb1]))
    const cmd1 = new Command(eng, Measure, tuple([qb1]), [], [new LogicalQubitIDTag(2)])

    expect(() => qb1.toNumber()).to.throw()
    expect(() => qb2.toNumber()).to.throw()

    eng.send([cmd0, cmd1])
    eng.flush()

    expect(() => qb1.toNumber()).to.throw()
    expect(qb2.toNumber()).to.equal(0)
  });
})
