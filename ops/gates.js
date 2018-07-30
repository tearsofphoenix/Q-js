/*
Contains definitions of standard gates such as
* Hadamard (H)
* Pauli-X (X / NOT)
* Pauli-Z (Z)
* T and its inverse (T / Tdagger)
* Swap gate (Swap)
* Phase gate (Ph)
* Rotation-Z (Rz)
* Phase-shift (R)
* Measurement (Measure)

and meta gates, i.e.,
* Allocate / Deallocate qubits
* Flush gate (end of circuit)
*/
import mathjs from 'mathjs'
import {
  SelfInverseGate, BasicPhaseGate, BasicRotationGate, BasicMathGate, BasicGate, FastForwardingGate, ClassicalInstructionGate
} from './basics'

import {getInverse} from './_cycle'
import {applyCommand} from './command'

const mc = mathjs.complex
const mm = mathjs.matrix

export class HGate extends SelfInverseGate {
  toString() {
    return 'H'
  }

  get matrix() {
    return mm([
      [mc(Math.SQRT1_2, 0), mc(Math.SQRT1_2, 0)],
      [mc(Math.SQRT1_2, 0), mc(-Math.SQRT1_2, 0)]
    ])
  }
}

export const H = new HGate()

// Pauli-X gate class
export class XGate extends SelfInverseGate {
  toString() {
    return 'X'
  }

  get matrix() {
    return mm([
      [0, 1],
      [1, 0]
    ])
  }
}


// Shortcut (instance of) :class:`projectq.ops.XGate`
export const X = new XGate()
export const NOT = X

// Pauli-Y gate class
export class YGate extends SelfInverseGate {
  toString() {
    return 'Y'
  }

  get matrix() {
    return mm([
      [0, mc(0, -1)],
      [mc(0, 1), 0],
    ])
  }
}

// Shortcut (instance of) :class:`projectq.ops.YGate`
export const Y = new YGate()

// Pauli-Z gate class
export class ZGate extends SelfInverseGate {
  toString() {
    return 'Z'
  }

  get matrix() {
    return mm([
      [1, 0],
      [0, -1]
    ])
  }
}

// Shortcut (instance of) :class:`projectq.ops.ZGate`
export const Z = new ZGate()

// S gate class
export class SGate extends SelfInverseGate {
  toString() {
    return 'S'
  }

  get matrix() {
    return mm([
      [1, 0],
      [0, mc(0, 1)]
    ])
  }
}

// Shortcut (instance of) :class:`projectq.ops.SGate`
export const S = new SGate()
// Shortcut (instance of) :class:`projectq.ops.SGate`
export const Sdag = getInverse(S)

export const Sdagger = Sdag

// T gate class
export class TGate extends BasicGate {
  get matrix() {
    return mm([
      [1, 0],
      [0, mc(Math.SQRT1_2, Math.SQRT1_2)]
    ])
  }

  toString() {
    return 'T'
  }
}

// Shortcut (instance of) :class:`projectq.ops.TGate`
export const T = new TGate()
// Shortcut (instance of) :class:`projectq.ops.TGate`
export const Tdag = getInverse(T)

export const Tdagger = Tdag

// Square-root X gate class
export class SqrtXGate extends BasicGate {
  get matrix() {
    return mm([
      [mc(0.5, 0.5), mc(0.5, -0.5)],
      [mc(0.5, -0.5), mc(0.5, 0.5)]
    ])
  }

  toString() {
    return 'SqrtX'
  }
}

// Shortcut (instance of) :class:`projectq.ops.SqrtXGate`
export const SqrtX = new SqrtXGate()

// Swap gate class (swaps 2 qubits)
//
export class SwapGate extends BasicMathGate {
  constructor() {
    super()
    this.interchangeableQubitIndices = [[0, 1]]
  }

  toString() {
    return 'Swap'
  }

  get matrix() {
    return mm([
      [1, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 1]
    ])
  }
}

// Shortcut (instance of) :class:`projectq.ops.SwapGate`
export const Swap = new SwapGate()

// Square-root Swap gate class
export class SqrtSwapGate extends BasicGate {
  constructor() {
    super()
    this.interchangeableQubitIndices = [[0, 1]]
  }

  toString() {
    return 'SqrtSwap'
  }

  get matrix() {
    return mm([
      [1, 0, 0, 0],
      [0, mc(0.5, 0.5), mc(0.5, -0.5), 0],
      [0, mc(0.5, -0.5), mc(0.5, 0.5), 0],
      [0, 0, 0, 1]
    ])
  }
}

