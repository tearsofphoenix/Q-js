/*
Mapper for a quantum circuit to a 2D square grid.

    Input: Quantum circuit with 1 and 2 qubit gates on n qubits. Gates are assumed
to be applied in parallel if they act on disjoint qubit(s) and any pair
of qubits can perform a 2 qubit gate (all-to-all connectivity)
Output: Quantum circuit in which qubits are placed in 2-D square grid in which
only nearest neighbour qubits can perform a 2 qubit gate. The mapper
uses Swap gates in order to move qubits next to each other.
*/
import assert from 'assert'
import math from 'mathjs'
import {classes} from 'jsnetworkx'
import {permutations} from 'itertools'
import BasicMapperEngine from './basicmapper';
import {return_swap_depth} from './linearmapper';
import {
  arrayFromRange, len, randomSample, setDifference, setEqual, setFromRange
} from '../libs/polyfill';
import LinearMapper from './linearmapper';
import {
  AllocateQubitGate, DeallocateQubitGate, FlushGate, Swap
} from '../ops';
import {tuple} from '../libs/util';
import Command from '../ops/command';
import {BasicQubit} from '../types/qubit';
import {LogicalQubitIDTag} from '../meta';

function hasEdge(g, u, v) {
  const edges = g.edges()
  for (let i = 0; i < edges.length; ++i) {
    const e = edges[i]
    if (e[0] === u && e[1] === v) {
      return true
    }
  }
  return false
}

/*
Mapper to a 2-D grid graph.

    Mapped qubits on the grid are numbered in row-major order. E.g. for
3 rows and 2 columns:

    0 - 1
    |   |
    2 - 3
    |   |
    4 - 5

The numbers are the mapped qubit ids. The backend might number
the qubits on the grid differently (e.g. not row-major), we call these
backend qubit ids. If the backend qubit ids are not row-major, one can
pass a dictionary translating from our row-major mapped ids to these
backend ids.

    Note: The algorithm sorts twice inside each column and once inside each
row.

    Attributes:
current_mapping:  Stores the mapping: key is logical qubit id, value
is backend qubit id.
storage(int): Number of gate it caches before mapping.
num_rows(int): Number of rows in the grid
num_columns(int): Number of columns in the grid
num_qubits(int): num_rows x num_columns = number of qubits
num_mappings (int): Number of times the mapper changed the mapping
depth_of_swaps (dict): Key are circuit depth of swaps, value is the
number of such mappings which have been
applied
num_of_swaps_per_mapping (dict): Key are the number of swaps per
mapping, value is the number of such
mappings which have been applied
 */
