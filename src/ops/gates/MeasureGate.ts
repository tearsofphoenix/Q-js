import { IQubit } from '@/interfaces';
import { FastForwardingGate, BasicGate } from '../basics';
/**
 * @class MeasureGate
 * @desc Measurement gate class (for single qubits).
 */
export class MeasureGate extends FastForwardingGate {
    toString() {
        return 'Measure'
    }

    /**
      Previously (ProjectQ <= v0.3.6) MeasureGate/Measure was allowed to be
      applied to any number of quantum registers. Now the MeasureGate/Measure
      is strictly a single qubit gate. In the coming releases the backward
      compatibility will be removed!
  
       */
    or(qubits: IQubit[]) {
        let num_qubits = 0
        const qs = BasicGate.makeTupleOfQureg(qubits)
        qs.forEach((qureg) => {
            qureg.forEach((qubit) => {
                num_qubits += 1
                const cmd = this.generateCommand([qubit])
                cmd.apply()
            })
        })
        if (num_qubits > 1) {
            console.warn(`Pending syntax change in future versions of 
                ProjectQ: \n Measure will be a single qubit gate 
                only. Use \`All(Measure) | qureg\` instead to 
                measure multiple qubits.`)
        }
    }
}

// Shortcut (instance of) `MeasureGate`
export const Measure = new MeasureGate()
