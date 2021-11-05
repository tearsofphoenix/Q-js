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
import { BasicEngine } from './basics'
import { FastForwardingGate } from '../ops/basics';
import { FlushGate } from '../ops/gates'
import { instanceOf } from '../libs/util'
import { NotMergeable } from '../meta/error';


/**
 * @class LocalOptimizer
 * @desc is a compiler engine which optimizes locally (merging
rotations, cancelling gates with their inverse) in a local window of user-
defined size.

    It stores all commands in a dict of lists, where each qubit has its own
gate pipeline. After adding a gate, it tries to merge / cancel successive
gates using the get_merged and getInverse functions of the gate (if
    available). For examples, see BasicRotationGate. Once a list corresponding
to a qubit contains >=m gates, the pipeline is sent on to the next engine.
 */
export default class LocalOptimizer extends BasicEngine {
  /**
   * @constructor
   * @param {number} m Number of gates to cache per qubit, before sending on the first gate.
   */
  constructor(m = 5) {
    super()
    this._l = {} // dict of lists containing operations for each qubit
    this._m = m // wait for m gates before sending on
  }

  /**
   * Send n gate operations of the qubit with index idx to the next engine.
   * @param idx qubit index
   * @param n command position in qubit idx's command list
   */
  sendQubitPipeline(idx: number, n: number) {
    if (typeof idx !== 'number') {
      idx = parseInt(idx, 10)
    }
    // temporary label for readability
    const il = this._l[idx]
    const count = Math.min(n, il.length)

    // loop over first n operations
    // send all gates before n-qubit gate for other qubits involved
    // --> recursively call send_helper
    for (let i = 0; i < count; ++i) {
      const other_involved_qubits = []
      il[i].allQubits.forEach(qreg => qreg.forEach((qb) => {
        if (qb.id !== idx) {
          other_involved_qubits.push(qb)
        }
      }))

      other_involved_qubits.forEach((qb) => {
        const idLooper = qb.id
        try {
          let gateloc = 0
          // find location of this gate within its list
          while (!this._l[idLooper][gateloc].equal(il[i])) {
            gateloc += 1
          }

          gateloc = this.optimize(idLooper, gateloc)
          // flush the gates before the n-qubit gate
          this.sendQubitPipeline(idLooper, gateloc)
          // delete the n-qubit gate, we're taking care of it
          // and don't want the other qubit to do so
          this._l[idLooper] = this._l[idLooper].slice(1)
        } catch (e) {
          console.log(e)
          console.log('Invalid qubit pipeline encountered (in the  process of shutting down?).')
        }
      })
      // all qubits that need to be flushed have been flushed
      // --> send on the n-qubit gate
      this.send([il[i]])
    }
    // n operations have been sent on --> resize our gate list
    this._l[idx] = this._l[idx].slice(n)
  }

  /**
    Return all indices of a command, each index corresponding to the
    command's index in one of the qubits' command lists.

    @param idx qubit index
    @param i command position in qubit idx's command list
    @param IDs IDs of all qubits involved in the command
  */
  getGateIndices(idx: number, i: number, IDs: number[]): number[] {
    if (typeof idx !== 'number') {
      idx = parseInt(idx, 10)
    }
    const N = IDs.length
    // 1-qubit gate: only gate at index i in list #idx is involved
    if (N === 1) {
      return [i]
    }

    // When the same gate appears multiple time, we need to make sure not to
    // match earlier instances of the gate applied to the same qubits. So we
    // count how many there are, and skip over them when looking in the
    // other lists.
    const cmd = this._l[idx][i]
    let num_identical_to_skip = 0
    this._l[idx].slice(0, i).forEach((prev_cmd) => {
      if (prev_cmd.equal(cmd)) {
        num_identical_to_skip += 1
      }
    })

    const indices: number[] = []
    IDs.forEach((Id) => {
      const identical_indices: number[] = []
      this._l[Id].forEach((c, j) => {
        if (c.equal(cmd)) {
          identical_indices.push(j)
        }
      })
      indices.push(identical_indices[num_identical_to_skip])
    })
    return indices
  }

