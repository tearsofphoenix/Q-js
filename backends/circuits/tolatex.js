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
import fs from 'fs'
import {Decimal} from 'decimal.js'
import {len, narray} from '../../libs/polyfill'
import {
  DaggeredGate, X, Measure, Allocate, Deallocate, Z, Swap, SqrtSwap
} from '../../ops'
import { getInverse } from '../../ops/_cycle'

// decimalToString
function dts(number) {
  return new Decimal(number).toString()
}

function minmax(array) {
  const min = Math.min(...array)
  const max = Math.max(...array)
  return [min, max]
}

function minOfDecimals(decimals = []) {
  let min = new Decimal(0)
  decimals.forEach(d => {
    if (d.lessThan(min)) {
      min = d
    }
  })
  return min
}

function maxOfDecimals(decimals = []) {
  let max = new Decimal(0)
  decimals.forEach(d => {
    if (d.greaterThan(max)) {
      max = d
    }
  })
  return max
}

export const _exports = {
  /*
Write all settings to a json-file.

    Args:
settings (dict): Settings dict to write.
 */
  write_settings(settings) {
    fs.writeFileSync('settings.json', JSON.stringify(settings))
    return settings
  },
  /*
Return the default settings for the circuit drawing function to_latex().

Returns:
    settings (dict): Default circuit settings
 */
  get_default_settings() {
    const settings = {}
    settings.gate_shadow = true
    settings.lines = ({
      'style': 'very thin',
      'double_classical': true,
      'init_quantum': true,
      'double_lines_sep': 0.04
    })
    settings.gates = ({
      'HGate': {
        'width': 0.5,
        'offset': 0.3,
        'pre_offset': 0.1
      },
      'XGate': {
        'width': 0.35,
        'height': 0.35,
        'offset': 0.1
      },
      'SqrtXGate': {
        'width': 0.7,
        'offset': 0.3,
        'pre_offset': 0.1
      },
      'SwapGate': {
        'width': 0.35,
        'height': 0.35,
        'offset': 0.1
      },
      'SqrtSwapGate': {
        'width': 0.35,
        'height': 0.35,
        'offset': 0.1
      },
      'Rx': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'Ry': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'Rz': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'Ph': {
        'width': 1.0,
        'height': 0.8,
        'pre_offset': 0.2,
        'offset': 0.3
      },
      'EntangleGate': {
        'width': 1.8,
        'offset': 0.2,
        'pre_offset': 0.2
      },
      'DeallocateQubitGate': {
        'height': 0.15,
        'offset': 0.2,
        'width': 0.2,
        'pre_offset': 0.1
      },
      'AllocateQubitGate': {
        'height': 0.15,
        'width': 0.2,
        'offset': 0.1,
        'pre_offset': 0.1,
        'draw_id': false,
        'allocate_at_zero': false
      },
      'MeasureGate': {
        'width': 0.75,
        'offset': 0.2,
        'height': 0.5,
        'pre_offset': 0.2
      }
    })
    settings.control = {'size': 0.1, 'shadow': false}
    return settings
  },
  /*
Writes the Latex header using the settings file.

    The header includes all packages and defines all tikz styles.

    Returns:
header (string): Header of the Latex document.
 */
  _header(settings) {
    const packages = ('\\documentclass{standalone}\n\\usepackage[margin=1in]'
      + '{geometry}\n\\usepackage[hang,small,bf]{caption}\n'
      + '\\usepackage{tikz}\n'
      + '\\usepackage{braket}\n\\usetikzlibrary{backgrounds,shadows.'
      + 'blur,fit,decorations.pathreplacing,shapes}\n\n')


    const init = ('\\begin{document}\n'
      + '\\begin{tikzpicture}[scale=0.8, transform shape]\n\n')

    let gate_style = ('\\tikzstyle{basicshadow}=[blur shadow={shadow blur steps=8,'
      + ' shadow xshift=0.7pt, shadow yshift=-0.7pt, shadow scale='
      + '1.02}]')

    if (!(settings.gate_shadow || settings.control.shadow)) {
      gate_style = ''
    }
    gate_style += '\\tikzstyle{basic}=[draw,fill=white,'
    if (settings.gate_shadow) {
      gate_style += 'basicshadow'
    }
    gate_style += ']\n'

    gate_style += (`\\tikzstyle{operator}=[basic,minimum size=1.5em]\n\\tikzstyle{phase}=[fill=black,shape=circle,minimum size=${settings.control.size}cm,inner sep=0pt,outer sep=0pt,draw=black`
    )
    if (settings.control.shadow) {
      gate_style += ',basicshadow'
    }
    gate_style += (`]\n\\tikzstyle{none}=[inner sep=0pt,outer sep=-.5pt,minimum height=0.5cm+1pt]
\\tikzstyle{measure}=[operator,inner sep=0pt,minimum height=${settings.gates.MeasureGate.height}cm, minimum width=${settings.gates.MeasureGate.width}cm]
\\tikzstyle{xstyle}=[circle,basic,minimum height=`)
    const x_gate_radius = Math.min(settings.gates.XGate.height, settings.gates.XGate.width)
    gate_style += (`${x_gate_radius}cm,minimum width=${x_gate_radius}cm,inner sep=-1pt,${settings.lines.style}]\n`)
    if (settings.gate_shadow) {
      gate_style += ('\\tikzset{\nshadowed/.style={preaction={transform '
        + 'canvas={shift={(0.5pt,-0.5pt)}}, draw=gray, opacity='
        + '0.4}},\n}\n')
    }
    gate_style += '\\tikzstyle{swapstyle}=['
    gate_style += 'inner sep=-1pt, outer sep=-1pt, minimum width=0pt]\n'
    const edge_style = (`\\tikzstyle{edgestyle}=[${settings.lines.style
    }]\n`)

    return packages + init + gate_style + edge_style
  },
  /*
Return the body of the Latex document, including the entire circuit in
TikZ format.

    Args:
circuit (list<list<CircuitItem>>): Circuit to draw.

    Returns:
tex_str (string): Latex string to draw the entire circuit.
 */
  _body(circuit, settings) {
    const code = []

    const conv = new _Circ2Tikz(settings, len(circuit))
    Object.keys(circuit).forEach((_, line) => code.push(conv.to_tikz(line, circuit)))

    return code.join('')
  },

  /*
  Return the footer of the Latex document.

      Returns:
  tex_footer_str (string): Latex document footer.
   */
  _footer() {
    return '\n\n\\end{tikzpicture}\n\\end{document}'
  }

}


