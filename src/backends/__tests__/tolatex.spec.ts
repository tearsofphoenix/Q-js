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
import _ from 'lodash';
import { expect } from 'chai'
import ToLatex from '@/backends/circuits/tolatex'
import { CircuitDrawer } from '@/backends/circuits/drawer'
import { tuple } from '@/libs/util'
import {
  BasicGate, C, CNOT, H, Measure, SqrtSwap, SqrtX, Swap, X, Z
} from '@/ops'
import MainEngine from '@/cengines/main'
import '@/libs/polyfill'
import { getInverse } from '@/ops/_cycle';
import { Control } from '@/meta';

const cs = (str: string, pattern: string) => _.sumBy(str, x => x === pattern ? 1 : 0);

describe('tolatex test', () => {
  it('should test_tolatex', () => {
    const oldHeader = ToLatex._header
    const oldBody = ToLatex._body
    const oldFooter = ToLatex._footer

    ToLatex._header = () => 'H'
    ToLatex._body = (x, y) => x
    ToLatex._footer = () => 'F'
    const result = ToLatex.toLatex('B')

    expect(result).to.equal('HBF')

    ToLatex._header = oldHeader
    ToLatex._body = oldBody
    ToLatex._footer = oldFooter
  });

  it('should test_default_settings', () => {
    const settings = ToLatex.get_default_settings()
    expect(settings instanceof Object).to.equal(true)
    expect('gate_shadow' in settings).to.equal(true)
    expect('lines' in settings).to.equal(true)
    expect('gates' in settings).to.equal(true)
    expect('control' in settings).to.equal(true)
  });

  it('should test_header', () => {
    const settings = {
      'gate_shadow': false,
      'control': { 'shadow': false, 'size': 0 },
      'gates': {
        'MeasureGate': { 'height': 0, 'width': 0 },
        'XGate': { 'height': 1, 'width': 0.5 }
      },
      'lines': { 'style': 'my_style' }
    }
    let header = ToLatex._header(settings)

    expect(header.indexOf('minimum') !== -1).to.equal(true)
    expect(header.indexOf('basicshadow') === -1).to.equal(true)
    expect(header.indexOf('minimum height=0.5') !== -1).to.equal(true)
    expect(header.indexOf('minimum height=1cm') === -1).to.equal(true)
    expect(header.indexOf('minimum height=0cm') !== -1).to.equal(true)

    settings.control.shadow = true
    settings.gates.XGate.width = 1
    header = ToLatex._header(settings)

    expect(header.indexOf('minimum') !== -1).to.equal(true)
    expect(header.indexOf('basicshadow') !== -1).to.equal(true)
    expect(header.indexOf('minimum height=1cm') !== -1).to.equal(true)
    expect(header.indexOf('minimum height=0cm') !== -1).to.equal(true)

    settings.control.shadow = true
    settings.gate_shadow = true
    header = ToLatex._header(settings)

    expect(header.indexOf('minimum') !== -1).to.equal(true)
    expect(header.indexOf('white,basicshadow') !== -1).to.equal(true)
    expect(header.indexOf('minimum height=1cm') !== -1).to.equal(true)
    expect(header.indexOf('minimum height=0cm') !== -1).to.equal(true)
  });

  it('should test_large_gates', () => {
    const drawer = new CircuitDrawer()
    const eng = new MainEngine(drawer, [])
    const old_tolatex = ToLatex.toLatex
    ToLatex.toLatex = x => x

    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const qubit3 = eng.allocateQubit()

    class MyLargeGate extends BasicGate {
      toString() {
        return 'large_gate'
      }

      equal(other) {
        return other instanceof MyLargeGate
      }
    }

    H.or(qubit2)
    new MyLargeGate().or(tuple(qubit1, qubit3))
    H.or(qubit2)
    eng.flush()

    const circuit_lines = drawer.getLatex()
    ToLatex.toLatex = old_tolatex

    const settings = ToLatex.get_default_settings()
    settings.gates.AllocateQubitGate.draw_id = true
    const code = ToLatex._body(circuit_lines, settings)

    expect(cs(code, 'large_gate')).to.equal(1) // 1 large gate was applied
    // check that large gate draws lines, also for qubits it does not act upon
    expect(cs(code, 'edge\\[')).to.equal(5)
    expect(cs(code, '{H};')).to.equal(2)
  });

  it('should test_body', () => {
    const drawer = new CircuitDrawer()
    const eng = new MainEngine(drawer, [])
    const old_tolatex = ToLatex.toLatex
    ToLatex.toLatex = x => x

    const qubit1 = eng.allocateQubit()
    const qubit2 = eng.allocateQubit()
    const qubit3 = eng.allocateQubit()
    H.or(qubit1)
    H.or(qubit2)
    CNOT.or(tuple(qubit1, qubit2))
    X.or(qubit2)
    Measure.or(qubit2)
    CNOT.or(tuple(qubit2, qubit1))
    Z.or(qubit2)
    C(Z).or(tuple(qubit1, qubit2))
    C(Swap).or(tuple(qubit1, qubit2, qubit3))
    SqrtX.or(qubit1)
    SqrtSwap.or(tuple(qubit1, qubit2))
    getInverse(SqrtX).or(qubit1)
    C(SqrtSwap).or(tuple(qubit1, qubit2, qubit3))
    getInverse(SqrtSwap).or(tuple(qubit1, qubit2))
    C(Swap).or(tuple(qubit3, qubit1, qubit2))
    C(SqrtSwap).or(tuple(qubit3, qubit1, qubit2))

    qubit1.deallocate()
    eng.flush()

    const circuit_lines = drawer.getLatex()
    ToLatex.toLatex = old_tolatex

    const settings = ToLatex.get_default_settings()
    settings.gates.AllocateQubitGate.draw_id = true
    const code = ToLatex._body(circuit_lines, settings)
    const c = ToLatex.toLatex(circuit_lines)
    console.log(c)
    // swap draws 2 nodes + 2 lines each, so is sqrtswap gate, csqrtswap,
    // inv(sqrt_swap), and cswap.
    expect(cs(code, 'swapstyle')).to.equal(36)
    // CZ is two phases plus 2 from CNOTs + 2 from cswap + 2 from csqrtswap
    expect(cs(code, 'phase')).to.equal(8)
    expect(cs(code, `{${H.toString()}}`)).to.equal(2) // 2 hadamard gates
    const exp = new RegExp(/\{\$\\Ket\{0\}/g)
    const count = code.match(exp).length
    expect(count).to.equal(3) // 3 qubits allocated
    // 1 cnot, 1 not gate, 3 SqrtSwap, 1 inv(SqrtSwap)
    expect(cs(code, 'xstyle')).to.equal(7)
    expect(cs(code, 'measure')).to.equal(1) // 1 measurement
    expect(cs(code, `{${Z.toString()}}`)).to.equal(1) // 1 Z gate
    expect(cs(code, '{red}')).to.equal(3)
  });

  it('should test_qubit_allocations_at_zero', () => {
    function copyLines(linesMap) {
      const copy = {}
      Object.keys(linesMap).forEach((key) => {
        const lines = linesMap[key]
        copy[key] = lines.map(item => item.copy())
      })
      return copy
    }

    const drawer = new CircuitDrawer()
    const eng = new MainEngine(drawer, [])
    const old_tolatex = ToLatex.toLatex
    ToLatex.toLatex = x => x

    const a = eng.allocateQureg(4)

    CNOT.or(tuple(a[0], a[2]))
    CNOT.or(tuple(a[0], a[3]))
    CNOT.or(tuple(a[0], a[2]))
    CNOT.or(tuple(a[1], a[3]))

    a.deallocate()
    eng.flush()

    const circuit_lines = drawer.getLatex()
    ToLatex.toLatex = old_tolatex

    const settings = ToLatex.get_default_settings()
    settings.gates.AllocateQubitGate.allocate_at_zero = true
    let code = ToLatex._body(copyLines(circuit_lines), settings)
    expect(cs(code, 'gate0\\) at \\(0')).to.equal(4)

    settings.gates.AllocateQubitGate.allocate_at_zero = false
    code = ToLatex._body(copyLines(circuit_lines), settings)
    expect(cs(code, 'gate0\\) at \\(0')).to.equal(3)

    delete settings.gates.AllocateQubitGate.allocate_at_zero
    code = ToLatex._body(copyLines(circuit_lines), settings)
    expect(cs(code, 'gate0\\) at \\(0')).to.equal(3)
  });

  it('should test_qubit_lines_classicalvsquantum1', () => {
    const drawer = new CircuitDrawer()
    const eng = new MainEngine(drawer, [])
    const old_tolatex = ToLatex.toLatex
    ToLatex.toLatex = x => x

    const qubit1 = eng.allocateQubit()

    H.or(qubit1)
    Measure.or(qubit1)
    X.or(qubit1)

    const circuit_lines = drawer.getLatex()
    ToLatex.toLatex = old_tolatex

    const settings = ToLatex.get_default_settings()
    const code = ToLatex._body(circuit_lines, settings)

    expect(cs(code, 'edge\\[')).to.equal(4)
  });

  it('should test_qubit_lines_classicalvsquantum2', () => {
    const drawer = new CircuitDrawer()
    const eng = new MainEngine(drawer, [])

    const controls = eng.allocateQureg(3)
    const action = eng.allocateQubit()

    Control(eng, controls, () => H.or(action))

    const code = drawer.getLatex()
    expect(cs(code, `{${H.toString()}`)).to.equal(1) // 1 Hadamard
    expect(cs(code, '\\{\\$')).to.equal(4) // four allocate gates
    expect(cs(code, 'node\\[phase\\]')).to.equal(3) // 3 controls
  });

  it('should test_qubit_lines_classicalvsquantum3', () => {
    const drawer = new CircuitDrawer()
    const eng = new MainEngine(drawer, [])

    const control0 = eng.allocateQureg(2)
    const action1 = eng.allocateQubit()
    const control1 = eng.allocateQureg(2)
    const action2 = eng.allocateQubit()
    const control2 = eng.allocateQubit()

    Control(eng, control0.concat(control1).concat(control2), () => H.or(tuple(action1, action2)))

    const code = drawer.getLatex()
    expect(cs(code, `{${H.toString()}}`)).to.equal(1) // 1 Hadamard
    expect(cs(code, '\\{\\$')).to.equal(7) // 8 allocate gates
    expect(cs(code, 'node\\[phase\\]')).to.equal(3) // 1 control
    // (other controls are within the gate -> are not drawn)
    expect(cs(code, 'edge\\[')).to.equal(10) // 7 qubit lines + 3 from controls
  });

  it('should test_quantum_lines_cnot', () => {
    let drawer = new CircuitDrawer()
    let eng = new MainEngine(drawer, [])

    let qubit1 = eng.allocateQubit()
    let qubit2 = eng.allocateQubit()

    Measure.or(qubit1)
    Measure.or(qubit2)

    CNOT.or(tuple(qubit2, qubit1))

    qubit1.deallocate()
    qubit2.deallocate()
    let code = drawer.getLatex()
    expect(cs(code, 'edge\\[')).to.equal(12) // all lines are classical

    drawer = new CircuitDrawer()
    eng = new MainEngine(drawer, [])

    qubit1 = eng.allocateQubit()
    qubit2 = eng.allocateQubit()

    Measure.or(qubit1) // qubit1 is classical

    CNOT.or(tuple(qubit2, qubit1)) // now it is quantum

    qubit1.deallocate()
    qubit2.deallocate()
    code = drawer.getLatex()
    expect(cs(code, 'edge\\[')).to.equal(7) // all lines are quantum
  });
})
