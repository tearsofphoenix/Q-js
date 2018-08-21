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

/**
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
import math from 'mathjs'
import {
  SelfInverseGate, BasicPhaseGate, BasicRotationGate, BasicMathGate, BasicGate, FastForwardingGate, ClassicalInstructionGate
} from './basics'

import {getInverse} from './_cycle'

const mc = math.complex
const mm = math.matrix

/**
 * @class HGate
 */
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

/**
 * @class XGate
 */
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


// Shortcut (instance of) `XGate`
export const X = new XGate()
export const NOT = X

/**
 * @class YGate
 */
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

// Shortcut (instance of) `YGate`
export const Y = new YGate()

/**
 * @class ZGate
 * Pauli-Z gate class
 */
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

// Shortcut (instance of) `ZGate`
export const Z = new ZGate()

/**
 * @class SGate
 */
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

// Shortcut (instance of) `SGate`
export const S = new SGate()

/**
 * @class TGate
 */
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

// Shortcut (instance of) `TGate`
export const T = new TGate()

/**
 * @class SqrtXGate
 */
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

  texString() {
    return '$\\sqrt{X}$'
  }
}

// Shortcut (instance of) `SqrtXGate`
export const SqrtX = new SqrtXGate()

/**
 * @class SwapGate
 * @classdesc Swap gate class (swaps 2 qubits) also self inverse gate
 */
export class SwapGate extends BasicMathGate {
  constructor() {
    super((x, y) => [y, x])
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

  getInverse() {
    const inv = new SwapGate()
    inv.interchangeableQubitIndices = this.interchangeableQubitIndices.slice(0)
    return inv
  }
}

// Shortcut (instance of) `SwapGate`
export const Swap = new SwapGate()

/**
 * @class SqrtSwapGate
 * @classdesc Square-root Swap gate class
 */
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

// Shortcut (instance of) `SqrtSwapGate`
export const SqrtSwap = new SqrtSwapGate()

/**
 * @class EntangleGate
 * @classdesc gate (Hadamard on first qubit, followed by CNOTs applied to all other qubits).
*/
export class EntangleGate extends BasicGate {
  toString() {
    return 'Entangle'
  }

  get matrix() {
    throw new Error('No Attribute')
  }
}


// Shortcut (instance of) `EntangleGate`
export const Entangle = new EntangleGate()

/**
 * @class Ph
 * @classdesc Phase gate (global phase)
 */
export class Ph extends BasicPhaseGate {
  get matrix() {
    return mm([
      [mc(Math.cos(this.angle), Math.sin(this.angle)), 0],
      [0, mc(Math.cos(this.angle), Math.sin(this.angle))]
    ])
  }
}

/**
 * @class Rx
 */
export class Rx extends BasicRotationGate {
  get matrix() {
    return mm([
      [Math.cos(0.5 * this.angle), mc(0, -1 * Math.sin(0.5 * this.angle))],
      [mc(0, -1 * Math.sin(0.5 * this.angle)), Math.cos(0.5 * this.angle)]
    ])
  }
}

/**
 * @class Ry
 */
export class Ry extends BasicRotationGate {
  get matrix() {
    return mm([
      [Math.cos(0.5 * this.angle), -Math.sin(0.5 * this.angle)],
      [Math.sin(0.5 * this.angle), Math.cos(0.5 * this.angle)]
    ])
  }
}

/**
 * @class Rz
 * @classdesc RotationZ gate class
 */
export class Rz extends BasicRotationGate {
  get matrix() {
    return mm([
      [mc(Math.cos(-0.5 * this.angle), Math.sin(-0.5 * this.angle)), 0],
      [0, mc(Math.cos(0.5 * this.angle), Math.sin(0.5 * this.angle))]
    ])
  }
}

/**
 * @class R
 * @classdesc Phase-shift gate (equivalent to Rz up to a global phase)
 */
export class R extends BasicPhaseGate {
  get matrix() {
    return mm([[1, 0], [0, mc(Math.cos(this.angle), Math.sin(this.angle))]])
  }
}

/**
 * @class FlushGate
 * @classdesc
Flush gate (denotes the end of the circuit).

Note:
    All compiler engines (cengines) which cache/buffer gates are obligated
to flush and send all gates to the next compiler engine (followed by
the flush command).

Note:
    This gate is sent when calling

    @code

eng.flush()

on the MainEngine `eng`.

 */
export class FlushGate extends FastForwardingGate {
  toString() {
    return ''
  }
}

/**
 * @class MeasureGate
 * @classdesc Measurement gate class (for single qubits).
 */
export class MeasureGate extends FastForwardingGate {
  toString() {
    return 'Measure'
  }

  /**
    Previously (ProjectQ <= v0.3.6) MeasureGate/Measure was allowed to be
    applied to any number of quantum registers. Now the MeasureGate/Measure
    is strictly a single qubit gate. In the coming releases the backward
    compatibility will be removed!

     */
  or(qubits) {
    let num_qubits = 0
    const qs = BasicGate.makeTupleOfQureg(qubits)
    qs.forEach((qureg) => {
      qureg.forEach((qubit) => {
        num_qubits += 1
        const cmd = this.generateCommand([qubit])
        cmd.apply()
      })
    })
    if (num_qubits > 1) {
      console.warn('Pending syntax change in future versions of '
      + 'ProjectQ: \n Measure will be a single qubit gate '
      + 'only. Use `All(Measure) | qureg` instead to '
        + 'measure multiple qubits.')
    }
  }
}


// Shortcut (instance of) `MeasureGate`
export const Measure = new MeasureGate()

export let Deallocate

/**
 * @class AllocateQubitGate
 */
export class AllocateQubitGate extends ClassicalInstructionGate {
  toString() {
    return 'Allocate'
  }

  getInverse() {
    return Deallocate
  }
}

// Shortcut (instance of) `AllocateQubitGate`
export const Allocate = new AllocateQubitGate()

/**
 * @class DeallocateQubitGate
 */
export class DeallocateQubitGate extends FastForwardingGate {
  toString() {
    return 'Deallocate'
  }

  getInverse() {
    return Allocate
  }
}

// Shortcut (instance of) `DeallocateQubitGate`
Deallocate = new DeallocateQubitGate()

/**
 * @class AllocateDirtyQubitGate
 */
export class AllocateDirtyQubitGate extends ClassicalInstructionGate {
  toString() {
    return 'AllocateDirty'
  }

  getInverse() {
    return Deallocate
  }
}

// Shortcut (instance of) AllocateDirtyQubitGate
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

// Shortcut (instance of) BarrierGate
Barrier = new BarrierGate()

const obj = {}
let _sdag = null
let _tdag = null
Object.defineProperties(obj, {
  Sdag: {
    get() {
      if (!_sdag) {
        _sdag = getInverse(S)
      }
      return _sdag
    }
  },
  Sdagger: {
    get() {
      return obj.Sdag
    }
  },
  Tdag: {
    get() {
      if (!_tdag) {
        _tdag = getInverse(T)
      }
      return _tdag
    }
  },
  Tdagger: {
    get() {
      return obj.Tdag
    }
  }
})

export default obj
