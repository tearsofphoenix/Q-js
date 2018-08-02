import {BasicEngine} from './basics'

/*
LocalOptimizer is a compiler engine which optimizes locally (merging
rotations, cancelling gates with their inverse) in a local window of user-
defined size.

    It stores all commands in a dict of lists, where each qubit has its own
gate pipeline. After adding a gate, it tries to merge / cancel successive
gates using the get_merged and get_inverse functions of the gate (if
    available). For examples, see BasicRotationGate. Once a list corresponding
to a qubit contains >=m gates, the pipeline is sent on to the next engine.
 */
export default class LocalOptimizer extends BasicEngine {

  /*
  Initialize a LocalOptimizer object.

    Args:
m (int): Number of gates to cache per qubit, before sending on the
first gate.
   */
  constructor(m = 5) {
    super()
    this._l = {} // dict of lists containing operations for each qubit
    this._m = m // wait for m gates before sending on
  }

  // Send n gate operations of the qubit with index idx to the next engine.
  sendQubitPipeline(idx, n) {
    // temporary label for readability
    const il = this._l[idx]
    const count = Math.min(n, il.length)

    // loop over first n operations
    // send all gates before n-qubit gate for other qubits involved
    // --> recursively call send_helper
    for (let i = 0; i < count; ++i) {
      const other_involved_qubits = []
      il[i].allQubits.forEach(qreg => qreg.forEach(qb => {
        if (qb.id !== idx) {
          other_involved_qubits.push(qb)
        }
      }))

      other_involved_qubits.forEach(qb => {
        let idLooper = qb.id
        try {
          let gateloc = 0
          // find location of this gate within its list
          while (this._l[idLooper][gateloc].equal(il[i])) {
            gateloc += 1
          }

          gateloc = this._optimize(idLooper, gateloc)
          // flush the gates before the n-qubit gate
          this._sendQubitPipeline(idLooper, gateloc)
          // delete the n-qubit gate, we're taking care of it
          // and don't want the other qubit to do so
          this._l[idLooper] = this._l[idLooper].slice(1)
        } catch (e) {
          console.log("Invalid qubit pipeline encountered (in the"
          + " process of shutting down?).")
        }
      })
      // all qubits that need to be flushed have been flushed
      // --> send on the n-qubit gate
      this.send([il[i]])
    }
    // n operations have been sent on --> resize our gate list
    this._l[idx] = this._l[idx].slice(n)
  }

  /*
  Return all indices of a command, each index corresponding to the
command's index in one of the qubits' command lists.

    Args:
idx (int): qubit index
i (int): command position in qubit idx's command list
IDs (list<int>): IDs of all qubits involved in the command
   */
  getGateIndices(idx, i, IDs) {
    const N = IDs.length
    // 1-qubit gate: only gate at index i in list #idx is involved
    if (N === 1) {
      return [i]
    }

    // When the same gate appears multiple time, we need to make sure not to
    // match earlier instances of the gate applied to the same qubits. So we
    // count how many there are, and skip over them when looking in the
    // other lists.
     const cmd = this._l[idx][i]
    let num_identical_to_skip = 0
    this._l[idx].slice(0, i).forEach(prev_cmd => {
      if (prev_cmd.equal(cmd)) {
        num_identical_to_skip += 1
      }
    })

    const indices = []
    IDs.forEach(Id => {
      const identical_indices = []
      this._l[Id].forEach((c, i) => {
        if (c.equal(cmd)) {
          identical_indices.push(i)
        }
      })
      indices.push(identical_indices[num_identical_to_skip])
    })
    return indices
  }
}


def _optimize(self, idx, lim=None):
"""
Try to merge or even cancel successive gates using the get_merged and
get_inverse functions of the gate (see, e.g., BasicRotationGate).

    It does so for all qubit command lists.
"""
# loop over all qubit indices
i = 0
new_gateloc = 0
limit = len(this._l[idx])
if lim is not None:
    limit = lim
new_gateloc = limit

while i < limit - 1:
# can be dropped if two in a row are self-inverses
inv = this._l[idx][i].get_inverse()

if inv == this._l[idx][i + 1]:
# determine index of this gate on all qubits
qubitids = [qb.id for sublist in this._l[idx][i].all_qubits
    for qb in sublist]
gid = this._get_gate_indices(idx, i, qubitids)
# check that there are no other gates between this and its
# inverse on any of the other qubits involved
erase = True
for j in range(len(qubitids)):
erase *= (inv == this._l[qubitids[j]][gid[j] + 1])

# drop these two gates if possible and goto next iteration
if erase:
for j in range(len(qubitids)):
new_list = (this._l[qubitids[j]][0:gid[j]] +
    this._l[qubitids[j]][gid[j] + 2:])
this._l[qubitids[j]] = new_list
i = 0
limit -= 2
continue

# gates are not each other's inverses --> check if they're
# mergeable
try:
merged_command = this._l[idx][i].get_merged(
    this._l[idx][i + 1])
# determine index of this gate on all qubits
qubitids = [qb.id for sublist in this._l[idx][i].all_qubits
    for qb in sublist]
gid = this._get_gate_indices(idx, i, qubitids)

merge = True
for j in range(len(qubitids)):
m = this._l[qubitids[j]][gid[j]].get_merged(
    this._l[qubitids[j]][gid[j] + 1])
merge *= (m == merged_command)

if merge:
for j in range(len(qubitids)):
this._l[qubitids[j]][gid[j]] = merged_command
new_list = (this._l[qubitids[j]][0:gid[j] + 1] +
    this._l[qubitids[j]][gid[j] + 2:])
this._l[qubitids[j]] = new_list
i = 0
limit -= 1
continue
except NotMergeable:
    pass  # can't merge these two commands.

i += 1  # next iteration: look at next gate
return limit

def _check_and_send(self):
"""
Check whether a qubit pipeline must be sent on and, if so,
    optimize the pipeline and then send it on.
"""
for i in this._l:
if (len(this._l[i]) >= this._m or len(this._l[i]) > 0 and
isinstance(this._l[i][-1].gate, FastForwardingGate)):
this._optimize(i)
if (len(this._l[i]) >= this._m and not
isinstance(this._l[i][-1].gate,
    FastForwardingGate)):
this._send_qubit_pipeline(i, len(this._l[i]) - this._m + 1)
elif (len(this._l[i]) > 0 and
isinstance(this._l[i][-1].gate, FastForwardingGate)):
this._send_qubit_pipeline(i, len(this._l[i]))
new_dict = dict()
for idx in this._l:
if len(this._l[idx]) > 0:
new_dict[idx] = this._l[idx]
this._l = new_dict

def _cache_cmd(self, cmd):
"""
Cache a command, i.e., inserts it into the command lists of all qubits
involved.
"""
# are there qubit ids that haven't been added to the list?
idlist = [qubit.id for sublist in cmd.all_qubits for qubit in sublist]

# add gate command to each of the qubits involved
for ID in idlist:
if ID not in this._l:
this._l[ID] = []
this._l[ID] += [cmd]

this._check_and_send()

def receive(self, command_list):
"""
Receive commands from the previous engine and cache them.
    If a flush gate arrives, the entire buffer is sent on.
"""
for cmd in command_list:
if cmd.gate == FlushGate():  # flush gate --> optimize and flush
for idx in this._l:
this._optimize(idx)
this._send_qubit_pipeline(idx, len(this._l[idx]))
new_dict = dict()
for idx in this._l:
if len(this._l[idx]) > 0:
new_dict[idx] = this._l[idx]
this._l = new_dict
assert this._l == dict()
this.send([cmd])
else:
this._cache_cmd(cmd)
