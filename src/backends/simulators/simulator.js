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
import math from 'mathjs'
import {BasicEngine} from '../../cengines/basics'
import SimulatorBackend from './jssim'
import CPPSimulatorBackend from './cppsim'

import {
  Allocate, AllocateQubitGate, Deallocate, DeallocateQubitGate, FlushGate, Measure, MeasureGate
} from '../../ops/gates';
import {BasicMathGate} from '../../ops/basics';
import TimeEvolution from '../../ops/timeevolution';
import { BasicQubit } from '../../types/qubit'
import { stringToArray } from '../../ops/qubitoperator'
import { LogicalQubitIDTag } from '../../meta/tag'
import {instanceOf} from '../../libs/util';
import {len, stringToBitArray} from '../../libs/polyfill';

/**
 * @class Simulator
 * @desc
Simulator is a compiler engine which simulates a quantum computer using
C++-based kernels.

    OpenMP is enabled and the number of threads can be controlled using the
OMP_NUM_THREADS environment variable, i.e.

    @example

export OMP_NUM_THREADS=4 # use 4 threads
export OMP_PROC_BIND=spread # bind threads to processors by spreading
 */
export default class Simulator extends BasicEngine {
  /**
   * @constructor
  Construct the C++/JavaScript-simulator object and initialize it with a
  random seed.

    @param {boolean} gate_fusion If true, gates are cached and only executed
once a certain gate-size has been reached (only has an effect
for the c++ simulator).
    @param {number} rnd_seed Random seed (uses random.randint(0, 4294967295) by default). Ignored currently!!!
    @param {boolean} forceSimulation if true, will force use cpp simulator

Example of gate_fusion Instead of applying a Hadamard gate to 5
qubits, the simulator calculates the kronecker product of the 1-qubit
gate matrices and then applies one 5-qubit gate. This increases
operational intensity and keeps the simulator from having to iterate
through the state vector multiple times. Depending on the system (and,
    especially, number of threads), this may or may not be beneficial.

    Note:
If the C++ Simulator extension was not built or cannot be found,
    the Simulator defaults to a Javascript implementation of the kernels.
    While this is much slower, it is still good enough to run basic
quantum algorithms.

    If you need to run large simulations, check out the tutorial in
the docs which gives futher hints on how to build the C++
extension.
   */
  constructor(gate_fusion = false, rnd_seed = null, forceSimulation = false) {
    super()
    if (!rnd_seed) {
      rnd_seed = Math.random()
    }

    if (!forceSimulation && CPPSimulatorBackend) {
      const S = CPPSimulatorBackend.Simulator
      this._simulator = new S(rnd_seed)
    } else {
      this._simulator = new SimulatorBackend(rnd_seed)
    }
    this._gate_fusion = gate_fusion
  }

  /**
  Specialized implementation of isAvailable: The simulator can deal
with all arbitrarily-controlled gates which provide a
gate-matrix (via gate.matrix) and acts on 5 or less qubits (not
counting the control qubits).

  @param {Command} cmd Command for which to check availability (single-qubit gate, arbitrary controls)

  @return {boolean} true if it can be simulated and false otherwise.
  */
  isAvailable(cmd) {
    if (instanceOf(cmd.gate, [MeasureGate, AllocateQubitGate, DeallocateQubitGate, BasicMathGate, TimeEvolution])) {
      return true
    }
    try {
      const m = cmd.gate.matrix
      // Allow up to 5-qubit gates
      const [row, col] = m.size()
      if (row > 2 ** 5 || col > 2 ** 5) return false
      return true
    } catch (e) {
      return false
    }
  }

  /**
    Converts a qureg from logical to mapped qubits if there is a mapper.
    @param {Array.<Qubit>|Qureg} qureg Logical quantum bits
  */
  convertLogicalToMappedQureg(qureg) {
    const {mapper} = this.main
    if (mapper) {
      const mapped_qureg = []
      qureg.forEach((qubit) => {
        const v = mapper.currentMapping[qubit.id]
        if (typeof v === 'undefined') {
          throw new Error('Unknown qubit id. '
          + 'Please make sure you have called '
          + 'eng.flush().')
        }
        const new_qubit = new BasicQubit(qubit.engine, mapper.currentMapping[qubit.id])
        mapped_qureg.push(new_qubit)
      })
      return mapped_qureg
    }
    return qureg
  }