/*
Translates a given circuit to a TikZ picture in a Latex document.

    It uses a json-configuration file which (if it does not exist) is created
automatically upon running this function for the first time. The config
file can be used to determine custom gate sizes, offsets, etc.

    New gate options can be added under settings['gates'], using the gate
class name string as a key. Every gate can have its own width, height, pre
offset and offset.

    Example:
.. code-block:: python

settings['gates']['HGate'] = {'width': .5, 'offset': .15}

The default settings can be acquired using the get_default_settings()
function, and written using write_settings().

    Args:
circuit (list<list<CircuitItem>>): Each qubit line is a list of
CircuitItem objects, i.e., in circuit[line].

    Returns:
tex_doc_str (string): Latex document string which can be compiled
using, e.g., pdflatex.
 */
function toLatex(circuit) {
  let content
  let settings
  let text
  if (fs.existsSync('settings.json')) {
    content = fs.readFileSync('settings.json')
    try {
      settings = JSON.parse(content)
    } catch (e) {
      settings = _exports.get_default_settings()
      _exports.write_settings(settings)
    }
  } else {
    settings = _exports.get_default_settings()
    _exports.write_settings(settings)
  }

  text = _exports._header(settings)
  text += _exports._body(circuit, settings)
  text += _exports._footer(settings)

  return text
}

_exports.toLatex = toLatex

/*
The Circ2Tikz class takes a circuit (list of lists of CircuitItem objects)
and turns them into Latex/TikZ code.

    It uses the settings dictionary for gate offsets, sizes, spacing, ...
 */
export class _Circ2Tikz {
  /*
  Initialize a circuit to latex converter object.

    Args:
settings (dict): Dictionary of settings to use for the TikZ image.
num_lines (int): Number of qubit lines to use for the entire
circuit.
   */
  constructor(settings, num_lines) {
    this.settings = settings
    this.pos = narray(() => new Decimal(0.0), num_lines)
    this.op_count = narray(0, num_lines)
    this.is_quantum = narray(settings.lines.init_quantum, num_lines)
  }

