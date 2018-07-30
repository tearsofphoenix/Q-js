
const shared = {}

export function add(key, value) {
  shared[key] = value
}

export function get(key) {
  return shared[key]
}


/*
Return the inverse of a gate.

    Tries to call gate.get_inverse and, upon failure, creates a DaggeredGate
instead.

    Args:
gate: Gate of which to get the inverse

Example:
    .. code-block:: python

get_inverse(H) # returns a Hadamard gate (HGate object)
 */
export function getInverse(gate) {
  try {
    return gate.getInverse()
  } catch (e) {
    const DaggeredGate = get('DaggeredGate')
    return new DaggeredGate(gate)
  }
}

export default {
  add,
  get
}