  /**
  Try to merge or even cancel successive gates using the get_merged and
getInverse functions of the gate (see, e.g., BasicRotationGate).

    It does so for all qubit command lists.
   @param {number} idx
   @param {number} lim
   */
  optimize(idx, lim) {
    if (typeof idx !== 'number') {
      idx = parseInt(idx, 10)
    }
    // loop over all qubit indices
    let i = 0
    let new_gateloc = 0
    let limit = this._l[idx].length
    if (typeof lim !== 'undefined') {
      limit = lim
      new_gateloc = limit
    }

    while (i < limit - 1) {
      // can be dropped if two in a row are self-inverses
      const cmd = this._l[idx][i]
      const inv = cmd.getInverse()

      if (inv.equal(this._l[idx][i + 1])) {
        // determine index of this gate on all qubits
        const qubitids = []
        cmd.allQubits.forEach(sublist => sublist.forEach(qb => qubitids.push(qb.id)))
        const gid = this.getGateIndices(idx, i, qubitids)
        // check that there are no other gates between this and its
        // inverse on any of the other qubits involved
        let erase = true
        qubitids.forEach((looper, j) => {
          erase = inv.equal(this._l[looper][gid[j] + 1])
        })

        // drop these two gates if possible and goto next iteration
        if (erase) {
          let new_list = []
          qubitids.forEach((looper, j) => {
            new_list = this._l[looper].slice(0, gid[j]).concat(this._l[looper].slice(gid[j] + 2))
            this._l[looper] = new_list
          })
          i = 0
          limit -= 2
          continue
        }
      }
      // gates are not each other's inverses --> check if they're
      // mergeable
      try {
        const merged_command = this._l[idx][i].getMerged(this._l[idx][i + 1])
        // determine index of this gate on all qubits
        const qubitids = []
        const c = this._l[idx][i]
        c.allQubits.forEach(sublist => sublist.forEach(qb => qubitids.push(qb.id)))

        const gid = this.getGateIndices(idx, i, qubitids)

        let merge = true
        qubitids.forEach((looper, j) => {
          const m = this._l[looper][gid[j]].getMerged(this._l[looper][gid[j] + 1])
          merge = m.equal(merged_command)
        })
        if (merge) {
          qubitids.forEach((looper, j) => {
            this._l[looper][gid[j]] = merged_command
            const new_list = this._l[looper].slice(0, gid[j] + 1).concat(this._l[looper].slice(gid[j] + 2))
            this._l[looper] = new_list
          })
          i = 0
          limit -= 1
          continue
        }
      } catch (e) {
        if (!(e instanceof NotMergeable)) {
          throw e
        }
      }
      i += 1 // next iteration: look at next gate
    }
    return limit
  }


  /**
  Check whether a qubit pipeline must be sent on and, if so,
    optimize the pipeline and then send it on.
   */
  checkAndSend() {
    Object.keys(this._l).forEach((i) => {
      let v = this._l[i]
      let lastCMD = v.length > 0 ? v[v.length - 1] : {}
      let gateFlag = instanceOf(lastCMD.gate, FastForwardingGate)
      if (v.length >= this._m || (v.length > 0 && gateFlag)) {
        this.optimize(i)
        v = this._l[i]
        lastCMD = v.length > 0 ? v[v.length - 1] : {}
        gateFlag = instanceOf(lastCMD.gate, FastForwardingGate)

        if (v.length >= this._m && !gateFlag) {
          this.sendQubitPipeline(i, v.length - this._m + 1)
        } else if (v.length > 0 && gateFlag) {
          this.sendQubitPipeline(i, v.length)
        }
      }
    })
    const newDict = {}
    Object.keys(this._l).forEach((key) => {
      const v = this._l[key]
      if (v.length > 0) {
        newDict[key] = v
      }
    })

    this._l = newDict
  }

  /**
    Cache a command, i.e., inserts it into the command lists of all qubits involved.
    @param {Command} cmd
  */
  cacheCMD(cmd) {
    // are there qubit ids that haven't been added to the list?
    const ids = []
    cmd.allQubits.forEach(sublist => sublist.forEach(qubit => ids.push(qubit.id)))

    // add gate command to each of the qubits involved
    ids.forEach((ID) => {
      const v = this._l[ID]
      if (typeof v === 'undefined') {
        this._l[ID] = []
      }
      this._l[ID].push(cmd)
    })
    this.checkAndSend()
  }

  /**
    Receive commands from the previous engine and cache them.
    If a flush gate arrives, the entire buffer is sent on.
  */
  receive(commandList) {
    commandList.forEach((cmd) => {
      if (instanceOf(cmd.gate, FlushGate)) {
        Object.keys(this._l).forEach((idx) => {
          const v = this._l[idx]
          this.optimize(idx)
          this.sendQubitPipeline(idx, v.length)
        })

        const newDict = {}
        Object.keys(this._l).forEach((idx) => {
          const v = this._l[idx]
          if (v.length > 0) {
            newDict[idx] = v
          }
        })
        this._l = newDict
        assert(Object.keys(this._l).length === 0)
        this.send([cmd])
      } else {
        this.cacheCMD(cmd)
      }
    })
  }
}
