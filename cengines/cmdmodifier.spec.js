import {expect} from 'chai'
import { ClassicalInstructionGate, FastForwardingGate } from '../ops/basics'
import {H} from '../ops/gates'
import {DummyEngine} from './testengine'
import {MainEngine} from './main'
import CommandModifier from './cmdmodifier'

describe('cmdmodifier test', () => {
  it('should test_command_modifier', function () {

    const cmd_mod_fun = (cmd) => {
      cmd.tags = "NewTag"
      return cmd
    }

    const backend = new DummyEngine(true)
    const cmd_modifier = new CommandModifier(cmd_mod_fun)
    const main_engine = new MainEngine(backend, [cmd_modifier])
    const qubit = main_engine.allocateQubit()
    H.or(qubit)
    // Test if H gate was sent through forwarder_eng and tag was added
    const received_commands = []
    // Remove Allocate and Deallocate gates
    backend.receivedCommands.forEach(cmd => {
      if (!(cmd.gate instanceof FastForwardingGate || cmd.gate instanceof ClassicalInstructionGate)) {
        received_commands.push(cmd)
      }
    })

    received_commands.forEach(cmd => {
      console.log(cmd.toString())
    })
    expect(received_commands.length).to.equal(1)
    expect(received_commands[0].gate.equal(H)).to.equal(true)
    expect(received_commands[0].tags).to.equal("NewTag")
  });
})