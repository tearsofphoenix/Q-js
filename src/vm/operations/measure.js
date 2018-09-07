import BaseOperation from './base'
import {All, Measure} from '../../ops'

export default class MeasureOperation extends BaseOperation {
  execute(state) {
    const [quregName, cregName] = this.args
    const qureg = state.resolve(quregName)
    const creg = state.resolve(cregName)
    new All(Measure).or(qureg)
    qureg.forEach((qubit, i) => {
      const value = this.engine.getMeasurementResult(qubit)
      creg[i] = value
    })
  }
}
