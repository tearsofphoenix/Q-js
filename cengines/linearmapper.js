
/*
Mapper for a quantum circuit to a linear chain of qubits.

    Input: Quantum circuit with 1 and 2 qubit gates on n qubits. Gates are assumed
to be applied in parallel if they act on disjoint qubit(s) and any pair
of qubits can perform a 2 qubit gate (all-to-all connectivity)
Output: Quantum circuit in which qubits are placed in 1-D chain in which only
nearest neighbour qubits can perform a 2 qubit gate. The mapper uses
Swap gates in order to move qubits next to each other.
*/


/*
Returns the circuit depth to execute these swaps.

    Args:
swaps(list of tuples): Each tuple contains two integers representing
the two IDs of the qubits involved in the
Swap operation
Returns:
    Circuit depth to execute these swaps.
 */
import BasicMapperEngine from "./basicmapper";
import {len} from "../libs/polyfill";
import {AllocateQubitGate, DeallocateQubitGate} from "../ops/gates";

function return_swap_depth(swaps) {
  const depth_of_qubits = {}
  // for qb0_id, qb1_id in swaps:
  // if qb0_id not in depth_of_qubits:
  // depth_of_qubits[qb0_id] = 0
  // if qb1_id not in depth_of_qubits:
  // depth_of_qubits[qb1_id] = 0
  // max_depth = max(depth_of_qubits[qb0_id], depth_of_qubits[qb1_id])
  // depth_of_qubits[qb0_id] = max_depth + 1
  // depth_of_qubits[qb1_id] = max_depth + 1
  return max(list(depth_of_qubits.values()) + [0])
}

