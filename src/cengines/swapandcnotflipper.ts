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

import assert from 'assert'
import { BasicEngine, ForwarderEngine } from './basics'
import { NOT, H, Swap } from '../ops/gates'
import { All } from '../ops/metagates'
import { instanceOf, tuple } from '../libs/util';
import { CNOT } from '../ops/shortcuts'
import CommandModifier from './cmdmodifier'
import { ICommand } from '@/interfaces';

/**
 * @class SwapAndCNOTFlipper
 * @desc
Flips CNOTs and translates Swaps to CNOTs where necessary.

    Warning:
This engine assumes that CNOT and Hadamard gates are supported by
the following engines.

    Warning:
This engine cannot be used as a backend.
 */
export default class SwapAndCNOTFlipper extends BasicEngine {
  connectivity: {};
  /**
   * @param connectivity Set of tuples (c, t) where if (c, t) is an
   *   element of the set means that a CNOT can be performed between the physical ids (c, t)
   *   with c being the control and t being the target qubit.
   */
  constructor(connectivity: Set<string> | Set<number[]>) {
    super()
    if (connectivity instanceof Set) {
      const newMap = {}
      connectivity.forEach(v => newMap[v] = 1);
      this.connectivity = newMap;
    } else {
      this.connectivity = connectivity;
    }
  }

  /**
   * Check if the IBM backend can perform the Command cmd and return true if so.
   * @param cmd The command to check
   */
  isAvailable(cmd: ICommand) {
    return this.isSwap(cmd) || this.next.isAvailable(cmd)
  }

  isCNOT(cmd: ICommand) {
    return instanceOf(cmd.gate, NOT.constructor) && cmd.controlCount === 1
  }

  isSwap(cmd: ICommand) {
    const n = cmd.controlCount
    const f = cmd.gate.equal(Swap)
    return n === 0 && f
  }

  needsFlipping(cmd: ICommand) {
    if (!this.isCNOT(cmd)) {
      return false
    }

    const target = cmd.qubits[0][0].id
    const control = cmd.controlQubits[0].id
    const key = [control, target]
    const rkey = [target, control]
    const v = this.connectivity[key];
    const rv = this.connectivity[rkey];
    const is_possible = typeof v !== 'undefined'
    if (!is_possible && typeof rv === 'undefined') {
      throw new Error(`The provided connectivity does not allow to execute the CNOT gate ${cmd.toString()}.`)
    }
    return !is_possible
  }

  sendCNOT(cmd: ICommand, control, target, flip = false) {
    const cmd_mod = (command: ICommand) => {
      command.tags = cmd.tags.slice(0).concat(command.tags)
      command.engine = this.main
      return command
    }

    // We'll have to add all meta tags before sending on
    const cmd_mod_eng = new CommandModifier(cmd_mod)
    cmd_mod_eng.next = this.next
    cmd_mod_eng.main = this.main
    // forward everything to the command modifier
    const forwarder_eng = new ForwarderEngine(cmd_mod_eng)
    target[0].engine = forwarder_eng
    control[0].engine = forwarder_eng
    if (flip) {
      // flip the CNOT using Hadamard gates:
      new All(H).or(control.concat(target))
      CNOT.or(tuple(target, control))
      new All(H).or(control.concat(target))
    } else {
      CNOT.or(tuple(control, target))
    }
  }

  /**
     Receives a command list and if the command is a CNOT gate, it flips
    it using Hadamard gates if necessary; if it is a Swap gate, it
    decomposes it using 3 CNOTs. All other gates are simply sent to the next engine.
    @param commandList list of commands to receive.
   */
  receive(commandList: ICommand[]) {
    commandList.forEach((cmd) => {
      if (this.needsFlipping(cmd)) {
        this.sendCNOT(cmd, cmd.controlQubits, cmd.qubits[0], true)
      } else if (this.isSwap(cmd)) {
        const qubits = [];
        cmd.qubits.forEach(qr => qr.forEach(qb => qubits.push(qb)))
        const ids = qubits.map(qb => qb.id)
        assert(ids.length === 2)
        let key = ids
        let v = this.connectivity[key]
        let control
        let target
        if (typeof v !== 'undefined') {
          control = [qubits[0]]
          target = [qubits[1]]
        } else {
          key = key.slice(0).reverse()
          v = this.connectivity[key]
          if (typeof v !== 'undefined') {
            control = [qubits[1]]
            target = [qubits[0]]
          } else {
            throw new Error(`The provided connectivity does not allow to execute the Swap gate ${cmd.toString()}.`)
          }
        }

        this.sendCNOT(cmd, control, target)
        this.sendCNOT(cmd, target, control, true)
        this.sendCNOT(cmd, control, target)
      } else {
        this.next.receive([cmd])
      }
    })
  }
}
