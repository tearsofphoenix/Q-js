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
import {expect} from 'chai'
import ToLatex from './tolatex'
import { CircuitDrawer } from './drawer'
import { tuple } from '../../libs/util'
import { BasicGate } from '../../ops'
import MainEngine from '../../cengines/main'

describe('tolatex test', () => {
  it('should test_tolatex', () => {
    const oldHeader = ToLatex._header
    const oldBody = ToLatex._body
    const oldFooter = ToLatex._footer
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
      'control': {'shadow': false, 'size': 0},
      'gates': {
        'MeasureGate': {'height': 0, 'width': 0},
        'XGate': {'height': 1, 'width': 0.5}
      },
      'lines': {'style': 'my_style'}
    }
    let header = ToLatex._header(settings)
    console.log(header)
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
    const old_tolatex = _drawer.to_latex
    _drawer.to_latex = x => x

    const qubit1 = eng.allocate_qubit()
    const qubit2 = eng.allocate_qubit()
    const qubit3 = eng.allocate_qubit()

    class MyLargeGate extends BasicGate {
      toString() {
        return 'large_gate'
      }
    }

    H.or(qubit2)
    new MyLargeGate().or(tuple(qubit1, qubit3))
    H.or(qubit2)
    eng.flush()

    const circuit_lines = drawer.get_latex()
    _drawer.to_latex = old_tolatex

    const settings = ToLatex.get_default_settings()
    settings.gates.AllocateQubitGate.draw_id = true
    const code = ToLatex._body(circuit_lines, settings)

    expect(code.count('large_gate')).to.equal(1) // 1 large gate was applied
    // check that large gate draws lines, also for qubits it does not act upon
    expect(code.count('edge[')).to.equal(5)
    expect(code.count('{H};')).to.equal(2)
  });
})

