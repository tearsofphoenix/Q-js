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
Contains a (slow) JavaScript simulator.

    Please compile the c++ simulator for large-scale simulations.
*/
import assert from 'assert'
import {
  abs, add, complex, divide, index, clone, im, re, exp,
  matrix, multiply, ones, zeros, sqrt,
  Complex,
} from 'mathjs'
import {
  matrixDot,
  matrixRangeAssign,
  matrixRangeIndicesAssign,
} from '@/libs/util'
import {
  len, setEqual, complexVectorDot
} from '@/libs/polyfill'
import { stringToArray } from '@/ops/qubitoperator'

/**
 * @desc
NodeJS implementation of a quantum computer simulator.

    This Simulator can be used as a backup if compiling the c++ simulator is
not an option (for some reason). It has the same features but is much
slower, so please consider building the c++ version for larger experiments.
 */
export default class Simulator {
  _state: number[];
  _map: {
    [key: number]: number;
  }
  _numQubits: number;
  constructor() {
    // ignore seed
    this._state = ones(1) as number[];
    this._map = {}
    this._numQubits = 0
  }

  /**
  Return the qubit index to bit location map and the corresponding state
  vector.

    This function can be used to measure expectation values more efficiently (emulation).

    A tuple where the first entry is a dictionary mapping qubit indices
    to bit-locations and the second entry is the corresponding state
    vector
   */
  cheat() {
    return [this._map, this._state._data.slice(0)]
  }

  /**
  Measure the qubits with IDs ids and return a list of measurement
outcomes (true/false).

    @param ids List of qubit IDs to measure.

    @return List of measurement results (containing either true or false).
   */
  measureQubits(ids: number[]): boolean[] {
    const P = Math.random()
    let val = 0.0
    let i_picked = 0
    while (val < P && i_picked < len(this._state)) {
      val = add(val, abs(this._getState(i_picked) || complex(0, 0)) ** 2) as number;
      i_picked += 1
    }

    i_picked -= 1

    const res: boolean[] = []
    const pos = ids.map((ID) => {
      res.push(false)
      return this._map[ID]
    })

    let mask = 0
    val = 0

    pos.forEach((looper, i) => {
      res[i] = ((i_picked >> looper) & 1) === 1
      mask |= (1 << looper)
      val |= ((res[i] & 1) << looper)
    })

    let nrm = 0.0
    this._state.forEach((looper, _i) => {
      const i = _i[0]
      if ((mask & i) !== val) {
        this._setState(i, 0.0)
      } else {
        const tmp = abs(looper)
        nrm = add(nrm, multiply(tmp, tmp)) as number;
      }
    })
    // normalize
    const scale = 1.0 / Math.sqrt(nrm)
    this._state = multiply(this._state, scale)
    return res
  }

  /**
  Allocate a qubit.

    @param ID ID of the qubit which is being allocated.
   */
  allocateQubit(ID: number) {
    this._map[ID] = this._numQubits
    this._numQubits += 1
    this._state.resize([1 << this._numQubits], 0)
  }

  /**
  Return the classical value of a classical bit (i.e., a qubit which has
been measured / uncomputed).

   @param ID ID of the qubit of which to get the classical value.
   @param tolerance Tolerance for numerical errors when determining
whether the qubit is indeed classical.

    @throws {Error} If the qubit is in a superposition, i.e., has not been measured / uncomputed.
*/
  getClassicalValue(ID: number, tolerance: number = 1.e-10): number {
    const pos = this._map[ID]
    let up = false
    let down = false

    for (let i = 0; i < len(this._state); i += (1 << (pos + 1))) {
      for (let j = 0; j < (1 << pos); ++j) {
        if (abs(this._getState(i + j)) > tolerance) {
          up = true
        }

        if (abs(this._getState(i + j + (1 << pos)) || 0) > tolerance) {
          down = true
        }

        if (up && down) {
          throw new Error('Qubit has not been measured / '
            + 'uncomputed. Cannot access its '
            + 'classical value and/or deallocate a '
            + 'qubit in superposition!')
        }
      }
    }

    return down ? 1 : 0;
  }

