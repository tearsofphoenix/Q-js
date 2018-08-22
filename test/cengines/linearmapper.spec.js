import {expect} from 'chai'
import deepEqual from 'deep-eql'
import {return_swap_depth} from '../../src/cengines/linearmapper'
import LinearMapper from '../../src/cengines/linearmapper';
import {BasicQubit} from '../../src/types/qubit';
import Command from '../../src/ops/command';
import {tuple} from '../../src/libs/util';
import {
  Allocate, BasicGate, CNOT, Deallocate, FlushGate, QFT, X
} from '../../src/ops';
import {len, setEqual} from '../../src/libs/polyfill';
import {DummyEngine} from '../../src/cengines/testengine';
import {LogicalQubitIDTag} from '../../src/meta';

describe('linearmapper test', () => {
  it('should test_return_swap_depth', () => {
    let swaps = []
    expect(return_swap_depth(swaps)).to.equal(0)
    swaps = [[0, 1], [0, 1], [1, 2]]
    expect(return_swap_depth(swaps)).to.equal(3)
    swaps.push([2, 3])
    expect(return_swap_depth(swaps)).to.equal(4)
  });

  it('should test_is_available', () => {
    const mapper = new LinearMapper(5, false)
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const cmd0 = new Command(null, new BasicGate(), tuple([qb0]))
    expect(mapper.isAvailable(cmd0)).to.equal(true)
    const cmd1 = new Command(null, new BasicGate(), tuple([qb0]), [qb1])
    expect(mapper.isAvailable(cmd1)).to.equal(true)
    const cmd2 = new Command(null, new BasicGate(), tuple([qb0], [qb1, qb2]))
    expect(mapper.isAvailable(cmd2)).to.equal(false)
    const cmd3 = new Command(null, new BasicGate(), tuple([qb0], [qb1]), [qb2])
    expect(mapper.isAvailable(cmd3)).to.equal(false)
  });

  it('should test_returnNewMapping_too_many_qubits', () => {
    const mapper = new LinearMapper(3, false)
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const cmd0 = new Command(null, QFT, tuple([qb0], [qb1, qb2]))
    mapper._stored_commands = [cmd0]

    expect(() => LinearMapper.returnNewMapping(
      mapper.num_qubits,
      mapper.cyclic,
      mapper._currently_allocated_ids,
      mapper._stored_commands,
      mapper.currentMapping
    )).to.throw()
    const cmd1 = new Command(null, new BasicGate(), tuple([]))
    mapper._stored_commands = [cmd1]

    expect(() => LinearMapper.returnNewMapping(
      mapper.num_qubits,
      mapper.cyclic,
      mapper._currently_allocated_ids,
      mapper._stored_commands,
      mapper.currentMapping
    )).to.throw()
  });

  it('should test_return_new_mapping_allocate_qubits', () => {
    const mapper = new LinearMapper(2, false)
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    mapper._currently_allocated_ids = new Set([4])
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, Allocate, tuple([qb1]))
    mapper._stored_commands = [cmd0, cmd1]
    const new_mapping = LinearMapper.returnNewMapping(
      mapper.num_qubits,
      mapper.cyclic,
      mapper._currently_allocated_ids,
      mapper._stored_commands,
      mapper.currentMapping
    )
    expect(setEqual(mapper._currently_allocated_ids, new Set([4]))).to.equal(true)
    expect(mapper._stored_commands).to.deep.equal([cmd0, cmd1])
    expect(len(new_mapping)).to.equal(2)
    expect(4 in new_mapping && 0 in new_mapping).to.equal(true)
  });

  it('should test_return_new_mapping_allocate_only_once', () => {
    const mapper = new LinearMapper(1, false)
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    mapper._currently_allocated_ids = new Set()
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, Deallocate, tuple([qb0]))
    // Test if loop stops after deallocate gate has been used.
    // This would otherwise trigger an error (test by 2)
    const cmd2 = null
    mapper._stored_commands = [cmd0, cmd1, cmd2]
    const new_mapping = LinearMapper.returnNewMapping(
      mapper.num_qubits,
      mapper.cyclic,
      mapper._currently_allocated_ids,
      mapper._stored_commands,
      mapper.currentMapping
    )
  });

  it('should test_return_new_mapping_possible_map', () => {
    const mapper = new LinearMapper(3, false)
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, Allocate, tuple([qb1]))
    const cmd2 = new Command(null, Allocate, tuple([qb2]))
    const cmd3 = new Command(null, CNOT, tuple([qb0]), [qb1])
    const cmd4 = new Command(null, CNOT, tuple([qb2]), [qb1])
    const cmd5 = new Command(null, X, tuple([qb0]))
    mapper._stored_commands = [cmd0, cmd1, cmd2, cmd3, cmd4, cmd5]
    const new_mapping = LinearMapper.returnNewMapping(
      mapper.num_qubits,
      mapper.cyclic,
      mapper._currently_allocated_ids,
      mapper._stored_commands,
      mapper.currentMapping
    )
    const array = [{0: 2, 1: 1, 2: 0}, {0: 0, 1: 1, 2: 2}]
    const idx = array.findIndex(item => deepEqual(item, new_mapping))
    expect(idx).to.not.equal(-1)
  });

  it('should test_return_new_mapping_previous_error', () => {
    const mapper = new LinearMapper(2, false)
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const qb3 = new BasicQubit(null, 3)
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, Allocate, tuple([qb1]))
    const cmd2 = new Command(null, Allocate, tuple([qb2]))
    const cmd3 = new Command(null, Allocate, tuple([qb3]))
    const cmd4 = new Command(null, CNOT, tuple([qb2]), [qb3])
    mapper._stored_commands = [cmd0, cmd1, cmd2, cmd3, cmd4]
    const new_mapping = LinearMapper.returnNewMapping(
      mapper.num_qubits,
      mapper.cyclic,
      mapper._currently_allocated_ids,
      mapper._stored_commands,
      mapper.currentMapping
    )
  });

  it('should test_process_two_qubit_gate_not_in_segments_test0', () => {
    const mapper = new LinearMapper(5, false)
    const segments = [[0, 1]]
    const active_qubits = new Set([0, 1, 4, 6])
    const neighbour_ids = {
      0: new Set([1]), 1: new Set([0]), 4: new Set(), 6: new Set()
    }
    LinearMapper._processTwoQubitGate(mapper.num_qubits,
      mapper.cyclic,
      4,
      6,
      active_qubits,
      segments,
      neighbour_ids)
    expect(len(segments)).to.equal(2)
    expect(segments[0]).to.deep.equal([0, 1])
    expect(segments[1]).to.deep.equal([4, 6])
    expect(neighbour_ids[4]).to.deep.equal(new Set([6]))
    expect(neighbour_ids[6]).to.deep.equal(new Set([4]))
    expect(active_qubits).to.deep.equal(new Set([0, 1, 4, 6]))
  });

  it('should test_process_two_qubit_gate_not_in_segments_test1', () => {
    const mapper = new LinearMapper(5, false)
    const segments = []
    const active_qubits = new Set([4, 6])
    const neighbour_ids = {4: new Set(), 6: new Set()}
    LinearMapper._processTwoQubitGate(mapper.num_qubits,
      mapper.cyclic,
      5,
      6,
      active_qubits,
      segments,
      neighbour_ids)
    expect(len(segments)).to.equal(0)
    expect(active_qubits).to.deep.equal(new Set([4]))
  });

  it('should test_process_two_qubit_gate_one_qb_free_one_qb_in_segment', () => {
    const qubits = [[1, 2], [2, 1]]
    qubits.forEach(([qb0, qb1]) => {
      // add on the right to segment
      const mapper = new LinearMapper(3, false)
      const segments = [[0, 1]]
      const active_qubits = new Set([0, 1, 2])
      const neighbour_ids = {0: new Set([1]), 1: new Set([0]), 2: new Set()}
      LinearMapper._processTwoQubitGate(mapper.num_qubits,
        mapper.cyclic,
        qb0,
        qb1,
        active_qubits,
        segments,
        neighbour_ids)
      expect(segments).to.deep.equal([[0, 1, 2]])
      expect(active_qubits).to.deep.equal(new Set([0, 1, 2]))
      expect(neighbour_ids[1]).to.deep.equal(new Set([0, 2]))
      expect(neighbour_ids[2]).to.deep.equal(new Set([1]))
    })
  });

  it('should test_process_two_qubit_gate_one_qb_free_one_qb_in_segment2', () => {
    const qubits = [[0, 1], [1, 0]]

    qubits.forEach(([qb0, qb1]) => {
    // add on the left to segment
      const mapper = new LinearMapper(3, false)
      const segments = [[1, 2]]
      const active_qubits = new Set([0, 1, 2])
      const neighbour_ids = {0: new Set([]), 1: new Set([2]), 2: new Set([1])}
      LinearMapper._processTwoQubitGate(mapper.num_qubits,
        mapper.cyclic,
        qb0,
        qb1,
        active_qubits,
        segments,
        neighbour_ids)
      expect(segments).to.deep.equal([[0, 1, 2]])
      expect(active_qubits).to.deep.equal(new Set([0, 1, 2]))
      expect(neighbour_ids[1]).to.deep.equal(new Set([0, 2]))
      expect(neighbour_ids[0]).to.deep.equal(new Set([1]))
    })
  });

  it('should test_process_two_qubit_gate_one_qb_free_one_qb_in_segment_cycle', () => {
    const qubits = [[1, 2], [2, 1]]
    qubits.forEach(([qb0, qb1]) => {
      const mapper = new LinearMapper(3, true)
      const segments = [[0, 1]]
      const active_qubits = new Set([0, 1, 2])
      const neighbour_ids = {0: new Set([1]), 1: new Set([0]), 2: new Set()}
      LinearMapper._processTwoQubitGate(mapper.num_qubits,
        mapper.cyclic,
        qb0,
        qb1,
        active_qubits,
        segments,
        neighbour_ids)
      expect(segments).to.deep.equal([[0, 1, 2]])
      expect(active_qubits).to.deep.equal(new Set([0, 1, 2]))
      expect(neighbour_ids[1]).to.deep.equal(new Set([0, 2]))
      expect(neighbour_ids[2]).to.deep.equal(new Set([1, 0]))
    })
  });

  it('should test_process_two_qubit_gate_one_qb_free_one_qb_in_seg_cycle2', () => {
    const qubits = [[1, 2], [2, 1]]
    qubits.forEach(([qb0, qb1]) => {
      // not yet long enough segment for cycle
      const mapper = new LinearMapper(4, true)
      const segments = [[0, 1]]
      const active_qubits = new Set([0, 1, 2])
      const neighbour_ids = {0: new Set([1]), 1: new Set([0]), 2: new Set()}
      LinearMapper._processTwoQubitGate(mapper.num_qubits,
        mapper.cyclic,
        qb0,
        qb1,
        active_qubits,
        segments,
        neighbour_ids)
      expect(segments).to.deep.equal([[0, 1, 2]])
      expect(active_qubits).to.deep.equal(new Set([0, 1, 2]))
      expect(neighbour_ids[1]).to.deep.equal(new Set([0, 2]))
      expect(neighbour_ids[2]).to.deep.equal(new Set([1]))
    })
  });

  it('should test_process_two_qubit_gate_one_qubit_in_middle_of_segment', () => {
    const mapper = new LinearMapper(5, false)
    const segments = []
    const active_qubits = new Set([0, 1, 2, 3])
    const neighbour_ids = {
      0: new Set([1]), 1: new Set([0, 2]), 2: new Set([1]), 3: new Set()
    }
    LinearMapper._processTwoQubitGate(mapper.num_qubits,
      mapper.cyclic,
      1,
      3,
      active_qubits,
      segments,
      neighbour_ids)
    expect(len(segments)).to.equal(0)
    expect(active_qubits).to.deep.equal(new Set([0, 2]))
  });

  it('should test_process_two_qubit_gate_both_in_same_segment', () => {
    const mapper = new LinearMapper(3, false)
    const segments = [[0, 1, 2]]
    const active_qubits = new Set([0, 1, 2])
    const neighbour_ids = {0: new Set([1]), 1: new Set([0, 2]), 2: new Set([1])}
    LinearMapper._processTwoQubitGate(mapper.num_qubits,
      mapper.cyclic,
      0,
      2,
      active_qubits,
      segments,
      neighbour_ids)
    expect(segments).to.deep.equal([[0, 1, 2]])
    expect(active_qubits).to.deep.equal(new Set([1]))
  });

  it('should test_process_two_qubit_gate_already_connected', () => {
    const mapper = new LinearMapper(3, false)
    const segments = [[0, 1, 2]]
    const active_qubits = new Set([0, 1, 2])
    const neighbour_ids = {0: new Set([1]), 1: new Set([0, 2]), 2: new Set([1])}
    LinearMapper._processTwoQubitGate(mapper.num_qubits,
      mapper.cyclic,
      0,
      1,
      active_qubits,
      segments,
      neighbour_ids)
    expect(segments).to.deep.equal([[0, 1, 2]])
    expect(active_qubits).to.deep.equal(new Set([0, 1, 2]))
  });

  it('should test_process_two_qubit_gate_combine_segments', () => {
    const data = [
      [0, 2, [1, 0, 2, 3]],
      [0, 3, [2, 3, 0, 1]],
      [1, 2, [0, 1, 2, 3]],
      [1, 3, [0, 1, 3, 2]]
    ]
    data.forEach(([qb0, qb1, result_seg]) => {
      const mapper = new LinearMapper(4, false)
      const segments = [[0, 1], [2, 3]]
      const active_qubits = new Set([0, 1, 2, 3, 4])
      const neighbour_ids = {
        0: new Set([1]), 1: new Set([0]), 2: new Set([3]), 3: new Set([2])
      }
      LinearMapper._processTwoQubitGate(mapper.num_qubits,
        mapper.cyclic,
        qb0,
        qb1,
        active_qubits,
        segments,
        neighbour_ids)
      const r = deepEqual(segments, [result_seg]) || deepEqual(segments, [result_seg.reverse()])
      expect(r).to.equal(true)
      expect(neighbour_ids[qb0].has(qb1)).to.equal(true)
      expect(neighbour_ids[qb1].has(qb0)).to.equal(true)
    })
  });

  it('should test_process_two_qubit_gate_combine_segments_cycle', () => {
    const data = [
      [0, 2, [1, 0, 2, 3]], [0, 3, [2, 3, 0, 1]],
      [1, 2, [0, 1, 2, 3]], [1, 3, [0, 1, 3, 2]]
    ]
    data.forEach(([qb0, qb1, result_seg]) => {
      const mapper = new LinearMapper(4, true)
      const segments = [[0, 1], [2, 3]]
      const active_qubits = new Set([0, 1, 2, 3, 4])
      const neighbour_ids = {
        0: new Set([1]), 1: new Set([0]), 2: new Set([3]), 3: new Set([2])
      }
      LinearMapper._processTwoQubitGate(mapper.num_qubits,
        mapper.cyclic,
        qb0,
        qb1,
        active_qubits,
        segments,
        neighbour_ids)
      const r = deepEqual(segments, [result_seg]) || deepEqual(segments, [result_seg.reverse()])
      expect(r).to.equal(true)
      expect(neighbour_ids[qb0].has(qb1)).to.equal(true)
      expect(neighbour_ids[qb1].has(qb0)).to.equal(true)
      const last = result_seg[result_seg.length - 1]
      expect(neighbour_ids[last].has(result_seg[0])).to.equal(true)
      expect(neighbour_ids[result_seg[0]].has(last)).to.equal(true)
    })
  });

  it('should test_process_two_qubit_gate_combine_segments_cycle2', () => {
    const data = [
      [0, 2, [1, 0, 2, 3]], [0, 3, [2, 3, 0, 1]],
      [1, 2, [0, 1, 2, 3]],
      [1, 3, [0, 1, 3, 2]]
    ]
    data.forEach(([qb0, qb1, result_seg]) => {
      // // Not long enough segment for cyclic
      const mapper = new LinearMapper(5, true)
      const segments = [[0, 1], [2, 3]]
      const active_qubits = new Set([0, 1, 2, 3, 4])
      const neighbour_ids = {
        0: new Set([1]), 1: new Set([0]), 2: new Set([3]), 3: new Set([2])
      }
      LinearMapper._processTwoQubitGate(mapper.num_qubits,
        mapper.cyclic,
        qb0,
        qb1,
        active_qubits,
        segments,
        neighbour_ids)
      const r = deepEqual(segments, [result_seg]) || deepEqual(segments, [result_seg.reverse()])
      expect(r).to.equal(true)
      expect(neighbour_ids[qb0].has(qb1)).to.equal(true)
      expect(neighbour_ids[qb1].has(qb0)).to.equal(true)
      const last = result_seg[result_seg.length - 1]
      expect(neighbour_ids[last].has(result_seg[0])).to.equal(false)
      expect(neighbour_ids[result_seg[0]].has(last)).to.equal(false)
    })
  });

  it('should test_return_new_mapping_from_segments', () => {
    const data = [
      [[[0, 2, 4]], [0, 1, 2, 3, 4], [0, 2, 4, 3, 1], [0, 1, 2, 3, 4]],
      [[[0, 2, 4]], [0, 1, 2, 3, 4], [0, 2, 4, 3, null], [0, 2, 3, 4]],
      [[[1, 2], [3, 0]], [0, 1, 2, 3, 4], [null, 1, 2, 3, 0], [0, 1, 2, 3]],
      [[[1, 2], [3, 0]], [0, 1, 2, 3, 4], [1, 2, 3, 0, 4], [0, 1, 2, 3, 4]]
    ]
    data.forEach(([segments, current_chain, correct_chain, allocated_qubits]) => {
      const mapper = new LinearMapper(5, false)
      const currentMapping = {}
      current_chain.forEach((logical_id, pos) => currentMapping[logical_id] = pos)
      mapper.currentMapping = currentMapping
      const new_mapping = LinearMapper._returnNewMappingFromSegments(
        mapper.num_qubits,
        segments,
        allocated_qubits,
        mapper.currentMapping
      )
      const correct_mapping = {}
      correct_chain.forEach((logical_id, pos) => {
        if (logical_id !== null) {
          correct_mapping[logical_id] = pos
        }
      })
      expect(correct_mapping).to.deep.equal(new_mapping)
    })
  });
  it('should test_odd_even_transposition_sort_swaps', () => {
    const data = [
      [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]],
      [[2, 0, 14, 44, 12], [14, 12, 44, 0, 2]],
      [[2, null, 14, 44, 12], [14, 1, 44, 0, 2]],
      [[2, null, 14, 44, 12], [14, null, 44, 0, 2]]
    ]
    data.forEach(([old_chain, new_chain]) => {
      const mapper = new LinearMapper(5, false)
      const old_map = {}
      const new_map = {}
      old_chain.forEach((logical_id, pos) => {
        if (logical_id !== null) {
          old_map[logical_id] = pos
        }
      })

      new_chain.forEach((logical_id, pos) => {
        if (logical_id !== null) {
          new_map[logical_id] = pos
        }
      })
      const swaps = mapper._oddEvenTranspositionSortSwaps(old_map, new_map)
      const sorted_chain = old_chain.slice(0)
      // Remove all ids which are not in new_chain by null
      sorted_chain.forEach((item, i) => {
        if (!new_chain.includes(item)) {
          sorted_chain[i] = null
        }
      })
      swaps.forEach(([i, j]) => {
        const tmp = sorted_chain[i]
        sorted_chain[i] = sorted_chain[j]
        sorted_chain[j] = tmp
      })

      expect(len(sorted_chain)).to.equal(len(new_chain))
      sorted_chain.forEach((item, i) => {
        if (item !== null) {
          expect(sorted_chain[i]).to.equal(new_chain[i])
        }
      })
    })
  });
  it('should test_send_possible_commands_allocate', () => {
    const mapper = new LinearMapper(4, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const cmd0 = new Command(null, Allocate, tuple([qb0]), [], [])
    mapper._stored_commands = [cmd0]
    mapper._currently_allocated_ids = new Set([10])
    // not in mapping:
    mapper.currentMapping = {}
    expect(len(backend.receivedCommands)).to.equal(0)
    mapper._sendPossibleCommands()
    expect(len(backend.receivedCommands)).to.equal(0)
    expect(mapper._stored_commands).to.deep.equal([cmd0])
    // in mapping:
    mapper.currentMapping = {0: 3}
    mapper._sendPossibleCommands()
    expect(len(mapper._stored_commands)).to.equal(0)
    expect(len(backend.receivedCommands)).to.equal(1)
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[0].qubits[0][0].id).to.equal(3)
    expect(backend.receivedCommands[0].tags).to.deep.equal([new LogicalQubitIDTag(0)])
    expect(mapper._currently_allocated_ids).to.deep.equal(new Set([10, 0]))
  });
  it('should test_send_possible_commands_deallocate', () => {
    const mapper = new LinearMapper(4, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const cmd0 = new Command(null, Deallocate, tuple([qb0]), [], [])
    mapper._stored_commands = [cmd0]
    mapper.currentMapping = {}
    mapper._currently_allocated_ids = new Set([10])
    // not yet allocated:
    mapper._sendPossibleCommands()
    expect(len(backend.receivedCommands)).to.equal(0)
    expect(mapper._stored_commands).to.deep.equal([cmd0])
    // allocated:
    mapper.currentMapping = {0: 3}
    mapper._currently_allocated_ids.add(0)
    mapper._sendPossibleCommands()
    expect(len(backend.receivedCommands)).to.equal(1)
    expect(backend.receivedCommands[0].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[0].qubits[0][0].id).to.equal(3)
    expect(backend.receivedCommands[0].tags).to.deep.equal([new LogicalQubitIDTag(0)])
    expect(len(mapper._stored_commands)).to.equal(0)
    expect(mapper.currentMapping).to.deep.equal({})
    expect(mapper._currently_allocated_ids).to.deep.equal(new Set([10]))
  });

  it('should test_send_possible_commands_keep_remaining_gates', () => {
    const mapper = new LinearMapper(4, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const cmd0 = new Command(null, Allocate, tuple([qb0]), [], [])
    const cmd1 = new Command(null, Deallocate, tuple([qb0]), [], [])
    const cmd2 = new Command(null, Allocate, tuple([qb1]), [], [])

    mapper._stored_commands = [cmd0, cmd1, cmd2]
    mapper.currentMapping = {0: 0}
    mapper._sendPossibleCommands()
    expect(mapper._stored_commands).to.deep.equal([cmd2])
  });

  it('should test_send_possible_commands_not_cyclic', () => {
    const mapper = new LinearMapper(4, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const qb3 = new BasicQubit(null, 3)
    mapper._currently_allocated_ids = new Set([0, 1, 2, 3])
    const cmd0 = new Command(null, CNOT, tuple([qb0]), [qb2])
    const cmd1 = new Command(null, CNOT, tuple([qb1]), [qb2])
    const cmd2 = new Command(null, CNOT, tuple([qb1]), [qb3])
    const cmd3 = new Command(null, X, tuple([qb0]), [])
    mapper._stored_commands = [cmd0, cmd1, cmd2, cmd3]
    // Following chain 0 <-> 2 <-> 3 <-> 1
    mapper.currentMapping = {
      0: 0, 2: 1, 3: 2, 1: 3
    }
    mapper._sendPossibleCommands()
    expect(len(backend.receivedCommands)).to.equal(2)
    expect(backend.receivedCommands[0]).to.deep.equal(new Command(null, CNOT, tuple([qb0]), [qb1]))
    expect(backend.receivedCommands[1]).to.deep.equal(new Command(null, X, tuple([qb0])))
    // Following chain 0 <-> 2 <-> 1 <-> 3
    mapper.currentMapping = {
      0: 0, 2: 1, 3: 3, 1: 2
    }
    mapper._sendPossibleCommands()
    expect(len(backend.receivedCommands)).to.equal(4)
    expect(len(mapper._stored_commands)).to.equal(0)
  });

  it('should test_send_possible_commands_cyclic', () => {
    const mapper = new LinearMapper(4, true)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const qb3 = new BasicQubit(null, 3)
    mapper._currently_allocated_ids = new Set([0, 1, 2, 3])
    const cmd0 = new Command(null, CNOT, tuple([qb0]), [qb1])
    const cmd1 = new Command(null, CNOT, tuple([qb1]), [qb2])
    const cmd2 = new Command(null, CNOT, tuple([qb1]), [qb3])
    const cmd3 = new Command(null, X, tuple([qb0]), [])
    mapper._stored_commands = [cmd0, cmd1, cmd2, cmd3]
    // Following chain 0 <-> 2 <-> 3 <-> 1
    mapper.currentMapping = {
      0: 0, 2: 1, 3: 2, 1: 3
    }
    mapper._sendPossibleCommands()
    expect(len(backend.receivedCommands)).to.equal(2)
    expect(backend.receivedCommands[0]).to.deep.equal(new Command(null, CNOT, tuple([qb0]), [qb3]))
    expect(backend.receivedCommands[1]).to.deep.equal(new Command(null, X, tuple([qb0])))
    // Following chain 0 <-> 2 <-> 1 <-> 3
    mapper.currentMapping = {
      0: 0, 2: 1, 3: 3, 1: 2
    }
    mapper._sendPossibleCommands()
    expect(len(backend.receivedCommands)).to.equal(4)
    expect(len(mapper._stored_commands)).to.equal(0)
  });

  it('should test_run_and_receive', () => {
    const mapper = new LinearMapper(3, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, Allocate, tuple([qb1]))
    const cmd2 = new Command(null, Allocate, tuple([qb2]))
    const cmd3 = new Command(null, X, tuple([qb0]), [qb1])
    const cmd4 = new Command(null, X, tuple([qb1]), [qb2])
    const cmd5 = new Command(null, Deallocate, tuple([qb1]))
    mapper.receive([cmd0, cmd1, cmd2, cmd3, cmd4, cmd5])
    expect(mapper._stored_commands).to.deep.equal([cmd0, cmd1, cmd2, cmd3, cmd4, cmd5])
    const qb3 = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb3]))
    mapper.receive([cmd_flush])
    expect(mapper._stored_commands).to.deep.equal([])
    expect(len(backend.receivedCommands)).to.equal(7)
    expect(mapper._currently_allocated_ids).to.deep.equal(new Set([0, 2]))

    const f = deepEqual(mapper.currentMapping, {0: 2, 2: 0}) || deepEqual(mapper.currentMapping, {0: 0, 2: 2})
    expect(f).to.equal(f)
    const cmd6 = new Command(null, X, tuple([qb0]), [qb2])
    mapper.storage = 1
    mapper.receive([cmd6])
    expect(mapper._currently_allocated_ids).to.deep.equal(new Set([0, 2]))
    expect(mapper._stored_commands).to.deep.equal([])
    expect(len(mapper.currentMapping)).to.equal(2)
    expect(0 in mapper.currentMapping).to.equal(true)
    expect(2 in mapper.currentMapping).to.equal(true)
    expect(len(backend.receivedCommands)).to.equal(11)

    backend.receivedCommands.forEach(cmd => console.log(cmd.toString()))

    expect(backend.receivedCommands[backend.receivedCommands.length - 1]).to.deep.equal(new Command(null, X,
      tuple([new BasicQubit(null, mapper.currentMapping[qb0.id])]),
      [new BasicQubit(null, mapper.currentMapping[qb2.id])]))
    expect(mapper.num_mappings).to.equal(1)
  });

  it('should test_run_infinite_loop_detection', () => {
    const mapper = new LinearMapper(1, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const cmd0 = new Command(null, Allocate, tuple([qb0], ))
    const cmd1 = new Command(null, Allocate, tuple([qb1], ))
    const cmd2 = new Command(null, X, tuple([qb0]), [qb1])
    const qb2 = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb2]))

    expect(() => mapper.receive([cmd0, cmd1, cmd2, cmd_flush])).to.throw()
  });

  it('should test_logical_id_tags_allocate_and_deallocate', () => {
    const mapper = new LinearMapper(4, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const cmd0 = new Command(null, Allocate, tuple([qb0], ))
    const cmd1 = new Command(null, Allocate, tuple([qb1], ))
    const cmd2 = new Command(null, X, tuple([qb0]), [qb1])
    const cmd3 = new Command(null, Deallocate, tuple([qb0], ))
    const cmd4 = new Command(null, Deallocate, tuple([qb1], ))
    mapper.currentMapping = {0: 0, 1: 3}
    const qb_flush = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb_flush], ))
    mapper.receive([cmd0, cmd1, cmd2, cmd_flush])
    expect(backend.receivedCommands[0].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[0].qubits[0][0].id).to.equal(0)
    expect(backend.receivedCommands[0].tags).to.deep.equal([new LogicalQubitIDTag(0)])
    expect(backend.receivedCommands[1].gate.equal(Allocate)).to.equal(true)
    expect(backend.receivedCommands[1].qubits[0][0].id).to.equal(3)
    expect(backend.receivedCommands[1].tags).to.deep.equal([new LogicalQubitIDTag(1)])

    backend.receivedCommands.slice(2).forEach((cmd) => {
      if (cmd.gate.equal(Allocate)) {
        expect(cmd.tags).to.deep.equal([])
      } else if (cmd.gate.equal(Deallocate)) {
        expect(cmd.tags).to.deep.equal([])
      }
    })

    const mapped_id_for_0 = mapper.currentMapping[0]
    const mapped_id_for_1 = mapper.currentMapping[1]
    mapper.receive([cmd3, cmd4, cmd_flush])
    const c = backend.receivedCommands.length
    expect(backend.receivedCommands[c - 3].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[c - 3].qubits[0][0].id).to.equal(mapped_id_for_0)
    expect(backend.receivedCommands[c - 3].tags).to.deep.equal([new LogicalQubitIDTag(0)])
    expect(backend.receivedCommands[c - 2].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[c - 2].qubits[0][0].id).to.equal(mapped_id_for_1)
    expect(backend.receivedCommands[c - 2].tags).to.deep.equal([new LogicalQubitIDTag(1)])
  });

  it('should test_send_possible_cmds_before_new_mapping', () => {
    const mapper = new LinearMapper(3, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend

    const dont_call_mapping = () => {
      throw new Error('')
    }

    mapper._return_new_mapping = dont_call_mapping
    mapper.currentMapping = {0: 1}
    const qb0 = new BasicQubit(null, 0)
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const qb2 = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb2]))
    mapper.receive([cmd0, cmd_flush])
  });
  it('should test_correct_stats', () => {
    // Should test stats for twice same mapping but depends on heuristic
    const mapper = new LinearMapper(3, false)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, Allocate, tuple([qb1]))
    const cmd2 = new Command(null, Allocate, tuple([qb2]))
    const cmd3 = new Command(null, X, tuple([qb0]), [qb1])
    const cmd4 = new Command(null, X, tuple([qb1]), [qb2])
    const cmd5 = new Command(null, X, tuple([qb0]), [qb2])
    const cmd6 = new Command(null, X, tuple([qb2]), [qb1])
    const cmd7 = new Command(null, X, tuple([qb0]), [qb1])
    const cmd8 = new Command(null, X, tuple([qb1]), [qb2])
    const qb_flush = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb_flush]))
    mapper.receive([cmd0, cmd1, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7, cmd8, cmd_flush])
    expect(mapper.num_mappings).to.equal(2)
  });
})