// Shortcut (instance of) :class:`projectq.ops.SqrtSwapGate`
export const SqrtSwap = new SqrtSwapGate()

/*
Entangle gate (Hadamard on first qubit, followed by CNOTs applied to all
other qubits).
*/
export class EntangleGate extends BasicGate {
  toString() {
    return 'Entangle'
  }
}


// Shortcut (instance of) :class:`projectq.ops.EntangleGate`
export const Entangle = new EntangleGate()

// Phase gate (global phase)
export class Ph extends BasicPhaseGate {
  get matrix() {
    return mm([
      [mc(Math.cos(this.angle), Math.sin(this.angle)), 0],
      [0, mc(Math.cos(this.angle), Math.sin(this.angle))]
    ])
  }
}

export class Rx extends BasicRotationGate {
  get matrix() {
    return mm([
      [Math.cos(0.5 * this.angle), mc(0, -1 * Math.sin(0.5 * this.angle))],
      [mc(0, -1 * Math.sin(0.5 * this.angle)), Math.cos(0.5 * this.angle)]
    ])
  }
}


export class Ry extends BasicRotationGate {
  get matrix() {
    return mm([
      [Math.cos(0.5 * this.angle), -Math.sin(0.5 * this.angle)],
      [Math.sin(0.5 * this.angle), Math.cos(0.5 * this.angle)]
    ])
  }
}

// RotationZ gate class
export class Rz extends BasicRotationGate {
  get matrix() {
    return mm([
      [mc(Math.cos(-0.5 * this.angle), Math.sin(-0.5 * this.angle)), 0],
      [0, mc(Math.cos(0.5 * this.angle), Math.sin(0.5 * this.angle))]
    ])
  }
}

// Phase-shift gate (equivalent to Rz up to a global phase)
export class R extends BasicPhaseGate {
  get matrix() {
    return mm([[1, 0], [0, mc(Math.cos(this.angle), Math.sin(this.angle))]])
  }
}

/*
Flush gate (denotes the end of the circuit).

Note:
    All compiler engines (cengines) which cache/buffer gates are obligated
to flush and send all gates to the next compiler engine (followed by
the flush command).

Note:
    This gate is sent when calling

    .. code-block:: python

eng.flush()

on the MainEngine `eng`.

 */
export class FlushGate extends FastForwardingGate {
  toString() {
    return ''
  }
}

// Measurement gate class (for single qubits).
export class MeasureGate extends FastForwardingGate {
  toString() {
    return 'Measure'
  }

  /*
    Previously (ProjectQ <= v0.3.6) MeasureGate/Measure was allowed to be
    applied to any number of quantum registers. Now the MeasureGate/Measure
    is strictly a single qubit gate. In the coming releases the backward
    compatibility will be removed!

     */
  or(qubits) {
    const qs = this.makeTupleOfQureg(qubits)
    qs.forEach((qureg) => {
      qureg.forEach((qubit) => {
        const cmd = this.generateCommand([qubit])
        applyCommand(cmd)
      })
    })
  }
}


// Shortcut (instance of) :class:`projectq.ops.MeasureGate`
export const Measure = new MeasureGate()

export let Deallocate

export class AllocateQubitGate extends ClassicalInstructionGate {
  toString() {
    return 'Allocate'
  }

  getInverse() {
    return Deallocate
  }
}

// Shortcut (instance of) :class:`projectq.ops.AllocateQubitGate`
export const Allocate = new AllocateQubitGate()


export class DeallocateQubitGate extends FastForwardingGate {
  toString() {
    return 'Deallocate'
  }

  getInverse() {
    return Allocate
  }
}

// Shortcut (instance of) :class:`projectq.ops.DeallocateQubitGate`
Deallocate = new DeallocateQubitGate()


export class AllocateDirtyQubitGate extends ClassicalInstructionGate {
  toString() {
    return 'AllocateDirty'
  }

  getInverse() {
    return Deallocate
  }
}

// Shortcut (instance of) :class:`projectq.ops.AllocateDirtyQubitGate`
export const AllocateDirty = new AllocateDirtyQubitGate()

export let Barrier

export class BarrierGate extends BasicGate {
  toString() {
    return 'Barrier'
  }

  getInverse() {
    return Barrier
  }
}

// Shortcut (instance of) :class:`projectq.ops.BarrierGate`
Barrier = new BarrierGate()
