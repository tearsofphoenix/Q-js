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
import {BasicEngine} from '../../cengines/basics'
import Gates, {
  Allocate, Barrier, Deallocate, FlushGate, H, Measure, NOT, Rx, Ry, Rz, S, T, Y, Z
} from '../../ops/gates'
import {LogicalQubitIDTag} from '../../meta/tag';
import IBMHTTPClient from './ibmhttpclient'
import {instanceOf} from '../../libs/util'
import '../../ops/metagates'

const {Tdag, Sdag} = Gates
/**
 * @class IBMBackend
 * @desc
The IBM Backend class, which stores the circuit, transforms it to JSON
QASM, and sends the circuit through the IBM API.
 */
export default class IBMBackend extends BasicEngine {
  /**
   * @constructor
  @param {{use_hardware: boolean, num_runs: number, verbose: boolean, user: string, password: string, device: string, retrieve_execution: ?string}} args
    use_hardware: If true, the code is run on the IBM quantum chip (instead of using the IBM simulator)
    num_runs: Number of runs to collect statistics. (default is 1024)
    verbose: If true, statistics are printed, in addition to the measurement result being registered (at the end of the circuit).
    user: IBM Quantum Experience user name
    password: IBM Quantum Experience password
    device: Device to use ('ibmqx4', or 'ibmqx5') if use_hardware is set to true. Default is ibmqx4.
    retrieve_execution: Job ID to retrieve instead of re-running the circuit (e.g., if previous run timed out).
  */
  constructor(...args) {
    super()
    this._reset()
    this._errors = []
    let use_hardware = false
    let num_runs = 1024
    let verbose = false
    let user = null
    let password = null
    let device = 'ibmqx4'
    let retrieve_execution = null

    if (typeof args[0] === 'object') {
      const obj = args[0]
      use_hardware = use_hardware || obj.use_hardware
      num_runs = num_runs || obj.num_runs
      verbose = verbose || obj.verbose
      user = user || obj.user
      password = password || obj.password
      device = device || obj.device
      retrieve_execution = retrieve_execution || obj.retrieve_execution
    } else {
      [use_hardware, num_runs, verbose, user, password, device, retrieve_execution] = args
    }

    num_runs = num_runs || 1024
    device = device || 'ibmqx4'
    if (use_hardware) {
      this.device = device
    } else {
      this.device = 'simulator'
    }
    this._num_runs = num_runs
    this._verbose = verbose
    this._user = user
    this._password = password
    this._probabilities = {}
    this.qasm = ''
    this._measured_ids = []
    this._allocated_qubits = new Set()
    this._retrieve_execution = retrieve_execution
  }

  /**
  Return true if the command can be executed.

    The IBM quantum chip can do X, Y, Z, T, Tdag, S, Sdag,
    rotation gates, barriers, and CX / CNOT.

    @param {Command} cmd Command for which to check availability
    @return {boolean}
   */
  isAvailable(cmd) {
    const g = cmd.gate
    const controlCount = cmd.controlCount
    if (g.equal(NOT) && controlCount <= 1) {
      return true
    }
    if (controlCount === 0) {
      const set = [T, Tdag, S, Sdag, H, Y, Z]
      if (set.includes(g)) {
        return true
      }
      if (g instanceof Rx || g instanceof Ry || g instanceof Rz) {
        return true
      }
    }
    const set = [Measure, Allocate, Deallocate, Barrier]
    if (set.includes(g)) {
      return true
    }
    return false
  }

  // Reset all temporary variables (after flush gate).
  _reset() {
    this._clear = true
    this._measured_ids = []
  }

  /**
Temporarily store the command cmd.

  Translates the command and stores it in a local variable (this._cmds).

  @param {Command} cmd Command to store
  */
  _store(cmd) {
    if (this._clear) {
      this._probabilities = {}
      this._clear = false
      this.qasm = ''
      this._allocated_qubits = new Set()
    }

    const {gate} = cmd

    if (gate.equal(Allocate)) {
      this._allocated_qubits.add(cmd.qubits[0][0].id)
      return
    }

    if (gate.equal(Deallocate)) {
      return
    }

    if (gate.equal(Measure)) {
      assert(cmd.qubits.length === 1 && cmd.qubits[0].length === 1)
      const qb_id = cmd.qubits[0][0].id
      let logical_id
      for (let i = 0; i < cmd.tags.length; ++i) {
        const t = cmd.tags[i]
        if (t instanceof LogicalQubitIDTag) {
          logical_id = t.logical_qubit_id
          break
        }
      }
      assert(typeof logical_id !== 'undefined')
      this._measured_ids.push(logical_id)
    } else if (gate === NOT && cmd.controlCount === 1) {
      const ctrl_pos = cmd.controlQubits[0].id
      const qb_pos = cmd.qubits[0][0].id
      this.qasm += `\ncx q[${ctrl_pos}], q[${qb_pos}];`
    } else if (gate === Barrier) {
      const qb_pos = []
      cmd.qubits.forEach(qr => qr.forEach(qb => qb_pos.push(qb.id)))
      this.qasm += '\nbarrier '
      let qb_str = ''
      qb_pos.forEach((pos) => {
        qb_str += `q[${pos}]`
      })

      this.qasm += `${qb_str.substring(0, qb_str.length - 2)};`
    } else if (instanceOf(gate, [Rx, Ry, Rz])) {
      assert(cmd.controlCount === 0)
      const qb_pos = cmd.qubits[0][0].id
      const u_strs = {
        Rx: a => `u3(${a}, -pi/2, pi/2)`,
        Ry: a => `u3(${a}, 0, 0)`,
        Rz: a => `u1(${a})`
      }
      const gateASM = u_strs[gate.toString().substring(0, 2)](gate.angle)
      this.qasm += `\n${gateASM} q[${qb_pos}];`
    } else {
      if (cmd.controlCount !== 0) {
        console.log(187, cmd.toString())
      }
      assert(cmd.controlCount === 0)
      const key = gate.toString()
      const v = IBMBackend.gateNames[key]
      let gate_str
      if (typeof v !== 'undefined') {
        gate_str = v
      } else {
        gate_str = key.toLowerCase()
      }

      const qb_pos = cmd.qubits[0][0].id
      this.qasm += `\n${gate_str} q[${qb_pos}];`
    }
  }


