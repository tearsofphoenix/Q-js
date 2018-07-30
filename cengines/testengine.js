import {BasicEngine} from './basics'
import {FlushGate} from '../ops/gates';

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
        this._l.push([[]])
      }
    }
    // add gate command to each of the qubits involved
    allQubitIDList.forEach(qid => this._l[qid].push(cmd))
  }

  receive(commandList) {
    commandList.forEach((cmd) => {
      if (cmd.gate !== FlushGate) {
        this.cacheCMD(cmd)
      }
    })

    if (!this.isLastEngine) {
      this.send(commandList)
    }
  }

  compareCMDs(c1, c2) {
    return c1 == c2
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
