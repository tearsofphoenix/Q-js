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

Basic compiler engine: All compiler engines are derived from this class.
It provides basic functionality such as qubit allocation/deallocation and
functions that provide information about the engine's position (e.g., next
engine).

This information is provided by the MainEngine, which initializes all
further engines.

    Attributes:
next_engine (BasicEngine): Next compiler engine (or the back-end).
main_engine (MainEngine): Reference to the main compiler engine.
is_last_engine (bool): True for the last engine, which is the back-end.
 */
import {Qureg, Qubit} from '../types/qubit'
import {Command} from '../ops/command'
import {Allocate, Deallocate} from '../ops/gates'
import {DirtyQubitTag} from '../meta/tag'
import { LastEngineError } from '../meta/error'

export class BasicEngine {
  /*
    Initialize the basic engine.

    Initializes local variables such as _next_engine, _main_engine, etc. to
None.
     */
  constructor() {
    this.isLastEngine = false
  }

  /*
    Default implementation of is_available:
    Ask the next engine whether a command is available, i.e.,
    whether it can be executed by the next engine(s).

    Args:
cmd (Command): Command for which to check availability.

    Returns:
True if the command can be executed.

    Raises:
LastEngineException: If is_last_engine is True but is_available
is not implemented.
     */
  isAvailable(cmd) {
    if (!this.isLastEngine) {
      return this.next.isAvailable(cmd)
    }
    throw new LastEngineError('Should not be last!')
  }

  /*
    Return a new qubit as a list containing 1 qubit object (quantum
register of size 1).

Allocates a new qubit by getting a (new) qubit id from the MainEngine,
    creating the qubit object, and then sending an AllocateQubit command
down the pipeline. If dirty=True, the fresh qubit can be replaced by
a pre-allocated one (in an unknown, dirty, initial state). Dirty qubits
must be returned to their initial states before they are deallocated /
freed.

    All allocated qubits are added to the MainEngine's set of active
qubits as weak references. This allows proper clean-up at the end of
the Python program (using atexit), deallocating all qubits which are
still alive. Qubit ids of dirty qubits are registered in MainEngine's
dirty_qubits set.

    Args:
dirty (bool): If True, indicates that the allocated qubit may be
dirty (i.e., in an arbitrary initial state).

Returns:
    Qureg of length 1, where the first entry is the allocated qubit.
     */
  allocateQubit(dirty = false) {
    const new_id = this.main.getNewQubitID()
    const qubit = new Qubit(this, new_id)
    const qb = new Qureg(qubit)
    const cmd = new Command(this, Allocate, [qb])
    if (dirty) {
      if (this.isMetaTagSupported(DirtyQubitTag)) {
        cmd.tags.push(new DirtyQubitTag())
        this.main.dirtyQubits.add(qubit.id)
      }
    }
    this.main.activeQubits.add(qubit)
    this.send([cmd])
    return qb
  }

  /*
    Allocate n qubits and return them as a quantum register, which is a
list of qubit objects.

    Args:
n (int): Number of qubits to allocate
Returns:
    Qureg of length n, a list of n newly allocated qubits.
     */
  allocateQureg(n) {
    const array = []
    for (let i = 0; i < n; ++i) {
      let q = this.allocateQubit()[0]
      array.push(q)
    }
    return new Qureg(array)
  }

  /*
    Deallocate a qubit (and sends the deallocation command down the
pipeline). If the qubit was allocated as a dirty qubit, add
DirtyQubitTag() to Deallocate command.

    Args:
qubit (BasicQubit): Qubit to deallocate.
    Raises:
ValueError: Qubit already deallocated. Caller likely has a bug.
     */
  deallocateQubit(qubit) {
    if (qubit.id === -1) {
      throw new Error('Already deallocated.')
    }
    const is_dirty = this.main.dirtyQubits.has(qubit.id)
    const cmds = [new Command(this, Deallocate, [new Qureg([qubit])], [], is_dirty ? [new DirtyQubitTag()] : [])]
    this.send(cmds)
  }

  autoDeallocateQubits() {
    const copy = new Set(this.main.activeQubits)
    for (const qb of copy) {
      if (qb.engine === this) {
        // need to
        qb.deallocate()
      }
    }
  }
  /*
    Check if there is a compiler engine handling the meta tag

Args:
    engine: First engine to check (then iteratively calls
getNextEngine)
meta_tag: Meta tag class for which to check support

Returns:
    supported (bool): True if one of the further compiler engines is a
meta tag handler, i.e., engine.is_meta_tag_handler(meta_tag)
returns True.
     */
  isMetaTagSupported(metaTag) {
    let engine = this
    try {
      while (true) {
        if (typeof engine.isMetaTagHandler === 'function' && engine.isMetaTagHandler(metaTag)) {
          return true
        }
        engine = engine.next
      }
    } catch (e) {
      return false
    }
  }

  /*
    Forward the list of commands to the next engine in the pipeline.
     */
  send(commandList) {
    this.next.receive(commandList)
  }

  receive() {
    // TODO
  }
}

/*
A ForwarderEngine is a trivial engine which forwards all commands to the
next engine.

    It is mainly used as a substitute for the MainEngine at lower levels such
that meta operations still work (e.g., with Compute).

 */
export class ForwarderEngine extends BasicEngine {
  /*
    Initialize a ForwarderEngine.

    Args:
engine (BasicEngine): Engine to forward all commands to.
cmd_mod_fun (function): Function which is called before sending a
command. Each command cmd is replaced by the command it
returns when getting called with cmd.
     */
  constructor(engine, cmdModFunc) {
    super()
    this.main = engine.main
    this.next = engine
    if (!cmdModFunc) {
      cmdModFunc = x => x
    }
    this.cmdModFunc = cmdModFunc
  }

  receive(commandList) {
    const newCommandList = commandList.map(cmd => this.cmdModFunc(cmd))
    this.send(newCommandList)
  }
}