  /**
  Deallocate a qubit (if it has been measured / uncomputed).

   @param ID ID of the qubit to deallocate.

   @throws If the qubit is in a superposition, i.e., has not been measured / uncomputed.
   */
  deallocateQubit(ID: number) {
    const pos = this._map[ID]
    const cv = this.getClassicalValue(ID)
    const newstate = zeros(1 << (this._numQubits - 1))
    let k = 0
    for (let i = (1 << pos) * cv; i < len(this._state); i += 1 << (pos + 1)) {
      matrixRangeIndicesAssign(newstate, k, k + (1 << pos), this._state, i)
      k += (1 << pos)
    }

    const newmap = {}
    Object.keys(this._map).forEach((key) => {
      const value = this._map[key]
      if (value > pos) {
        newmap[key] = value - 1
      } else if (parseInt(key, 10) !== ID) {
        newmap[key] = value
      }
    })

    this._map = newmap
    this._state = newstate
    this._numQubits -= 1
  }

  /**
  Get control mask from list of control qubit IDs.

    @return A mask which represents the control qubits in binary.
   */
  getControlMask(ctrlids: number[]) {
    let mask = 0
    ctrlids.forEach((ctrlid) => {
      const ctrlpos = this._map[ctrlid]
      mask |= (1 << ctrlpos)
    })
    return mask
  }

  /**
  Emulate a math function (e.g., BasicMathGate).

    @param f Function executing the operation to emulate.
    @param qubitIDs List of lists of qubit IDs to which
        the gate is being applied. Every gate is applied to a tuple of
        quantum registers, which corresponds to this 'list of lists'.
    @param ctrlQubitIDs List of control qubit ids.
   */
  emulateMath(f: Function, qubitIDs: number[][], ctrlQubitIDs: number[]) {
    const mask = this.getControlMask(ctrlQubitIDs)
    // determine qubit locations from their IDs
    const qb_locs: number[][] = [];
    qubitIDs.forEach((qureg) => {
      qb_locs.push([])
      qureg.forEach((qubitID) => {
        qb_locs[qb_locs.length - 1].push(this._map[qubitID])
      })
    })

    const newstate = zeros(len(this._state))

    this._state.forEach((looper, _i) => {
      const i = _i[0]
      if ((mask & i) === mask) {
        const argList = zeros(qb_locs.length)
        qb_locs.forEach((qb, qri) => {
          qb.forEach((il, qi) => {
            argList[qri] |= (((i >> il) & 1) << qi)
          })
        })

        const res = f(argList)
        let newI = i

        qb_locs.forEach((qb, qri) => {
          qb.forEach((il, qi) => {
            if (!(((newI >> il) & 1) == ((res[qri] >> qi) & 1))) {
              newI ^= (1 << il)
            }
          })
        })
        newstate.subset(index(newI), looper)
      } else {
        newstate.subset(index(i), looper)
      }
    })

    this._state = newstate
  }

  /**
  Return the expectation value of a qubit operator w.r.t. qubit ids.

    @param {Array.<Array>} termsArray Operator Array (see QubitOperator.terms)
    @param {number[]} IDs List of qubit ids upon which the operator acts.

    @return Expectation value
   */
  getExpectationValue(termsArray: T[][], IDs: number[]) {
    let expectation = 0.0
    const current_state = clone(this._state)
    termsArray.forEach(([term, coefficient]) => {
      this.applyTerm(term, IDs)
      const tmp = complexVectorDot(current_state, this._state)
      const delta = multiply(coefficient, tmp)
      expectation = add(expectation, delta)
      this._state = clone(current_state)
    })
    if (im(expectation) === 0) {
      return re(expectation)
    }
    return expectation
  }

