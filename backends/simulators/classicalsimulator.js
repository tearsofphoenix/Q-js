import assert from 'assert'
import bigInt from 'big-integer'
import { BasicEngine } from '../../cengines/basics'
import { BasicQubit } from '../../types/qubit'
import {
  Allocate,
  AllocateQubitGate, Deallocate,
  DeallocateQubitGate,
  FlushGate,
  Measure,
  MeasureGate,
  XGate
} from '../../ops/gates'
import { BasicMathGate } from '../../ops/basics'
import { LogicalQubitIDTag } from '../../meta/tag'
import { instanceOf } from '../../libs/util'

/*
A simple introspective simulator that only permits classical operations.

  Allows allocation, deallocation, measuring (no-op), flushing (no-op),
  controls, NOTs, and any BasicMathGate. Supports reading/writing directly
from/to bits and registers of bits.
 */
export default class ClassicalSimulator extends BasicEngine {
  constructor() {
    super();
    this._state = bigInt(0)
    this._bit_positions = {}
  }

  /*
  Converts a qubit from a logical to a mapped qubit if there is a mapper.

  Args:
qubit (projectq.types.Qubit): Logical quantum bit
   */
  convertLogicalToMappedQubit(qubit) {
    const {mapper} = this.main
    if (mapper) {
      const v = mapper.currentMapping[qubit.id]
      if (typeof v === 'undefined') {
        throw new Error('Unknown qubit id. '
        + 'Please make sure you have called '
        + 'eng.flush().')
      }
      return new BasicQubit(qubit.engine, v)
    } else {
      return qubit
    }
  }

  /*
  Reads a bit.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

  Args:
qubit (projectq.types.Qubit): The bit to read.

  Returns:
int: 0 if the target bit is off, 1 if it's on.
   */
  readBit(qubit) {
    qubit = this.convertLogicalToMappedQubit(qubit)
    return this.readMappedBit(qubit)
  }

  // Internal use only. Does not change logical to mapped qubits.
  readMappedBit(mappedQubit) {
    const p = this._bit_positions[mappedQubit.id]
    return this._state.shiftRight(p).and(1).toJSNumber()
  }

  /*
  Resets/sets a bit to the given value.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

  Args:
qubit (projectq.types.Qubit): The bit to write.
value (bool|int): Writes 1 if this value is truthy, else 0.
   */
  writeBit(qubit, value) {
    qubit = this.convertLogicalToMappedQubit(qubit)
    this.writeMappedBit(qubit, value)
  }

  // Internal use only. Does not change logical to mapped qubits.
  writeMappedBit(mappedQubit, value) {
    const p = this._bit_positions[mappedQubit.id]
    if (value) {
      this._state = this._state.or(bigInt(1).shiftLeft(p))
    } else {
      const temp = bigInt(1).shiftLeft(p).not()
      this._state = this._state.and(temp)
    }
  }

  /*
  Returns a mask, to compare against the state, with bits from the
register set to 1 and other bits set to 0.

Args:
  qureg (projectq.types.Qureg):
The bits whose positions should be set.

  Returns:
int: The mask.
   */
  mask(qureg) {
    let t = 0
    qureg.forEach(q => t |= 1 << this._bit_positions[q.id])
    return t
  }

  /*
  Reads a group of bits as a little-endian integer.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

  Args:
qureg (projectq.types.Qureg):
The group of bits to read, in little-endian order.

  Returns:
int: Little-endian register value.
   */
  readRegister(qureg) {
    const new_qureg = []
    qureg.forEach(qubit => new_qureg.push(this.convertLogicalToMappedQubit(qubit)))
    return this.readMappedRegister(new_qureg)
  }

  readMappedRegister(mappedQureg) {
    let t = 0
    mappedQureg.forEach((_, i) => t |= this.readMappedBit(mappedQureg[i]) << i)
    return t
  }

  /*
  Sets a group of bits to store a little-endian integer value.

  Note:
If there is a mapper present in the compiler, this function
automatically converts from logical qubits to mapped qubits for
  the qureg argument.

  Args:
qureg (projectq.types.Qureg):
The bits to write, in little-endian order.
value (int): The integer value to store. Must fit in the register.
   */
  writeRegister(qureg, value) {
    const new_qureg = []
    qureg.forEach(qubit => new_qureg.push(this.convertLogicalToMappedQubit(qubit)))
    this.writeMappedRegister(new_qureg, value)
  }

  writeMappedRegister(mappedQureg, value) {
    if (value < 0 || value >= (2 ** mappedQureg.length)) {
      throw new Error("Value won't fit in register.")
    }
    mappedQureg.forEach((_, i) => this.writeMappedBit(mappedQureg[i], (value >> i) & 1))
  }

  isAvailable(cmd) {
    return instanceOf(cmd.gate, [MeasureGate, AllocateQubitGate, DeallocateQubitGate, BasicMathGate, FlushGate, XGate])
  }

  receive(commandList) {
    commandList.forEach((cmd) => {
      this.handle(cmd)
    })
    if (!this.isLastEngine) {
      this.send(commandList)
    }
  }

  handle(cmd) {
    if (cmd.gate instanceof FlushGate) {
      return
    }

    if (cmd.gate.equal(Measure)) {
      cmd.qubits.forEach(qr => qr.forEach((qb) => {
        // Check if a mapper assigned a different logical id
        let logical_id_tag
        cmd.tags.forEach((tag) => {
          if (tag instanceof LogicalQubitIDTag) {
            logical_id_tag = tag
          }
        })
        let log_qb = qb
        if (logical_id_tag) {
          log_qb = new BasicQubit(qb.engine, logical_id_tag.logical_qubit_id)
        }
        this.main.setMeasurementResult(log_qb, this.readMappedBit(qb))
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

    const controls_mask = this.mask(cmd.controlQubits)
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
