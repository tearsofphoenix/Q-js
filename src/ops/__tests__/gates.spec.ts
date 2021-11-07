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

import { expect } from 'chai'
import * as math from 'mathjs'
import Gates, {
  HGate,
  H,
  XGate,
  X,
  YGate,
  Y,
  ZGate,
  Z,
  SGate,
  S,
  TGate,
  T,
  SqrtXGate,
  SqrtX,
  Swap,
  SwapGate,
  SqrtSwap,
  SqrtSwapGate,
  Allocate,
  Deallocate,
  Barrier,
  Entangle,
  EntangleGate,
  R,
  Rx,
  Ry,
  Rz,
  Ph,
  FlushGate,
  Measure,
  DeallocateQubitGate,
  AllocateQubitGate,
  AllocateDirtyQubitGate, AllocateDirty, BarrierGate,
  MeasureGate
} from '@/ops/gates'
import '@/ops/metagates'
import { getInverse } from '@/ops/_cycle'
const { Tdag, Tdagger } = Gates
const np = math
const mm = math.matrix
const mc = math.complex

function matrixEqual(m1, m2) {
  if (math.equal(math.size(m1), math.size(m2))) {
    let isSame = true
    m1.forEach((value, index) => {
      const v = m2.subset(np.index(...index))
      if (math.abs(value - v) > 1e-12) {
        isSame = false
      }
    })
    return isSame
  }
  return false
}

