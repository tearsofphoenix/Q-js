import {OPCode} from 'qasm'
import IndexOperation from './_index'

const {OP_INDEX, OP_ARRAY_INDEX} = OPCode

export default {
  [OP_INDEX]: IndexOperation,
  [OP_ARRAY_INDEX]: IndexOperation
}