  /**
  Get the expectation value of qubit_operator w.r.t. the current wave
function represented by the supplied quantum register.

    @param {QubitOperator} qubitOperator  Operator to measure.
    @param {Array.<Qubit>|Qureg} qureg  Quantum bits to measure.

    @return Expectation value

Note:
    Make sure all previous commands (especially allocations) have
passed through the compilation chain (call main.flush() to
make sure).

Note:
    If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
    the qureg argument.

    @throws {Error} If `qubit_operator` acts on more qubits than present in the `qureg` argument.
   */
  getExpectationValue(qubitOperator, qureg) {
    qureg = this.convertLogicalToMappedQureg(qureg)
    const operator = []
    const num_qubits = qureg.length
    Object.keys(qubitOperator.terms).forEach((term) => {
      const keys = stringToArray(term)
      if (term !== '' && keys[keys.length - 1][0] >= num_qubits) {
        throw new Error('qubit_operator acts on more qubits than contained in the qureg.')
      }
      operator.push([keys, qubitOperator.terms[term]])
    })
    return this._simulator.getExpectationValue(operator, qureg.map(qb => qb.id))
  }

  /**
  Apply a (possibly non-unitary) qubit_operator to the current wave
function represented by the supplied quantum register.

    @param {QubitOperator} qubitOperator  Operator to apply.
    @param {Array.<Qubit>|Qureg} qureg Quantum bits to which to apply the
operator.

    @throws {Error} If `qubit_operator` acts on more qubits than present in the `qureg` argument.

    Warning:
This function allows applying non-unitary gates and it will not
re-normalize the wave function! It is for numerical experiments
only and should not be used for other purposes.

    Note:
Make sure all previous commands (especially allocations) have
passed through the compilation chain (call main.flush() to
make sure).

Note:
    If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
    the qureg argument.
   */
  applyQubitOperator(qubitOperator, qureg) {
    qureg = this.convertLogicalToMappedQureg(qureg)
    const num_qubits = qureg.length
    const operator = []
    Object.keys(qubitOperator.terms).forEach((term) => {
      const keys = stringToArray(term)
      if (term !== '' && keys[keys.length - 1][0] >= num_qubits) {
        throw new Error('qubit_operator acts on more qubits than contained in the qureg.')
      }
      operator.push([keys, qubitOperator.terms[term]])
    })
    return this._simulator.applyQubitOperator(operator, qureg.map(qb => qb.id))
  }

  /**
  Return the probability of the outcome `bit_string` when measuring
the quantum register `qureg`.

    @param {number[]|string} bitString  Measurement outcome.
    @param {Qureg|Array.<Qubit>} qureg Quantum register.

    @returns {number} Probability of measuring the provided bit string.

    Note:
Make sure all previous commands (especially allocations) have
passed through the compilation chain (call main.flush() to
make sure).

Note:
    If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
    the qureg argument.
   */
  getProbability(bitString, qureg) {
    qureg = this.convertLogicalToMappedQureg(qureg)
    const bit_string = stringToBitArray(bitString)
    return this._simulator.getProbability(bit_string, qureg.map(qb => qb.id))
  }

  /**
  Return the probability amplitude of the supplied `bit_string`.
    The ordering is given by the quantum register `qureg`, which must
contain all allocated qubits.

   @param {number[]|string} bitString Computational basis state
   @param {Qureg|Array.<Qubit>} qureg Quantum register determining the
ordering. Must contain all allocated qubits.

    @returns {number}
Probability amplitude of the provided bit string.

    Note:
Make sure all previous commands (especially allocations) have
passed through the compilation chain (call main.flush() to
make sure).

Note:
    If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
    the qureg argument.
   */
  getAmplitude(bitString, qureg) {
    qureg = this.convertLogicalToMappedQureg(qureg)
    const bit_string = stringToBitArray(bitString)
    return this._simulator.getAmplitude(bit_string, qureg.map(qb => qb.id))
  }

  /**
  Set the wavefunction and the qubit ordering of the simulator.

    The simulator will adopt the ordering of qureg (instead of reordering
the wavefunction).

  @param {Complex[]} wavefunction  Array of complex amplitudes describing the wavefunction (must be normalized).
  @param {Qureg|Array.<Qubit>} qureg  Quantum register determining the ordering. Must contain all allocated qubits.

    Note:
Make sure all previous commands (especially allocations) have
passed through the compilation chain (call main.flush() to
make sure).

Note:
    If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
    the qureg argument.
   */
  setWavefunction(wavefunction, qureg) {
    qureg = this.convertLogicalToMappedQureg(qureg)
    this._simulator.setWavefunction(wavefunction, qureg.map(qb => qb.id))
  }

  /**
  Collapse a quantum register onto a classical basis state.

    @param {Qureg|Array.<Qubit>} qureg Qubits to collapse.
    @param {boolean[]} values  Measurement outcome for each of the qubits
in `qureg`.

    @throws {Error} If an outcome has probability (approximately) 0 or
if unknown qubits are provided (see note).

Note:
    Make sure all previous commands have passed through the
compilation chain (call main.flush() to make sure).

Note:
    If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
    the qureg argument.
   */
  collapseWavefunction(qureg, values) {
    qureg = this.convertLogicalToMappedQureg(qureg)
    return this._simulator.collapseWavefunction(qureg.map(qb => qb.id), values)
  }

