import {BasicEngine} from './basics'
import {FlushGate} from '../ops/gates';
import {ObjectCopy} from '../libs/util';

/*
CompareEngine is an engine which saves all commands. It is only intended
for testing purposes. Two CompareEngine backends can be compared and
return True if they contain the same commmands.

 */
export class CompareEngine extends BasicEngine {
  constructor() {
    super()
    this._l = [[]]
  }

  isAvailable() {
    return true
  }

  cacheCMD(cmd) {
    // are there qubit ids that haven't been added to the list?
    const allQubitIDList = []
    cmd.allQubits.forEach((qureg) => {
      qureg.forEach(qubit => allQubitIDList.push(qubit.id))
    })
    let maxidx = 0
    allQubitIDList.forEach(qid => maxidx = Math.max(maxidx, qid))

    // if so, increase size of list to account for these qubits
    const add = maxidx + 1 - this._l.length
    if (add > 0) {
      for (let i = 0; i < add; ++i) {
        this._l.push([])
      }
    }
    // add gate command to each of the qubits involved
    allQubitIDList.forEach(qid => this._l[qid].push(cmd))
  }

  receive(commandList) {
    const f = new FlushGate()
    commandList.forEach((cmd) => {
      if (!cmd.gate.equal(f)) {
        this.cacheCMD(cmd)
      }
    })

    if (!this.isLastEngine) {
      this.send(commandList)
    }
  }

  compareCMDs(c1, c2) {
    const item = c2.copy()
    item.engine = c1.engine
    return c1.equal(item)
  }

  equal(engine) {
    const len = this._l.length
    if (!(engine instanceof CompareEngine) || len !== engine._l.length) {
      return false
    }

    for (let i = 0; i < len; ++i) {
      const item1 = this._l[i]
      const item2 = engine._l[i]
      if (item1.length !== item2.length) {
        return false
      }
      const total = item1.length
      for (let j = 0; j < total; ++j) {
        if (!this.compareCMDs(item1[j], item2[j])) {
          return false
        }
      }
    }
    return true
  }

  toString() {
    let string = ''
    this._l.forEach((cmds, qubit_id) => {
      string += `Qubit ${qubit_id} : `
      cmds.forEach((command) => {
        string += `${command.toString()}, `
      })
      string = `${string.substring(0, string.length - 2)}\n`
    })
    return string
  }
}

/*
DummyEngine used for testing.

                         The DummyEngine forwards all commands directly to next engine.
    If self.is_last_engine == True it just discards all gates.
    By setting save_commands == True all commands get saved as a
list in self.received_commands. Elements are appended to this
list so they are ordered according to when they are received.
 */
export class DummyEngine extends BasicEngine {
  constructor(saveCommands = false) {
    super()
    this.saveCommands = saveCommands
    this.receivedCommands = []
  }

  isAvailable() {
    return true
  }

  receive(commandList) {
    if (this.saveCommands) {
      this.receivedCommands = this.receivedCommands.concat(commandList)
    }

    if (!this.isLastEngine) {
      this.send(commandList)
    }
  }
}
