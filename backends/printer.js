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

/*
Contains a compiler engine which prints commands to stdout prior to sending
them on to the next engines (see CommandPrinter).
*/
import assert from 'assert'
import {BasicEngine} from '../cengines/basics'
import {FlushGate, Measure} from '../ops/gates'
import {getControlCount} from '../meta/control'
import {LogicalQubitIDTag} from '../meta/tag'
import {BasicQubit} from '../types/qubit'
import { LastEngineError } from '../meta/error'

/**
 * CommandPrinter is a compiler engine which prints commands to stdout prior
 * to sending them on to the next compiler engine.
 */
export default class CommandPrinter extends BasicEngine {
  /**
   *Initialize a CommandPrinter.

  @param acceptInput {boolean}: If accept_input is true, the printer queries
  the user to input measurement results if the CommandPrinter is
  the last engine. Otherwise, all measurements yield
  @param defaultMeasure {boolean}. Default measurement result (if accept_input is False).
  @param inPlace {boolean}: If in_place is true, all output is written on the same line of the terminal.

  */
  constructor(acceptInput = true, defaultMeasure = false, inPlace = false) {
    super()
    this._acceptInput = acceptInput
    this._defaultMeasure = defaultMeasure
    this._inPlace = inPlace
  }

  /**
    Specialized implementation of is_available: Returns True if the
    CommandPrinter is the last engine (since it can print any command).

    @param cmd {Command}: Command of which to check availability (all Commands can be printed).
    @return {boolean} True, unless the next engine cannot handle the Command (if there is a next engine).
   */
  isAvailable(cmd) {
    try {
      return super.isAvailable(cmd)
    } catch (e) {
      if (e instanceof LastEngineError) {
        return true
      }
    }
    return false
  }

  /**
    Print a command or, if the command is a measurement instruction and
    the CommandPrinter is the last engine in the engine pipeline: Query
    the user for the measurement result (if accept_input = True) / Set
    the result to 0 (if it's False).

    @param cmd {Command}: Command to print.
   */
  printCMD(cmd) {
    if (this.isLastEngine && cmd.gate.equal(Measure)) {
      assert(getControlCount(cmd) === 0)
      console.log(cmd.toString())
      cmd.qubits.forEach((qureg) => {
        qureg.forEach((qubit) => {
          // ignore input
          const m = this._defaultMeasure
          let logicQubitTag
          cmd.tags.forEach((tag) => {
            if (tag instanceof LogicalQubitIDTag) {
              logicQubitTag = tag
            }
          })

          if (logicQubitTag) {
            qubit = new BasicQubit(qubit.engine, logicQubitTag.logical_qubit_id)
          }
          this.main.setMeasurementResult(qubit, m)
        })
      })
    } else if (this._inPlace) {
      console.log(`\0\r\t\x1b[K${cmd.toString()}\r`)
    } else {
      console.log(cmd.toString())
    }
  }

  /**
  Receive a list of commands from the previous engine, print the
commands, and then send them on to the next engine.

    @param commandList {Array<Command>} List of Commands to print (and potentially send on to the next engine).
   */
  receive(commandList) {
    commandList.forEach((cmd) => {
      if (!(cmd.gate instanceof FlushGate)) {
        this.printCMD(cmd)
      }
      if (!this.isLastEngine) {
        this.send([cmd])
      }
    })
  }
}