export default class GridMapper extends BasicMapperEngine {
  /*
  Initialize a GridMapper compiler engine.

    Args:
num_rows(int): Number of rows in the grid
num_columns(int): Number of columns in the grid.
mapped_ids_to_backend_ids(dict): Stores a mapping from mapped ids
which are 0,...,this.num_qubits-1
in row-major order on the grid to
the corresponding qubit ids of the
backend. Key: mapped id. Value:
corresponding backend id.
    Default is None which means
backend ids are identical to
mapped ids.
    storage: Number of gates to temporarily store
optimization_function: Function which takes a list of swaps and
returns a cost value. Mapper chooses a
permutation which minimizes this cost.
    Default optimizes for circuit depth.
num_optimization_steps(int): Number of different permutations to
of the matching to try and minimize
the cost.
    Raises:
RuntimeError: if incorrect `mapped_ids_to_backend_ids` parameter
   */
  constructor(args) {
    super()
    const {
      num_rows, num_columns, mapped_ids_to_backend_ids,
      storage = 1000,
      optimization_function = x => return_swap_depth(x),
      num_optimization_steps = 50
    } = args


    this.num_rows = num_rows
    this.num_columns = num_columns
    this.num_qubits = num_rows * num_columns
    // Internally we use the mapped ids until sending a command.
    // Before sending we use this map to translate to backend ids:
    this._mapped_ids_to_backend_ids = mapped_ids_to_backend_ids
    if (typeof this._mapped_ids_to_backend_ids === 'undefined' || this._mapped_ids_to_backend_ids === null) {
      this._mapped_ids_to_backend_ids = {}
      for (let i = 0; i < this.num_qubits; ++i) {
        this._mapped_ids_to_backend_ids[i] = i
      }
    }

    const f1 = setEqual(new Set(Object.keys(this._mapped_ids_to_backend_ids).map(k => parseInt(k, 10))), setFromRange(this.num_qubits))
    const f2 = new Set(Object.values(this._mapped_ids_to_backend_ids)).size === this.num_qubits
    if (!f1 || !f2) {
      throw new Error('Incorrect mapped_ids_to_backend_ids parameter')
    }
    this._backend_ids_to_mapped_ids = {}

    Object.keys(this._mapped_ids_to_backend_ids).forEach((mapped_id) => {
      const backend_id = this._mapped_ids_to_backend_ids[mapped_id]
      this._backend_ids_to_mapped_ids[backend_id] = mapped_id
    })
    // As we use internally the mapped ids which are in row-major order,
    // we have an internal current mapping which maps from logical ids to
    // these mapped ids:
    this._current_row_major_mapping = Object.assign({}, this._currentMapping)
    this.storage = storage
    this.optimization_function = optimization_function
    this.num_optimization_steps = num_optimization_steps
    // Randomness to pick permutations if there are too many.
    // This creates an own instance of Random in order to not influence
    // the bound methods of the random module which might be used in other
    // places.
    // TODO
    // this._rng = random.Random(11)
    // Storing commands
    this._stored_commands = []
    // Logical qubit ids for which the Allocate gate has already been
    // processed and sent to the next engine but which are not yet
    // deallocated:
    this._currently_allocated_ids = new Set()
    // Change between 2D and 1D mappings (2D is a snake like 1D chain)
    // Note it translates to our mapped ids in row major order and not
    // backend ids which might be different.
    this._map_2d_to_1d = {}
    this._map_1d_to_2d = {}
    for (let row_index = 0; row_index < this.num_rows; ++row_index) {
      for (let column_index = 0; column_index < this.num_columns; ++column_index) {
        if (row_index % 2 === 0) {
          const mapped_id = row_index * this.num_columns + column_index
          this._map_2d_to_1d[mapped_id] = mapped_id
          this._map_1d_to_2d[mapped_id] = mapped_id
        } else {
          const mapped_id_2d = row_index * this.num_columns + column_index
          const mapped_id_1d = ((row_index + 1) * this.num_columns - column_index - 1)
          this._map_2d_to_1d[mapped_id_2d] = mapped_id_1d
          this._map_1d_to_2d[mapped_id_1d] = mapped_id_2d
        }
      }
    }

    // Statistics:
    this.num_mappings = 0
    this.depth_of_swaps = {}
    this.num_of_swaps_per_mapping = {}
  }

  set currentMapping(newMapping) {
    this._currentMapping = newMapping
    if (typeof newMapping === 'undefined' || newMapping === null) {
      this._current_row_major_mapping = newMapping
    } else {
      this._current_row_major_mapping = {}

      Object.keys(newMapping).forEach((logical_id) => {
        const backend_id = newMapping[logical_id]
        this._current_row_major_mapping[logical_id] = parseInt(this._backend_ids_to_mapped_ids[backend_id], 10)
      })
    }
  }

  // Only allows 1 || two qubit gates.
  isAvailable(cmd) {
    let num_qubits = 0
    cmd.allQubits.forEach(qureg => num_qubits += qureg.length)
    return num_qubits <= 2
  }

  /*
  Returns a new mapping of the qubits.

    It goes through this._saved_commands and tries to find a
mapping to apply these gates on a first come first served basis.
    It reuses the function of a 1D mapper and creates a mapping for a
  1D linear chain and then wraps it like a snake onto the square grid.

    One might create better mappings by specializing this function for a
  square grid.

    Returns: A new mapping as a dict. key is logical qubit id,
    value is mapped id
   */
  returnNewMapping() {
    // Change old mapping to 1D in order to use LinearChain heuristic
    let old_mapping_1d
    if (this._current_row_major_mapping) {
      old_mapping_1d = {}
      Object.keys(this._current_row_major_mapping).forEach((logical_id) => {
        const mapped_id = this._current_row_major_mapping[logical_id]
        old_mapping_1d[logical_id] = this._map_2d_to_1d[mapped_id]
      })
    } else {
      old_mapping_1d = this._current_row_major_mapping
    }

    const new_mapping_1d = LinearMapper.returnNewMapping(
      this.num_qubits,
      false,
      this._currently_allocated_ids,
      this._stored_commands,
      old_mapping_1d
    )

    const new_mapping_2d = {}
    Object.keys(new_mapping_1d).forEach((logical_id) => {
      const mapped_id = new_mapping_1d[logical_id]
      new_mapping_2d[logical_id] = this._map_1d_to_2d[mapped_id]
    })

    return new_mapping_2d
  }

