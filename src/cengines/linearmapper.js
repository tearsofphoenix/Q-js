
/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
Mapper for a quantum circuit to a linear chain of qubits.

    Input: Quantum circuit with 1 and 2 qubit gates on n qubits. Gates are assumed
to be applied in parallel if they act on disjoint qubit(s) and any pair
of qubits can perform a 2 qubit gate (all-to-all connectivity)
Output: Quantum circuit in which qubits are placed in 1-D chain in which only
nearest neighbour qubits can perform a 2 qubit gate. The mapper uses
Swap gates in order to move qubits next to each other.
*/


import assert from 'assert'
import BasicMapperEngine from './basicmapper'
import {intersection, len, setDifference, setFromRange} from '../libs/polyfill'
import {
  Allocate,
  AllocateQubitGate, Deallocate, DeallocateQubitGate, FlushGate, Swap
} from '../ops/gates'
import {BasicQubit} from '../types/qubit'
import {tuple} from '../libs/util'
import Command from '../ops/command'
import {LogicalQubitIDTag} from '../meta'

/**
 Returns the circuit depth to execute these swaps.

 @param
   swaps(list of tuples): Each tuple contains two integers representing
 the two IDs of the qubits involved in the
 Swap operation
 @returns
   Circuit depth to execute these swaps.
 */
export function return_swap_depth(swaps) {
  const depth_of_qubits = {}
  swaps.forEach(([qb0_id, qb1_id]) => {
    if (!(qb0_id in depth_of_qubits)) {
      depth_of_qubits[qb0_id] = 0
    }
    if (!(qb1_id in depth_of_qubits)) {
      depth_of_qubits[qb1_id] = 0
    }
    const max_depth = Math.max(depth_of_qubits[qb0_id], depth_of_qubits[qb1_id])
    depth_of_qubits[qb0_id] = max_depth + 1
    depth_of_qubits[qb1_id] = max_depth + 1
  })
  const values = Object.values(depth_of_qubits)
  values.push(0)
  return Math.max(...values)
}

/**
 * @class LinearMapper
 * @classdesc
Maps a quantum circuit to a linear chain of nearest neighbour interactions.

    Maps a quantum circuit to a linear chain of qubits with nearest neighbour
interactions using Swap gates. It supports open or cyclic boundary
conditions.

    Attributes:
current_mapping:  Stores the mapping: key is logical qubit id, value
is mapped qubit id from 0,...,this.num_qubits
cyclic (Bool): If chain is cyclic or not
storage (int): Number of gate it caches before mapping.
num_mappings (int): Number of times the mapper changed the mapping
depth_of_swaps (dict): Key are circuit depth of swaps, value is the
number of such mappings which have been
applied
num_of_swaps_per_mapping (dict): Key are the number of swaps per
mapping, value is the number of such
mappings which have been applied

Note:
    1) Gates are cached and only mapped from time to time. A
FastForwarding gate doesn't empty the cache, only a FlushGate does.
2) Only 1 and two qubit gates allowed.
3) Does not optimize for dirty qubits.
 */
export default class LinearMapper extends BasicMapperEngine {
  /**
  Initialize a LinearMapper compiler engine.

    @param
num_qubits(int): Number of physical qubits in the linear chain
cyclic(bool): If 1D chain is a cycle. Default is false.
storage(int): Number of gates to temporarily store, default is 1000
   */
  constructor(num_qubits, cyclic = false, storage = 1000) {
    super()

    this.num_qubits = num_qubits
    this.cyclic = cyclic
    this.storage = storage
    // Storing commands
    this._stored_commands = []
    // Logical qubit ids for which the Allocate gate has already been
    // processed and sent to the next engine but which are not yet
    // deallocated:
    this._currently_allocated_ids = new Set()
    // Statistics:
    this.num_mappings = 0
    this.depth_of_swaps = {}
    this.num_of_swaps_per_mapping = {}
  }

  // Only allows 1 or two qubit gates.
  isAvailable(cmd) {
    let num_qubits = 0
    cmd.allQubits.forEach(qureg => num_qubits += len(qureg))
    return num_qubits <= 2
  }