  /*
  Generate the TikZ code for one line of the circuit up to a certain
  gate.

  It modifies the circuit to include only the gates which have not been
  drawn. It automatically switches to other lines if the gates on those
  lines have to be drawn earlier.

  Args:
      line (int): Line to generate the TikZ code for.
  circuit (list<list<CircuitItem>>): The circuit to draw.
  end (int): Gate index to stop at (for recursion).

  Returns:
      tikz_code (string): TikZ code representing the current qubit line
  and, if it was necessary to draw other lines, those lines as
  well.
   */
  to_tikz(line, circuit, end) {
    if (typeof end === 'undefined') {
      end = len(circuit[line])
    }
    const tikz_code = []

    const cmds = circuit[line]
    for (let i = 0; i < end; ++i) {
      const {gate, lines, ctrl_lines} = cmds[i]
      let all_lines = lines.concat(ctrl_lines)
      const idx = all_lines.indexOf(line)
      all_lines.splice(idx, 1) // remove current line
      all_lines.forEach((l) => {
        let gate_idx = 0
        while (!circuit[l][gate_idx].equal(cmds[i])) {
          gate_idx += 1
        }

        tikz_code.push(this.to_tikz(l, circuit, gate_idx))
        // we are taking care of gate 0 (the current one)
        circuit[l] = circuit[l].slice(1)
      })

      all_lines = lines.concat(ctrl_lines)
      const tmp = []
      const [min, max] = minmax(all_lines)
      for (let l = min; l < max + 1; ++l) {
        tmp.push(this.pos[l])
      }
      const pos = maxOfDecimals(tmp)
      for (let l = min; l < max + 1; ++l) {
        this.pos[l] = pos.add(this._gate_offset(gate))
      }

      let connections = ''
      all_lines.forEach((l) => {
        connections += this._line(this.op_count[l] - 1, this.op_count[l], l)
      })

      let add_str = ''
      if (gate.equal(X)) {
        // draw NOT-gate with controls
        add_str = this._x_gate(lines, ctrl_lines)
        // and make the target qubit quantum if one of the controls is
        if (!this.is_quantum[lines[0]]) {
          let sum = 0
          ctrl_lines.forEach(iL => sum += this.is_quantum[iL])
          if (sum > 0) {
            this.is_quantum[lines[0]] = true
          }
        }
      } else if (gate.equal(Z) && len(ctrl_lines) > 0) {
        add_str = this._cz_gate(lines.concat(ctrl_lines))
      } else if (gate.equal(Swap)) {
        add_str = this._swap_gate(lines, ctrl_lines)
      } else if (gate.equal(SqrtSwap)) {
        add_str = this._sqrtswap_gate(lines, ctrl_lines, false)
      } else if (gate.equal(getInverse(SqrtSwap))) {
        add_str = this._sqrtswap_gate(lines, ctrl_lines, true)
      } else if (gate.equal(Measure)) {
        // draw measurement gate
        lines.forEach((l) => {
          const op = this._op(l)
          const width = this._gate_width(Measure)
          const height = this._gate_height(Measure)
          const shift0 = new Decimal(height).mul(0.07)
          const shift1 = new Decimal(height).mul(0.36)
          const shift2 = new Decimal(width).mul(0.1)

          add_str += `\n\\node[measure,edgestyle] (${op}) at (${dts(this.pos[l])},-${l}) {};`
          add_str += `\n\\draw[edgestyle] ([yshift=-${shift1}cm,xshift=${shift2}cm]${op}.west) to [out=60,in=180] ([yshift=${shift0}cm]${op}.center) to [out=0, in=120] ([yshift=-${shift1}cm,xshift=-${shift2}cm]${op}.east);`
          add_str += `\n\\draw[edgestyle] ([yshift=-${shift1}cm]${op}.center) to ([yshift=-${shift2}cm,xshift=-${shift1}cm]${op}.north east);`

          this.op_count[l] += 1
          this.pos[l] = this.pos[l].add(this._gate_width(gate)).add(this._gate_offset(gate))
          this.is_quantum[l] = false
        })
      } else if (gate.equal(Allocate)) {
        // draw 'begin line'
        let id_str = ''
        if (this.settings.gates.AllocateQubitGate.draw_id) {
          id_str = `^{\\textcolor{red}{${cmds[i].id}}}`
        }
        let xpos = this.pos[line]

        if (this.settings.gates.AllocateQubitGate.allocate_at_zero) {
          this.pos[line] = xpos.sub(this._gate_pre_offset(gate))
          xpos = new Decimal(this._gate_pre_offset(gate))
        }
        this.pos[line] = maxOfDecimals([xpos.add(this._gate_offset(gate)).add(this._gate_width(gate)), this.pos[line]])
        add_str = `\n\\node[none] (${this._op(line)}) at (${dts(xpos)},-${line}) {$\\Ket{0}${id_str}$};`
        this.op_count[line] += 1
        this.is_quantum[line] = this.settings.lines.init_quantum
      } else if (gate.equal(Deallocate)) {
        // draw 'end of line'
        const op = this._op(line)
        add_str = `\n\\node[none] (${op}) at (${dts(this.pos[line])},-${line}) {};`
        const yshift = `${this._gate_height(gate)}cm]`
        add_str += `\n\\draw ([yshift=${yshift}${op}.center) edge [edgestyle] ([yshift=-${yshift}${op}.center);`

        this.op_count[line] += 1
        this.pos[line] = this.pos[line].add(this._gate_width(gate)).add(this._gate_offset(gate))
      } else {
        // regular gate must draw the lines it does not act upon
        // if it spans multiple qubits
        add_str = this._regular_gate(gate, lines, ctrl_lines)
        lines.forEach(l => this.is_quantum[l] = true)
      }
      tikz_code.push(add_str)
      if (!gate.equal(Allocate)) {
        tikz_code.push(connections)
      }
    }

    circuit[line] = circuit[line].slice(end)
    return tikz_code.join('')
  }

