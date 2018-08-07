import {add_constant, add_constant_modN, mul_by_constant_modN} from "./constantmath";
import {Control} from "../../meta/control";
import DecompositionRule from "../../cengines/replacer/decompositionrule";
import {AddConstant, AddConstantModN, MultiplyByConstantModN} from "./gates";

function _replace_addconstant(cmd) {
  const eng = cmd.engine
  const c = cmd.gate.a
  const quint = cmd.qubits[0]

  Control(eng, cmd.controlQubits, () => add_constant(eng, c, quint))
}


function _replace_addconstmodN(cmd){
  const eng = cmd.engine
  const c = cmd.gate.a
  const N = cmd.gate.N
  const quint = cmd.qubits[0]

  Control(eng, cmd.controlQubits, () => add_constant_modN(eng, c, N, quint))
}


function _replace_multiplybyconstantmodN(cmd) {
  const eng = cmd.engine
  const c = cmd.gate.a
  const N = cmd.gate.N
  const quint = cmd.qubits[0]

  Control(eng, cmd.controlQubits, () => mul_by_constant_modN(eng, c, N, quint))
}

export default [
  new DecompositionRule(AddConstant, _replace_addconstant),
  new DecompositionRule(AddConstantModN, _replace_addconstmodN),
  new DecompositionRule(MultiplyByConstantModN, _replace_multiplybyconstantmodN),
]
