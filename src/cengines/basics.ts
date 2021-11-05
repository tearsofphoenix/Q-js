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
import { ICommand, IEngine, IQubit, CommandModifyFunction, IQureg } from '@/interfaces';
import { Qureg, Qubit } from '../meta/qubit'
import Command from '../ops/command'
import { Allocate, Deallocate } from '../ops/gates'
import { DirtyQubitTag } from '../meta/tag'
import { LastEngineError } from '../meta/error'

/**
 * @class BasicEngine
 * @abstract
 * @desc
Basic compiler engine: All compiler engines are derived from this class.
It provides basic functionality such as qubit allocation/deallocation and
functions that provide information about the engine's position (e.g., next
engine).

This information is provided by the MainEngine, which initializes all
further engines.

    Attributes:
next_engine (BasicEngine): Next compiler engine (or the back-end).
main_engine (MainEngine): Reference to the main compiler engine.
is_last_engine (bool): true for the last engine, which is the back-end.
 */
export class BasicEngine implements IEngine {
  isLastEngine: boolean = false;
  main: IEngine;
  next: IEngine;
  dirtyQubits = new Set<number>();
  activeQubits = new Set<IQubit>();
  /**
   * @constructor
   Initialize the basic engine.

    Initializes local variables such as _next_engine, _main_engine, etc. to None.
  */
  constructor() {
    this.isLastEngine = false
  }

  /**
    Default implementation of isAvailable:
    Ask the next engine whether a command is available, i.e.,
    whether it can be executed by the next engine(s).

    @param cmd Command for which to check availability.
    @return true if the command can be executed.

    @throws If is_last_engine is true but isAvailable is not implemented.
     */
  isAvailable(cmd: ICommand) {
    if (!this.isLastEngine) {
      return this.next.isAvailable(cmd)
    }
    throw new LastEngineError('Should not be last!')
  }

  /**
    Return a new qubit as a list containing 1 qubit object (quantum
register of size 1).

Allocates a new qubit by getting a (new) qubit id from the MainEngine,
    creating the qubit object, and then sending an AllocateQubit command
down the pipeline. If dirty=true, the fresh qubit can be replaced by
a pre-allocated one (in an unknown, dirty, initial state). Dirty qubits
must be returned to their initial states before they are deallocated /
freed.

    All allocated qubits are added to the MainEngine's set of active
qubits as weak references. This allows proper clean-up at the end of
the JavaScript program (using atexit), deallocating all qubits which are
still alive. Qubit ids of dirty qubits are registered in MainEngine's
dirty_qubits set.

    @param {boolean} dirty If true, indicates that the allocated qubit may be
    dirty (i.e., in an arbitrary initial state).

    @return {Qureg} Qureg of length 1, where the first entry is the allocated qubit.
  */
  allocateQubit(dirty = false): IQureg {
    const new_id = this.main.getNewQubitID();
    const qubit = new Qubit(this, new_id);
    const qb = new Qureg(qubit);
    const cmd = new Command(this, Allocate, [qb]);
    if (dirty) {
      if (this.isMetaTagSupported(DirtyQubitTag)) {
        cmd.tags.push(new DirtyQubitTag());
        this.main.dirtyQubits.add(qubit.id);
      }
    }
    this.main.activeQubits.add(qubit);
    this.send([cmd]);
    return qb;
  }

  /**
    Allocate n qubits and return them as a quantum register, which is a
list of qubit objects.

    @param n Number of qubits to allocate
    @return Qureg of length n, a list of n newly allocated qubits.
  */
  allocateQureg(n: number): Qureg {
    const array = []
    for (let i = 0; i < n; ++i) {
      const q = this.allocateQubit()[0]
      array.push(q)
    }
    return new Qureg(array)
  }

  getNewQubitID(): number {
    throw new Error('Not implemented');
    return -1;
  }

  getMeasurementResult(qubit: IQubit): boolean {
    throw new Error('Not implemented');
    return false;
  }

  /**
    Deallocate a qubit (and sends the deallocation command down the
pipeline). If the qubit was allocated as a dirty qubit, add
DirtyQubitTag() to Deallocate command.

    @param {BasicQubit} qubit Qubit to deallocate.
    @throws {Error} Qubit already deallocated. Caller likely has a bug.
  */
  deallocateQubit(qubit: IQubit) {
    if (qubit.id === -1) {
      throw new Error('Already deallocated.')
    }
    const is_dirty = this.main.dirtyQubits.has(qubit.id)
    const cmds = [new Command(this, Deallocate, [new Qureg([qubit])], [], is_dirty ? [new DirtyQubitTag()] : [])]
    this.send(cmds)
  }

  /**
    Check if there is a compiler engine handling the meta tag

    @param {function} metaTag Meta tag class for which to check support

    @return {boolean} true if one of the further compiler engines is a
meta tag handler, i.e., engine.is_meta_tag_handler(meta_tag)
returns true.
     */
  isMetaTagSupported(metaTag: Function) {
    let engine: IEngine = this as any;
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

  /**
    Forward the list of commands to the next engine in the pipeline.
  */
  send(commandList: ICommand[]) {
    this.next.receive(commandList)
  }

  receive(commandList: ICommand[]) {
    // do nothing
  }
}

/**
 * @class ForwarderEngine
 * @desc
    A ForwarderEngine is a trivial engine which forwards all commands to the next engine.

    It is mainly used as a substitute for the MainEngine at lower levels such
that meta operations still work (e.g., with Compute).
 */
export class ForwarderEngine extends BasicEngine {
  cmdModFunc: CommandModifyFunction;
  /**
   * @constructor

    @param engine Engine to forward all commands to.
    @param cmdModFunc Function which is called before sending a
command. Each command cmd is replaced by the command it
returns when getting called with cmd.
     */
  constructor(engine: IEngine, cmdModFunc?: CommandModifyFunction) {
    super()
    this.main = engine.main
    this.next = engine
    if (!cmdModFunc) {
      cmdModFunc = x => x
    }
    this.cmdModFunc = cmdModFunc
  }

  receive(commandList: ICommand[]) {
    const newCommandList = commandList.map(cmd => this.cmdModFunc(cmd))
    this.send(newCommandList)
  }

  /**
   * internal usaged for deallocate qubits after `Uncompute`
   */
  autoDeallocateQubits() {
    const copy = new Set(this.main.activeQubits)
    copy.forEach((qb) => {
      if (qb.engine === this) {
        //TODO: need to
        (qb as any).deallocate()
      }
    })
  }
}
