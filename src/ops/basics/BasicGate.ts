import { ICommand, IEngine, IGate, QObject, IQureg } from '@/interfaces';
import { NotMergeable } from '@/meta/error';
import { ObjectCopy, arrayIsTuple } from '@/libs/util';
import Command from '../command';
import { BasicQubit } from '@/meta/qubit';
/**
 * @abstract
 * @class BasicGate
 * @desc Base class of all gates.
 */
export class BasicGate implements IGate {
  interchangeableQubitIndices: number[][];
  /**
   * @constructor
    Note:
Set interchangeable qubit indices!
    (gate.interchangeable_qubit_indices)
 
As an example, consider
 
   @example
   ExampleGate | (a,b,c,d,e)
 
where a and b are interchangeable. Then, call this function as
follows:
 
   @example
   this.set_interchangeable_qubit_indices([[0,1]])
 
As another example, consider
 
   @example
   ExampleGate2 | (a,b,c,d,e)
 
where a and b are interchangeable and, in addition, c, d, and e
are interchangeable among themselves. Then, call this function as
 
   @example
    this.set_interchangeable_qubit_indices([[0,1],[2,3,4]])
  */
  constructor() {
    this.interchangeableQubitIndices = []
  }

  getInverse(): IGate {
    throw new Error('BasicGate: No getInverse() implemented.')
  }

  getMerged(other: IGate): IGate {
    throw new NotMergeable('BasicGate: No getMerged() implemented.')
  }

  toString(): string {
    throw new Error('BasicGate: No toString() implemented.')
  }

  inspect(): string {
    return this.toString()
  }

  /**
    Convert quantum input of "gate | quantum input" to internal formatting.
 
    A Command object only accepts tuples of Quregs (list of Qubit objects)
as qubits input parameter. However, with this function we allow the
user to use a more flexible syntax:
 
    1) Gate | qubit
    2) Gate | [qubit0, qubit1]
    3) Gate | qureg
    4) Gate | (qubit, )
    5) Gate | (qureg, qubit)
 
where qubit is a Qubit object and qureg is a Qureg object. This
function takes the right hand side of | and transforms it to the
correct input parameter of a Command object which is:
 
    1) -> Gate | ([qubit], )
    2) -> Gate | ([qubit0, qubit1], )
    3) -> Gate | (qureg, )
    4) -> Gate | ([qubit], )
    5) -> Gate | (qureg, [qubit])
 
@param {Qubit|Qubit[]|Qureg|Qureg[]} qubits a Qubit object, a list of Qubit objects, a Qureg object,
    or a tuple of Qubit or Qureg objects (can be mixed).
@returns {Qureg[]} Canonical representation A tuple containing Qureg (or list of Qubits) objects.
     */
  static makeTupleOfQureg(qubits: QObject): IQureg[] {
    const isTuple = arrayIsTuple(qubits);
    if (!isTuple) {
      qubits = [qubits as any];
    }
    (qubits as any[]).forEach((looper, idx) => {
      if (looper instanceof BasicQubit) {
        qubits[idx] = [looper]
      }
    })
    return (qubits as any[]).slice(0);
  }

  /**
    Helper function to generate a command consisting of the gate and the qubits being acted upon.
 
    @param qubits {Qubit | Array.<Qubit> | Qureg} see BasicGate.makeTupleOfQureg(qubits)
    @return A Command object containing the gate and the qubits.
  */
  generateCommand(qubits: QObject): ICommand {
    const qs = BasicGate.makeTupleOfQureg(qubits)
    const engines: IEngine[] = [];
    qs.forEach((reg) => {
      reg.forEach(q => engines.push(q.engine))
    })
    const eng = engines[0];
    return new Command(eng, this, qs);
  }

  /**
    Operator| overload which enables the syntax Gate | qubits.
 
    @example
1) Gate | qubit
2) Gate | [qubit0, qubit1]
3) Gate | qureg
4) Gate | (qubit, )
5) Gate | (qureg, qubit)
 
   @param qubits {Qubit | Array.<Qubit> | Qureg}
   a Qubit object, a list of Qubit objects, a Qureg object,
   or a tuple of Qubit or Qureg objects (can be mixed).
  */
  or(qubits: QObject) {
    const cmd = this.generateCommand(qubits)
    cmd.apply();
  }

  equal(other: IGate) {
    return this.constructor === other.constructor;
  }

  /**
   * @return {BasicGate}
   */
  copy() {
    return ObjectCopy(this)
  }
}
