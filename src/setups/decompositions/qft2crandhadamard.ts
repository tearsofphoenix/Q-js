import math from 'mathjs'
import { Control } from '@/meta/control';
import { H, R } from '@/ops/gates';
import DecompositionRule from '@/cengines/replacer/decompositionrule';
import QFTGate from '@/ops/qftgate';
import { ICommand } from '@/interfaces';
const _decompose_QFT = (cmd: ICommand) => {
  const qb = cmd.qubits[0]
  const eng = cmd.engine
  Control(eng, cmd.controlQubits, () => {
    for (let i = 0; i < qb.length; ++i) {
      const count = qb.length - 1 - i
      H.or(qb[count])
      for (let j = 0; j < count; ++j) {
        Control(eng, qb[qb.length - 1 - (j + i + 1)], () => {
          new R(math.pi / (1 << (1 + j))).or(qb[count])
        })
      }
    }
  })
}

export default [
  new DecompositionRule(QFTGate, _decompose_QFT)
]