  /**
  Apply a (possibly non-unitary) qubit operator to qubits.

    @param termsArray Operator array (see QubitOperator.terms)
    @param IDs List of qubit ids upon which the operator acts.
  */
  applyQubitOperator<T>(termsArray: T[][], IDs: number[]) {
    let new_state = zeros(len(this._state))
    const current_state = clone(this._state)
    termsArray.forEach(([term, coefficient]) => {
      this.applyTerm(term, IDs)
      const temp = multiply(this._state, coefficient)
      new_state = add(new_state, temp)
      this._state = clone(current_state)
    })
    this._state = new_state
  }

  /**
  Return the probability of the outcome `bit_string` when measuring
  the qubits given by the list of ids.
  
    @param bitString Measurement outcome.
    @param IDs List of qubit ids determining the ordering.
  
    @return Probability of measuring the provided bit string.
  
    @throws {Error} if an unknown qubit id was provided.
   */
  getProbability(bitString: number[], IDs: number[]) {
    const n = IDs.length
    for (let i = 0; i < n; ++i) {
      const id = IDs[i]
      const v = this._map[id]
      if (typeof v === 'undefined') {
        throw new Error('get_probability(): Unknown qubit id. '
          + 'Please make sure you have called '
          + 'eng.flush().')
      }
    }
    let mask = 0
    let bit_str = 0
    for (let i = 0; i < n; ++i) {
      mask |= (1 << this._map[IDs[i]])
      bit_str |= (bitString[i] << this._map[IDs[i]])
    }

    let probability = 0.0

    this._state.forEach((val, _i) => {
      const i = _i[0]
      if ((i & mask) === bit_str) {
        const e = val
        probability += re(e) ** 2 + im(e) ** 2
      }
    })
    return probability
  }

  _getState(i: number) {
    return this._state.subset(index(i))
  }

  _setState(i: number, value: number) {
    this._state.subset(index(i), value)
  }

  /**
  Return the probability amplitude of the supplied `bit_string`.
    The ordering is given by the list of qubit ids.
  
   @param {boolean[]|number[]} bitString Computational basis state
   @param {number[]} IDs List of qubit ids determining the ordering. Must contain all allocated qubits.
  
    @return Probability amplitude of the provided bit string.
  
    @throws {Error} if the second argument is not a permutation of all allocated qubits.
   */
  getAmplitude(bitString: number[], IDs: number[]): number {
    const s1 = new Set(IDs)
    const s2 = new Set(Object.keys(this._map).map(k => parseInt(k, 10)))
    if (!setEqual(s1, s2)) {
      throw new Error('The second argument to get_amplitude() must'
        + ' be a permutation of all allocated qubits. '
        + 'Please make sure you have called '
        + 'eng.flush().')
    }
    let index = 0
    IDs.forEach((item, i) => {
      item = parseInt(item, 10)
      index |= (bitString[i] << this._map[item])
    })
    const ret = this._getState(index)
    return ret
  }

  /**
  Applies exp(-i*time*H) to the wave function, i.e., evolves under
  the Hamiltonian H for a given time. The terms in the Hamiltonian
  are not required to commute.
  
    This function computes the action of the matrix exponential using
  ideas from Al-Mohy and Higham, 2011.
  TODO: Implement better estimates for s.
  
   @param terms_dict Operator dictionary (see QubitOperator.terms) defining the Hamiltonian.
   @param time Time to evolve for
   @param ids A list of qubit IDs to which to apply the evolution.
   @param ctrlids A list of control qubit IDs.
  */
  emulateTimeEvolution(terms_dict: number[][], time: number, ids: number[], ctrlids: number[]): void {
    // Determine the (normalized) trace, which is nonzero only for identity
    // terms:
    let tr = 0
    let sum = 0
    const newTerms: number[][] = [];
    terms_dict.forEach(([t, c]) => {
      if (t.length === 0) {
        tr += c
      } else {
        newTerms.push([t, c])
        sum += Math.abs(c)
      }
    })

    terms_dict = newTerms
    const op_nrm = abs(time) * sum
    // rescale the operator by s:
    const s = Math.floor(op_nrm + 1)
    const correction = exp(complex(0, -time * tr / (s * 1.0)))
    const output_state = clone(this._state)
    const mask = this.getControlMask(ctrlids)

    for (let i = 0; i < s; ++i) {
      let j = 0
      let nrm_change = 1.0
      let update;
      while (nrm_change > 1.e-12) {
        const coeff = divide(complex(0, -time), s * (j + 1))
        const current_state = clone(this._state)
        update = 0
        terms_dict.forEach(([t, c]) => {
          this.applyTerm(t, ids)
          this._state = multiply(this._state, c)

          update = add(this._state, update)
          // update += this._state
          this._state = clone(current_state)
        })
        update = multiply(update, coeff)
        this._state = update

        update.forEach((value, [m]) => {
          if ((m & mask) === mask) {
            const idx = index(m)
            const v = add(output_state.subset(idx), value)
            output_state.subset(idx, v)
          }
        })
        nrm_change = norm(update)
        j += 1
      }

      update.forEach((value, [k]) => {
        if ((k & mask) === mask) {
          const idx = index(k)
          const v = multiply(output_state.subset(idx), correction)
          output_state.subset(idx, v)
        }
      })
      this._state = clone(output_state)
    }
  }