  /**
  Builds a mapping of qubits to a linear chain.

    It goes through stored_commands and tries to find a
mapping to apply these gates on a first come first served basis.
    More compilicated scheme could try to optimize to apply as many gates
as possible between the Swaps.

    @param
num_qubits(int): Total number of qubits in the linear chain
cyclic(bool): If linear chain is a cycle.
currently_allocated_ids(set of int): Logical qubit ids for which
  the Allocate gate has already
been processed and sent to
the next engine but which are
not yet deallocated and hence
need to be included in the
new mapping.
stored_commands(list of Command objects): Future commands which
should be applied next.
    current_mapping: A current mapping as a dict. key is logical qubit
id, value is placement id. If there are different
possible maps, this current mapping is used to
minimize the swaps to go to the new mapping by a
heuristic.

    @returns A new mapping as a dict. key is logical qubit id,
    value is placement id
   */
  static returnNewMapping(num_qubits, cyclic, currently_allocated_ids,
    stored_commands, current_mapping) {
    // allocated_qubits is used as this mapper currently does not reassign
    // a qubit placement to a new qubit if the previous qubit at that
    // location has been deallocated. This is done after the next swaps.
    const allocated_qubits = new Set(currently_allocated_ids)
    const active_qubits = new Set(currently_allocated_ids)
    // Segments contains a list of segments. A segment is a list of
    // neighouring qubit ids
    const segments = []
    // neighbour_ids only used to speedup the lookup process if qubits
    // are already connected. key: qubit_id, value: set of neighbour ids
    const neighbour_ids = {}
    active_qubits.forEach(qubit_id => neighbour_ids[qubit_id] = new Set())

    for (let i = 0; i < stored_commands.length; ++i) {
      const cmd = stored_commands[i]
      if (len(allocated_qubits) === num_qubits && len(active_qubits) === 0) {
        break
      }

      const qubit_ids = []
      cmd.allQubits.forEach(qureg => qureg.forEach(qubit => qubit_ids.push(qubit.id)))

      if (len(qubit_ids) > 2 || len(qubit_ids) === 0) {
        throw new Error(`Invalid command (number of qubits): ${cmd.toString()}`)
      } else if (cmd.gate instanceof AllocateQubitGate) {
        const qubit_id = cmd.qubits[0][0].id
        if (len(allocated_qubits) < num_qubits) {
          allocated_qubits.add(qubit_id)
          active_qubits.add(qubit_id)
          neighbour_ids[qubit_id] = new Set()
        }
      } else if (cmd.gate instanceof DeallocateQubitGate) {
        const qubit_id = cmd.qubits[0][0].id
        if (active_qubits.has(qubit_id)) {
          active_qubits.delete(qubit_id)
        }
        // Do not remove from allocated_qubits as this would
        // allow the mapper to add a new qubit to this location
        // before the next swaps which is currently not supported
      } else if (len(qubit_ids) === 1) {
        continue
      } else {
        // Process a two qubit gate:

        LinearMapper._processTwoQubitGate(
          num_qubits,
          cyclic,
          qubit_ids[0],
          qubit_ids[1],
          active_qubits,
          segments,
          neighbour_ids
        )
      }
    }

    return LinearMapper._returnNewMappingFromSegments(
      num_qubits,
      segments,
      allocated_qubits,
      current_mapping
    )
  }

