export class ComputeTag {
  equal(other) {
    return other instanceof ComputeTag
  }
}

export class UncomputeTag {
  equal(other) {
    return other instanceof UncomputeTag
  }
}

export class DirtyQubitTag {
  equal(other) {
    return other instanceof DirtyQubitTag
  }
}

export class LogicalQubitIDTag {
  constructor(logical_qubit_id) {
    this.logical_qubit_id = logical_qubit_id
  }

  equal(other) {
    return other instanceof LogicalQubitIDTag && other.logical_qubit_id === this.logical_qubit_id
  }

  isInArray(array) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; ++i) {
        if (this.equal(array[i])) {
          return true
        }
      }
    }
    return false
  }
}