  /**
   * leave it empty to keep same API with cpp simulator
   */
  run() {
    //
  }

  /**
  Applies a QubitOperator term to the state vector. (Helper function for time evolution & expectation)
  
    @param term One term of QubitOperator.terms
    @param ids Term index to Qubit ID mapping
    @param controlIDs Control qubit IDs
  */
  applyTerm(term, ids: number[], controlIDs: number[] = []) {
    const X = [[0.0, 1.0], [1.0, 0.0]]
    const Y = [[0.0, complex(0, -1)], [complex(0, 1), 0.0]]
    const Z = [[1.0, 0.0], [0.0, -1.0]]
    const gates = { X, Y, Z }
    term.forEach((local_op) => {
      const qb_id = ids[local_op[0]]
      this.applyControlledGate(gates[local_op[1]], [qb_id], controlIDs)
    })
  }

  /**
  Applies the k-qubit gate matrix m to the qubits with indices ids,
    using ctrlids as control qubits.
  
    @param m 2^k x 2^k complex matrix describing the k-qubit gate.
    @param ids A list containing the qubit IDs to which to apply the gate.
    @param ctrlids A list of control qubit IDs (i.e., the gate is only applied where these qubits are 1).
   */
  applyControlledGate(m: number[][], ids: number[], ctrlids: number[]): void {
    const mask = this.getControlMask(ctrlids)
    if (len(m) === 2) {
      const k = ids[0]
      const pos = this._map[k] || this._map[k.toString()]
      this._singleQubitGate(m, pos, mask)
    } else {
      const pos = ids.map(ID => this._map[ID])
      this._multiQubitGate(m, pos, mask)
    }
  }

  /**
  Applies the single qubit gate matrix m to the qubit at position `pos`
  using `mask` to identify control qubits.
  
    @param m 2x2 complex matrix describing the single-qubit gate.
    @param pos Bit-position of the qubit.
    @param mask Bit-mask where set bits indicate control qubits.
   */
  _singleQubitGate(m: number[][], pos: number, mask: number) {
    const kernel = (u, d, m) => {
      const ma = add
      const mm = multiply
      d = d || complex(0, 0)
      u = u || complex(0, 0)
      const r1 = ma(mm(u, m[0][0]), mm(d, m[0][1]))
      const r2 = ma(mm(u, m[1][0]), mm(d, m[1][1]))
      return [r1, r2]
    }

    const step = 1 << (pos + 1)
    for (let i = 0; i < len(this._state); i += step) {
      for (let j = 0; j < (1 << pos); ++j) {
        if (((i + j) & mask) === mask) {
          const id1 = i + j
          const id2 = id1 + (1 << pos)
          const [r1, r2] = kernel(this._getState(id1), this._getState(id2), m)
          this._setState(id1, r1)
          this._setState(id2, r2)
        }
      }
    }
  }

