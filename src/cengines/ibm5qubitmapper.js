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

import {permutations} from 'itertools'
import BasicMapperEngine from './basicmapper'
import { Allocate, FlushGate, NOT } from '../ops/gates'
import { getControlCount } from '../meta/control'
import IBMBackend from '../backends/ibm/ibm'

function stringKeyToIntArray(key) {
  return key.split(',').map(i => parseInt(i, 10))
}

// export const ibmqx4_connections = new Set([2, 1], [4, 2], [2, 0], [3, 2], [3, 4], [1, 0])
export const ibmqx4_connections = new Set(['2,1', '4,2', '2,0', '3,2', '3,4', '1,0'])

/**
Mapper for the 5-qubit IBM backend.

  Maps a given circuit to the IBM Quantum Experience chip.

  Note:
The mapper has to be run once on the entire circuit.

  Warning:
If the provided circuit cannot be mapped to the hardware layout
without performing Swaps, the mapping procedure
**raises an Exception**.
 */
export default class IBM5QubitMapper extends BasicMapperEngine {
  /**
Initialize an IBM 5-qubit mapper compiler engine.

  Resets the mapping.
   */
  constructor() {
    super();
    this.currentMapping = {}
    this._reset()
  }

  /**
  Check if the IBM backend can perform the Command cmd and return true
if so.

  @param
cmd (Command): The command to check
   */
  isAvailable(cmd) {
    return new IBMBackend().isAvailable(cmd)
  }

  // Reset the mapping parameters so the next circuit can be mapped.
  _reset() {
    this._cmds = []
    this._interactions = {}
  }

  /**
  Check if the command corresponds to a CNOT (controlled NOT gate).

@param
  cmd (Command): Command to check whether it is a controlled NOT
gate.
   */
  _isCNOT(cmd) {
    return (cmd.gate instanceof NOT.constructor && getControlCount(cmd) === 1)
  }

  /**
  Determines the cost of the circuit with the given mapping.

  @param
mapping (dict): Dictionary with key, value pairs where keys are
logical qubit ids and the corresponding value is the physical
location on the IBM Q chip.
  @returns
Cost measure taking into account CNOT directionality or None
if the circuit cannot be executed given the mapping.
   */
  determineCost(mapping) {
    let cost = 0
    const connections = ibmqx4_connections
    const keys = Object.keys(this._interactions)
    for (let i = 0; i < keys.length; ++i) {
      const tpl = stringKeyToIntArray(keys[i])
      const ctrl_id = tpl[0]
      const target_id = tpl[1]
      const ctrl_pos = mapping[ctrl_id]
      const target_pos = mapping[target_id]
      let k = `${ctrl_pos},${target_pos}`
      let v = connections.has(k)
      if (!v) {
        k = `${target_pos},${ctrl_pos}`
        v = connections.has(k)
        if (v) {
          cost += this._interactions[tpl]
        } else {
          return undefined
        }
      }
    }
    return cost
  }

  /**
  Runs all stored gates.

  @throws
Exception:
  If the mapping to the IBM backend cannot be performed or if
  the mapping was already determined but more CNOTs get sent
down the pipeline.
   */
  run() {
    if (Object.keys(this._currentMapping).length > 0 && Math.max(...Object.values(this._currentMapping)) > 4) {
      throw new Error('Too many qubits allocated. The IBM Q '
      + 'device supports at most 5 qubits and no '
      + 'intermediate measurements / '
      + 'reallocations.')
    }
    if (Object.keys(this._interactions).length > 0) {
      const logical_ids = Object.keys(this._currentMapping).map(k => parseInt(k, 10))
      let best_mapping = this._currentMapping
      let best_cost

      for (const physical_ids of permutations([0, 1, 2, 3, 4], logical_ids.length)) {
        const mapping = {}
        physical_ids.forEach((looper, i) => mapping[logical_ids[i]] = looper)
        const new_cost = this.determineCost(mapping)
        if (new_cost) {
          if (!best_cost || new_cost < best_cost) {
            best_cost = new_cost
            best_mapping = mapping
          }
        }
      }

      if (!best_cost) {
        throw new Error('Circuit cannot be mapped without using Swaps. Mapping failed.')
      }
      this._interactions = {}
      this.currentMapping = best_mapping
    }

    this._cmds.forEach(cmd => this.sendCMDWithMappedIDs(cmd))

    this._cmds = []
  }

  /**
  Store a command and handle CNOTs.

  @param
cmd (Command): A command to store
   */
  _store(cmd) {
    let target
    if (!(cmd.gate instanceof FlushGate)) {
      target = cmd.qubits[0][0].id
    }

    if (this._isCNOT(cmd)) {
      // CNOT encountered
      const ctrl = cmd.controlQubits[0].id
      const key = [ctrl, target]
      const v = this._interactions[key]
      if (typeof v === 'undefined') {
        this._interactions[key] = 0
      }
      this._interactions[key] += 1
    } else if (cmd.gate.equal(Allocate)) {
      const v = this._currentMapping[target]
      if (typeof v === 'undefined') {
        let newMax = 0
        if (Object.keys(this._currentMapping).length > 0) {
          newMax = Math.max(...Object.values(this._currentMapping)) + 1
        }
        this._currentMapping[target] = newMax
      }
    }
    this._cmds.push(cmd)
  }

  /**
  Receives a command list and, for each command, stores it until
completion.

  @param
command_list (list of Command objects): list of commands to
receive.

  @throws
Exception: If mapping the CNOT gates to 1 qubit would require
Swaps. The current version only supports remapping of CNOT
gates without performing any Swaps due to the large costs
associated with Swapping given the CNOT constraints.
   */
  receive(commandList) {
    commandList.forEach((cmd) => {
      this._store(cmd)
      if (cmd.gate instanceof FlushGate) {
        this.run()
        this._reset()
      }
    })
  }
}
