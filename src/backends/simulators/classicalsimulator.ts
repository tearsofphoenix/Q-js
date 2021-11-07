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
import bigInt, { BigInteger } from 'big-integer'
import { BasicEngine } from '@/cengines/basics'
import { BasicQubit } from '@/meta/qubit'
import {
  Allocate,
  AllocateQubitGate, Deallocate,
  DeallocateQubitGate,
  FlushGate,
  Measure,
  MeasureGate,
  XGate
} from '@/ops/gates'
import { BasicMathGate } from '@/ops/basics'
import { LogicalQubitIDTag } from '@/meta/tag'
import { instanceOf } from '@/libs/util'
import { ICommand, IQubit, IQureg } from '@/interfaces';

/**
 * @desc
A simple introspective simulator that only permits classical operations.

  Allows allocation, deallocation, measuring (no-op), flushing (no-op),
  controls, NOTs, and any BasicMathGate. Supports reading/writing directly
from/to bits and registers of bits.
 */
export default class ClassicalSimulator extends BasicEngine {
  _state: BigInteger;
  _bit_positions: {
    [key: number]: number;
  }
  constructor() {
    super();
    this._state = bigInt(0);
    this._bit_positions = {}
  }

  /**
  Converts a qubit from a logical to a mapped qubit if there is a mapper.

  @param qubit Logical quantum bit
   */
  convertLogicalToMappedQubit(qubit: IQubit) {
    const { mapper } = this.main
    if (mapper) {
      const v = mapper.currentMapping![qubit.id];
      if (typeof v === 'undefined') {
        throw new Error(`Unknown qubit id. Please make sure you have called 'eng.flush()'.`);
      }
      return new BasicQubit(qubit.engine, v);
    } else {
      return qubit;
    }
  }

  /**
  Reads a bit.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

  @param qubit The bit to read.

  @return 0 if the target bit is off, 1 if it's on.
   */
  readBit(qubit: IQubit) {
    qubit = this.convertLogicalToMappedQubit(qubit)
    return this.readMappedBit(qubit)
  }

  // Internal use only. Does not change logical to mapped qubits.
  readMappedBit(mappedQubit: IQubit) {
    const p = this._bit_positions[mappedQubit.id]
    return this._state.shiftRight(p).and(1).toJSNumber()
  }

  /**
  Resets/sets a bit to the given value.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

    @param qubit The bit to write.
    @param value Writes 1 if this value is truthy, else 0.
  */
  writeBit(qubit: IQubit, value: boolean | number) {
    qubit = this.convertLogicalToMappedQubit(qubit)
    this.writeMappedBit(qubit, value)
  }

  // Internal use only. Does not change logical to mapped qubits.
  writeMappedBit(mappedQubit: IQubit, value: boolean | number) {
    const p = this._bit_positions[mappedQubit.id]
    if (value) {
      this._state = this._state.or(bigInt(1).shiftLeft(p))
    } else {
      const temp = bigInt(1).shiftLeft(p).not()
      this._state = this._state.and(temp)
    }
  }

  /**
  Returns a mask, to compare against the state, with bits from the
register set to 1 and other bits set to 0.

  @param qureg The bits whose positions should be set.

  @return The mask.
   */
  mask(qureg: IQureg) {
    let t = 0
    qureg.forEach(q => t |= 1 << this._bit_positions[q.id])
    return t
  }

  /**
  Reads a group of bits as a little-endian integer.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

  @param qureg The group of bits to read, in little-endian order.

  @return Little-endian register value.
   */
  readRegister(qureg: IQureg) {
    const new_qureg: IQubit[] = [];
    qureg.forEach(qubit => new_qureg.push(this.convertLogicalToMappedQubit(qubit)))
    return this.readMappedRegister(new_qureg);
  }

  readMappedRegister(mappedQureg: IQubit[]) {
    let t = 0
    mappedQureg.forEach((_, i) => t |= this.readMappedBit(mappedQureg[i]) << i)
    return t
  }

  /**
  Sets a group of bits to store a little-endian integer value.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

   @param qureg  The bits to write, in little-endian order.
   @param value  The integer value to store. Must fit in the register.
   */
  writeRegister(qureg: IQureg, value: number) {
    const new_qureg: IQubit[] = []
    qureg.forEach(qubit => new_qureg.push(this.convertLogicalToMappedQubit(qubit)))
    this.writeMappedRegister(new_qureg, value)
  }

  writeMappedRegister(mappedQureg: IQubit[], value: number) {
    if (value < 0 || value >= (2 ** mappedQureg.length)) {
      throw new Error("Value won't fit in register.")
    }
    mappedQureg.forEach((_, i) => this.writeMappedBit(mappedQureg[i], (value >> i) & 1))
  }

  isAvailable(cmd: ICommand) {
    return instanceOf(cmd.gate, [MeasureGate, AllocateQubitGate, DeallocateQubitGate, BasicMathGate, FlushGate, XGate])
  }

  receive(commandList: ICommand[]) {
    commandList.forEach((cmd) => {
      this.handle(cmd)
    })
    if (!this.isLastEngine) {
      this.send(commandList)
    }
  }

  handle(cmd: ICommand) {
    if (cmd.gate instanceof FlushGate) {
      return
    }

    if (cmd.gate.equal(Measure)) {
      cmd.qubits.forEach(qr => qr.forEach((qb) => {
        // Check if a mapper assigned a different logical id
        let logical_id_tag: LogicalQubitIDTag | undefined = undefined;
        cmd.tags.forEach((tag) => {
          if (tag instanceof LogicalQubitIDTag) {
            logical_id_tag = tag
          }
        })
        let log_qb = qb;
        if (logical_id_tag) {
          log_qb = new BasicQubit(qb.engine, (logical_id_tag as LogicalQubitIDTag).logicalQubitID);
        }
        this.main.setMeasurementResult!(log_qb, Boolean(this.readMappedBit(qb)));
      }))
      return
    }

    if (cmd.gate.equal(Allocate)) {
      const newID = cmd.qubits[0][0].id
      this._bit_positions[newID] = Object.keys(this._bit_positions).length
      return
    }
    if (cmd.gate.equal(Deallocate)) {
      const old_id = cmd.qubits[0][0].id
      const pos = this._bit_positions[old_id]
      const low = (1 << pos) - 1
      this._state = this._state.and(low).or(this._state.shiftRight(1).and(~low))
      const newpos = {}
      Object.keys(this._bit_positions).forEach((k) => {
        const b = this._bit_positions[k]
        if (b < pos) {
          newpos[k] = b
        } else {
          newpos[k] = b - 1
        }
      })
      this._bit_positions = newpos
      return
    }

    const controls_mask = this.mask(cmd.controlQubits as any);
    const meets_controls = this._state.and(controls_mask).eq(bigInt(controls_mask))

    if (cmd.gate instanceof XGate) {
      assert(cmd.qubits.length === 1 && cmd.qubits[0].length === 1)
      const target = cmd.qubits[0][0]
      if (meets_controls) {
        this.writeMappedBit(target, !this.readMappedBit(target))
      }
      return
    }

    if (cmd.gate instanceof BasicMathGate) {
      if (meets_controls) {
        const ins = cmd.qubits.map(reg => this.readMappedRegister(reg))
        const outs = cmd.gate.getMathFunction(cmd.qubits)(ins)
        cmd.qubits.forEach((reg, index) => {
          const out = outs[index]
          this.writeMappedRegister(reg, out & ((1 << reg.length) - 1))
        })
      }
      return
    }
    throw new Error('Only support alloc/dealloc/measure/not/math ops.')
  }
}