/*
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
  /*
  Initialize a LinearMapper compiler engine.

    Args:
num_qubits(int): Number of physical qubits in the linear chain
cyclic(bool): If 1D chain is a cycle. Default is false.
storage(int): Number of gates to temporarily store, default is 1000
   */
  constructor(num_qubits, cyclic = false, storage=1000) {
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

  /*
  Builds a mapping of qubits to a linear chain.

    It goes through stored_commands and tries to find a
mapping to apply these gates on a first come first served basis.
    More compilicated scheme could try to optimize to apply as many gates
as possible between the Swaps.

    Args:
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

    Returns: A new mapping as a dict. key is logical qubit id,
    value is placement id
   */
  static returnNewMapping(num_qubits, cyclic, currently_allocated_ids,
                          stored_commands, current_mapping) {

    // allocated_qubits is used as this mapper currently does not reassign
    // a qubit placement to a new qubit if the previous qubit at that
    // location has been deallocated. This is done after the next swaps.
       const allocated_qubits = currently_allocated_ids.slice(0)
    const active_qubits = currently_allocated_ids.slice(0)
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
           break;
      }

      const qubit_ids = []
      cmd.allQubits.forEach(qureg => qureg.forEach(qubit => qubit_ids.push(qubit.id)))

      if (len(qubit_ids) > 2 || len(qubit_ids) === 0) {
        throw new Error("Invalid command (number of qubits): " + cmd.toString())
      } else if (cmd.gate instanceof AllocateQubitGate) {
        const qubit_id = cmd.qubits[0][0].id
        if(len(allocated_qubits) < num_qubits) {
          allocated_qubits.add(qubit_id)
          active_qubits.add(qubit_id)
          neighbour_ids[qubit_id] = new Set()
        }
      } else if (cmd.gate instanceof DeallocateQubitGate) {
        const qubit_id = cmd.qubits[0][0].id
        if (active_qubits.has(qubit_id)) {
          active_qubits.remove(qubit_id)
        }
        // Do not remove from allocated_qubits as this would
        // allow the mapper to add a new qubit to this location
        // before the next swaps which is currently not supported
      } else if (len(qubit_ids) === 1) {
        continue
      } else {
        // Process a two qubit gate:

        LinearMapper._process_two_qubit_gate(
            num_qubits,
            cyclic,
            qubit_ids[0],
            qubit_ids[1],
            active_qubits,
            segments,
            neighbour_ids)
      }
    }

    return LinearMapper._return_new_mapping_from_segments(
        num_qubits,
        segments,
        allocated_qubits,
        current_mapping)

  }

  /*
  Processes a two qubit gate.

    It either removes the two qubits from active_qubits if the gate is not
possible or updates the segements such that the gate is possible.

    Args:
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
  static _process_two_qubit_gate(num_qubits, cyclic, qubit0, qubit1,
                                 active_qubits, segments, neighbour_ids) {
    // already connected
    if (qubit1 in neighbour_ids && qubit0 in neighbour_ids[qubit1]) {
      return
    }
// at least one qubit is not an active qubit:
    else if(!(qubit0 in active_qubits) || !(qubit1 in active_qubits)) {
      active_qubits.remove(qubit0)
      active_qubits.remove(qubit1)
    }
// at least one qubit is in the inside of a segment:
    else if(len(neighbour_ids[qubit0]) > 1 || len(neighbour_ids[qubit1]) > 1) {
      active_qubits.remove(qubit0)
      active_qubits.remove(qubit1)
    }
// qubits are both active and either not yet in a segment or at
// the end of segement:
  else {
      let segment_index_qb0
      let qb0_is_left_end
      let segment_index_qb1
      let qb1_is_left_end

      segments.forEach((segment, index) => {
        if(qubit0 == segment[0]) {
          segment_index_qb0 = index
          qb0_is_left_end = true
        }else if(qubit0 == segment[-1]) {
          segment_index_qb0 = index
          qb0_is_left_end = false
        }
        if(qubit1 == segment[0]) {
          segment_index_qb1 = index
          qb1_is_left_end = true
        } else if (qubit1 == segment[-1]) {
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
      else if (segment_index_qb0 == segment_index_qb1) {
        active_qubits.remove(qubit0)
        active_qubits.remove(qubit1)
// qubit0 not yet assigned to a segment:
      } else if (typeof segment_index_qb0 === 'undefined') {
          if (qb1_is_left_end) {
            segments[segment_index_qb1].insert(0, qubit0)
          }else {
            segments[segment_index_qb1].append(qubit0)
          }
      neighbour_ids[qubit0].add(qubit1)
      neighbour_ids[qubit1].add(qubit0)
      if(cyclic && len(segments[0]) == num_qubits) {
        neighbour_ids[segments[0][0]].add(segments[0][-1])
        neighbour_ids[segments[0][-1]].add(segments[0][0])
      }
      }
// qubit1 not yet assigned to a segment:
      else if (typeof segment_index_qb1 === 'undefined') {
        if (qb0_is_left_end) {
          segments[segment_index_qb0].insert(0, qubit1)
        } else {
          segments[segment_index_qb0].append(qubit1)
        }
        neighbour_ids[qubit0].add(qubit1)
        neighbour_ids[qubit1].add(qubit0)
        if (cyclic && len(segments[0]) == num_qubits) {
          neighbour_ids[segments[0][0]].add(segments[0][-1])
          neighbour_ids[segments[0][-1]].add(segments[0][0])
        }
      }
// both qubits are at the end of different segments -> combine them
    else {
        if (!qb0_is_left_end && qb1_is_left_end) {
          segments[segment_index_qb0].extend(
              segments[segment_index_qb1])
          segments.pop(segment_index_qb1)
        }else if(!qb0_is_left_end && !qb1_is_left_end) {
          segments[segment_index_qb0].extend(
              reversed(segments[segment_index_qb1]))
          segments.pop(segment_index_qb1)
        }else if(qb0_is_left_end && qb1_is_left_end) {
          segments[segment_index_qb0].reverse()
          segments[segment_index_qb0].extend(
              segments[segment_index_qb1])
          segments.pop(segment_index_qb1)
        }else {
          segments[segment_index_qb1].extend(
              segments[segment_index_qb0])
          segments.pop(segment_index_qb0)
// Add new neighbour ids && make sure to check cyclic
          neighbour_ids[qubit0].add(qubit1)
          neighbour_ids[qubit1].add(qubit0)
          if (cyclic && len(segments[0]) == num_qubits) {
            neighbour_ids[segments[0][0]].add(segments[0][-1])
            neighbour_ids[segments[0][-1]].add(segments[0][0])
          }
        }
      }
    }
    return
  }
}

@staticmethod
def _return_new_mapping_from_segments(num_qubits, segments,
    allocated_qubits, current_mapping):
"""
Combines the individual segments into a new mapping.

It tries to minimize the number of swaps to go from the old mapping
in this.current_mapping to the new mapping which it returns. The
strategy is to map a segment to the same region where most of the
qubits are already. Note that this is not a global optimal strategy
but helps if currently the qubits can be divided into independent
groups without interactions between the groups.

    Args:
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
    Returns:
A new mapping as a dict. key is logical qubit id,
    value is placement id
"""
remaining_segments = deepcopy(segments)
individual_qubits = deepcopy(allocated_qubits)
num_unused_qubits = num_qubits - len(allocated_qubits)
// Create a segment out of individual qubits and add to segments
for segment in segments:
for qubit_id in segment:
individual_qubits.remove(qubit_id)
for individual_qubit_id in individual_qubits:
remaining_segments.append([individual_qubit_id])

previous_chain = [None] * num_qubits
if current_mapping:
for key, value in current_mapping.items():
previous_chain[value] = key
// Note: previous_chain potentially has some None elements
new_chain = [None] * num_qubits

current_position_to_fill = 0
while len(remaining_segments):
best_segment = None
best_padding = num_qubits
highest_overlap_fraction = 0
for segment in remaining_segments:
for padding in range(num_unused_qubits + 1):
idx0 = current_position_to_fill + padding
idx1 = idx0 + len(segment)

previous_chain_ids = set(previous_chain[idx0:idx1])
previous_chain_ids.discard(None)
segment_ids = set(segment)
segment_ids.discard(None)

overlap = len(previous_chain_ids.intersection(
    segment_ids)) + previous_chain[idx0:idx1].count(None)
if overlap == 0:
overlap_fraction = 0
elif overlap == len(segment):
overlap_fraction = 1
else:
overlap_fraction = overlap / float(len(segment))
if ((overlap_fraction == 1 && padding < best_padding) or
overlap_fraction > highest_overlap_fraction or
highest_overlap_fraction == 0):
best_segment = segment
best_padding = padding
highest_overlap_fraction = overlap_fraction
// Add best segment and padding to new_chain
new_chain[current_position_to_fill+best_padding:
current_position_to_fill+best_padding +
len(best_segment)] = best_segment
remaining_segments.remove(best_segment)
current_position_to_fill += best_padding + len(best_segment)
num_unused_qubits -= best_padding
// Create mapping
new_mapping = {}
for pos, logical_id in enumerate(new_chain):
if logical_id is not None:
    new_mapping[logical_id] = pos
return new_mapping

def _odd_even_transposition_sort_swaps(self, old_mapping, new_mapping):
"""
Returns the swap operation for an odd-even transposition sort.

    See https://en.wikipedia.org/wiki/Odd-even_sort for more info.

    Args:
        old_mapping: dict: keys are logical ids and values are mapped
qubit ids
new_mapping: dict: keys are logical ids and values are mapped
qubit ids
Returns:
    List of tuples. Each tuple is a swap operation which needs to be
applied. Tuple contains the two MappedQubit ids for the Swap.
"""
final_positions = [None] * this.num_qubits
// move qubits which are in both mappings
for logical_id in old_mapping:
if logical_id in new_mapping:
final_positions[old_mapping[logical_id]] = new_mapping[
    logical_id]
// exchange all remaining None with the not yet used mapped ids
used_mapped_ids = set(final_positions)
used_mapped_ids.discard(None)
all_ids = set(range(this.num_qubits))
not_used_mapped_ids = list(all_ids.difference(used_mapped_ids))
not_used_mapped_ids = sorted(not_used_mapped_ids, reverse=true)
for i in range(len(final_positions)):
if final_positions[i] is None:
    final_positions[i] = not_used_mapped_ids.pop()
assert len(not_used_mapped_ids) == 0
// Start sorting:
    swap_operations = []
finished_sorting = false
while not finished_sorting:
    finished_sorting = true
for i in range(1, len(final_positions)-1, 2):
if final_positions[i] > final_positions[i+1]:
swap_operations.append((i, i+1))
tmp = final_positions[i]
final_positions[i] = final_positions[i+1]
final_positions[i+1] = tmp
finished_sorting = false
for i in range(0, len(final_positions)-1, 2):
if final_positions[i] > final_positions[i+1]:
swap_operations.append((i, i+1))
tmp = final_positions[i]
final_positions[i] = final_positions[i+1]
final_positions[i+1] = tmp
finished_sorting = false
return swap_operations

def _send_possible_commands(self):
"""
Sends the stored commands possible without changing the mapping.

    Note: this.current_mapping must exist already
"""
active_ids = deepcopy(this._currently_allocated_ids)
for logical_id in this.current_mapping:
active_ids.add(logical_id)

new_stored_commands = []
for i in range(len(this._stored_commands)):
cmd = this._stored_commands[i]
if len(active_ids) == 0:
new_stored_commands += this._stored_commands[i:]
break
if isinstance(cmd.gate, AllocateQubitGate):
if cmd.qubits[0][0].id in this.current_mapping:
this._currently_allocated_ids.add(cmd.qubits[0][0].id)
qb = WeakQubitRef(
    engine=self,
    idx=this.current_mapping[cmd.qubits[0][0].id])
new_cmd = Command(
    engine=self,
    gate=AllocateQubitGate(),
    qubits=([qb],),
    tags=[LogicalQubitIDTag(cmd.qubits[0][0].id)])
this.send([new_cmd])
else:
new_stored_commands.append(cmd)
elif isinstance(cmd.gate, DeallocateQubitGate):
if cmd.qubits[0][0].id in active_ids:
qb = WeakQubitRef(
    engine=self,
    idx=this.current_mapping[cmd.qubits[0][0].id])
new_cmd = Command(
    engine=self,
    gate=DeallocateQubitGate(),
    qubits=([qb],),
    tags=[LogicalQubitIDTag(cmd.qubits[0][0].id)])
this._currently_allocated_ids.remove(cmd.qubits[0][0].id)
active_ids.remove(cmd.qubits[0][0].id)
this._current_mapping.pop(cmd.qubits[0][0].id)
this.send([new_cmd])
else:
new_stored_commands.append(cmd)
else:
send_gate = true
mapped_ids =new Set()
for qureg in cmd.all_qubits:
for qubit in qureg:
if qubit.id not in active_ids:
send_gate = false
break
mapped_ids.add(this.current_mapping[qubit.id])
// Check that mapped ids are nearest neighbour
if len(mapped_ids) == 2:
mapped_ids = list(mapped_ids)
diff = abs(mapped_ids[0]-mapped_ids[1])
if this.cyclic:
if diff != 1 && diff != this.num_qubits-1:
send_gate = false
else:
if diff != 1:
send_gate = false
if send_gate:
this._send_cmd_with_mapped_ids(cmd)
else:
for qureg in cmd.all_qubits:
for qubit in qureg:
active_ids.discard(qubit.id)
new_stored_commands.append(cmd)
this._stored_commands = new_stored_commands

def _run(self):
"""
Creates a new mapping and executes possible gates.

    It first allocates all 0, ..., this.num_qubits-1 mapped qubit ids, if
    they are not already used because we might need them all for the
  swaps. Then it creates a new map, swaps all the qubits to the new map,
    executes all possible gates, and finally deallocates mapped qubit ids
which don't store any information.
"""
num_of_stored_commands_before = len(this._stored_commands)
if not this.current_mapping:
this.current_mapping = {}
else:
this._send_possible_commands()
if len(this._stored_commands) == 0:
return
new_mapping = this.return_new_mapping(this.num_qubits,
    this.cyclic,
    this._currently_allocated_ids,
    this._stored_commands,
    this.current_mapping)
swaps = this._odd_even_transposition_sort_swaps(
    old_mapping=this.current_mapping, new_mapping=new_mapping)
if swaps:  // first mapping requires no swaps
// Allocate all mapped qubit ids (which are not already allocated,
    // i.e., contained in this._currently_allocated_ids)
mapped_ids_used =new Set()
for logical_id in this._currently_allocated_ids:
mapped_ids_used.add(this.current_mapping[logical_id])
not_allocated_ids = set(range(this.num_qubits)).difference(
    mapped_ids_used)
for mapped_id in not_allocated_ids:
qb = WeakQubitRef(engine=self, idx=mapped_id)
cmd = Command(engine=self, gate=Allocate, qubits=([qb],))
this.send([cmd])
// Send swap operations to arrive at new_mapping:
    for qubit_id0, qubit_id1 in swaps:
q0 = WeakQubitRef(engine=self, idx=qubit_id0)
q1 = WeakQubitRef(engine=self, idx=qubit_id1)
cmd = Command(engine=self, gate=Swap, qubits=([q0], [q1]))
this.send([cmd])
// Register statistics:
    this.num_mappings += 1
depth = return_swap_depth(swaps)
if depth not in this.depth_of_swaps:
this.depth_of_swaps[depth] = 1
else:
this.depth_of_swaps[depth] += 1
if len(swaps) not in this.num_of_swaps_per_mapping:
this.num_of_swaps_per_mapping[len(swaps)] = 1
else:
this.num_of_swaps_per_mapping[len(swaps)] += 1
// Deallocate all previously mapped ids which we only needed for the
  // swaps:
mapped_ids_used =new Set()
for logical_id in this._currently_allocated_ids:
mapped_ids_used.add(new_mapping[logical_id])
not_needed_anymore = set(range(this.num_qubits)).difference(
    mapped_ids_used)
for mapped_id in not_needed_anymore:
qb = WeakQubitRef(engine=self, idx=mapped_id)
cmd = Command(engine=self, gate=Deallocate,
    qubits=([qb],))
this.send([cmd])
// Change to new map:
this.current_mapping = new_mapping
// Send possible gates:
    this._send_possible_commands()
// Check that mapper actually made progress
if len(this._stored_commands) == num_of_stored_commands_before:
raise RuntimeError("Mapper is potentially in an infinite loop. "
"It is likely that the algorithm requires "
"too many qubits. Increase the number of "
"qubits for this mapper.")

def receive(self, command_list):
"""
Receives a command list and, for each command, stores it until
we do a mapping (FlushGate or Cache of stored commands is full).

Args:
    command_list (list of Command objects): list of commands to
receive.
"""
for cmd in command_list:
if isinstance(cmd.gate, FlushGate):
while(len(this._stored_commands)):
this._run()
this.send([cmd])
else:
this._stored_commands.append(cmd)
// Storage is full: Create new map and send some gates away:
    if len(this._stored_commands) >= this.storage:
this._run()