  /**
  Access the ordering of the qubits and the state vector directly.

    This is a cheat function which enables, e.g., more efficient
evaluation of expectation values and debugging.

    @return {Array}
A tuple where the first entry is a dictionary mapping qubit
indices to bit-locations and the second entry is the corresponding
state vector.

    Note:
Make sure all previous commands have passed through the
compilation chain (call main.flush() to make sure).

Note:
    If there is a mapper present in the compiler, this function
DOES NOT automatically convert from logical qubits to mapped
qubits.
   */
  cheat() {
    return this._simulator.cheat()
  }

  /**
  Handle all commands, i.e., call the member functions of the C++-
simulator object corresponding to measurement, allocation/
deallocation, and (controlled) single-qubit gate.

    @param {Command} cmd Command to handle.

    @throws Error If a non-single-qubit gate needs to be processed (which should never happen due to isAvailable).
   */
  handle(cmd) {
    if (cmd.gate instanceof TimeEvolution) {
      const {terms} = cmd.gate.hamiltonian
      const op = []
      Object.keys(terms).forEach(k => {
        const v = terms[k]
        op.push([stringToArray(k), v])
      })
      const t = cmd.gate.time
      const qubitids = cmd.qubits[0].map(qb => qb.id)
      const ctrlids = cmd.controlQubits.map(qb => qb.id)
      this._simulator.emulateTimeEvolution(op, t, qubitids, ctrlids)
    } else if (cmd.gate.equal(Measure)) {
      assert(cmd.controlCount === 0)
      const ids = []
      cmd.qubits.forEach(qr => qr.forEach(qb => ids.push(qb.id)))
      const out = this._simulator.measureQubits(ids)
      let i = 0
      cmd.qubits.forEach((qr) => {
        qr.forEach((qb) => {
          // Check if a mapper assigned a different logical id
          let logical_id_tag
          cmd.tags.forEach((tag) => {
            if (tag instanceof LogicalQubitIDTag) {
              logical_id_tag = tag
            }
          })
          if (logical_id_tag) {
            qb = new BasicQubit(qb.engine, logical_id_tag.logical_qubit_id)
          }
          this.main.setMeasurementResult(qb, out[i])
          i += 1
        })
      })
    } else if (cmd.gate.equal(Allocate)) {
      const ID = cmd.qubits[0][0].id
      this._simulator.allocateQubit(ID)
    } else if (cmd.gate.equal(Deallocate)) {
      const ID = cmd.qubits[0][0].id
      this._simulator.deallocateQubit(ID)
    } else if (cmd.gate instanceof BasicMathGate) {
      const qubitids = []
      cmd.qubits.forEach((qr) => {
        const latest = []
        qubitids.push(latest)
        qr.forEach((qb) => {
          latest.push(qb.id)
        })
      })

      const math_fun = cmd.gate.getMathFunction(cmd.qubits)
      this._simulator.emulateMath(math_fun, qubitids, cmd.controlQubits.map(qb => qb.id))
    } else if (len(cmd.gate.matrix) <= 2 ** 5) {
      const matrix = cmd.gate.matrix
      const ids = []
      cmd.qubits.forEach(qr => qr.forEach(qb => ids.push(qb.id)))
      if (2 ** ids.length !== len(matrix)) {
        throw new Error(`Simulator: Error applying ${cmd.gate.toString()} gate: ${math.log(len(cmd.gate.matrix), 2)}-qubit gate applied to ${ids.length} qubits.`)
      }
      const m = math.clone(matrix)._data
      const ctrls = cmd.controlQubits.map(qb => qb.id)
      this._simulator.applyControlledGate(m, ids, ctrls)
      if (!this._gate_fusion) {
        this._simulator.run()
      }
    } else {
      throw new Error('This simulator only supports controlled k-qubit'
      + ' gates with k < 6!\nPlease add an auto-replacer'
      + ' engine to your list of compiler engines.')
    }
  }

  /**
  Receive a list of commands from the previous engine and handle them
(simulate them classically) prior to sending them on to the next
engine.

    @param {Command[]} commandList List of commands to execute on the simulator.
   */
  receive(commandList) {
    commandList.forEach((cmd) => {
      if (!(cmd.gate instanceof FlushGate)) {
        this.handle(cmd)
      } else {
        this._simulator.run()
      }
      if (!this.isLastEngine) {
        this.send([cmd])
      }
    })
  }
}