  /**
  Processes a two qubit gate.

    It either removes the two qubits from active_qubits if the gate is not
possible or updates the segements such that the gate is possible.

    @param
num_qubits (int): Total number of qubits in the chain
cyclic (bool): If linear chain is a cycle
qubit0 (int): qubit.id of one of the qubits
qubit1 (int): qubit.id of the other qubit
active_qubits (set): contains all qubit ids which for which gates
can be applied in this cycle before the swaps
segments: List of segments. A segment is a list of neighbouring
qubits.
neighbour_ids (dict): Key: qubit.id Value: qubit.id of neighbours
   */
  static _processTwoQubitGate(num_qubits, cyclic, qubit0, qubit1, active_qubits, segments, neighbour_ids) {
    // already connected
    if (qubit1 in neighbour_ids && neighbour_ids[qubit1].has(qubit0)) {
      // do nothing
      return
    }
    // at least one qubit is not an active qubit:
    else if (!active_qubits.has(qubit0) || !active_qubits.has(qubit1)) {
      active_qubits.delete(qubit0)
      active_qubits.delete(qubit1)
    }
    // at least one qubit is in the inside of a segment:
    else if (len(neighbour_ids[qubit0]) > 1 || len(neighbour_ids[qubit1]) > 1) {
      active_qubits.delete(qubit0)
      active_qubits.delete(qubit1)
    }
    // qubits are both active and either not yet in a segment or at
    // the end of segement:
    else {
      let segment_index_qb0
      let qb0_is_left_end
      let segment_index_qb1
      let qb1_is_left_end

      segments.forEach((segment, index) => {
        if (qubit0 === segment[0]) {
          segment_index_qb0 = index
          qb0_is_left_end = true
        } else if (qubit0 === segment[segment.length - 1]) {
          segment_index_qb0 = index
          qb0_is_left_end = false
        }
        if (qubit1 === segment[0]) {
          segment_index_qb1 = index
          qb1_is_left_end = true
        } else if (qubit1 === segment[segment.length - 1]) {
          segment_index_qb1 = index
          qb1_is_left_end = false
        }
      })
      // Both qubits are not yet assigned to a segment:
      if (typeof segment_index_qb0 === 'undefined' && typeof segment_index_qb1 === 'undefined') {
        segments.push([qubit0, qubit1])
        neighbour_ids[qubit0].add(qubit1)
        neighbour_ids[qubit1].add(qubit0)
      }
      // if qubits are in the same segment, then the gate is not
      // possible. Note that if this.cyclic==true, we have
      // added that connection already to neighbour_ids and wouldn't be
      // in this branch.
      else if (segment_index_qb0 === segment_index_qb1) {
        active_qubits.delete(qubit0)
        active_qubits.delete(qubit1)
        // qubit0 not yet assigned to a segment:
      } else if (typeof segment_index_qb0 === 'undefined') {
        if (qb1_is_left_end) {
          segments[segment_index_qb1].splice(0, 0, qubit0)
        } else {
          segments[segment_index_qb1].push(qubit0)
        }
        neighbour_ids[qubit0].add(qubit1)
        neighbour_ids[qubit1].add(qubit0)
        if (cyclic && len(segments[0]) === num_qubits) {
          const tmp = segments[0]
          neighbour_ids[tmp[0]].add(tmp[tmp.length - 1])
          neighbour_ids[tmp[tmp.length - 1]].add(tmp[0])
        }
      }
      // qubit1 not yet assigned to a segment:
      else if (typeof segment_index_qb1 === 'undefined') {
        if (qb0_is_left_end) {
          segments[segment_index_qb0].splice(0, 0, qubit1)
        } else {
          segments[segment_index_qb0].push(qubit1)
        }
        neighbour_ids[qubit0].add(qubit1)
        neighbour_ids[qubit1].add(qubit0)
        if (cyclic && len(segments[0]) === num_qubits) {
          const tmp = segments[0]
          neighbour_ids[tmp[0]].add(tmp[tmp.length - 1])
          neighbour_ids[tmp[tmp.length - 1]].add(tmp[0])
        }
      }
      // both qubits are at the end of different segments -> combine them
      else {
        if (!qb0_is_left_end && qb1_is_left_end) {
          segments[segment_index_qb0] = segments[segment_index_qb0].concat(segments[segment_index_qb1])
          segments.splice(segment_index_qb1, 1)
        } else if (!qb0_is_left_end && !qb1_is_left_end) {
          const rev = segments[segment_index_qb1].slice(0).reverse()
          segments[segment_index_qb0] = segments[segment_index_qb0].concat(rev)
          segments.splice(segment_index_qb1, 1)
        } else if (qb0_is_left_end && qb1_is_left_end) {
          segments[segment_index_qb0].reverse()
          segments[segment_index_qb0] = segments[segment_index_qb0].concat(segments[segment_index_qb1])
          segments.splice(segment_index_qb1, 1)
        } else {
          segments[segment_index_qb1] = segments[segment_index_qb1].concat(segments[segment_index_qb0])
          segments.splice(segment_index_qb0, 1)
        }

        // Add new neighbour ids && make sure to check cyclic
        neighbour_ids[qubit0].add(qubit1)
        neighbour_ids[qubit1].add(qubit0)
        if (cyclic && len(segments[0]) === num_qubits) {
          const tmp = segments[0]
          neighbour_ids[tmp[0]].add(tmp[tmp.length - 1])
          neighbour_ids[tmp[tmp.length - 1]].add(tmp[0])
        }
      }
    }
  }

