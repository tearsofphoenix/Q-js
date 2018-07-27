/*
This file defines BasicQubit, Qubit, WeakQubit and Qureg.

    A Qureg represents a list of Qubit or WeakQubit objects.
    Qubit represents a (logical-level) qubit with a unique index provided by the
MainEngine. Qubit objects are automatically deallocated if they go out of
scope and intented to be used within Qureg objects in user code.

    Example:
.. code-block:: python

from projectq import MainEngine
eng = MainEngine()
qubit = eng.allocate_qubit()

qubit is a Qureg of size 1 with one Qubit object which is deallocated once
qubit goes out of scope.

    WeakQubit are used inside the Command object and are not automatically
deallocated.
*/

/*
BasicQubit objects represent qubits.

    They have an id and a reference to the owning engine.
 */
export class BasicQubit {
  /*

Initialize a BasicQubit object.

    Args:
engine: Owning engine / engine that created the qubit
idx: Unique index of the qubit referenced by this qubit
     */
  constructor(engine, idx) {
    this.engine = engine
    this.id = idx
  }

  /*
    Return string representation of this qubit.
     */
  toString() {
    return `${this.id}`
  }

  /*
        Access the result of a previous measurement and return False / True (0 / 1)
        @return bool
     */
  toBoolean() {
    return this.engine.main.getMeasurementResult(this)
  }

  valueOf() {
    return this.toBoolean()
  }

  /*
  Compare with other qubit (Returns True if equal id and engine).

  Args:
      other (BasicQubit): BasicQubit to which to compare this one
  */
  equal(other) {
    if (this.id === -1) {
      return this === other
    } else {
      return other instanceof BasicQubit && this.id === other.id && this.engine === other.engine
    }
  }

  /*
    Return the hash of this qubit.

    Hash definition because of custom __eq__.
    Enables storing a qubit in, e.g., a set.
     */
  Hash() {
    if (this.id === -1) {
      return this
    }
    return this.engine + this.id
  }
}

/*

Qubit class.

Represents a (logical-level) qubit with a unique index provided by the
MainEngine. Once the qubit goes out of scope (and is garbage-collected),
it deallocates itself automatically, allowing automatic resource
management.

    Thus the qubit is not copyable only returns a reference to the same
object.

 */
export class Qubit extends BasicQubit {
  deallocate() {
    // # If a user directly calls this function, then the qubit gets id == -1
    // # but stays in active_qubits as it is not yet deleted, hence remove
    // # it manually (if the garbage collector calls this function, then the
    // # WeakRef in active qubits is already gone):
    if (this.id === -1) {
      return
    }

    try {
      const qubits = this.engine.main.activeQubits
      if (qubits.has(this)) {
        qubits.delete(this)
      }
      this.engine.deallocateQubit(this)
    } catch (e) {

    } finally {
      this.id = -1
    }
  }

  /*

Non-copyable (returns reference to self).

Note:
    To prevent problems with automatic deallocation, qubits are not
copyable!
     */
  copy() {
    return this
  }
}


/*
WeakQubitRef objects are used inside the Command object.

    Qubits feature automatic deallocation when destroyed. WeakQubitRefs, on
the other hand, do not share this feature, allowing to copy them and pass
them along the compiler pipeline, while the actual qubit objects may be
garbage-collected (and, thus, cleaned up early). Otherwise there is no
difference between a WeakQubitRef and a Qubit object.

 */
export class WeakQubitRef extends BasicQubit {

}

/*

Quantum register class.

Simplifies accessing measured values for single-qubit registers (no []-
    access necessary) and enables pretty-printing of general quantum registers
(call Qureg.__str__(qureg)).

 */
export class Qureg {
  constructor(...args) {
    const arg0 = args[0]
    if (Array.isArray(arg0)) {
      this._imp = Array.from(arg0)
    } else if (arg0 instanceof Qureg) {
      this._imp = Array.from(arg0._imp)
    } else {
      this._imp = new Array(...args)
    }
  }

  forEach(callbackFunc) {
    this._imp.forEach(callbackFunc)
  }

  map(callbackFunc) {
    return this._imp.map(callbackFunc)
  }

  at(index) {
    return this._imp[index]
  }

  assign(index, value) {
    this._imp[index] = value
  }

  /*
Return measured value if Qureg consists of 1 qubit only.

    Raises:
Exception if more than 1 qubit resides in this register (then you
need to specify which value to get using qureg[???])
     */
  toBoolean() {
    if (this.length === 1) {
      return this.at(0).toBoolean()
    }
    throw new Error('__bool__(qureg): Quantum register contains more "\n'
            + '"than 1 qubit. Use __bool__(qureg[idx]) instead.')
  }

  slice(start, end) {
    return this._imp.slice(start, end)
  }

  toString() {
    if (this.length === 0) return 'Qureg[]'
    const ids = this.slice(1).map(({id}) => id)
    ids.push(null) // Forces a flush on last loop iteration.

    const out_list = []
    let start_id = this.at(0).id
    let count = 1
    ids.forEach((qubit_id) => {
      if (qubit_id === start_id + count) {
        count += 1
      } else {
        // TODO
        if (count > 1) {
          out_list.push(`${start_id}-${start_id + count - 1}`)
        } else {
          out_list.push(`${start_id}`)
        }
        start_id = qubit_id
        count = 1
      }
    })

    return `Qureg[${out_list.join(', ')}]`
  }

  add(other) {
    const array = this._imp.concat(other._imp)
    return new Qureg(array)
  }

  push(value) {
    this._imp.push(value)
  }

  get length() {
    return this._imp.length
  }

  get engine() {
    return this.at(0).engine
  }

  set engine(newEngine) {
    this.forEach(looper => looper.engine = newEngine)
  }
}