  /**
  Return the physical location of the qubit with the given logical id.

    @param {number} qbID ID of the logical qubit whose position should be returned.
   */
  _logicalToPhysical(qbID) {
    assert(!!this.main.mapper)
    const mapping = this.main.mapper.currentMapping
    const v = mapping[qbID]
    if (typeof v === 'undefined') {
      throw new Error(`Unknown qubit id ${qbID}. Please make sure 
      eng.flush() was called and that the qubit 
      was eliminated during optimization.`)
    }
    return v
  }

  /**
  Return the list of basis states with corresponding probabilities.

    The measured bits are ordered according to the supplied quantum
register, i.e., the left-most bit in the state-string corresponds to
the first qubit in the supplied quantum register.

    Warning:
Only call this function after the circuit has been executed!

    @param {Array.<Qubit>|Qureg} qureg Quantum register determining the order of the qubits.

    @return {Object} Dictionary mapping n-bit strings to probabilities.

    @throws {Error} If no data is available (i.e., if the circuit has
not been executed). Or if a qubit was supplied which was not
present in the circuit (might have gotten optimized away).
   */
  getProbabilities(qureg) {
    if (Object.keys(this._probabilities).length === 0) {
      throw new Error('Please, run the circuit first!')
    }

    const probability_dict = {}

    this._probabilities.forEach((state) => {
      const mapped_state = []
      for (let i = 0; i < qureg.length; ++i) {
        mapped_state.push('0')
      }

      for (let i = 0; i < qureg.length; ++i) {
        mapped_state[i] = state[this._logicalToPhysical(qureg[i].id)]
      }
      const probability = this._probabilities[state]
      probability_dict[mapped_state.join('')] = probability
    })

    return probability_dict
  }

  /**
  Run the circuit.

    Send the circuit via the IBM API (JSON QASM) using the provided user
data / ask for username & password.
   */
  async run() {
    if (this.qasm.length === 0) {
      return
    }
    // finally: add measurements (no intermediate measurements are allowed)
    this._measured_ids.forEach((measured_id) => {
      const qb_loc = this.main.mapper.currentMapping[measured_id]
      this.qasm += `measure q[${qb_loc}] -> c[${qb_loc}];`
    })
    let max_qubit_id = -1
    this._allocated_qubits.forEach((id) => {
      if (id > max_qubit_id) {
        max_qubit_id = id
      }
    })

    const nq = max_qubit_id + 1
    const qasm = `\ninclude \"qelib1.inc\";\nqreg q[${nq}];\ncreg c[${nq}];${this.qasm}`
    const info = {}
    info.qasms = [{qasm}]
    info.shots = this._num_runs
    info.maxCredits = 5
    info.backend = {'name': this.device}
    const infoJSON = JSON.stringify(info)

    try {
      let res
      if (!this._retrieve_execution) {
        res = await IBMHTTPClient.send(infoJSON, this.device, this._user, this._password, this._num_runs, this._verbose)
      } else {
        res = await IBMHTTPClient.retrieve(this.device, this._user, this._password, this._retrieve_execution)
      }
      const {counts} = res.data
      // Determine random outcome
      const P = Math.random()
      let p_sum = 0.0
      let measured = ''
      Object.keys(counts).forEach((state) => {
        const probability = counts[state] * 1.0 / this._num_runs
        if (Array.isArray(state)) {
          state = state.slice(0).reverse()
          state = ''.join(state)
        }
        p_sum += probability
        let star = ''
        if (p_sum >= P && measured === '') {
          measured = state
          star = '*'
        }
        this._probabilities[state] = probability
        if (this._verbose && probability > 0) {
          console.log(`${state.toString()} with p = ${probability.toString()}${star}`)
        }
      })

      class QB {
        constructor(ID) {
          this.id = ID
        }
      }

      // register measurement result
      this._measured_ids.forEach((ID) => {
        const location = this._logicalToPhysical(ID)
        const result = measured[location]
        this.main.setMeasurementResult(new QB(ID), result)
      })
      this._reset()
    } catch (e) {
      throw new Error('Failed to run the circuit. Aborting.')
    }
  }

  /**
  Receives a command list and, for each command, stores it until
completion.

    @param {Command[]} commandList List of commands to execute
   */
  receive(commandList) {
    commandList.forEach((cmd) => {
      if (!(cmd.gate instanceof FlushGate)) {
        this._store(cmd)
      } else {
        this.run()
          .then(() => this._reset())
          .catch((e) => {
            console.log(e)
            this.addError(e)
          }).finally(() => {
            if (this.didRunCallback) {
              this.didRunCallback()
            }
          })
      }
    })
  }

  /**
   * @return {Error[]}
   */
  get errors() {
    return this._errors
  }

  addError(error) {
    this._errors.push(error)
  }

  /**
   * @return {function}
   */
  get didRunCallback() {
    return this._didRunCallback
  }

  /**
   * @param {function} callback
   */
  set didRunCallback(callback) {
    this._didRunCallback = callback
  }
}

IBMBackend.gateNames = {
  [Tdag.toString()]: 'tdg',
  [Sdag.toString()]: 'sdg'
}
