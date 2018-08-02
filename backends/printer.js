
/*
Contains a compiler engine which prints commands to stdout prior to sending
them on to the next engines (see CommandPrinter).
*/
import assert from 'assert'
import {BasicEngine} from '../cengines/basics'
import {FlushGate, Measure} from '../ops/gates'
import {getControlCount} from '../meta/control'
import {LogicalQubitIDTag} from '../meta/tag'
import {BasicQubit} from '../types/qubit'

export default class CommandPrinter extends BasicEngine {
  /*
  CommandPrinter is a compiler engine which prints commands to stdout prior
to sending them on to the next compiler engine.
   */
  /*
  Initialize a CommandPrinter.

    Args:
accept_input (bool): If accept_input is true, the printer queries
the user to input measurement results if the CommandPrinter is
the last engine. Otherwise, all measurements yield
default_measure.
default_measure (bool): Default measurement result (if
    accept_input is False).
in_place (bool): If in_place is true, all output is written on the
same line of the terminal.
   */
  constructor(acceptInput = true, defaultMeasure = false, inPlace = false) {
    super()
    this._acceptInput = acceptInput
    this._defaultMeasure = defaultMeasure
    this._inPlace = inPlace
  }

  /*
  Specialized implementation of is_available: Returns True if the
  CommandPrinter is the last engine (since it can print any command).

Args:
    cmd (Command): Command of which to check availability (all
Commands can be printed).
Returns:
    availability (bool): True, unless the next engine cannot handle
the Command (if there is a next engine).
   */
  isAvailable(cmd) {
    try {
      return super.isAvailable(cmd)
    } catch (e) {
      console.log(e)
    }
    return false
  }

  /*
  Print a command or, if the command is a measurement instruction and
the CommandPrinter is the last engine in the engine pipeline: Query
the user for the measurement result (if accept_input = True) / Set
the result to 0 (if it's False).

Args:
    cmd (Command): Command to print.
   */
  printCMD(cmd) {
    if (this.isLastEngine && cmd.gate.equal(Measure)) {
      assert(getControlCount(cmd) === 0)
      console.log(cmd.toString())
      cmd.qubits.forEach((qureg) => {
        qureg.forEach((qubit) => {
          // ignore input
          const m = this._defaultMeasure
          let logicQubitTag
          cmd.tags.forEach((tag) => {
            if (tag instanceof LogicalQubitIDTag) {
              logicQubitTag = tag
            }
          })

          if (logicQubitTag) {
            this.main.setMeasurementResult(new BasicQubit(qubit.engine, logicQubitTag.logical_qubit_id), m)
          }
        })
      })
    } else if (this._inPlace) {
      console.log(`\0\r\t\x1b[K${cmd.toString()}\r`)
    } else {
      console.log(cmd.toString())
    }
  }

  /*
  Receive a list of commands from the previous engine, print the
commands, and then send them on to the next engine.

    Args:
command_list (list<Command>): List of Commands to print (and
potentially send on to the next engine).
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