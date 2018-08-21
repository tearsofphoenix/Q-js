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
import {LastEngineError} from '../../meta/error';
import {arrayEqual, len} from '../../libs/polyfill';
import {getControlCount} from '../../meta';

import {
  Allocate, Deallocate, FlushGate, Measure
} from '../../ops';
import {BasicEngine} from '../../cengines'
import ToLatex from './tolatex'

/**
 * @class CircuitItem
 */
export class CircuitItem {
  /**
   * @constructor
  Initialize a circuit item.

    @param {BasicGate} gate
    @param {number[]} lines: Circuit lines the gate acts on.
    @param {number[]} ctrl_lines: Circuit lines which control the gate.
  */
  constructor(gate, lines, ctrl_lines) {
    this.gate = gate
    this.lines = lines
    this.ctrl_lines = ctrl_lines
    this.id = -1
  }

  /**
   * @return {CircuitItem}
   */
  copy() {
    const l = Array.isArray(this.lines) ? this.lines.slice(0) : this.lines
    const cl = Array.isArray(this.ctrl_lines) ? this.ctrl_lines.slice(0) : this.ctrl_lines
    const inst = new CircuitItem(this.gate, l, cl)
    inst.id = this.id
    return inst
  }

  /**
   * @param {CircuitItem|Object} other
   * @return boolean
   */
  equal(other) {
    if (other instanceof CircuitItem) {
      let f = false
      if (this.gate.equal) {
        f = this.gate.equal(other.gate)
      } else {
        f = this.gate === other.gate
      }
      return f && arrayEqual(this.lines, other.lines)
          && arrayEqual(this.ctrl_lines, other.ctrl_lines) && this.id === other.id
    }
    return false
  }
}

/**
 * @class CircuitDrawer
 * @classdesc
CircuitDrawer is a compiler engine which generates TikZ code for drawing
  quantum circuits.

    The circuit can be modified by editing the settings.json file which is
generated upon first execution. This includes adjusting the gate width,
    height, shadowing, line thickness, and many more options.

    After initializing the CircuitDrawer, it can also be given the mapping
from qubit IDs to wire location (via the :meth:`set_qubit_locations`
function):

  @code

const circuit_backend = new CircuitDrawer()
circuit_backend.setQubitLocations({0: 1, 1: 0}) // swap lines 0 and 1
const eng = new MainEngine(circuit_backend)

... // run quantum algorithm on this main engine

console.log(circuit_backend.getLatex()) // prints LaTeX code

To see the qubit IDs in the generated circuit, simply set the `draw_id`
option in the settings.json file under "gates":"AllocateQubitGate" to
true:

   @code

"gates": {
  "AllocateQubitGate": {
    "draw_id": true,
        "height": 0.15,
        "width": 0.2,
        "pre_offset": 0.1,
        "offset": 0.1
  },
...

  The settings.json file has the following structure:

      @code

  {
    "control": { // settings for control "circle"
    "shadow": false,
        "size": 0.1
  },
    "gate_shadow": true, // enable/disable shadows for all gates
    "gates": {
    "GateClassString": {
      GATE_PROPERTIES
    }
    "GateClassString2": {
    ...
    },
    "lines": { // settings for qubit lines
      "double_classical": true, // draw double-lines for classical bits
      "double_lines_sep": 0.04, // gap between the two lines for double lines
      "init_quantum": true, // start out with quantum bits
      "style": "very thin" // line style
    }
  }

    All gates (except for the ones requiring special treatment) support the
    following properties:

    @code

    "GateClassString": {
    "height": GATE_HEIGHT,
        "width": GATE_WIDTH
    "pre_offset": OFFSET_BEFORE_PLACEMENT,
        "offset": OFFSET_AFTER_PLACEMENT,
  },
 */
export class CircuitDrawer extends BasicEngine {
  /**
   * @constructor
  Initialize a circuit drawing engine.

      The TikZ code generator uses a settings file (settings.json), which
    can be altered by the user. It contains gate widths, heights, offsets,
      etc.

    @param {boolean} accept_input: If accept_input is true, the printer queries
    the user to input measurement results if the CircuitDrawer is
    the last engine. Otherwise, all measurements yield the result
    default_measure (0 or 1).
    @param {number} default_measure: Default value to use as measurement
    results if accept_input is false and there is no underlying
    backend to register real measurement results.
   */
  constructor(accept_input = false, default_measure = 0) {
    super()
    this._accept_input = accept_input
    this._default_measure = default_measure
    this._qubit_lines = {}
    this._free_lines = []
    this._map = {}
  }

