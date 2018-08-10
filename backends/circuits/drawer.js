import assert from 'assert'
import {LastEngineError} from '../../meta/error';
import {len} from '../../libs/polyfill';
import {getControlCount} from '../../meta';

import {Allocate, Deallocate, FlushGate, Measure} from '../../ops';
import {BasicEngine} from "../../cengines";

export class CircuitItem {
  /*
  Initialize a circuit item.

    Args:
gate: Gate object.
lines (list<int>): Circuit lines the gate acts on.
ctrl_lines (list<int>): Circuit lines which control the gate.
   */
  constructor(gate, lines, ctrl_lines) {
    this.gate = gate
    this.lines = lines
    this.ctrl_lines = ctrl_lines
    this.id = -1
  }

  equal(other) {
    return other instanceof CircuitItem && this.gate.equal(other.gate) && this.lines === other.lines && this.ctrl_lines == other.ctrl_lines
    && this.id === other.id
  }
}

/*
CircuitDrawer is a compiler engine which generates TikZ code for drawing
  quantum circuits.

    The circuit can be modified by editing the settings.json file which is
generated upon first execution. This includes adjusting the gate width,
    height, shadowing, line thickness, and many more options.

    After initializing the CircuitDrawer, it can also be given the mapping
from qubit IDs to wire location (via the :meth:`set_qubit_locations`
function):

.. code-block:: python

circuit_backend = CircuitDrawer()
circuit_backend.set_qubit_locations({0: 1, 1: 0}) # swap lines 0 and 1
eng = MainEngine(circuit_backend)

... # run quantum algorithm on this main engine

print(circuit_backend.get_latex()) # prints LaTeX code

To see the qubit IDs in the generated circuit, simply set the `draw_id`
option in the settings.json file under "gates":"AllocateQubitGate" to
True:

    .. code-block:: python

"gates": {
  "AllocateQubitGate": {
    "draw_id": True,
        "height": 0.15,
        "width": 0.2,
        "pre_offset": 0.1,
        "offset": 0.1
  },
...

  The settings.json file has the following structure:

      .. code-block:: python

  {
    "control": { # settings for control "circle"
    "shadow": false,
        "size": 0.1
  },
    "gate_shadow": true, # enable/disable shadows for all gates
    "gates": {
    "GateClassString": {
      GATE_PROPERTIES
    }
    "GateClassString2": {
    ...
    },
    "lines": { # settings for qubit lines
      "double_classical": true, # draw double-lines for
          # classical bits
      "double_lines_sep": 0.04, # gap between the two lines
      # for double lines
      "init_quantum": true, # start out with quantum bits
      "style": "very thin" # line style
    }
  }

    All gates (except for the ones requiring special treatment) support the
    following properties:

      .. code-block:: python

    "GateClassString": {
    "height": GATE_HEIGHT,
        "width": GATE_WIDTH
    "pre_offset": OFFSET_BEFORE_PLACEMENT,
        "offset": OFFSET_AFTER_PLACEMENT,
  },
 */
export class CircuitDrawer extends BasicEngine {
  /*
  Initialize a circuit drawing engine.

      The TikZ code generator uses a settings file (settings.json), which
    can be altered by the user. It contains gate widths, heights, offsets,
      etc.

          Args:
    accept_input (bool): If accept_input is true, the printer queries
    the user to input measurement results if the CircuitDrawer is
    the last engine. Otherwise, all measurements yield the result
    default_measure (0 or 1).
    default_measure (bool): Default value to use as measurement
    results if accept_input is False and there is no underlying
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

  /*
  Specialized implementation of is_available: Returns True if the
    CircuitDrawer is the last engine (since it can print any command).

    Args:
        cmd (Command): Command for which to check availability (all
    Commands can be printed).
    Returns:
        availability (bool): True, unless the next engine cannot handle
    the Command (if there is a next engine).
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

  /*
  Sets the qubit lines to use for the qubits explicitly.

      To figure out the qubit IDs, simply use the setting `draw_id` in the
    settings file. It is located in "gates":"AllocateQubitGate".
      If draw_id is True, the qubit IDs are drawn in red.

      Args:
    id_to_loc (dict): Dictionary mapping qubit ids to qubit line
    numbers.

        Raises:
    RuntimeError: If the mapping has already begun (this function
  needs be called before any gates have been received).
   */
  setQubitLocations(idToLoc) {
    if (len(this._map) > 0) {
      throw new Error('set_qubit_locations() has to be called before applying gates!')
    }

    const min = Math.min(idToLoc)
    const max = Math.max(idToLoc) + 1
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

  /*
  Add the command cmd to the circuit diagram, taking care of potential
    measurements as specified in the __init__ function.

    Queries the user for measurement input if a measurement command
    arrives if accept_input was set to True. Otherwise, it uses the
    default_measure parameter to register the measurement outcome.

      Args:
    cmd (Command): Command to add to the circuit diagram.
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
      this._free_lines.append(qubit_id)
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

    all_lines.forEach(l => this._qubit_lines[l].append(item))
  }

  /*
  Return the latex document string representing the circuit.

      Simply write this string into a tex-file or, alternatively, pipe the
    output directly to, e.g., pdflatex:

  .. code-block:: bash

    python3 my_circuit.py | pdflatex

    where my_circuit.py calls this function and prints it to the terminal.
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
        if (gate == Allocate) {
          new_cmd.id = cmd.lines[0]
        }
        qubit_lines[new_line].append(new_cmd)
      })
    }


    const circuit = []
    qubit_lines.forEach(lines => circuit.push(qubit_lines[lines]))
    return to_latex(qubit_lines)
  }

  /*
  Receive a list of commands from the previous engine, print the
    commands, and then send them on to the next engine.

      Args:
    command_list (list<Command>): List of Commands to print (and
    potentially send on to the next engine).
   */
  receiver(commandList) {
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
