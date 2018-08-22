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

import {BasicEngine} from './basics'
import {FlushGate} from '../ops/gates'

/**
 * @class CompareEngine
 * @desc CompareEngine is an engine which saves all commands. It is only intended
 * for testing purposes. Two CompareEngine backends can be compared and
 * return true if they contain the same commmands.
 */
export class CompareEngine extends BasicEngine {
  /**
   * @constructor
   */
  constructor() {
    super()
    this._l = [[]]
  }

  /**
   * @return {boolean}
   */
  isAvailable() {
    return true
  }

  /**
   * @param {Command} cmd
   */
  cacheCMD(cmd) {
    // are there qubit ids that haven't been added to the list?
    const allQubitIDList = []
    cmd.allQubits.forEach((qureg) => {
      qureg.forEach(qubit => allQubitIDList.push(qubit.id))
    })
    let maxidx = 0
    allQubitIDList.forEach(qid => maxidx = Math.max(maxidx, qid))

    // if so, increase size of list to account for these qubits
    const add = maxidx + 1 - this._l.length
    if (add > 0) {
      for (let i = 0; i < add; ++i) {
        this._l.push([])
      }
    }
    // add gate command to each of the qubits involved
    allQubitIDList.forEach(qid => this._l[qid].push(cmd))
  }

  receive(commandList) {
    const f = new FlushGate()
    commandList.forEach((cmd) => {
      if (!cmd.gate.equal(f)) {
        this.cacheCMD(cmd)
      }
    })

    if (!this.isLastEngine) {
      this.send(commandList)
    }
  }

  /**
   * test if c1 & c2 are equal
   * @param c1 {Command}
   * @param c2 {Command}
   * @return {boolean}
   */
  compareCMDs(c1, c2) {
    const item = c2.copy()
    item.engine = c1.engine
    return c1.equal(item)
  }

  equal(engine) {
    const len = this._l.length
    if (!(engine instanceof CompareEngine) || len !== engine._l.length) {
      return false
    }

    for (let i = 0; i < len; ++i) {
      const item1 = this._l[i]
      const item2 = engine._l[i]
      if (item1.length !== item2.length) {
        return false
      }
      const total = item1.length
      for (let j = 0; j < total; ++j) {
        if (!this.compareCMDs(item1[j], item2[j])) {
          return false
        }
      }
    }
    return true
  }

  /**
   * string description
   * @return {string}
   */
  toString() {
    let string = ''
    this._l.forEach((cmds, qubit_id) => {
      string += `Qubit ${qubit_id} : `
      cmds.forEach((command) => {
        string += `${command.toString()}, `
      })
      string = `${string.substring(0, string.length - 2)}\n`
    })
    return string
  }
}

/**
 * @class DummyEngine
   @desc DummyEngine used for testing.
    The DummyEngine forwards all commands directly to next engine.
    If this.is_last_engine == true it just discards all gates.
    By setting save_commands == true all commands get saved as a
    list in this.received_commands. Elements are appended to this
    list so they are ordered according to when they are received.
 */
export class DummyEngine extends BasicEngine {
  /**
   * @constructor
   * @param {boolean} saveCommands default is false
   */
  constructor(saveCommands = false) {
    super()
    this.saveCommands = saveCommands
    this.receivedCommands = []
  }

  isAvailable() {
    return true
  }

  receive(commandList) {
    if (this.saveCommands) {
      this.receivedCommands = this.receivedCommands.concat(commandList)
    }

    if (!this.isLastEngine) {
      this.send(commandList)
    }
  }
}