  // If swapped (inplace), then return swap operation
  // so that key(element0) < key(element1)
  _compareAndSwap(element0, element1, key) {
    if (key(element0) > key(element1)) {
      const mapped_id0 = (element0.current_column + element0.current_row * this.num_columns)
      const mapped_id1 = (element1.current_column + element1.current_row * this.num_columns)
      const swap_operation = [mapped_id0, mapped_id1]
      // swap elements but update also current position:
      const tmp_0 = element0.final_row
      const tmp_1 = element0.final_column
      const tmp_2 = element0.row_after_step_1
      element0.final_row = element1.final_row
      element0.final_column = element1.final_column
      element0.row_after_step_1 = element1.row_after_step_1
      element1.final_row = tmp_0
      element1.final_column = tmp_1
      element1.row_after_step_1 = tmp_2
      return swap_operation
    }
    return undefined
  }

  _sortWithinRows(final_positions, key) {
    const swap_operations = []
    for (let row = 0; row < this.num_rows; ++row) {
      let finished_sorting = false
      while (!finished_sorting) {
        finished_sorting = true
        for (let column = 1; column < this.num_columns - 1; column += 2) {
          const element0 = final_positions[row][column]
          const element1 = final_positions[row][column + 1]
          const swap = this._compareAndSwap(element0, element1, key)
          if (typeof swap !== 'undefined') {
            finished_sorting = false
            swap_operations.push(swap)
          }
        }

        for (let column = 0; column < this.num_columns - 1; column += 2) {
          const element0 = final_positions[row][column]
          const element1 = final_positions[row][column + 1]
          const swap = this._compareAndSwap(element0, element1, key)
          if (typeof swap !== 'undefined') {
            finished_sorting = false
            swap_operations.push(swap)
          }
        }
      }
    }
    return swap_operations
  }

  _sortWithinColumns(final_positions, key) {
    const swap_operations = []
    for (let column = 0; column < this.num_columns; ++column) {
      let finished_sorting = false
      while (!finished_sorting) {
        finished_sorting = true
        for (let row = 1; row < this.num_rows - 1; row += 2) {
          const element0 = final_positions[row][column]
          const element1 = final_positions[row + 1][column]
          const swap = this._compareAndSwap(element0, element1, key)
          if (typeof swap !== 'undefined') {
            finished_sorting = false
            swap_operations.push(swap)
          }
        }

        for (let row = 0; row < this.num_rows - 1; row += 2) {
          const element0 = final_positions[row][column]
          const element1 = final_positions[row + 1][column]
          const swap = this._compareAndSwap(element0, element1, key)
          if (typeof swap !== 'undefined') {
            finished_sorting = false
            swap_operations.push(swap)
          }
        }
      }
    }
    return swap_operations
  }

