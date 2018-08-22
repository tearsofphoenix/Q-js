import {expect} from 'chai'
import {permutations} from 'itertools'
import deepEqual from 'deep-eql'
import GridMapper from '../../src/cengines/twodmapper';
import {BasicQubit} from '../../src/types/qubit';
import {
  Allocate, BasicGate, Deallocate, FlushGate, X
} from '../../src/ops';
import Command from '../../src/ops/command';
import {tuple} from '../../src/libs/util';
import MainEngine from '../../src/cengines/main';
import {DummyEngine} from '../../src/cengines/testengine';
import {arrayFromRange, len, randomSample} from '../../src/libs/polyfill';
import {LogicalQubitIDTag} from '../../src/meta';
import LocalOptimizer from '../../src/cengines/optimize';

describe('twodmapper test', () => {
  it('should test_is_available', () => {
    const mapper = new GridMapper({num_rows: 2, num_columns: 2})
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb2 = new BasicQubit(null, 2)
    const cmd0 = new Command(null, new BasicGate(), tuple([qb0]))
    expect(mapper.isAvailable(cmd0)).to.equal(true)
    const cmd1 = new Command(null, new BasicGate(), tuple([qb0]), [qb1])
    expect(mapper.isAvailable(cmd1)).to.equal(true)
    const cmd2 = new Command(null, new BasicGate(), tuple([qb0], [qb1, qb2]))
    expect(!mapper.isAvailable(cmd2)).to.equal(true)
    const cmd3 = new Command(null, new BasicGate(), tuple([qb0], [qb1]), [qb2])
    expect(!mapper.isAvailable(cmd3)).to.equal(true)
  });

  it('should test_wrong_init_mapped_ids_to_backend_ids', () => {
    expect(() => {
      const test = {
        0: 1, 1: 0, 2: 2, 3: 3, 4: 4
      }
      new GridMapper({
        num_rows: 2,
        num_columns: 3,
        mapped_ids_to_backend_ids: test
      })
    }).to.throw()

    expect(() => {
      const test = {
        0: 1, 1: 0, 2: 2, 3: 3, 4: 4, 5: 2
      }
      new GridMapper({
        num_rows: 2,
        num_columns: 3,
        mapped_ids_to_backend_ids: test
      })
    }).to.throw()
  });

  it('should test_resetting_mapping_to_none', () => {
    const mapper = new GridMapper({num_rows: 2, num_columns: 3})
    mapper.currentMapping = {0: 1}
    expect(mapper._current_row_major_mapping).to.deep.equal({0: 1})
    mapper.currentMapping = null
    expect(mapper._current_row_major_mapping).to.equal(null)
  });

  it('should test_return_new_mapping', () => {
    const different_backend_ids = [false, true]
    different_backend_ids.forEach((different_backend_id) => {
      let map_to_backend_ids
      if (different_backend_id) {
        map_to_backend_ids = {
          0: 21,
          1: 32,
          2: 1,
          3: 4,
          4: 5,
          5: 6,
          6: 10,
          7: 7,
          8: 0,
          9: 56,
          10: 55,
          11: 9
        }
      } else {
        map_to_backend_ids = null
      }
      const mapper = new GridMapper({
        num_rows: 4,
        num_columns: 3,
        mapped_ids_to_backend_ids: map_to_backend_ids
      })
      const eng = new MainEngine(new DummyEngine(), [mapper])
      const linear_chain_ids = [33, 22, 11, 2, 3, 0, 6, 7, 9, 12, 4, 88]
      mapper._stored_commands = []
      for (let i = 0; i < 12; ++i) {
        const qb = new BasicQubit(null, linear_chain_ids[i])
        const cmd = new Command(null, Allocate, tuple([qb]))
        mapper._stored_commands.push(cmd)
      }
      for (let i = 0; i < 11; ++i) {
        const qb0 = new BasicQubit(null, linear_chain_ids[i])
        const qb1 = new BasicQubit(null, linear_chain_ids[i + 1])
        const cmd = new Command(null, X, tuple([qb0]), [qb1])
        mapper._stored_commands.push(cmd)
      }
      const new_mapping = mapper.returnNewMapping()
      const possible_solution_1 = {
        33: 0,
        22: 1,
        11: 2,
        2: 5,
        3: 4,
        0: 3,
        6: 6,
        7: 7,
        9: 8,
        12: 11,
        4: 10,
        88: 9
      }
      const possible_solution_2 = {
        88: 0,
        4: 1,
        12: 2,
        9: 5,
        7: 4,
        6: 3,
        0: 6,
        3: 7,
        2: 8,
        11: 11,
        22: 10,
        33: 9
      }
      const f = deepEqual(new_mapping, possible_solution_1) || deepEqual(new_mapping, possible_solution_2)
      expect(f).to.equal(true)
      eng.flush()
      if (different_backend_id) {
        const transformed_sol1 = {}
        Object.keys(possible_solution_1).forEach((logical_id) => {
          const mapped_id = possible_solution_1[logical_id]
          transformed_sol1[logical_id] = map_to_backend_ids[mapped_id]
        })
        const transformed_sol2 = {}
        Object.keys(possible_solution_2).forEach((logical_id) => {
          const mapped_id = possible_solution_2[logical_id]
          transformed_sol2[logical_id] = map_to_backend_ids[mapped_id]
        })

        expect(deepEqual(mapper.currentMapping, transformed_sol1) || deepEqual(mapper.currentMapping, transformed_sol2)).to.equal(true)
      } else {
        expect(deepEqual(mapper.currentMapping, possible_solution_1) || deepEqual(mapper.currentMapping, possible_solution_2)).to.equal(true)
      }
    })
  });

  it('should test_return_swaps_random', () => {
    const data = [
      [2, 2, 0, 0, 0], [3, 4, 1, 0, 0], [4, 3, 2, 0, 0],
      [5, 5, 3, 0, 0], [5, 3, 4, 3, 0], [4, 4, 5, 0, 3],
      [6, 6, 7, 2, 3]]
    data.forEach(([num_rows, num_columns, seed, none_old, none_new]) => {
      const num_qubits = num_rows * num_columns
      const range = arrayFromRange(num_qubits)
      const old_chain = randomSample(range, num_qubits)
      const new_chain = randomSample(range, num_qubits)
      const old_mapping = {}
      const new_mapping = {}
      for (let i = 0; i < num_qubits; ++i) {
        old_mapping[old_chain[i]] = i
        new_mapping[new_chain[i]] = i
      }

      // Remove certain elements from mappings:
      const old_none_ids = new Set(randomSample(range, none_old))
      if (none_old !== 0) {
        for (const logical_id of old_none_ids) {
          delete old_mapping[logical_id]
        }
      }
      const new_none_ids = new Set(randomSample(range, none_new))
      if (none_new !== 0) {
        for (const logical_id of new_none_ids) {
          delete new_mapping[logical_id]
        }
      }
      const mapper = new GridMapper({num_rows, num_columns})
      const swaps = mapper.returnSwaps(old_mapping, new_mapping)
      // Check that Swaps are allowed
      const all_allowed_swaps = new Set()
      for (let row = 0; row < num_rows; ++row) {
        for (let column = 0; column < num_columns - 1; ++column) {
          const qb_id = row * num_columns + column
          all_allowed_swaps.add([qb_id, qb_id + 1])
        }
      }
      for (let row = 0; row < num_rows - 1; ++row) {
        for (let column = 0; column < num_columns; ++column) {
          const qb_id = row * num_columns + column
          all_allowed_swaps.add([qb_id, qb_id + num_columns])
        }
      }

      function arrayInSet(set, array) {
        for (const looper of set) {
          if (deepEqual(looper, array)) {
            return true
          }
        }
        return false
      }
      swaps.forEach(swap => expect(arrayInSet(all_allowed_swaps, swap)).to.equal(true))

      const test_chain = old_chain.slice(0)
      swaps.forEach(([pos0, pos1]) => {
        const tmp = test_chain[pos0]
        test_chain[pos0] = test_chain[pos1]
        test_chain[pos1] = tmp
      })

      expect(len(test_chain)).to.equal(len(new_chain))

      new_chain.forEach((looper, i) => {
        if (looper in old_mapping && looper in new_mapping) {
          expect(test_chain[i]).to.equal(looper)
        }
      })
    })
  })

  it('should test_send_possible_commands', () => {
    const different_backend_ids = [false, true]
    different_backend_ids.forEach((different_backend_id) => {
      let map_to_backend_ids
      if (different_backend_id) {
        map_to_backend_ids = {
          0: 21,
          1: 32,
          2: 1,
          3: 4,
          4: 5,
          5: 6,
          6: 10,
          7: 7
        }
      }
      const mapper = new GridMapper({
        num_rows: 2,
        num_columns: 4,
        mapped_ids_to_backend_ids: map_to_backend_ids
      })
      const backend = new DummyEngine(true)
      backend.isLastEngine = true
      mapper.next = backend
      // mapping is identical except 5 <-> 0
      if (different_backend_id) {
        mapper.currentMapping = {
          0: 6,
          1: 32,
          2: 1,
          3: 4,
          4: 5,
          5: 21,
          6: 10,
          7: 7
        }
      } else {
        mapper.currentMapping = {
          5: 0,
          1: 1,
          2: 2,
          3: 3,
          4: 4,
          0: 5,
          6: 6,
          7: 7
        }
      }
      const neighbours = [[5, 1], [1, 2], [2, 3], [4, 0], [0, 6], [6, 7],
        [5, 4], [1, 0], [2, 6], [3, 7]]
      neighbours.forEach(([qb0_id, qb1_id]) => {
        const qb0 = new BasicQubit(null, qb0_id)
        const qb1 = new BasicQubit(null, qb1_id)
        const cmd1 = new Command(null, X, tuple([qb0]), [qb1])
        const cmd2 = new Command(null, X, tuple([qb1]), [qb0])
        mapper._stored_commands = [cmd1, cmd2]
        mapper._sendPossibleCommands()
        expect(len(mapper._stored_commands)).to.equal(0)
      })

      const r = arrayFromRange(8)
      function arrayInSuperArray(sup, array) {
        return sup.findIndex(looper => deepEqual(looper, array)) !== -1
      }
      for (const looper of permutations(r, 2)) {
        const [qb0_id, qb1_id] = looper
        if (!arrayInSuperArray(neighbours, [qb0_id, qb1_id]) && !arrayInSuperArray(neighbours, [qb1_id, qb0_id])) {
          const qb0 = new BasicQubit(null, qb0_id)
          const qb1 = new BasicQubit(null, qb1_id)
          const cmd = new Command(null, X, tuple([qb0]), [qb1])
          mapper._stored_commands = [cmd]
          mapper._sendPossibleCommands()
          expect(len(mapper._stored_commands)).to.equal(1)
        }
      }
    })
  });

  it('should test_send_possible_commands_allocate', () => {
    const different_backend_ids = [false, true]
    different_backend_ids.forEach((different_backend_id) => {
      let map_to_backend_ids
      if (different_backend_id) {
        map_to_backend_ids = {
          0: 21, 1: 32, 2: 3, 3: 4, 4: 5, 5: 6
        }
      }
      const mapper = new GridMapper({
        num_rows: 3,
        num_columns: 2,
        mapped_ids_to_backend_ids: map_to_backend_ids
      })
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
      // Only self._run() sends Allocate gates
      const mapped0 = new BasicQubit(null, 3)
      const received_cmd = new Command(mapper, Allocate, tuple([mapped0]), [], [new LogicalQubitIDTag(0)])
      expect(backend.receivedCommands[0].equal(received_cmd)).to.equal(true)
      expect(mapper._currently_allocated_ids).to.deep.equal(new Set([10, 0]))
    })
  });

  it('should test_send_possible_commands_deallocate', () => {
    const different_backend_ids = [false, true]
    different_backend_ids.forEach((different_backend_id) => {
      let map_to_backend_ids
      if (different_backend_id) {
        map_to_backend_ids = {
          0: 21, 1: 32, 2: 3, 3: 4, 4: 5, 5: 6
        }
      }
      const mapper = new GridMapper({
        num_rows: 3,
        num_columns: 2,
        mapped_ids_to_backend_ids: map_to_backend_ids
      })
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
      expect(len(mapper._stored_commands)).to.equal(0)
      expect(mapper.currentMapping).to.deep.equal({})
      expect(mapper._currently_allocated_ids).to.deep.equal(new Set([10]))
    })
  })

  it('should test_send_possible_commands_keep_remaining_gates', () => {
    const different_backend_ids = [false, true]
    different_backend_ids.forEach((different_backend_id) => {
      let map_to_backend_ids
      if (different_backend_id) {
        map_to_backend_ids = {
          0: 21, 1: 32, 2: 3, 3: 0, 4: 5, 5: 6
        }
      }
      const mapper = new GridMapper({
        num_rows: 3,
        num_columns: 2,
        mapped_ids_to_backend_ids: map_to_backend_ids
      });
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
    })
  });

  it('should test_send_possible_commands_one_inactive_qubit', () => {
    const different_backend_ids = [false, true]
    different_backend_ids.forEach((different_backend_id) => {
      let map_to_backend_ids
      if (different_backend_id) {
        map_to_backend_ids = {
          0: 21, 1: 32, 2: 3, 3: 0, 4: 5, 5: 6
        }
      }
      const mapper = new GridMapper({
        num_rows: 3,
        num_columns: 2,
        mapped_ids_to_backend_ids: map_to_backend_ids
      })
      const backend = new DummyEngine(true)
      backend.isLastEngine = true
      mapper.next = backend
      const qb0 = new BasicQubit(null, 0)
      const qb1 = new BasicQubit(null, 1)
      const cmd0 = new Command(null, Allocate, tuple([qb0]), [], [])
      const cmd1 = new Command(null, X, tuple([qb0]), [qb1])
      mapper._stored_commands = [cmd0, cmd1]
      mapper.currentMapping = {0: 0}
      mapper._sendPossibleCommands()
      expect(mapper._stored_commands).to.deep.equal([cmd1])
    })
  });

  it('should test_run_and_receive', () => {
    const different_backend_ids = [false, true]
    const num_optimization_steps = [1, 10]
    different_backend_ids.forEach((different_backend_id) => {
      num_optimization_steps.forEach((num_optimization_step) => {
        let map_to_backend_ids
        if (different_backend_id) {
          map_to_backend_ids = {
            0: 21, 1: 32, 2: 3, 3: 0
          }
        }

        function choose_last_permutation(swaps) {
          choose_last_permutation.counter -= 1
          return choose_last_permutation.counter
        }

        choose_last_permutation.counter = 100
        const mapper = new GridMapper(
          {
            num_rows: 2,
            num_columns: 2,
            mapped_ids_to_backend_ids: map_to_backend_ids,
            optimization_function: choose_last_permutation,
            num_optimization_steps: num_optimization_step
          }
        )
        const backend = new DummyEngine(true)
        backend.isLastEngine = true
        mapper.next = backend
        const qb0 = new BasicQubit(null, 0)
        const qb1 = new BasicQubit(null, 1)
        const qb2 = new BasicQubit(null, 2)
        const qb3 = new BasicQubit(null, 3)
        const cmd0 = new Command(null, Allocate, tuple([qb0], ))
        const cmd1 = new Command(null, Allocate, tuple([qb1], ))
        const cmd2 = new Command(null, Allocate, tuple([qb2], ))
        const cmd3 = new Command(null, Allocate, tuple([qb3], ))
        const cmd4 = new Command(null, X, tuple([qb0]), [qb1])
        const cmd5 = new Command(null, X, tuple([qb1]), [qb3])
        const cmd6 = new Command(null, X, tuple([qb3]), [qb2])
        const cmd7 = new Command(null, X, tuple([qb0]), [qb2])
        const cmd8 = new Command(null, Deallocate, tuple([qb1], ))
        const all_cmd = [cmd0, cmd1, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7, cmd8]
        mapper.receive(all_cmd)
        expect(mapper._stored_commands).to.deep.equal(all_cmd)
        const qb4 = new BasicQubit(null, -1)
        const cmd_flush = new Command(null, new FlushGate(), tuple([qb4]))
        mapper.receive([cmd_flush])
        expect(mapper._stored_commands).to.deep.equal([])
        expect(len(backend.receivedCommands)).to.equal(10)
        expect(mapper._currently_allocated_ids).to.deep.equal(new Set([0, 2, 3]))
        if (different_backend_id) {
          const obj = mapper.currentMapping
          const f1 = deepEqual(obj, {0: 21, 2: 3, 3: 0})
          const f2 = deepEqual(obj, {0: 32, 2: 0, 3: 21})
          const f3 = deepEqual(obj, {0: 3, 2: 21, 3: 32})
          const f4 = deepEqual(obj, {0: 0, 2: 32, 3: 3})
          expect(f1 || f2 || f3 || f4).to.equal(true)
        } else {
          const obj = mapper.currentMapping
          const f1 = deepEqual(obj, {0: 0, 2: 2, 3: 3})
          const f2 = deepEqual(obj, {0: 1, 2: 3, 3: 0})
          const f3 = deepEqual(obj, {0: 2, 2: 0, 3: 1})
          const f4 = deepEqual(obj, {0: 3, 2: 1, 3: 2})
          expect(f1 || f2 || f3 || f4).to.equal(true)
        }
        const cmd9 = new Command(null, X, tuple([qb0]), [qb3])
        mapper.storage = 1
        mapper.receive([cmd9])
        expect(mapper._currently_allocated_ids).to.deep.equal(new Set([0, 2, 3]))
        expect(mapper._stored_commands).to.deep.equal([])
        expect(len(mapper.currentMapping)).to.equal(3)
        expect(0 in mapper.currentMapping).to.equal(true)
        expect(2 in mapper.currentMapping).to.equal(true)
        expect(3 in mapper.currentMapping).to.equal(true)
        expect(mapper.num_mappings).to.equal(1)
      })
    })
  })

  it('should test_run_infinite_loop_detection', () => {
    const mapper = new GridMapper({num_rows: 2, num_columns: 2})
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    let qb2 = new BasicQubit(null, 2)
    const qb3 = new BasicQubit(null, 3)
    const qb4 = new BasicQubit(null, 4)
    const cmd0 = new Command(null, Allocate, tuple([qb0], ))
    const cmd1 = new Command(null, Allocate, tuple([qb1], ))
    const cmd2 = new Command(null, Allocate, tuple([qb2], ))
    const cmd3 = new Command(null, Allocate, tuple([qb3], ))
    const cmd4 = new Command(null, Allocate, tuple([qb4], ))
    const cmd5 = new Command(null, X, tuple([qb0]), [qb1])
    qb2 = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb2], ))

    expect(() => mapper.receive([cmd0, cmd1, cmd2, cmd3, cmd4, cmd5, cmd_flush])).to.throw()
  })

  it('should test_correct_stats', () => {
    // Should test stats for twice same mapping but depends on heuristic
    const mapper = new GridMapper({num_rows: 3, num_columns: 1})
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

  it('should test_send_possible_cmds_before_new_mapping', () => {
    const mapper = new GridMapper({num_rows: 3, num_columns: 1})
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend

    function dont_call_mapping() {
      throw new Error('')
    }

    mapper.returnNewMapping = dont_call_mapping
    mapper.currentMapping = {0: 1}
    const qb0 = new BasicQubit(null, 0)
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const qb2 = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb2]))
    mapper.receive([cmd0, cmd_flush])
  })

  it('should test_logical_id_tags_allocate_and_deallocate', () => {
    const mapper = new GridMapper({num_rows: 2, num_columns: 2})
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = backend
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, Allocate, tuple([qb1]))
    const cmd2 = new Command(null, X, tuple([qb0]), [qb1])
    const cmd3 = new Command(null, Deallocate, tuple([qb0]))
    const cmd4 = new Command(null, Deallocate, tuple([qb1]))
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
      if (cmd.gate.equal(Allocate) || cmd.gate.equal(Deallocate)) {
        expect(cmd.tags).to.deep.equal([])
      }
    })

    const mapped_id_for_0 = mapper.currentMapping[0]
    const mapped_id_for_1 = mapper.currentMapping[1]
    mapper.receive([cmd3, cmd4, cmd_flush])
    const length = backend.receivedCommands.length
    expect(backend.receivedCommands[length - 3].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[length - 3].qubits[0][0].id).to.equal(mapped_id_for_0)
    expect(backend.receivedCommands[length - 3].tags).to.deep.equal([new LogicalQubitIDTag(0)])
    expect(backend.receivedCommands[length - 2].gate.equal(Deallocate)).to.equal(true)
    expect(backend.receivedCommands[length - 2].qubits[0][0].id).to.equal(mapped_id_for_1)
    expect(backend.receivedCommands[length - 2].tags).to.deep.equal([new LogicalQubitIDTag(1)])
  })

  it('should test_check_that_local_optimizer_doesnt_merge', () => {
    const mapper = new GridMapper({num_rows: 2, num_columns: 2})
    const optimizer = new LocalOptimizer(10)
    const backend = new DummyEngine(true)
    backend.isLastEngine = true
    mapper.next = optimizer
    optimizer.next = backend
    mapper.currentMapping = {0: 0}
    mapper.storage = 1
    const qb0 = new BasicQubit(null, 0)
    const qb1 = new BasicQubit(null, 1)
    const qb_flush = new BasicQubit(null, -1)
    const cmd_flush = new Command(null, new FlushGate(), tuple([qb_flush]))
    const cmd0 = new Command(null, Allocate, tuple([qb0]))
    const cmd1 = new Command(null, X, tuple([qb0]))
    const cmd2 = new Command(null, Deallocate, tuple([qb0]))
    mapper.receive([cmd0, cmd1, cmd2])
    expect(len(mapper._stored_commands)).to.equal(0)
    mapper.currentMapping = {1: 0}
    const cmd3 = new Command(null, Allocate, tuple([qb1]))
    const cmd4 = new Command(null, X, tuple([qb1]))
    const cmd5 = new Command(null, Deallocate, tuple([qb1]))
    mapper.receive([cmd3, cmd4, cmd5, cmd_flush])
    expect(len(backend.receivedCommands)).to.equal(7)
  });
})
