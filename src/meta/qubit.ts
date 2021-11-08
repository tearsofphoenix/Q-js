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
import { IEngine, IQubit, IQureg } from '@/interfaces';
/**
    This file defines BasicQubit, Qubit, WeakQubit and Qureg.

    A Qureg represents a list of Qubit or WeakQubit objects.
    Qubit represents a (logical-level) qubit with a unique index provided by the
    MainEngine. Qubit objects are automatically deallocated if they go out of
    scope and intented to be used within Qureg objects in user code.

 @example
      const eng = new MainEngine()
      const qubit = eng.allocateQubit()

    qubit is a Qureg of size 1 with one Qubit object which is deallocated once
    qubit goes out of scope.

    WeakQubit are used inside the Command object and are not automatically deallocated.
*/
import { arrayEqual } from '../libs/polyfill'

/**
 * @class BasicQubit
 * @desc
 * objects represent qubits. They have an id and a reference to the owning engine.
 */
export class BasicQubit implements IQubit {
  engine: IEngine;
  id: number;
  /**
   *  @constructor
   *  Initialize a BasicQubit object.
   *  @param engine Owning engine / engine that created the qubit
   *  @param idx Unique index of the qubit referenced by this qubit
   */
  constructor(engine: IEngine, idx: number) {
    /**
     * @type {BasicEngine}
     */
    this.engine = engine
    this.id = idx
  }

  /**
    Return string representation of this qubit.
   @return {string}
   */
  toString() {
    return `${this.id}`
  }

  /**
   *
   * @return {string}
   */
  inspect() {
    return this.toString()
  }

  /**
    Access the result of a previous measurement and return false / true (0 / 1)
  */
  toBoolean(): boolean {
    return Boolean(this.engine.main.getMeasurementResult(this));
  }

  /**
   * @return {number}
   */
  toNumber() {
    return this.toBoolean() ? 1 : 0
  }

  /**
   * Compare with other qubit (Returns true if equal id and engine).
   *
   * @param other BasicQubit to which to compare this one
   */
  equal(other: IQubit) {
    if (this === other) {
      return true
    }
    return other instanceof BasicQubit && this.id === other.id && this.engine === other.engine
  }

  weakCopy() {
    return new BasicQubit(this.engine, this.id)
  }

  deallocate() {

  }

  static copyArray(array: IQubit[]): IQubit[] {
    return array.map(i => i.weakCopy())
  }
}

/**
 * @class Qubit
 * @desc
    Represents a (logical-level) qubit with a unique index provided by the
    MainEngine. Once the qubit goes out of scope (and is garbage-collected),
    it deallocates itself automatically, allowing automatic resource management.

    Thus the qubit is not copyable only returns a reference to the same object.
 */
export class Qubit extends BasicQubit {
  deallocate() {
    // If a user directly calls this function, then the qubit gets id == -1
    // but stays in active_qubits as it is not yet deleted, hence remove
    // it manually (if the garbage collector calls this function, then the
    // WeakRef in active qubits is already gone):
    if (this.id === -1) {
      return
    }

    try {
      const qubits = this.engine.main.activeQubits
      if (qubits.has(this)) {
        qubits.delete(this)
      }
      this.engine.deallocateQubit(this)
    } catch (e) {
      throw e
    } finally {
      this.id = -1
    }
  }

  /**
    Non-copyable (returns reference to self).
    Note:
      To prevent problems with automatic deallocation, qubits are not copyable!
  */
  copy() {
    return this
  }
}

/**
 * Quantum register class.
Simplifies accessing measured values for single-qubit registers (no []-access necessary)
 and enables pretty-printing of general quantum registers).
 */
export class Qureg extends Array implements IQureg {
  /**
   * a little different with `Array`: when pass an array as argument, will copy the passed array
   */
  constructor(...args: any[]) {
    const arg0 = args[0]
    if (Array.isArray(arg0)) {
      super(...arg0)
    } else {
      super(...args)
    }
  }

  /**
   * test if two Quregs are equal
   */
  equal(other: IQubit | IQureg): boolean {
    if (other instanceof Qureg) {
      return arrayEqual(this, other, (x: any, y: any) => x.equal(y))
    }
    return false
  }

  /**
   * only supported when `length === 1`, use the qubit value as qureg value
   * @throws will throw when `length !== 1`
   */
  toBoolean() {
    if (this.length === 1) {
      return this[0].toBoolean()
    }
    throw new Error('qureg.toBoolean(): Quantum register contains more "\n'
      + '"than 1 qubit. Use qureg[idx].toBoolean() instead.')
  }

  /**
   * number representation
   */
  toNumber() {
    return this.toBoolean() ? 1 : 0;
  }

  /**
   * add qubits from `other`, return a new Qureg instance
   */
  add(other: IQubit[] | Qureg): Qureg {
    const array = this.concat(other)
    return new Qureg(array)
  }

  /**
   * string description
   */
  toString() {
    if (this.length === 0) return 'Qureg[]'
    const ids = this.slice(1).map(({ id }) => id)
    ids.push(null) // Forces a flush on last loop iteration.

    const out_list: string[] = []
    let start_id = this[0].id
    let count = 1
    ids.forEach((qubit_id) => {
      if (qubit_id === start_id + count) {
        count += 1
      } else {
        // TODO
        if (count > 1) {
          out_list.push(`${start_id}-${start_id + count - 1}`)
        } else {
          out_list.push(`${start_id}`)
        }
        start_id = qubit_id
        count = 1
      }
    })

    return `Qureg[${out_list.join(', ')}]`
  }

  /**
   * deallocate all qubit, then clear the qureg
   */
  deallocate() {
    this.forEach(qubit => qubit.deallocate())
    this.length = 0
  }

  get engine() {
    return this[0].engine
  }

  set engine(newEngine) {
    this.forEach(looper => looper.engine = newEngine)
  }
}