  /*
  Return the string representation of the gate.

    Tries to use gate.tex_str and, if that is not available, uses str(gate)
instead.

    Args:
gate: Gate object of which to get the name / latex representation.

    Returns:
gate_name (string): Latex gate name.
*/
  _gate_name(gate) {
    let name
    if (gate.texString) {
      name = gate.texString()
    }
    name = gate.toString()
    return name
  }

  /*
  Return the TikZ code for a Square-root Swap-gate.

    Args:
lines (list<int>): List of length 2 denoting the target qubit of
the Swap gate.
ctrl_lines (list<int>): List of qubit lines which act as controls.
daggered (bool): Show the daggered one if true.
   */
  _sqrtswap_gate(lines, ctrl_lines, daggered) {
    assert(len(lines) === 2) // sqrt swap gate acts on 2 qubits
    const delta_pos = this._gate_offset(SqrtSwap)
    const gate_width = this._gate_width(SqrtSwap)
    lines.sort()

    let gate_str = ''
    lines.forEach((line) => {
      const op = this._op(line)
      const w = `${new Decimal(gate_width).mul(0.5).toString()}cm`
      const s1 = `[xshift=-${w},yshift=-${w}]${op}.center`
      const s2 = `[xshift=${w},yshift=${w}]${op}.center`
      const s3 = `[xshift=-${w},yshift=${w}]${op}.center`
      const s4 = `[xshift=${w},yshift=-${w}]${op}.center`
      let swap_style = 'swapstyle,edgestyle'
      if (this.settings.gate_shadow) {
        swap_style += ',shadowed'
      }
      gate_str += `\n\\node[swapstyle] (${op}) at (${dts(this.pos[line])},-${line}) {};`
      gate_str += `\n\\draw[${swap_style}] (${s1})--(${s2});`
      gate_str += `\n\\draw[${swap_style}] (${s3})--(${s4});`
    })

    // add a circled 1/2
    const midpoint = (lines[0] + lines[1]) / 2.0
    const pos = this.pos[lines[0]]
    const op_mid = `line${lines[0]}-${lines[1]}_gate${this.op_count[lines[0]]}`
    gate_str += `\n\\node[xstyle] (${op_mid}) at (${dts(pos)},-${midpoint})\
                {\\scriptsize $\\frac{1}{2}${daggered ? '^{{\\dagger}}' : ''}$};`

    // add two vertical lines to connect circled 1/2
    gate_str += `\n\\draw (${this._op(lines[0])}) edge[edgestyle] (${op_mid});`
    gate_str += `\n\\draw (${op_mid}) edge[edgestyle] (${this._op(lines[1])});`


    ctrl_lines.forEach((ctrl) => {
      gate_str += this._phase(ctrl, this.pos[lines[0]])
      if (ctrl > lines[1] || ctrl < lines[0]) {
        let closer_line = lines[0]
        if (ctrl > lines[1]) {
          closer_line = lines[1]
        }
        gate_str += this._line(ctrl, closer_line)
      }
    })

    const all_lines = ctrl_lines.concat(lines)
    const new_pos = this.pos[lines[0]].add(delta_pos).add(gate_width)
    all_lines.forEach(i => this.op_count[i] += 1)
    const [min, max] = minmax(all_lines)
    for (let i = min; i < max + 1; ++i) {
      this.pos[i] = new_pos
    }
    return gate_str
  }

