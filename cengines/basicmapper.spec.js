import {expect} from 'chai'
import BasicMapperEngine from './basicmapper'
import {DummyEngine} from './testengine'
import { BasicQubit } from '../types/qubit'
import {Command} from '../ops/command'
import {
  Allocate, Deallocate, Measure, FlushGate
} from '../ops/gates'
import {BasicGate} from '../ops/basics'
import { makeTuple } from '../libs/util'
import {LogicalQubitIDTag} from '../meta/tag'

describe('basic mapper test', () => {
  it('should test basic_mapper_engine_send_cmd_with_mapped_ids', () => {
    const mapper = new BasicMapperEngine()
    mapper.currentMapping = {
      0: 3, 1: 2, 2: 1, 3: 0
    }
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    // generate a few commands
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const qb3 = new BasicQubit(null, 3)

    const cmd0 = new Command(null, Allocate, makeTuple([qb0]), [], [])
    const cmd1 = new Command(null, Deallocate, makeTuple([qb1]), [], [])
    const cmd2 = new Command(null, Measure, makeTuple([qb2]), [], ['SomeTag'])
    const cmd3 = new Command(null, new BasicGate(), makeTuple([qb0, qb1], [qb2]), [qb3], [])
    const cmd4 = new Command(null, new FlushGate(), makeTuple([new BasicGate(null, -1)]))
    mapper.sendCMDWithMappedIDs(cmd0)
    mapper.sendCMDWithMappedIDs(cmd1)
    mapper.sendCMDWithMappedIDs(cmd2)
    mapper.sendCMDWithMappedIDs(cmd3)
    mapper.sendCMDWithMappedIDs(cmd4)

    const rcmd0 = backend.receivedCommands[0]
    const rcmd1 = backend.receivedCommands[1]
    const rcmd2 = backend.receivedCommands[2]
    const rcmd3 = backend.receivedCommands[3]
    const rcmd4 = backend.receivedCommands[4]

    expect(rcmd0.gate.equal(Allocate)).to.equal(true)
    expect(rcmd0.qubits).to.deep.equal(makeTuple([qb3]))
    expect(rcmd1.gate.equal(Deallocate)).to.equal(true)
    expect(rcmd1.qubits).to.deep.equal(makeTuple([qb2]))
    expect(rcmd2.gate.equal(Measure)).to.equal(true)
    expect(rcmd2.qubits).to.deep.equal(makeTuple([qb1]))
    expect(rcmd2.tags).to.deep.equal(['SomeTag', LogicalQubitIDTag])

    expect(rcmd3.gate.equal(new BasicGate())).to.equal(true)
    expect(rcmd3.qubits).to.deep.equal(makeTuple([qb3, qb2], [qb1]))
    expect(rcmd3.controlQubits).to.deep.equal([qb0])

    expect(rcmd4.qubits.length).to.equal(1)
    expect(rcmd4.qubits[0].length).to.equal(1)
    expect(rcmd4.qubits[0][0].id).to.equal(-1)
  });
})