  /*
  Creates a new mapping and executes possible gates.

    It first allocates all 0, ..., this.num_qubits-1 mapped qubit ids, if
    they are not already used because we might need them all for the
  swaps. Then it creates a new map, swaps all the qubits to the new map,
    executes all possible gates, and finally deallocates mapped qubit ids
which don't store any information.
   */
  _run() {
    const num_of_stored_commands_before = len(this._stored_commands)
    if (!this.currentMapping) {
      this.currentMapping = {}
    } else {
      this._send_possible_commands()
      if (len(this._stored_commands) === 0) {
        return
      }
    }

    const new_row_major_mapping = this.returnNewMapping()
    // Find permutation of matchings with lowest cost
    let swaps
    let lowest_cost
    const matchings_numbers = arrayFromRange(this.num_rows)
    let ps
    if (this.num_optimization_steps <= math.factorial(this.num_rows)) {
      ps = permutations(matchings_numbers, this.num_rows)
    } else {
      ps = []
      for (let i = 0; i < this.num_optimization_steps; ++i) {
        ps.push(randomSample(matchings_numbers, this.num_rows))
      }
    }

    ps.forEach((permutation) => {
      const trial_swaps = this.return_swaps(
        this._current_row_major_mapping,
        new_row_major_mapping,
        permutation
      )
      if (typeof swaps === 'undefined') {
        swaps = trial_swaps
        lowest_cost = this.optimization_function(trial_swaps)
      } else if (lowest_cost > this.optimization_function(trial_swaps)) {
        swaps = trial_swaps
        lowest_cost = this.optimization_function(trial_swaps)
      }
    })
    if (swaps.length > 0) { // first mapping requires no swaps
      // Allocate all mapped qubit ids (which are not already allocated,
      // i.e., contained in this._currently_allocated_ids)
      let mapped_ids_used = new Set()
      for (const logical_id of this._currently_allocated_ids) {
        mapped_ids_used.add(
          this._current_row_major_mapping[logical_id]
        )
      }
      const not_allocated_ids = setDifference(setFromRange(this.num_qubits), mapped_ids_used)
      for (const mapped_id of not_allocated_ids) {
        const qb = new BasicQubit(this, this._mapped_ids_to_backend_ids[mapped_id])
        const cmd = new Command(this, new AllocateQubitGate(), tuple([qb]))
        this.send([cmd])
      }


      // Send swap operations to arrive at new_mapping:
      swaps.forEach(([qubit_id0, qubit_id1]) => {
        const q0 = new BasicQubit(this, this._mapped_ids_to_backend_ids[qubit_id0])
        const q1 = new BasicQubit(this, this._mapped_ids_to_backend_ids[qubit_id1])
        const cmd = new Command(this, Swap, tuple([q0], [q1]))
        this.send([cmd])
      })
      // Register statistics:
      this.num_mappings += 1
      const depth = return_swap_depth(swaps)
      if (!(depth in this.depth_of_swaps)) {
        this.depth_of_swaps[depth] = 1
      } else {
        this.depth_of_swaps[depth] += 1
      }
      if (!(len(swaps) in this.num_of_swaps_per_mapping)) {
        this.num_of_swaps_per_mapping[len(swaps)] = 1
      } else {
        this.num_of_swaps_per_mapping[len(swaps)] += 1
      }
      // Deallocate all previously mapped ids which we only needed for the
      // swaps:
      mapped_ids_used = new Set()
      for (const logical_id of this._currently_allocated_ids) {
        mapped_ids_used.add(new_row_major_mapping[logical_id])
      }
      const not_needed_anymore = setDifference(setFromRange(this.num_qubits), mapped_ids_used)
      for (const mapped_id of not_needed_anymore) {
        const qb = new BasicQubit(this, this._mapped_ids_to_backend_ids[mapped_id])
        const cmd = Command(this, new DeallocateQubitGate(), tuple([qb]))
        this.send([cmd])
      }
    }

    // Change to new map:
    this._current_row_major_mapping = new_row_major_mapping
    const new_mapping = {}
    Object.keys(new_row_major_mapping).forEach((logical_id) => {
      const mapped_id = new_row_major_mapping[logical_id]
      new_mapping[logical_id] = this._mapped_ids_to_backend_ids[mapped_id]
    })

    this.currentMapping = new_mapping
    // Send possible gates:
    this._send_possible_commands()
    // Check that mapper actually made progress
    if (len(this._stored_commands) === num_of_stored_commands_before) {
      throw new Error('Mapper is potentially in an infinite loop. '
          + 'It is likely that the algorithm requires '
          + 'too many qubits. Increase the number of '
          + 'qubits for this mapper.')
    }
  }