  /*
  Return the TikZ code for a Swap-gate.

    Args:
lines (list<int>): List of length 2 denoting the target qubit of
the Swap gate.
ctrl_lines (list<int>): List of qubit lines which act as controls.
   */
  _swap_gate(lines, ctrl_lines) {
    assert(len(lines) === 2) // swap gate acts on 2 qubits
    const delta_pos = this._gate_offset(Swap)
    const gate_width = this._gate_width(Swap)
    lines.sort()

    let gate_str = ''
    lines.forEach((line) => {
      const op = this._op(line)
      const w = `${new Decimal(gate_width).mul(0.5)}cm`
      const s1 = `[xshift=-${w},yshift=-${w}]${op}.center`
      const s2 = `[xshift=${w},yshift=${w}]${op}.center`
      const s3 = `[xshift=-${w},yshift=${w}]${op}.center`
      const s4 = `[xshift=${w},yshift=-${w}]${op}.center`
      let swap_style = 'swapstyle,edgestyle'
      if (this.settings.gate_shadow) {
        swap_style += ',shadowed'
      }
      gate_str += `\n\\node[swapstyle] (${op}) at (${dts(this.pos[line])},-${line}) {};`
      gate_str += `\n\\draw[${swap_style}] (${s1})--(${s2});`
      gate_str += `\n\\draw[${swap_style}] (${s3})--(${s4});`
    })

    gate_str += this._line(lines[0], lines[1])

    ctrl_lines.forEach((ctrl) => {
      gate_str += this._phase(ctrl, this.pos[lines[0]])
      if (ctrl > lines[1] || ctrl < lines[0]) {
        let closer_line = lines[0]
        if (ctrl > lines[1]) {
          closer_line = lines[1]
        }
        gate_str += this._line(ctrl, closer_line)
      }
    })

    const all_lines = ctrl_lines.concat(lines)
    const new_pos = this.pos[lines[0]].add(delta_pos).add(gate_width)
    all_lines.forEach(i => this.op_count[i] += 1)
    const [min, max] = minmax(all_lines)
    for (let i = min; i < max + 1; ++i) {
      this.pos[i] = new_pos
    }
    return gate_str
  }

  /*
  Return the TikZ code for a NOT-gate.

    Args:
lines (list<int>): List of length 1 denoting the target qubit of
the NOT / X gate.
ctrl_lines (list<int>): List of qubit lines which act as controls.
   */
  _x_gate(lines, ctrl_lines = []) {
    assert(len(lines) === 1) // NOT gate only acts on 1 qubit
    const line = lines[0]
    const delta_pos = this._gate_offset(X)
    const gate_width = this._gate_width(X)
    const op = this._op(line)
    let gate_str = `\n\\node[xstyle] (${op}) at (${dts(this.pos[line])},-${line}) {};`
    gate_str += `\n\\draw[edgestyle] (${op}.north)--(${op}.south);`
    gate_str += `\n\\draw[edgestyle] (${op}.west)--(${op}.east);`

    ctrl_lines.forEach((ctrl) => {
      gate_str += this._phase(ctrl, this.pos[line])
      gate_str += this._line(ctrl, line)
    })

    ctrl_lines.push(line)
    const all_lines = ctrl_lines
    const new_pos = this.pos[line].add(delta_pos).add(gate_width)
    all_lines.forEach(i => this.op_count[i] += 1)
    const [min, max] = minmax(all_lines)
    for (let i = min; i < max + 1; ++i) {
      this.pos[i] = new_pos
    }
    return gate_str
  }

