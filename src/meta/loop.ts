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

import { BasicEngine } from '../cengines/basics'
import { setEqual } from '../libs/polyfill';
import { dropEngineAfter, insertEngine } from './util';
import { Allocate, Deallocate } from '../ops/gates'
import { QubitManagementError } from './error';
import { ICommand, IEngine, IQubit } from '@/interfaces';

/**
 * @class LoopTag
 */
export class LoopTag {
  static loop_tag_id: number = 0;
  num: number;
  id: number;

  constructor(num: number) {
    this.num = num;
    this.id = LoopTag.loop_tag_id;
    LoopTag.loop_tag_id += 1;
  }

  equal(other: any) {
    return other instanceof LoopTag && other.id === this.id && this.num === other.num
  }
}

/**
 * @class LoopEngine
 * @desc
Stores all commands and, when done, executes them num times if no loop tag
handler engine is available.
    If there is one, it adds a loop_tag to the commands and sends them on.
 */
export class LoopEngine extends BasicEngine {
  _tag: LoopTag;
  _cmdList: ICommand[];
  _allocatedQubitIDs: Set<number>;
  _deallocatedQubitIDs: Set<number>;
  _nextEnginesSupportLoopTag: boolean;
  _refsToLocalQB: {
    [key: number]: IQubit[]
  }
  /**
    @param num Number of loop iterations.
   */
  constructor(num: number) {
    super()
    this._tag = new LoopTag(num);
    this._cmdList = [];
    this._allocatedQubitIDs = new Set();
    this._deallocatedQubitIDs = new Set();
    // key: qubit id of a local qubit, i.e. a qubit which has been allocated
    //     and deallocated within the loop body.
    // value: list contain reference to each weakref qubit with this qubit
    //        id either within control_qubits or qubits.
    this._refsToLocalQB = {};
    this._nextEnginesSupportLoopTag = false;
  }

  /**
  Apply the loop statements to all stored commands.
   Unrolls the loop if LoopTag is not supported by any of the following engines, i.e., if

   @example
    is_meta_tag_supported(next_engine, LoopTag) == false
   */
  run() {
    const error_message = ('\n Error. Qubits have been allocated in with '
      + 'Loop(eng, num) context,\n which have not '
      + 'explicitely been deallocated in the Loop context.\n'
      + 'Correct usage:\nLoop(eng, 5):\n'
      + '    qubit = eng.allocateQubit()\n'
      + '    ...\n'
      + '    qubit[0].deallocate()\n')

    if (!this._nextEnginesSupportLoopTag) {
      // Unroll the loop
      // Check that local qubits have been deallocated
      if (!setEqual(this._deallocatedQubitIDs, this._allocatedQubitIDs)) {
        throw new QubitManagementError(error_message)
      }
      if (this._allocatedQubitIDs.size === 0) {
        // No local qubits, just send the circuit num times
        for (let i = 0; i < this._tag.num; ++i) {
          this.send(this._cmdList.slice(0))
        }
      } else {
        // Ancilla qubits have been allocated in loop body
        // For each iteration, allocate and deallocate a new qubit and
        // replace the qubit id in all commands using it.
        for (let i = 0; i < this._tag.num; ++i) {
          if (i === 0) {
            this.send(this._cmdList.map(cmd => cmd.copy()))
          } else {
            // Change local qubit ids before sending them
            Object.values(this._refsToLocalQB).forEach(refs_loc_qubit => {
              const new_qb_id = this.main.getNewQubitID()
              refs_loc_qubit.forEach(qubitRef => qubitRef.id = new_qb_id)
            })
            this.send(this._cmdList.map(cmd => cmd.copy()))
          }
        }
      }
    } else if (!setEqual(this._deallocatedQubitIDs, this._allocatedQubitIDs)) {
      throw new QubitManagementError(error_message)
    }
  }

  /**
  Receive (and potentially temporarily store) all commands.

    Add LoopTag to all receiving commands and send to the next engine if
    a further engine is a LoopTag-handling engine. Otherwise store all
commands (to later unroll them). Check that within the loop body,
    all allocated qubits have also been deallocated. If loop needs to be
unrolled and ancilla qubits have been allocated within the loop body,
    then store a reference all these qubit ids (to change them when
unrolling the loop)

@param commandList List of commands to store and later
unroll or, if there is a LoopTag-handling engine, add the LoopTag.
   */
  receive(commandList: ICommand[]) {
    if (this._nextEnginesSupportLoopTag || this.next.isMetaTagSupported(LoopTag)) {
      // Loop tag is supported, send everything with a LoopTag
      // Don't check is_meta_tag_supported anymore
      this._nextEnginesSupportLoopTag = true
      if (this._tag.num === 0) {
        return
      }
      commandList.forEach((cmd) => {
        if (cmd.gate.equal(Allocate)) {
          this._allocatedQubitIDs.add(cmd.qubits[0][0].id)
        } else if (cmd.gate.equal(Deallocate)) {
          this._deallocatedQubitIDs.add(cmd.qubits[0][0].id)
        }
        cmd.tags.push(this._tag)
        this.send([cmd])
      })
    } else {
      // LoopTag is not supported, save the full loop body
      this._cmdList = this._cmdList.concat(commandList)
      // Check for all local qubits allocated and deallocated in loop body
      commandList.forEach((cmd) => {
        const qb = cmd.qubits[0][0]
        const qid = qb.id
        if (cmd.gate.equal(Allocate)) {
          this._allocatedQubitIDs.add(qid)
          this._refsToLocalQB[qid] = [qb]
        } else if (cmd.gate.equal(Deallocate)) {
          this._deallocatedQubitIDs.add(qid)
          this._refsToLocalQB[qid].push(qb)
        } else {
          cmd.controlQubits.forEach((ctrlQubit) => {
            const v = this._allocatedQubitIDs.has(ctrlQubit.id)
            if (v) {
              this._refsToLocalQB[ctrlQubit.id].push(ctrlQubit)
            }
          })
          cmd.qubits.forEach(qureg => qureg.forEach((qubit) => {
            if (this._allocatedQubitIDs.has(qubit.id)) {
              this._refsToLocalQB[qubit.id].push(qubit)
            }
          }))
        }
      })
    }
  }
}


/**
Loop n times over an entire code block.

    @example
    Loop(eng, 4, () => { })
    // [quantum gates to be executed 4 times]

Warning:
    If the code in the loop contains allocation of qubits, those qubits
have to be deleted prior to exiting the 'Loop()' context.

    This code is **NOT VALID**:

 @example

  Loop(eng, 4, () => {
    qb = eng.allocateQubit()
    H.or(qb) // qb is still available!!!
  })

The **correct way** of handling qubit (de-)allocation is as follows:

 @example
  Loop(eng, 4, () => {
    qb = eng.allocateQubit()
    ...
    qb.deallocate() // sends deallocate gate
  })
 */
export function Loop(engine: IEngine, num: number, func: Function) {
  if (typeof num === 'number' && num >= 0 && num % 1 === 0) {
    const _num = num
    let _loopEngine: LoopEngine;
    const enter = () => {
      if (_num !== 1) {
        _loopEngine = new LoopEngine(num)
        insertEngine(engine, _loopEngine)
      }
    }

    const exit = () => {
      if (_num !== 1) {
        _loopEngine.run();
        dropEngineAfter(engine)
      }
    }

    if (typeof func === 'function') {
      enter()
      try {
        func()
      } catch (e) {
        throw e
      } finally {
        exit()
      }
    }
  } else {
    throw new Error('invalid number of loop iterations')
  }
}