// def test_body():
// drawer = _drawer.CircuitDrawer()
// eng = MainEngine(drawer, [])
// old_tolatex = _drawer.to_latex
// _drawer.to_latex = lambda x: x
//
// qubit1 = eng.allocate_qubit()
// qubit2 = eng.allocate_qubit()
// qubit3 = eng.allocate_qubit()
// H.or(qubit1
// H.or(qubit2
// CNOT.or((qubit1, qubit2)
// X.or(qubit2
// Measure.or(qubit2
// CNOT.or((qubit2, qubit1)
// Z.or(qubit2
// C(Z).or((qubit1, qubit2)
// C(Swap).or((qubit1, qubit2, qubit3)
// SqrtX.or(qubit1
// SqrtSwap.or((qubit1, qubit2)
// get_inverse(SqrtX).or(qubit1
// C(SqrtSwap).or((qubit1, qubit2, qubit3)
// get_inverse(SqrtSwap).or((qubit1, qubit2)
// C(Swap).or((qubit3, qubit1, qubit2)
// C(SqrtSwap).or((qubit3, qubit1, qubit2)
//
// del qubit1
// eng.flush()
//
// circuit_lines = drawer.get_latex()
// _drawer.to_latex = old_tolatex
//
// settings = ToLatex.get_default_settings()
// settings['gates']['AllocateQubitGate']['draw_id'] = true
// code = ToLatex._body(circuit_lines, settings)
//
// // swap draws 2 nodes + 2 lines each, so is sqrtswap gate, csqrtswap,
//   // inv(sqrt_swap), and cswap.
//   expect(code.count("swapstyle") == 36
// // CZ is two phases plus 2 from CNOTs + 2 from cswap + 2 from csqrtswap
// expect(code.count("phase") == 8
// expect(code.count("{{{}}}".format(str(H))) == 2  // 2 hadamard gates
// expect(code.count("{$\Ket{0}") == 3  // 3 qubits allocated
// // 1 cnot, 1 not gate, 3 SqrtSwap, 1 inv(SqrtSwap)
// expect(code.count("xstyle") == 7
// expect(code.count("measure") == 1  // 1 measurement
// expect(code.count("{{{}}}".format(str(Z))) == 1  // 1 Z gate
// expect(code.count("{red}") == 3
//
//
// def test_qubit_allocations_at_zero():
// drawer = _drawer.CircuitDrawer()
// eng = MainEngine(drawer, [])
// old_tolatex = _drawer.to_latex
// _drawer.to_latex = lambda x: x
//
// a = eng.allocate_qureg(4)
//
// CNOT.or((a[0], a[2])
// CNOT.or((a[0], a[3])
// CNOT.or((a[0], a[2])
// CNOT.or((a[1], a[3])
//
// del a
// eng.flush()
//
// circuit_lines = drawer.get_latex()
// _drawer.to_latex = old_tolatex
//
// settings = ToLatex.get_default_settings()
// settings['gates']['AllocateQubitGate']['allocate_at_zero'] = true
// code = ToLatex._body(copy.deepcopy(circuit_lines), settings)
// expect(code.count("gate0) at (0") == 4
//
// settings['gates']['AllocateQubitGate']['allocate_at_zero'] = False
// code = ToLatex._body(copy.deepcopy(circuit_lines), settings)
// expect(code.count("gate0) at (0") == 3
//
// del settings['gates']['AllocateQubitGate']['allocate_at_zero']
// code = ToLatex._body(copy.deepcopy(circuit_lines), settings)
// expect(code.count("gate0) at (0") == 3
//
//
// def test_qubit_lines_classicalvsquantum1():
// drawer = _drawer.CircuitDrawer()
// eng = MainEngine(drawer, [])
// old_tolatex = _drawer.to_latex
// _drawer.to_latex = lambda x: x
//
// qubit1 = eng.allocate_qubit()
//
// H.or(qubit1
// Measure.or(qubit1
// X.or(qubit1
//
// circuit_lines = drawer.get_latex()
// _drawer.to_latex = old_tolatex
//
// settings = ToLatex.get_default_settings()
// code = ToLatex._body(circuit_lines, settings)
//
// expect(code.count("edge[") == 4
//
//
// def test_qubit_lines_classicalvsquantum2():
// drawer = _drawer.CircuitDrawer()
// eng = MainEngine(drawer, [])
//
// controls = eng.allocate_qureg(3)
// action = eng.allocate_qubit()
//
// with Control(eng, controls):
// H.or(action
//
// code = drawer.get_latex()
// expect(code.count("{{{}}}".format(str(H))) == 1  // 1 Hadamard
// expect(code.count("{$") == 4  // four allocate gates
// expect(code.count("node[phase]") == 3  // 3 controls
//
//
// def test_qubit_lines_classicalvsquantum3():
// drawer = _drawer.CircuitDrawer()
// eng = MainEngine(drawer, [])
//
// control0 = eng.allocate_qureg(2)
// action1 = eng.allocate_qubit()
// control1 = eng.allocate_qureg(2)
// action2 = eng.allocate_qubit()
// control2 = eng.allocate_qubit()
//
// with Control(eng, control0 + control1 + control2):
// H.or((action1, action2)
//
// code = drawer.get_latex()
// expect(code.count("{{{}}}".format(str(H))) == 1  // 1 Hadamard
// expect(code.count("{$") == 7  // 8 allocate gates
// expect(code.count("node[phase]") == 3  // 1 control
// // (other controls are within the gate -> are not drawn)
// expect(code.count("edge[") == 10  // 7 qubit lines + 3 from controls
//
//
// def test_quantum_lines_cnot():
// drawer = _drawer.CircuitDrawer()
// eng = MainEngine(drawer, [])
//
// qubit1 = eng.allocate_qubit()
// qubit2 = eng.allocate_qubit()
//
// Measure.or(qubit1
// Measure.or(qubit2
//
// CNOT.or((qubit2, qubit1)
//
// del qubit1, qubit2
// code = drawer.get_latex()
// expect(code.count("edge[") == 12  // all lines are classical
//
// drawer = _drawer.CircuitDrawer()
// eng = MainEngine(drawer, [])
//
// qubit1 = eng.allocate_qubit()
// qubit2 = eng.allocate_qubit()
//
// Measure.or(qubit1  // qubit1 is classical
//
// CNOT.or((qubit2, qubit1)  // now it is quantum
//
// del qubit1, qubit2
// code = drawer.get_latex()
// expect(code.count("edge[") == 7  // all lines are quantum
