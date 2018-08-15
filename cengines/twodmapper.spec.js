import {expect} from 'chai'
import deepEqual from 'deep-eql'
import GridMapper from './twodmapper';
import {BasicQubit} from '../types/qubit';
import {Allocate, BasicGate, X} from '../ops';
import Command from '../ops/command';
import {tuple} from '../libs/util';
import MainEngine from './main';
import {DummyEngine} from './testengine';

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
})

// @pytest.mark.parametrize("num_rows, num_columns, seed, none_old, none_new",
//     [(2, 2, 0, 0, 0), (3, 4, 1, 0, 0), (4, 3, 2, 0, 0),
//       (5, 5, 3, 0, 0), (5, 3, 4, 3, 0), (4, 4, 5, 0, 3),
//       (6, 6, 7, 2, 3)])
// def test_return_swaps_random(num_rows, num_columns, seed, none_old, none_new):
// random.seed(seed)
// num_qubits = num_rows * num_columns
// old_chain = random.sample(range(num_qubits), num_qubits)
// new_chain = random.sample(range(num_qubits), num_qubits)
// old_mapping = {}
// new_mapping = {}
// for i in range(num_qubits):
// old_mapping[old_chain[i]] = i
// new_mapping[new_chain[i]] = i
// # Remove certain elements from mappings:
//     old_none_ids = set(random.sample(range(num_qubits), none_old))
// if none_old != 0:
// for logical_id in old_none_ids:
// old_mapping.pop(logical_id)
// new_none_ids = set(random.sample(range(num_qubits), none_new))
// if none_new != 0:
// for logical_id in new_none_ids:
// new_mapping.pop(logical_id)
//
// mapper = new GridMapper(num_rows,
//     num_columns=num_columns)
// swaps = mapper.return_swaps(old_mapping, new_mapping)
// # Check that Swaps are allowed
// all_allowed_swaps = set()
// for row in range(num_rows):
// for column in range(num_columns-1):
// qb_id = row * num_columns + column
// all_allowed_swaps.add((qb_id, qb_id + 1))
// for row in range(num_rows-1):
// for column in range(num_columns):
// qb_id = row * num_columns + column
// all_allowed_swaps.add((qb_id, qb_id + num_columns))
//
// for swap in swaps:
// expect(swap in all_allowed_swaps
// test_chain = deepcopy(old_chain)
// for pos0, pos1 in swaps:
// tmp = test_chain[pos0]
// test_chain[pos0] = test_chain[pos1]
// test_chain[pos1] = tmp
// expect(len(test_chain) == len(new_chain)
// for i in range(len(new_chain)):
// if new_chain[i] in old_mapping and new_chain[i] in new_mapping:
// expect(test_chain[i] == new_chain[i]
//
//
// @pytest.mark.parametrize("different_backend_ids", [False, True])
// def test_send_possible_commands(different_backend_ids):
// if different_backend_ids:
// map_to_backend_ids = {0: 21, 1: 32, 2: 1, 3: 4, 4: 5, 5: 6, 6: 10,
//   7: 7}
// else:
// map_to_backend_ids = null
// mapper = new GridMapper(2,4,
//     mapped_ids_to_backend_ids=map_to_backend_ids)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// # mapping is identical except 5 <-> 0
// if different_backend_ids:
// mapper.current_mapping = {0: 6, 1: 32, 2: 1, 3: 4, 4: 5, 5: 21, 6: 10,
//   7: 7}
// else:
// mapper.current_mapping = {5: 0, 1: 1, 2: 2, 3: 3, 4: 4, 0: 5, 6: 6,
//   7: 7}
// neighbours = [(5, 1), (1, 2), (2, 3), (4, 0), (0, 6), (6, 7),
//   (5, 4), (1, 0), (2, 6), (3, 7)]
// for qb0_id, qb1_id in neighbours:
// qb0 = new BasicQubit(null, qb0_id)
// qb1 = new BasicQubit(null, qb1_id)
// cmd1 = new Command(null, X, tuple([qb0]), [qb1])
// cmd2 = new Command(null, X, tuple([qb1]), [qb0])
// mapper._stored_commands = [cmd1, cmd2]
// mapper._send_possible_commands()
// expect(len(mapper._stored_commands) == 0
// for qb0_id, qb1_id in itertools.permutations(range(8), 2):
// if ((qb0_id, qb1_id) not in neighbours and
// (qb1_id, qb0_id) not in neighbours):
// qb0 = new BasicQubit(null, qb0_id)
// qb1 = new BasicQubit(null, qb1_id)
// cmd = new Command(null, X, tuple([qb0]), [qb1])
// mapper._stored_commands = [cmd]
// mapper._send_possible_commands()
// expect(len(mapper._stored_commands) == 1
//
//
// @pytest.mark.parametrize("different_backend_ids", [False, True])
// def test_send_possible_commands_allocate(different_backend_ids):
// if different_backend_ids:
// map_to_backend_ids = {0: 21, 1: 32, 2: 3, 3: 4, 4: 5, 5: 6}
// else:
// map_to_backend_ids = null
// mapper = new GridMapper(3,2,
//     mapped_ids_to_backend_ids=map_to_backend_ids)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0]), [],
//     tags=[])
// mapper._stored_commands = [cmd0]
// mapper._currently_allocated_ids = set([10])
// # not in mapping:
// mapper.current_mapping = {}
// expect(len(backend.received_commands) == 0
// mapper._send_possible_commands()
// expect(len(backend.received_commands) == 0
// expect(mapper._stored_commands == [cmd0]
// # in mapping:
//     mapper.current_mapping = {0: 3}
// mapper._send_possible_commands()
// expect(len(mapper._stored_commands) == 0
// # Only self._run() sends Allocate gates
// mapped0 = new BasicQubit(null, 3)
// received_cmd = new Command(engine=mapper, gate=Allocate, tuple([mapped0],),
//     controls=[], tags=[LogicalQubitIDTag(0)])
// expect(backend.received_commands[0] == received_cmd
// expect(mapper._currently_allocated_ids == set([10, 0])
//
//
// @pytest.mark.parametrize("different_backend_ids", [False, True])
// def test_send_possible_commands_deallocate(different_backend_ids):
// if different_backend_ids:
// map_to_backend_ids = {0: 21, 1: 32, 2: 3, 3: 4, 4: 5, 5: 6}
// else:
// map_to_backend_ids = null
// mapper = new GridMapper(3,2,
//     mapped_ids_to_backend_ids=map_to_backend_ids)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// cmd0 = new Command(null, gate=Deallocate, tuple([qb0]), [],
//     tags=[])
// mapper._stored_commands = [cmd0]
// mapper.current_mapping = {}
// mapper._currently_allocated_ids = set([10])
// # not yet allocated:
//     mapper._send_possible_commands()
// expect(len(backend.received_commands) == 0
// expect(mapper._stored_commands == [cmd0]
// # allocated:
// mapper.current_mapping = {0: 3}
// mapper._currently_allocated_ids.add(0)
// mapper._send_possible_commands()
// expect(len(backend.received_commands) == 1
// expect(len(mapper._stored_commands) == 0
// expect(mapper.current_mapping == {}
// expect(mapper._currently_allocated_ids == set([10])
//
//
// @pytest.mark.parametrize("different_backend_ids", [False, True])
// def test_send_possible_commands_keep_remaining_gates(different_backend_ids):
// if different_backend_ids:
// map_to_backend_ids = {0: 21, 1: 32, 2: 3, 3: 0, 4: 5, 5: 6}
// else:
// map_to_backend_ids = null
// mapper = new GridMapper(3,2,
//     mapped_ids_to_backend_ids=map_to_backend_ids)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// qb1 = new BasicQubit(null, 1)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0]), [],
//     tags=[])
// cmd1 = new Command(null, gate=Deallocate, tuple([qb0]), [],
//     tags=[])
// cmd2 = new Command(null, gate=Allocate, tuple([qb1]), [],
//     tags=[])
//
// mapper._stored_commands = [cmd0, cmd1, cmd2]
// mapper.current_mapping = {0: 0}
// mapper._send_possible_commands()
// expect(mapper._stored_commands == [cmd2]
//
//
// @pytest.mark.parametrize("different_backend_ids", [False, True])
// def test_send_possible_commands_one_inactive_qubit(different_backend_ids):
// if different_backend_ids:
// map_to_backend_ids = {0: 21, 1: 32, 2: 3, 3: 0, 4: 5, 5: 6}
// else:
// map_to_backend_ids = null
// mapper = new GridMapper(3,2,
//     mapped_ids_to_backend_ids=map_to_backend_ids)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// qb1 = new BasicQubit(null, 1)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0]), [],
//     tags=[])
// cmd1 = new Command(null, gate=X, tuple([qb0]), [qb1])
// mapper._stored_commands = [cmd0, cmd1]
// mapper.current_mapping = {0: 0}
// mapper._send_possible_commands()
// expect(mapper._stored_commands == [cmd1]
//
//
// @pytest.mark.parametrize("different_backend_ids", [False, True])
// @pytest.mark.parametrize("num_optimization_steps", [1, 10])
// def test_run_and_receive(num_optimization_steps, different_backend_ids):
// if different_backend_ids:
// map_to_backend_ids = {0: 21, 1: 32, 2: 3, 3: 0}
// else:
// map_to_backend_ids = null
//
// def choose_last_permutation(swaps):
// choose_last_permutation.counter -= 1
// return choose_last_permutation.counter
//
// choose_last_permutation.counter = 100
// mapper = new GridMapper(
//     num_rows=2,
//     num_columns=2,
//     mapped_ids_to_backend_ids=map_to_backend_ids,
//     optimization_function=choose_last_permutation,
//     num_optimization_steps=num_optimization_steps)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// qb1 = new BasicQubit(null, 1)
// qb2 = new BasicQubit(null, 2)
// qb3 = new BasicQubit(null, 3)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0],))
// cmd1 = new Command(null, gate=Allocate, tuple([qb1],))
// cmd2 = new Command(null, gate=Allocate, tuple([qb2],))
// cmd3 = new Command(null, gate=Allocate, tuple([qb3],))
// cmd4 = new Command(null, X, tuple([qb0]), [qb1])
// cmd5 = new Command(null, X, tuple([qb1]), [qb3])
// cmd6 = new Command(null, X, tuple([qb3]), [qb2])
// cmd7 = new Command(null, X, tuple([qb0]), [qb2])
// cmd8 = new Command(null, gate=Deallocate, tuple([qb1],))
// all_cmd = [cmd0, cmd1, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7, cmd8]
// mapper.receive(all_cmd)
// expect(mapper._stored_commands == all_cmd
// qb4 = new BasicQubit(null, -1)
// cmd_flush = new Command(null, gate=FlushGate(), tuple([qb4],))
// mapper.receive([cmd_flush])
// expect(mapper._stored_commands == []
// expect(len(backend.received_commands) == 10
// expect(mapper._currently_allocated_ids == set([0, 2, 3])
// if different_backend_ids:
// expect((mapper.current_mapping == {0: 21, 2: 3, 3: 0} or
// mapper.current_mapping == {0: 32, 2: 0, 3: 21} or
// mapper.current_mapping == {0: 3, 2: 21, 3: 32} or
// mapper.current_mapping == {0: 0, 2: 32, 3: 3})
// else:
// expect((mapper.current_mapping == {0: 0, 2: 2, 3: 3} or
// mapper.current_mapping == {0: 1, 2: 3, 3: 0} or
// mapper.current_mapping == {0: 2, 2: 0, 3: 1} or
// mapper.current_mapping == {0: 3, 2: 1, 3: 2})
// cmd9 = new Command(null, X, tuple([qb0]), [qb3])
// mapper.storage = 1
// mapper.receive([cmd9])
// expect(mapper._currently_allocated_ids == set([0, 2, 3])
// expect(mapper._stored_commands == []
// expect(len(mapper.current_mapping) == 3
// expect(0 in mapper.current_mapping
// expect(2 in mapper.current_mapping
// expect(3 in mapper.current_mapping
// expect(mapper.num_mappings == 1
//
//
// def test_run_infinite_loop_detection():
// mapper = new GridMapper(2,2)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// qb1 = new BasicQubit(null, 1)
// qb2 = new BasicQubit(null, 2)
// qb3 = new BasicQubit(null, 3)
// qb4 = new BasicQubit(null, 4)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0],))
// cmd1 = new Command(null, gate=Allocate, tuple([qb1],))
// cmd2 = new Command(null, gate=Allocate, tuple([qb2],))
// cmd3 = new Command(null, gate=Allocate, tuple([qb3],))
// cmd4 = new Command(null, gate=Allocate, tuple([qb4],))
// cmd5 = new Command(null, X, tuple([qb0]), [qb1])
// qb2 = new BasicQubit(null, -1)
// cmd_flush = new Command(null, gate=FlushGate(), tuple([qb2],))
// with pytest.raises(RuntimeError):
// mapper.receive([cmd0, cmd1, cmd2, cmd3, cmd4, cmd5, cmd_flush])
//
//
// def test_correct_stats():
// # Should test stats for twice same mapping but depends on heuristic
// mapper = new GridMapper(3,1)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// qb1 = new BasicQubit(null, 1)
// qb2 = new BasicQubit(null, 2)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0],))
// cmd1 = new Command(null, gate=Allocate, tuple([qb1],))
// cmd2 = new Command(null, gate=Allocate, tuple([qb2],))
// cmd3 = new Command(null, X, tuple([qb0]), [qb1])
// cmd4 = new Command(null, X, tuple([qb1]), [qb2])
// cmd5 = new Command(null, X, tuple([qb0]), [qb2])
// cmd6 = new Command(null, X, tuple([qb2]), [qb1])
// cmd7 = new Command(null, X, tuple([qb0]), [qb1])
// cmd8 = new Command(null, X, tuple([qb1]), [qb2])
// qb_flush = new BasicQubit(null, -1)
// cmd_flush = new Command(null, gate=FlushGate(), tuple([qb_flush],))
// mapper.receive([cmd0, cmd1, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7, cmd8,
//   cmd_flush])
// expect(mapper.num_mappings == 2
//
//
// def test_send_possible_cmds_before_new_mapping():
// mapper = new GridMapper(3,1)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
//
// def dont_call_mapping(): raise Exception
//
// mapper._return_new_mapping = dont_call_mapping
// mapper.current_mapping = {0: 1}
// qb0 = new BasicQubit(null, 0)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0],))
// qb2 = new BasicQubit(null, -1)
// cmd_flush = new Command(null, gate=FlushGate(), tuple([qb2],))
// mapper.receive([cmd0, cmd_flush])
//
//
// def test_logical_id_tags_allocate_and_deallocate():
// mapper = new GridMapper(2,2)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = backend
// qb0 = new BasicQubit(null, 0)
// qb1 = new BasicQubit(null, 1)
// cmd0 = new Command(null, gate=Allocate, tuple([qb0],))
// cmd1 = new Command(null, gate=Allocate, tuple([qb1],))
// cmd2 = new Command(null, X, tuple([qb0]), [qb1])
// cmd3 = new Command(null, gate=Deallocate, tuple([qb0],))
// cmd4 = new Command(null, gate=Deallocate, tuple([qb1],))
// mapper.current_mapping = {0: 0, 1: 3}
// qb_flush = new BasicQubit(null, -1)
// cmd_flush = new Command(null, gate=FlushGate(), tuple([qb_flush],))
// mapper.receive([cmd0, cmd1, cmd2, cmd_flush])
// expect(backend.received_commands[0].gate == Allocate
// expect(backend.received_commands[0].qubits[0][0].id == 0
// expect(backend.received_commands[0].tags == [LogicalQubitIDTag(0)]
// expect(backend.received_commands[1].gate == Allocate
// expect(backend.received_commands[1].qubits[0][0].id == 3
// expect(backend.received_commands[1].tags == [LogicalQubitIDTag(1)]
// for cmd in backend.received_commands[2:]:
// if cmd.gate == Allocate:
// expect(cmd.tags == []
// elif cmd.gate == Deallocate:
// expect(cmd.tags == []
// mapped_id_for_0 = mapper.current_mapping[0]
// mapped_id_for_1 = mapper.current_mapping[1]
// mapper.receive([cmd3, cmd4, cmd_flush])
// expect(backend.received_commands[-3].gate == Deallocate
// expect(backend.received_commands[-3].qubits[0][0].id == mapped_id_for_0
// expect(backend.received_commands[-3].tags == [LogicalQubitIDTag(0)]
// expect(backend.received_commands[-2].gate == Deallocate
// expect(backend.received_commands[-2].qubits[0][0].id == mapped_id_for_1
// expect(backend.received_commands[-2].tags == [LogicalQubitIDTag(1)]
//
//
// def test_check_that_local_optimizer_doesnt_merge():
// mapper = new GridMapper(2,2)
// optimizer = LocalOptimizer(10)
// backend = DummyEngine(save_commands=True)
// backend.is_last_engine = True
// mapper.next_engine = optimizer
// optimizer.next_engine = backend
// mapper.current_mapping = {0: 0}
// mapper.storage = 1
// qb0 = new BasicQubit(null, 0)
// qb1 = new BasicQubit(null, 1)
// qb_flush = new BasicQubit(null, -1)
// cmd_flush = new Command(null, gate=FlushGate(), tuple([qb_flush],))
// cmd0 = new Command(null, gate=Allocate, tuple([qb0],))
// cmd1 = new Command(null, X, tuple([qb0],))
// cmd2 = new Command(null, gate=Deallocate, tuple([qb0],))
// mapper.receive([cmd0, cmd1, cmd2])
// expect(len(mapper._stored_commands) == 0
// mapper.current_mapping = {1: 0}
// cmd3 = new Command(null, gate=Allocate, tuple([qb1],))
// cmd4 = new Command(null, X, tuple([qb1],))
// cmd5 = new Command(null, gate=Deallocate, tuple([qb1],))
// mapper.receive([cmd3, cmd4, cmd5, cmd_flush])
// expect(len(backend.received_commands) == 7