describe('gate test', () => {
  it('should test h gate', () => {
    const gate = new HGate()
    expect(gate.equal(gate.getInverse())).to.equal(true)
    expect(gate.toString()).to.equal('H')
    expect(H instanceof HGate).to.equal(true)
    const m = mm([
      [mc(Math.SQRT1_2, 0), mc(Math.SQRT1_2, 0)],
      [mc(Math.SQRT1_2, 0), mc(-Math.SQRT1_2, 0)]
    ])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
  });

  it('should test x gate', () => {
    const gate = new XGate()
    expect(gate.equal(gate.getInverse())).to.equal(true)
    expect(gate.toString()).to.equal('X')
    expect(X instanceof XGate).to.equal(true)
    const m = mm([[0, 1], [1, 0]])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
  })

  it('should test y gate', () => {
    const gate = new YGate()
    expect(gate.equal(gate.getInverse())).to.equal(true)
    expect(gate.toString()).to.equal('Y')
    expect(Y instanceof YGate).to.equal(true)
    const m = mm([[0, mc(0, -1)], [mc(0, 1), 0]])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
  })

  it('should test z gate', () => {
    const gate = new ZGate()
    expect(gate.equal(gate.getInverse())).to.equal(true)
    expect(gate.toString()).to.equal('Z')
    expect(Z instanceof ZGate).to.equal(true)
    const m = mm([[1, 0], [0, -1]])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
  })

  it('should test s gate', () => {
    const gate = new SGate()
    expect(gate.equal(gate.getInverse())).to.equal(true)
    expect(gate.toString()).to.equal('S')
    expect(S instanceof SGate).to.equal(true)
    const m = mm([[1, 0], [0, mc(0, 1)]])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
  })

  it('should test t gate', () => {
    const gate = new TGate()
    expect(gate.toString()).to.equal('T')
    expect(T instanceof TGate).to.equal(true)
    const m = mm([[1, 0], [0, math.exp(mc(0, math.pi / 4))]])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
    expect(Tdag instanceof getInverse(gate).constructor).to.equal(true)
    expect(Tdagger instanceof getInverse(gate).constructor).to.equal(true)
  })

  it('should sqrtx gate', () => {
    const gate = new SqrtXGate()
    expect(gate.toString()).to.equal('SqrtX')
    const m = mm([[mc(0.5, 0.5), mc(0.5, -0.5)], [mc(0.5, -0.5), mc(0.5, 0.5)]])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
    const t = mm([[0, 1], [1, 0]])
    expect(np.deepEqual(t, math.multiply(gate.matrix, gate.matrix))).to.equal(true)
    expect(SqrtX instanceof SqrtXGate).to.equal(true)
  });

  it('should test swap gate', () => {
    const gate = new SwapGate()
    expect(gate.toString()).to.equal('Swap')
    expect(gate.interchangeableQubitIndices).to.deep.equal([[0, 1]])
    const m = mm([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]])
    expect(np.deepEqual(gate.matrix, m)).to.equal(true)
    expect(Swap instanceof SwapGate).to.equal(true)
  });

  it('should test sqrt swap gate', () => {
    const sqrt_gate = new SqrtSwapGate()
    const swap_gate = new SwapGate()
    expect(sqrt_gate.toString()).to.equal('SqrtSwap')

    const m = mm([[1, 0, 0, 0],
    [0, mc(0.5, 0.5), mc(0.5, -0.5), 0],
    [0, mc(0.5, -0.5), mc(0.5, 0.5), 0],
    [0, 0, 0, 1]])
    expect(np.deepEqual(sqrt_gate.matrix, m)).to.equal(true)
    expect(Swap instanceof SwapGate).to.equal(true)
    expect(SqrtSwap instanceof SqrtSwapGate).to.equal(true)
    expect(math.deepEqual(math.multiply(sqrt_gate.matrix, sqrt_gate.matrix), swap_gate.matrix)).to.equal(true)
  });

  it('should test engangle gate', () => {
    const gate = new EntangleGate()
    expect(gate.toString()).to.equal('Entangle')
    expect(Entangle instanceof EntangleGate).to.equal(true)
  })

  it('should test rx', () => {
    const angles = [0, 0.2, 2.1, 4.1, 2 * math.pi, 4 * math.pi]
    angles.forEach((angle) => {
      const gate = new Rx(angle)
      const expected_matrix = np.matrix([[math.cos(0.5 * angle), mc(0, -math.sin(0.5 * angle))],
      [mc(0, -math.sin(0.5 * angle)), math.cos(0.5 * angle)]])
      expect(math.deepEqual(gate.matrix, expected_matrix)).to.equal(true)
    })
  });

  it('should test ry', () => {
    const angles = [0, 0.2, 2.1, 4.1, 2 * math.pi, 4 * math.pi]
    angles.forEach((angle) => {
      const gate = new Ry(angle)
      const expected_matrix = np.matrix([[math.cos(0.5 * angle), -math.sin(0.5 * angle)],
      [math.sin(0.5 * angle), math.cos(0.5 * angle)]])
      expect(matrixEqual(gate.matrix, expected_matrix)).to.equal(true)
    })
  });

  it('should test rz', () => {
    const angles = [0, 0.2, 2.1, 4.1, 2 * math.pi, 4 * math.pi]
    angles.forEach((angle) => {
      const gate = new Rz(angle)
      const expected_matrix = np.matrix([
        [np.exp(mc(0, -0.5 * angle)), 0],
        [0, np.exp(mc(0, 0.5 * angle))]
      ])
      expect(matrixEqual(gate.matrix, expected_matrix)).to.equal(true)
    })
  });

  it('should test ph', () => {
    const angles = [0, 0.2, 2.1, 4.1, 2 * math.pi]
    angles.forEach((angle) => {
      const gate = new Ph(angle)
      const gate2 = new Ph(angle + 2 * math.pi)
      const expected_matrix = np.matrix([
        [np.exp(mc(0, angle)), 0],
        [0, np.exp(mc(0, angle))]
      ])
      expect(matrixEqual(gate.matrix, expected_matrix)).to.equal(true)
      expect(matrixEqual(gate2.matrix, expected_matrix)).to.equal(true)
      expect(gate.equal(gate2)).to.equal(true)
    })
  });

  it('should test r', () => {
    const angles = [0, 0.2, 2.1, 4.1, 2 * math.pi]
    angles.forEach((angle) => {
      const gate = new R(angle)
      const gate2 = new R(angle + 2 * math.pi)
      const expected_matrix = np.matrix([[1, 0], [0, np.exp(mc(0, angle))]])
      expect(matrixEqual(gate.matrix, expected_matrix)).to.equal(true)
      expect(matrixEqual(gate2.matrix, expected_matrix)).to.equal(true)
      expect(gate.equal(gate2)).to.equal(true)
    })
  });

  it('should test flush gate', () => {
    const gate = new FlushGate()
    expect(gate.toString()).to.equal('')
  });

  it('should test measure gate', () => {
    const gate = new MeasureGate()
    expect(gate.toString()).to.equal('Measure')
    expect(Measure instanceof MeasureGate).to.equal(true)
  });

  it('should test allocate qubit gate', () => {
    const gate = new AllocateQubitGate()
    expect(gate.toString()).to.equal('Allocate')
    expect(gate.getInverse().equal(new DeallocateQubitGate())).to.equal(true)
    expect(Allocate instanceof AllocateQubitGate).to.equal(true)
  });

  it('should test deallocate qubit gate', () => {
    const gate = new DeallocateQubitGate()
    expect(gate.toString()).to.equal('Deallocate')
    expect(gate.getInverse().equal(new AllocateQubitGate())).to.equal(true)
    expect(Deallocate instanceof DeallocateQubitGate).to.equal(true)
  });

  it('should test allocate dirty qubit gate', () => {
    const gate = new AllocateDirtyQubitGate()
    expect(gate.toString()).to.equal('AllocateDirty')
    expect(gate.getInverse().equal(new DeallocateQubitGate())).to.equal(true)
    expect(AllocateDirty instanceof AllocateDirtyQubitGate).to.equal(true)
  });

  it('should test barrier gate', () => {
    const gate = new BarrierGate()
    expect(gate.toString()).to.equal('Barrier')
    expect(gate.getInverse().equal(new BarrierGate())).to.equal(true)
    expect(Barrier instanceof BarrierGate).to.equal(true)
  });
})
