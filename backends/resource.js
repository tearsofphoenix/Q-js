import { BasicEngine } from '../cengines/basics'
import { LastEngineError } from '../meta/error'
import {
  Allocate, Deallocate, FlushGate, Measure
} from '../ops/gates'
import { LogicalQubitIDTag } from '../meta/tag'
import { BasicQubit } from '../types/qubit'
import { getControlCount } from '../meta/control'
import {genString} from '../libs/util'

function parseStringKey(key) {
  return key.split(',')
}
/*
ResourceCounter is a compiler engine which counts the number of gates and
max. number of active qubits.

  Attributes:
gate_counts (dict): Dictionary of gate counts.
  The keys are tuples of the form (cmd.gate, ctrl_cnt), where
ctrl_cnt is the number of control qubits.
gate_class_counts (dict): Dictionary of gate class counts.
The keys are tuples of the form (cmd.gate.__class__, ctrl_cnt),
  where ctrl_cnt is the number of control qubits.
max_width (int): Maximal width (=max. number of active qubits at any
given point).
Properties:
  depth_of_dag (int): It is the longest path in the directed
acyclic graph (DAG) of the program.
 */
export default class ResourceCounter extends BasicEngine {
  constructor() {
    super()
    this.gate_counts = {}
    this.gate_class_counts = {}
    this._active_qubits = 0
    this.max_width = 0
    // key: qubit id, depth of this qubit
    this._depth_of_qubit = {}
    this._previous_max_depth = 0
  }

  /*
  Specialized implementation of is_available: Returns True if the
  ResourceCounter is the last engine (since it can count any command).

Args:
  cmd (Command): Command for which to check availability (all
Commands can be counted).

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
  }

  get depthOfDag() {
    if (this._depth_of_qubit) {
      const current_max = Math.max(...Object.values(this._depth_of_qubit))
      return Math.max(current_max, this._previous_max_depth)
    } else {
      return this._previous_max_depth
    }
  }

  addCMD(cmd) {
    const qid = cmd.qubits[0][0].id
    if (cmd.gate.equal(Allocate)) {
      this._active_qubits += 1
      this._depth_of_qubit[qid] = 0
    } else if (cmd.gate.equal(Deallocate)) {
      this._active_qubits -= 1
      const depth = this._depth_of_qubit[qid]
      this._previous_max_depth = Math.max(this._previous_max_depth, depth)
      delete this._depth_of_qubit[qid]
    } else if (this.isLastEngine && cmd.gate.equal(Measure)) {
      cmd.qubits.forEach((qureg) => {
        qureg.forEach((qubit) => {
          this._depth_of_qubit[qubit.id] += 1
          //  Check if a mapper assigned a different logical id
          let logical_id_tag
          cmd.tags.forEach((tag) => {
            if (tag instanceof LogicalQubitIDTag) {
              logical_id_tag = tag
            }
          })
          if (logical_id_tag) {
            qubit = new BasicQubit(qubit.engine, logical_id_tag.logical_qubit_id)
          }
          this.main.setMeasurementResult(qubit, 0)
        })
      })
    } else {
      const qubit_ids = new Set()
      cmd.allQubits.forEach((qureg) => {
        qureg.forEach((qubit) => {
          qubit_ids.add(qubit.id)
        })
      })
      if (qubit_ids.size === 1) {
        const list = [...qubit_ids]
        this._depth_of_qubit[list[0]] += 1
      } else {
        let max_depth = 0
        qubit_ids.forEach((qubit_id) => {
          max_depth = Math.max(max_depth, this._depth_of_qubit[qubit_id])
        })

        qubit_ids.forEach(qubit_id => this._depth_of_qubit[qubit_id] = max_depth + 1)
      }
    }

    this.max_width = Math.max(this.max_width, this._active_qubits)

    const ctrl_cnt = getControlCount(cmd)
    const gate_description = [cmd.gate, ctrl_cnt]
    const gate_class_description = [cmd.gate.constructor.name, ctrl_cnt]

    try {
      const v = this.gate_counts[gate_description] || 0
      this.gate_counts[gate_description] = v + 1
    } catch (e) {
      console.log(e)
      this.gate_counts[gate_description] = 1
    }

    try {
      const v = this.gate_class_counts[gate_class_description] || 0
      this.gate_class_counts[gate_class_description] = v + 1
    } catch (e) {
      console.log(e)
      this.gate_class_counts[gate_class_description] = 1
    }
  }

  receive(commandList) {
    commandList.forEach((cmd) => {
      if (!(cmd.gate instanceof FlushGate)) {
        this.addCMD(cmd)
      }
      if (!this.isLastEngine) {
        this.send([cmd])
      }
    })
  }

  /*
  Return the string representation of this ResourceCounter.

  Returns:
A summary (string) of resources used, including gates, number of
calls, and max. number of qubits that were active at the same
time.
   */
  toString() {
    console.log(162, this.gate_counts, Object.keys(this.gate_counts))
    if (Object.keys(this.gate_counts).length > 0) {
      const gate_class_list = []
      Object.keys(this.gate_class_counts).forEach((gate_class_description) => {
        const num = this.gate_class_counts[gate_class_description]
        const [gate_class, ctrl_cnt] = parseStringKey(gate_class_description)
        console.log(gate_class, ctrl_cnt, num)
        const name = genString('C', ctrl_cnt) + gate_class
        gate_class_list.push(`${name} : ${num}`)
      })

      const gate_list = []
      Object.keys(this.gate_counts).forEach((gate_description) => {
        const num = this.gate_counts[gate_description]
        const [gate, ctrl_cnt] = parseStringKey(gate_description)
        const name = genString('C', ctrl_cnt) + gate.toString()
        gate_list.push(`${name} : ${num}`)
      })

      return `Gate class counts:\n    ${gate_class_list.join('\n    ')}\n\nGate counts:\n    ${gate_list.join('\n    ')}\n\nMax. width (number of qubits) : ${this.max_width}.`
    } else {
      return '(No quantum resources used)'
    }
  }
}