  /*
  Sends the stored commands possible without changing the mapping.

    Note: this._current_row_major_mapping (hence also this.currentMapping)
must exist already
   */
  _send_possible_commands() {
    const active_ids = new Set(this._currently_allocated_ids)
    Object.keys(this._current_row_major_mapping).forEach(logical_id => active_ids.add(logical_id))

    let new_stored_commands = []
    for (let i = 0; i < this._stored_commands.length; ++i) {
      const cmd = this._stored_commands[i]
      if (len(active_ids) === 0) {
        new_stored_commands = new_stored_commands.concat(this._stored_commands.slice(i))
        break
      }
      if (cmd.gate instanceof AllocateQubitGate) {
        const qid = cmd.qubits[0][0].id
        if (qid in this._current_row_major_mapping) {
          this._currently_allocated_ids.add(qid)
          const mapped_id = this._current_row_major_mapping[qid]
          const qb = new BasicQubit(this, this._mapped_ids_to_backend_ids[mapped_id])
          const new_cmd = new Command(this, new AllocateQubitGate(), tuple([qb]), [], [new LogicalQubitIDTag(qid)])
          this.send([new_cmd])
        } else {
          new_stored_commands.push(cmd)
        }
      } else if (cmd.gate instanceof DeallocateQubitGate) {
        const qid = cmd.qubits[0][0].id
        if (active_ids.has(qid)) {
          const mapped_id = this._current_row_major_mapping[qid]
          const qb = new BasicQubit(this, this._mapped_ids_to_backend_ids[mapped_id])
          const new_cmd = new Command(this, new DeallocateQubitGate(), tuple([qb]), [], [new LogicalQubitIDTag(qid)])
          this._currently_allocated_ids.delete(qid)
          active_ids.delete(qid)
          delete this._current_row_major_mapping[qid]
          delete this._currentMapping[qid]
          this.send([new_cmd])
        } else {
          new_stored_commands.push(cmd)
        }
      } else {
        let send_gate = true
        const mapped_ids = new Set()

        for (let i = 0; i < cmd.allQubits.length; ++i) {
          const qureg = cmd.allQubits[i]
          for (let j = 0; j < qureg.length; ++j) {
            const qubit = qureg[i]
            if (!active_ids.has(qubit.id)) {
              send_gate = false
              break
            }
            mapped_ids.add(this._current_row_major_mapping[qubit.id])
          }
        }


        // Check that mapped ids are nearest neighbour on 2D grid
        if (len(mapped_ids) === 2) {
          const [qb0, qb1] = Array.from(mapped_ids).sort()
          send_gate = false
          if (qb1 - qb0 === this.num_columns) {
            send_gate = true
          } else if (qb1 - qb0 === 1 && (qb1 % this.num_columns !== 0)) {
            send_gate = true
          }
        }
        if (send_gate) {
          // Note: This sends the cmd correctly with the backend ids
          //       as it looks up the mapping in this.currentMapping
          //       and not our internal mapping
          //       this._current_row_major_mapping
          this._send_cmd_with_mapped_ids(cmd)
        } else {
          cmd.allQubits.forEach(qureg => qureg.forEach(qubit => active_ids.delete(qubit.id)))
          new_stored_commands.push(cmd)
        }
      }
    }

    this._stored_commands = new_stored_commands
  }

  /*
  Receives a command list and, for each command, stores it until
we do a mapping (FlushGate || Cache of stored commands is full).

Args:
    command_list (list of Command objects): list of commands to
receive.
   */
  receive(command_list) {
    command_list.forEach((cmd) => {
      if (cmd.gate instanceof FlushGate) {
        while (this._stored_commands.length > 0) {
          this._run()
        }
        this.send([cmd])
      } else {
        this._stored_commands.push(cmd)
      }

      if (this._stored_commands.length >= this.storage) {
        this._run()
      }
    })
  }

