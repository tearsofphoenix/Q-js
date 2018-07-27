/*
Defines the parent class from which all mappers should be derived.

    There is only one engine currently allowed to be derived from
BasicMapperEngine. This allows the simulator to automatically translate
logical qubit ids to mapped ids.
*/

import {BasicEngine} from './basics'
import {LogicalQubitIDTag} from '../meta/logicalqubit'
import {dropEngineAfter, insertEngine} from "../meta/util"
import {MeasureGate} from '../ops/gates'

export class BasicMapperEngine extends BasicEngine {
  /*
  Parent class for all Mappers.

    Attributes:
self.current_mapping (dict): Keys are the logical qubit ids and values
are the mapped qubit ids.
   */
  constructor() {
    super()
    this._currentMapping = null
  }

  get currentMapping() {
    return this._currentMapping
  }

  set currentMapping(newMap) {
    this._currentMapping = newMap
  }

  /*
  Send this Command using the mapped qubit ids of self.current_mapping.

    If it is a Measurement gate, then it adds a LogicalQubitID tag.

    Args:
cmd: Command object with logical qubit ids.
   */
  sendCMDWithMappedIDs(cmd) {
    const newCMD = cmd.copy()
    const qubits = newCMD.qubits
    qubits.forEach(qureg => {
      qureg.forEach(qubit => {
        if (qubit.id !== -1) {
          qubit.id = this.currentMapping[qubit.id]
        }
      })
    })
    const controlQubits = newCMD.controlQubits()
    controlQubits.forEach(qubit => {
      qubit.id = this.currentMapping[qubit.id]
    })
    if (newCMD.gate instanceof MeasureGate) {
      assert(newCMD.qubits.length === 1 && newCMD.qubits[0] === 1)
      // Add LogicalQubitIDTag to MeasureGate
      const add_logical_id = function (command, old_tags = cmd.tags) {
        command.tags = (old_tags.push(new LogicalQubitIDTag(cmd.qubits[0][0].id)))
        return command
      }

      const tagger_eng = new CommandModifier(add_logical_id)
      insertEngine(this, tagger_eng)
      this.send([newCMD])
      dropEngineAfter(this)
    } else {
      this.send([newCMD])
    }
  }
}