  /**
  Specialized implementation of isAvailable: Returns true if the
    CircuitDrawer is the last engine (since it can print any command).

    @param {Command} cmd: Command for which to check availability (all Commands can be printed).
    @return {boolean}: true, unless the next engine cannot handle the Command (if there is a next engine).
   */
  isAvailable(cmd) {
    try {
      return super.isAvailable(cmd)
    } catch (e) {
      if (e instanceof LastEngineError) {
        return true
      }
    }
    return false
  }

  /**
  Sets the qubit lines to use for the qubits explicitly.

      To figure out the qubit IDs, simply use the setting `draw_id` in the
    settings file. It is located in "gates":"AllocateQubitGate".
      If draw_id is true, the qubit IDs are drawn in red.

      @param {Object} idToLoc: Dictionary mapping qubit ids to qubit line numbers.

      @throws {Error}: If the mapping has already begun (this function
  needs be called before any gates have been received).
   */
  setQubitLocations(idToLoc) {
    if (len(this._map) > 0) {
      throw new Error('set_qubit_locations() has to be called before applying gates!')
    }

    const min = Math.min(...Object.keys(idToLoc))
    const max = Math.max(...Object.keys(idToLoc)) + 1
    for (let k = min; k < max; ++k) {
      if (!(k in idToLoc)) {
        throw new Error('set_qubit_locations(): Invalid id_to_loc '
        + 'mapping provided. All ids in the provided'
        + ' range of qubit ids have to be mapped '
        + 'somewhere.')
      }
    }
    this._map = idToLoc
  }

  /**
  Add the command cmd to the circuit diagram, taking care of potential
    measurements as specified in the __init__ function.

    Queries the user for measurement input if a measurement command
    arrives if accept_input was set to true. Otherwise, it uses the
    default_measure parameter to register the measurement outcome.

      @param {Command} cmd: Command to add to the circuit diagram.
   */
  printCMD(cmd) {
    if (cmd.gate.equal(Allocate)) {
      const qubit_id = cmd.qubits[0][0].id
      if (!(qubit_id in this._map)) {
        this._map[qubit_id] = qubit_id
      }
      this._qubit_lines[qubit_id] = []
    }
    if (cmd.gate.equal(Deallocate)) {
      const qubit_id = cmd.qubits[0][0].id
      this._free_lines.push(qubit_id)
    }
    if (this.isLastEngine && cmd.gate === Measure) {
      assert(getControlCount(cmd) === 0)

      cmd.qubits.forEach(qureg => qureg.forEach((qubit) => {
        let m
        if (this._accept_input) {
          // TODO
        } else {
          m = this._default_measure
        }
        this.main.setMeasurementResult(qubit, m)
      }))
    }

    const all_lines = []
    cmd.allQubits.forEach(qr => qr.forEach(qb => all_lines.push(qb.id)))

    const gate = cmd.gate
    const lines = []
    cmd.qubits.forEach(qr => qr.forEach(qb => lines.push(qb.id)))
    const ctrl_lines = cmd.controlQubits.map(qb => qb.id)
    const item = new CircuitItem(gate, lines, ctrl_lines)

    all_lines.forEach(l => this._qubit_lines[l].push(item))
  }

  /**
  Return the latex document string representing the circuit.

      Simply write this string into a tex-file or, alternatively, pipe the
    output directly to, e.g., pdflatex:

  @code

    node my_circuit.js | pdflatex

    where my_circuit.js calls this function and prints it to the terminal.
   @return {string}
   */
  getLatex() {
    const qubit_lines = {}

    const linesCount = len(this._qubit_lines)
    for (let line = 0; line < linesCount; ++line) {
      const new_line = this._map[line]
      qubit_lines[new_line] = []

      this._qubit_lines[line].forEach((cmd) => {
        const lines = cmd.lines.map(qb_id => this._map[qb_id])
        const ctrl_lines = cmd.ctrl_lines.map(qb_id => this._map[qb_id])
        const {gate} = cmd
        const new_cmd = new CircuitItem(gate, lines, ctrl_lines)
        if (gate.equal(Allocate)) {
          new_cmd.id = cmd.lines[0]
        }
        qubit_lines[new_line].push(new_cmd)
      })
    }


    const circuit = []
    Object.keys(qubit_lines).forEach(lines => circuit.push(qubit_lines[lines]))
    return ToLatex.toLatex(qubit_lines)
  }

  /**
  Receive a list of commands from the previous engine, print the
    commands, and then send them on to the next engine.

    @param {Command[]} commandList: List of Commands to print (and potentially send on to the next engine).
  */
  receive(commandList) {
    commandList.forEach((cmd) => {
      if (!(cmd.gate instanceof FlushGate)) {
        this.printCMD(cmd)
      }
      if (!this.isLastEngine) {
        this.send([cmd])
      }
    })
  }
}