  /*
  Return the TikZ code for an n-controlled Z-gate.

    Args:
lines (list<int>): List of all qubits involved.
   */
  _cz_gate(lines) {
    assert(len(lines) > 1)
    const line = lines[0]
    const delta_pos = this._gate_offset(Z)
    const gate_width = this._gate_width(Z)
    let gate_str = this._phase(line, this.pos[line])

    lines.slice(1).forEach((ctrl) => {
      gate_str += this._phase(ctrl, this.pos[line])
      gate_str += this._line(ctrl, line)
    })

    const new_pos = this.pos[line].add(delta_pos).add(gate_width)
    lines.forEach(i => this.op_count[i] += 1)
    const [min, max] = minmax(lines)
    for (let i = min; i < max + 1; ++i) {
      this.pos[i] = new_pos
    }
    return gate_str
  }

  /*
  Return the gate width, using the settings (if available).

Returns:
    gate_width (float): Width of the gate.
(settings['gates'][gate_class_name]['width'])
   */
  _gate_width(gate) {
    if (gate instanceof DaggeredGate) {
      gate = gate.gate
    }

    const {gates} = this.settings
    const config = gates[gate.constructor.name] || {}
    return config.width || 0.5
  }

  /*
  Return the offset to use before placing this gate.

    Returns:
gate_pre_offset (float): Offset to use before the gate.
(settings['gates'][gate_class_name]['pre_offset'])
   */
  _gate_pre_offset(gate) {
    if (gate instanceof DaggeredGate) {
      gate = gate._gate
    }

    const {gates} = this.settings
    return gates[gate.constructor.name].pre_offset || this._gate_offset(gate)
  }

  /*
  Return the offset to use after placing this gate and, if no pre_offset
is defined, the same offset is used in front of the gate.

    Returns:
gate_offset (float): Offset.
(settings['gates'][gate_class_name]['offset'])
   */
  _gate_offset(gate) {
    if (gate instanceof DaggeredGate) {
      gate = gate.gate
    }
    const {gates} = this.settings
    const config = gates[gate.constructor.name] || {}
    return config.offset || 0.2
  }

  /*
  Return the height to use for this gate.

    Returns:
gate_height (float): Height of the gate.
(settings['gates'][gate_class_name]['height'])
   */
  _gate_height(gate) {
    if (gate instanceof DaggeredGate) {
      gate = gate.gate
    }
    const config = this.settings.gates[gate.constructor.name] || {}
    return config.height || 0.5
  }

  /*
  Places a phase / control circle on a qubit line at a given position.

    Args:
line (int): Qubit line at which to place the circle.
pos (float): Position at which to place the circle.

    Returns:
tex_str (string): Latex string representing a control circle at the
given position.
   */
  _phase(line, pos) {
    return `\n\\node[phase] (${this._op(line)}) at (${dts(pos)},-${line}) {};`
  }

  /*
  Returns the gate name for placing a gate on a line.

    Args:
line (int): Line number.
op (int): Operation number or, by default, uses the current op
count.

    Returns:
op_str (string): Gate name.
   */
  _op(line, op = null, offset = 0) {
    if (op === null) {
      op = this.op_count[line] || 0
    }
    return `line${line}_gate${op + offset}`
  }