  /**
  Returns the swap operation for an odd-even transposition sort.

  See https://en.wikipedia.org/wiki/Odd-even_sort for more info.

      @param
  old_mapping: dict: keys are logical ids and values are mapped
  qubit ids
  new_mapping: dict: keys are logical ids and values are mapped
  qubit ids
  @returns
      List of tuples. Each tuple is a swap operation which needs to be
  applied. Tuple contains the two MappedQubit ids for the Swap.
   */
  _oddEvenTranspositionSortSwaps(old_mapping, new_mapping) {
    const final_positions = new Array(this.num_qubits)
    // move qubits which are in both mappings
    Object.keys(old_mapping).forEach(logical_id => {
      if (logical_id in new_mapping) {
        final_positions[old_mapping[logical_id]] = new_mapping[logical_id]
      }
    })
    // exchange all remaining None with the not yet used mapped ids
    const used_mapped_ids = new Set(final_positions)
    used_mapped_ids.delete(undefined)
    const all_ids = setFromRange(this.num_qubits)
    let not_used_mapped_ids = Array.from(setDifference(all_ids, used_mapped_ids))
    // TODO
    not_used_mapped_ids = not_used_mapped_ids.sort().reverse()
    for (let i = 0; i < final_positions.length; ++i) {
      const looper = final_positions[i]
      if (typeof looper === 'undefined') {
        final_positions[i] = not_used_mapped_ids.pop()
      }
    }
    assert(len(not_used_mapped_ids) === 0)
    // Start sorting:
    const swap_operations = []
    let finished_sorting = false
    while (!finished_sorting) {
      finished_sorting = true
      for (let i = 1; i < len(final_positions); i += 2) {
        if (final_positions[i] > final_positions[i + 1]) {
          swap_operations.push(tuple(i, i + 1))
          const tmp = final_positions[i]
          final_positions[i] = final_positions[i + 1]
          final_positions[i + 1] = tmp
          finished_sorting = false
        }
      }
      for (let i = 0; i < len(final_positions) - 1; i += 2) {
        if (final_positions[i] > final_positions[i + 1]) {
          swap_operations.push(tuple(i, i + 1))
          const tmp = final_positions[i]
          final_positions[i] = final_positions[i + 1]
          final_positions[i + 1] = tmp
          finished_sorting = false
        }
      }
    }
    return swap_operations
  }