  /*
  Returns the swap operation to change mapping

Args:
    old_mapping: dict: keys are logical ids and values are mapped
qubit ids
new_mapping: dict: keys are logical ids and values are mapped
qubit ids
permutation: list of int from 0, 1, ..., this.num_rows-1. It is
used to permute the found perfect matchings. Default
is None which keeps the original order.
    Returns:
List of tuples. Each tuple is a swap operation which needs to be
applied. Tuple contains the two mapped qubit ids for the Swap.
   */
  return_swaps(old_mapping, new_mapping, permutation) {
    if (typeof permutation === 'undefined') {
      permutation = arrayFromRange(this.num_rows)
    }
    let swap_operations = []

    class Position {
      constructor(current_row, current_column, final_row, final_column, row_after_step_1) {
        this.current_row = current_row
        this.current_column = current_column
        this.final_row = final_row
        this.final_column = final_column
        this.row_after_step_1 = row_after_step_1
      }
    }
    // final_positions contains info containers
    // final_position[i][j] contains info container with
    // current_row == i and current_column == j
    const final_positions = new Array(this.num_rows)
    for (let i = 0; i < this.num_rows; ++i) {
      final_positions[i] = new Array(this.num_columns)
    }

    // move qubits which are in both mappings
    const used_mapped_ids = new Set()

    Object.keys(old_mapping).forEach((logical_id) => {
      if (logical_id in new_mapping) {
        used_mapped_ids.add(new_mapping[logical_id])
        const old_column = old_mapping[logical_id] % this.num_columns
        const old_row = Math.floor(old_mapping[logical_id] / this.num_columns)
        const new_column = new_mapping[logical_id] % this.num_columns
        const new_row = Math.floor(new_mapping[logical_id] / this.num_columns)
        const info_container = new Position(old_row,
          old_column,
          new_row,
          new_column)
        final_positions[old_row][old_column] = info_container
      }
    })
    // exchange all remaining None with the not yet used mapped ids
    const all_ids = setFromRange(this.num_qubits)
    let not_used_mapped_ids = Array.from(setDifference(all_ids, used_mapped_ids))
    not_used_mapped_ids = not_used_mapped_ids.sort().reverse()

    for (let row = 0; row < this.num_rows; ++row) {
      for (let column = 0; column < this.num_columns; ++column) {
        if (typeof final_positions[row][column] === 'undefined') {
          const mapped_id = not_used_mapped_ids.pop()
          const new_column = mapped_id % this.num_columns
          const new_row = Math.floor(mapped_id / this.num_columns)
          const info_container = new Position(row, column, new_row, new_column)
          final_positions[row][column] = info_container
        }
      }
    }

    assert(len(not_used_mapped_ids) === 0)
    // 1. Assign column_after_step_1 for each element
    // Matching contains the num_columns matchings
    const matchings = new Array(this.num_rows)
    // Build bipartite graph. Nodes are the current columns numbered
    // (0, 1, ...) and the destination columns numbered with an offset of
    // this.num_columns (0 + offset, 1+offset, ...)
    const graph = new classes.Graph()
    const offset = this.num_columns
    graph.addNodesFrom(arrayFromRange(this.num_columns), 0)
    graph.addNodesFrom(arrayFromRange(offset, offset + this.num_columns), 1)
    // Add an edge to the graph from (i, j+offset) for every element
    // currently in column i which should go to column j for the new
    // mapping
    for (let row = 0; row < this.num_rows; ++row) {
      for (let column = 0; column < this.num_columns; ++column) {
        const destination_column = final_positions[row][column].final_column
        if (!hasEdge(graph, column, destination_column + offset)) {
          graph.addEdge(column, destination_column + offset)
          // Keep manual track of multiple edges between nodes
          graph[column][destination_column + offset].num = 1
        } else {
          graph[column][destination_column + offset].num += 1
        }
      }
    }

    // Find perfect matching, remove those edges from the graph
    // and do it again:
    for (let i = 0; i < this.num_rows; ++i) {
      const top_nodes = arrayFromRange(this.num_columns)
      const matching = nx.bipartite.maximum_matching(graph, top_nodes)
      matchings[i] = matching
      // Remove all edges of the current perfect matching
      for (let node = 0; node < this.num_columns; ++node) {
        if (graph[node][matching[node]].num === 1) {
          graph.removeEdge(node, matching[node])
        } else {
          graph[node][matching[node]].num -= 1
        }
      }
    }

    // permute the matchings:
    const tmp = deepcopy(matchings)
    for (let i = 0; i < this.num_rows; ++i) {
      matchings[i] = tmp[permutation[i]]
    }
    // Assign row_after_step_1
    for (let column = 0; column < this.num_columns; ++column) {
      for (let row_after_step_1 = 0; row_after_step_1 < this.num_rows; ++row_after_step_1) {
        const dest_column = matchings[row_after_step_1][column] - offset
        let best_element
        for (let row = 0; row < this.num_rows; ++row) {
          const element = final_positions[row][column]
          if (typeof element.row_after_step_1 !== 'undefined') {
            continue
          } else if (element.final_column == dest_column) {
            if (typeof best_element === 'undefined') {
              best_element = element
            } else if (best_element.final_row > element.final_row) {
              best_element = element
            }
          }
        }
        best_element.row_after_step_1 = row_after_step_1
      }
    }

    // 2. Sort inside all the rows
    let swaps = this._sortWithinColumns(final_positions, x => x.row_after_step_1)
    swap_operations = swap_operations.concat(swaps)
    // 3. Sort inside all the columns
    swaps = this._sortWithinRows(final_positions, x => x.final_column)
    swap_operations = swap_operations.concat(swaps)
    // 4. Sort inside all the rows
    swaps = this._sortWithinColumns(final_positions, x => x.final_row)
    swap_operations = swap_operations.concat(swaps)
    return swap_operations
  }
}