  /*
  Connects p1 and p2, where p1 and p2 are either to qubit line indices,
in which case the two most recent gates are connected, or two gate
indices, in which case line denotes the line number and the two gates
are connected on the given line.

    Args:
p1 (int): Index of the first object to connect.
p2 (int): Index of the second object to connect.
double (bool): Draws double lines if true.
line (int or None): Line index - if provided, p1 and p2 are gate
indices.

    Returns:
tex_str (string): Latex code to draw this / these line(s).
   */
  _line(p1, p2, line = null) {
    const dbl_classical = this.settings.lines.double_classical

    let quantum
    let op1
    let op2
    let loc1
    let loc2
    let shift
    if (line === null) {
      quantum = !dbl_classical || this.is_quantum[p1]
      op1 = this._op(p1)
      op2 = this._op(p2)
      loc1 = 'north'
      loc2 = 'south'
      shift = 'xshift='
    } else {
      quantum = !dbl_classical || this.is_quantum[line]
      op1 = this._op(line, p1)
      op2 = this._op(line, p2)
      loc1 = 'west'
      loc2 = 'east'
      shift = 'yshift='
    }
    if (quantum) {
      return `\n\\draw (${op1}) edge[edgestyle] (${op2});`
    } else {
      if (p2 > p1) {
        const tmp = loc1
        loc1 = loc2
        loc2 = tmp
      }
      const line_sep = this.settings.lines.double_lines_sep
      const shift1 = `${shift}${line_sep / 2.0}cm`
      const shift2 = `${shift}${-line_sep / 2.0}cm`
      let edges_str = `\n\\draw ([${shift1}]${op1}.${loc1}) edge[edgestyle] ([${shift2}]${op2}.${loc2});`
      edges_str += `\n\\draw ([${shift2}]${op1}.${loc1}) edge[edgestyle] ([${shift2}]${op2}.${loc2});`
      return edges_str
    }
  }

  /*
  Draw a regular gate.

    Args:
gate: Gate to draw.
lines (list<int>): Lines the gate acts on.
ctrl_lines (list<int>): Control lines.

    Returns:
tex_str (string): Latex string drawing a regular gate at the given
location
   */
  _regular_gate(gate, lines, ctrl_lines) {
    const [imin, imax] = minmax(lines)

    const gate_lines = lines.concat(ctrl_lines)

    const delta_pos = this._gate_offset(gate)
    const gate_width = this._gate_width(gate)
    const gate_height = this._gate_height(gate)

    const name = this._gate_name(gate)

    lines = []
    for (let i = imin; i < imax + 1; ++i) {
      lines.push(i)
    }

    let tex_str = ''
    const pos = this.pos[lines[0]]

    lines.forEach((l) => {
      const node1 = `\n\\node[none] (${this._op(l)}) at (${dts(pos)},-${l}) {};`
      const at = pos.add(new Decimal(gate_width).div(2.0)).toString()
      const node2 = `\n\\node[none,minimum height=${gate_height}cm,outer sep=0] (${this._op(l, null, 1)}) at (${at},-${l}) {};`
      const node3 = `\n\\node[none] (${this._op(l, null, 2)}) at (${dts(pos.add(gate_width))},-${l}) {};`
      tex_str += node1 + node2 + node3
      if (!gate_lines.includes(l)) {
        tex_str += this._line(this.op_count[l] - 1, this.op_count[l], l)
      }
    })

    const half_height = 0.5 * gate_height
    const op1 = this._op(imin)
    const op2 = this._op(imax, null, 2)
    tex_str += `\n\\draw[operator,edgestyle,outer sep=${gate_width}cm] ([yshift=${half_height}cm]${op1}) rectangle ([yshift=-${half_height}cm]${op2}) node[pos=.5] {${name}};`

    lines.forEach((l) => {
      this.pos[l] = new Decimal(pos).add(new Decimal(gate_width).div(2.0))
      this.op_count[l] += 1
    })

    ctrl_lines.forEach((ctrl) => {
      if (!lines.includes(ctrl)) {
        tex_str += this._phase(ctrl, pos.add(new Decimal(gate_width).div(2.0)))
        let connect_to = imax
        if (Math.abs(connect_to - ctrl) > Math.abs(imin - ctrl)) {
          connect_to = imin
        }
        tex_str += this._line(ctrl, connect_to)
        this.pos[ctrl] = new Decimal(pos).add(delta_pos).add(gate_width)
        this.op_count[ctrl] += 1
      }
    })

    lines.forEach(l => this.op_count[l] += 2)

    const all = ctrl_lines.concat(lines)
    const [min, max] = minmax(all)
    for (let l = min; l < max + 1; ++l) {
      this.pos[l] = pos.add(delta_pos).add(gate_width)
    }
    return tex_str
  }
}

export default _exports