  /**
  Sends the stored commands possible without changing the mapping.

  Note: this.currentMapping must exist already
   */
  _sendPossibleCommands() {
    const active_ids = new Set(this._currently_allocated_ids)
    Object.keys(this._currentMapping).forEach(logical_id => active_ids.add(parseInt(logical_id, 10)))

    let new_stored_commands = []
    for (let i = 0; i < this._stored_commands.length; ++i) {
      const cmd = this._stored_commands[i]
      if (len(active_ids) === 0) {
        new_stored_commands = new_stored_commands.concat(this._stored_commands.slice(i))
        break
      }
      if (cmd.gate instanceof AllocateQubitGate) {
        const qid = cmd.qubits[0][0].id
        if (qid in this._currentMapping) {
          this._currently_allocated_ids.add(qid)
          const qb = new BasicQubit(this, this._currentMapping[qid])
          const new_cmd = new Command(this, new AllocateQubitGate(), tuple([qb]), [], [new LogicalQubitIDTag(qid)])
          this.send([new_cmd])
        } else {
          new_stored_commands.push(cmd)
        }
      } else if (cmd.gate instanceof DeallocateQubitGate) {
        const qid = cmd.qubits[0][0].id
        if (active_ids.has(qid)) {
          const qb = new BasicQubit(this, this._currentMapping[qid])
          const new_cmd = new Command(this, new DeallocateQubitGate(), tuple([qb]), [], [new LogicalQubitIDTag(qid)])
          this._currently_allocated_ids.delete(qid)
          active_ids.delete(qid)
          delete this._currentMapping[qid]
          this.send([new_cmd])
        } else {
          new_stored_commands.push(cmd)
        }
      } else {
        let send_gate = true
        let mapped_ids = new Set()
        for (let i = 0; i < cmd.allQubits.length; ++i) {
          const qureg = cmd.allQubits[i]
          for (let j = 0; j < qureg.length; ++j) {
            const qubit = qureg[j]
            if (!(active_ids.has(qubit.id))) {
              send_gate = false
              break
            }
            mapped_ids.add(this._currentMapping[qubit.id])
          }
        }

        // Check that mapped ids are nearest neighbour
        if (len(mapped_ids) === 2) {
          mapped_ids = Array.from(mapped_ids)
          const diff = Math.abs(mapped_ids[0] - mapped_ids[1])
          if (this.cyclic) {
            if (diff !== 1 && diff !== this.num_qubits - 1) {
              send_gate = false
            }
          } else if (diff !== 1) {
            send_gate = false
          }
        }
        if (send_gate) {
          this.sendCMDWithMappedIDs(cmd)
        } else {
          cmd.allQubits.forEach(qureg => qureg.forEach(qubit => active_ids.delete(qubit.id)))
          new_stored_commands.push(cmd)
        }
      }
    }
    this._stored_commands = new_stored_commands
  }