  /**
  Applies the k-qubit gate matrix m to the qubits at `pos`
  using `mask` to identify control qubits.
  
   @param m 2^k x 2^k complex matrix describing the k-qubit gate.
   @param pos List of bit-positions of the qubits.
   @param mask Bit-mask where set bits indicate control qubits.
   see follows the description in https://arxiv.org/abs/1704.01127
   */
  _multiQubitGate(m: number[][], pos: number[], mask: number) {
    const inactive = Object.keys(this._map).map(k => parseInt(k, 10)).filter(p => !pos.includes(p))

    const ma = matrix(m);
    const subvec = zeros(1 << pos.length) as number[];
    const subvec_idx = zeros(subvec.length) as number[];
    for (let c = 0; c < (1 << inactive.length); ++c) {
      // determine base index (state of inactive qubits)
      let base = 0
      for (let i = 0; i < inactive.length; ++i) {
        base |= ((c >> i) & 1) << inactive[i]
      }

      // check the control mask
      if (mask !== (base & mask)) {
        continue
      }
      // now gather all elements involved in mat-vec mul
      for (let x = 0; x < subvec_idx.length; ++x) {
        let offset = 0
        for (let i = 0; i < pos.length; ++i) {
          offset |= ((x >> i) & 1) << pos[i]
        }
        subvec_idx[x] = base | offset
        subvec[x] = this._getState(subvec_idx[x]) || complex(0, 0)
      }

      // perform mat-vec mul
      matrixRangeAssign(this._state, subvec_idx, matrixDot(ma, subvec))
    }
  }

  /**
  Set wavefunction and qubit ordering.
  
    @param wavefunction Array of complex amplitudes describing the wavefunction (must be normalized).
    @param ordering List of ids describing the new ordering of qubits
  (i.e., the ordering of the provided wavefunction).
   */
  setWavefunction(wavefunction: Complex[], ordering) {
    // wavefunction contains 2^n values for n qubits
    assert(wavefunction.length === (1 << ordering.length))

    // all qubits must have been allocated before
    const f1 = ordering.filter((Id) => {
      const v = this._map[Id]
      return typeof v !== 'undefined'
    }).length === ordering.length
    const f2 = len(this._map) === ordering.length
    if (!f1 || !f2) {
      throw new Error('set_wavefunction(): Invalid mapping provided.'
        + ' Please make sure all qubits have been '
        + 'allocated previously (call eng.flush()).')
    }

    this._state = matrix(wavefunction)
    const map = {}
    for (let i = 0; i < ordering.length; ++i) {
      map[ordering[i]] = i
    }
    this._map = map
  }

  /**
  Collapse a quantum register onto a classical basis state.
  
    @param {number[]} ids Qubit IDs to collapse.
    @param {boolean[]} values Measurement outcome for each of the qubit IDs in `ids`.
    @throws {Error} If probability of outcome is ~0 or unknown qubits are provided.
   */
  collapseWavefunction(ids, values) {
    assert(ids.length === values.length)

    // all qubits must have been allocated before
    const f1 = ids.filter(Id => typeof this._map[Id] !== 'undefined').length === ids.length
    if (!f1) {
      throw new Error('collapse_wavefunction(): Unknown qubit id(s)'
        + ' provided. Try calling eng.flush() before '
        + 'invoking this function.')
    }

    let mask = 0
    let val = 0
    ids.forEach((looper, i) => {
      const pos = this._map[looper]
      mask |= (1 << pos)
      val |= (Math.floor(values[i]) << pos)
    })

    let nrm = 0.0
    this._state.forEach((looper, _i) => {
      const i = _i[0]
      if ((mask & i) === val) {
        nrm += abs(this._getState(i)) ** 2
      }
    })

    if (nrm < 1.e-12) {
      throw new Error('collapse_wavefunction(): Invalid collapse! Probability is ~0.')
    }
    const inv_nrm = 1.0 / sqrt(nrm)
    this._state.forEach((looper, _i) => {
      const i = _i[0]
      if ((mask & i) !== val) {
        this._setState(i, 0)
      } else {
        this._setState(i, multiply(looper, inv_nrm))
      }
    })
  }
}