  /**
    Creates a new mapping and executes possible gates.

  It first allocates all 0, ..., this.num_qubits-1 mapped qubit ids, if
  they are not already used because we might need them all for the
  swaps. Then it creates a new map, swaps all the qubits to the new map,
  executes all possible gates, and finally deallocates mapped qubit ids
  which don't store any information.
   */
  _run() {
    const num_of_stored_commands_before = len(this._stored_commands)
    if (!this._currentMapping) {
      this.currentMapping = {}
    } else {
      this._sendPossibleCommands()
      if (len(this._stored_commands) === 0) {
        return
      }
    }
    const new_mapping = LinearMapper.returnNewMapping(this.num_qubits,
      this.cyclic,
      this._currently_allocated_ids,
      this._stored_commands,
      this.currentMapping)
    const swaps = this._oddEvenTranspositionSortSwaps(this._currentMapping, new_mapping)
    if (swaps.length > 0) { // first mapping requires no swaps
      // Allocate all mapped qubit ids (which are not already allocated,
      // i.e., contained in this._currently_allocated_ids)
      let mapped_ids_used = new Set()
      for (const logical_id of this._currently_allocated_ids) {
        mapped_ids_used.add(this._currentMapping[logical_id])
      }
      const tmpSet = setFromRange(this.num_qubits)
      const not_allocated_ids = setDifference(tmpSet, mapped_ids_used)
      for (const mapped_id of not_allocated_ids) {
        const qb = new BasicQubit(this, mapped_id)
        const cmd = new Command(this, Allocate, tuple([qb]))
        this.send([cmd])
      }
      // Send swap operations to arrive at new_mapping:
      swaps.forEach(([qubit_id0, qubit_id1]) => {
        const q0 = new BasicQubit(this, qubit_id0)
        const q1 = new BasicQubit(this, qubit_id1)
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
        mapped_ids_used.add(new_mapping[logical_id])
      }
      const not_needed_anymore = setDifference(setFromRange(this.num_qubits), mapped_ids_used)
      for (const mapped_id of not_needed_anymore) {
        const qb = new BasicQubit(this, mapped_id)
        const cmd = new Command(this, Deallocate, tuple([qb]))
        this.send([cmd])
      }
    }

    // Change to new map:
    this.currentMapping = new_mapping
    // Send possible gates:
    this._sendPossibleCommands()
    // Check that mapper actually made progress
    if (len(this._stored_commands) === num_of_stored_commands_before) {
      throw new Error('Mapper is potentially in an infinite loop. '
      + 'It is likely that the algorithm requires '
      + 'too many qubits. Increase the number of '
      + 'qubits for this mapper.')
    }
  }

  /**
  Receives a command list and, for each command, stores it until
  we do a mapping (FlushGate or Cache of stored commands is full).

  @param
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
    })

    // Storage is full: Create new map and send some gates away:
    if (this._stored_commands.length >= this.storage) {
      this._run()
    }
  }

  /**
   * @static
  Combines the individual segments into a new mapping.

  It tries to minimize the number of swaps to go from the old mapping
  in this.currentMapping to the new mapping which it returns. The
  strategy is to map a segment to the same region where most of the
  qubits are already. Note that this is not a global optimal strategy
  but helps if currently the qubits can be divided into independent
  groups without interactions between the groups.

  @param
      num_qubits (int): Total number of qubits in the linear chain
  segments: List of segments. A segment is a list of qubit ids which
  should be nearest neighbour in the new map.
  Individual qubits are in allocated_qubits but not in
  any segment
  allocated_qubits: A set of all qubit ids which need to be present
  in the new map
  current_mapping: A current mapping as a dict. key is logical qubit
  id, value is placement id. If there are different
  possible maps, this current mapping is used to
  minimize the swaps to go to the new mapping by a
  heuristic.
  @returns
      A new mapping as a dict. key is logical qubit id,
  value is placement id
   */
  static _returnNewMappingFromSegments(num_qubits, segments, allocated_qubits, current_mapping) {
    const remaining_segments = segments.slice(0)
    const individual_qubits = new Set(allocated_qubits)
    let num_unused_qubits = num_qubits - len(allocated_qubits)
    // Create a segment out of individual qubits and add to segments
    segments.forEach((segment) => {
      segment.forEach((qubit_id) => {
        individual_qubits.delete(qubit_id)
      })
    })

    for (const individual_qubit_id of individual_qubits) {
      remaining_segments.push([individual_qubit_id])
    }

    const previous_chain = new Array(num_qubits)
    if (current_mapping) {
      Object.keys(current_mapping).forEach(key => previous_chain[current_mapping[key]] = parseInt(key, 10))
    }

    // Note: previous_chain potentially has some None elements
    const new_chain = new Array(num_qubits)

    let current_position_to_fill = 0
    while (len(remaining_segments)) {
      let best_segment = []
      let best_padding = num_qubits
      let highest_overlap_fraction = 0
      remaining_segments.forEach((segment) => {
        for (let padding = 0; padding < num_unused_qubits + 1; ++padding) {
          const idx0 = current_position_to_fill + padding
          const idx1 = idx0 + len(segment)

          const previous_chain_ids = new Set(previous_chain.slice(idx0, idx1))
          previous_chain_ids.delete(undefined)
          const segment_ids = new Set(segment)
          segment_ids.delete(undefined)

          const overlap = len(intersection(previous_chain_ids, segment_ids)) + previous_chain.slice(idx0, idx1).count(undefined)
          let overlap_fraction
          if (overlap === 0) {
            overlap_fraction = 0
          } else if (overlap === len(segment)) {
            overlap_fraction = 1
          } else {
            overlap_fraction = overlap / (len(segment) * 1.0)
          }
          if ((overlap_fraction === 1 && padding < best_padding)
          || overlap_fraction > highest_overlap_fraction
          || highest_overlap_fraction === 0) {
            best_segment = segment
            best_padding = padding
            highest_overlap_fraction = overlap_fraction
          }
        }
      })

      // Add best segment and padding to new_chain
      const start = current_position_to_fill + best_padding
      for (let i = 0; i < len(best_segment); ++i) {
        new_chain[start + i] = best_segment[i]
      }

      remaining_segments.remove(best_segment)
      current_position_to_fill += best_padding + len(best_segment)
      num_unused_qubits -= best_padding
    }
    // Create mapping
    const new_mapping = {}
    Object.keys(new_chain).forEach((pos) => {
      const logical_id = new_chain[pos]
      if (typeof logical_id !== 'undefined') {
        new_mapping[logical_id] = parseInt(pos, 10)
      }
    })
    return new_mapping
  }
}
