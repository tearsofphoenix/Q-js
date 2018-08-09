export TimeEvolution from './timeevolution'

export {
  CNOT, CRz, Toffoli, CX, CZ
} from './shortcuts';

export QubitOperator from './qubitoperator'

export QFTGate from './qftgate'

export {QFT} from './qftgate'

export Command from './command'

export {
  BasicGate, BasicMathGate, BasicRotationGate, BasicPhaseGate, FastForwardingGate, ClassicalInstructionGate, SelfInverseGate
} from './basics'

export {
  R, Rx, Ry, Rz, Entangle, Measure, X, Z, H, HGate, FlushGate, Deallocate, Allocate, SwapGate, Swap, Barrier,
  MeasureGate, AllocateQubitGate, AllocateDirty, AllocateDirtyQubitGate, BarrierGate, DeallocateQubitGate, EntangleGate,
  NOT, Ph, S, SGate, SqrtSwap, SqrtSwapGate, SqrtX, SqrtXGate, T, TGate, XGate, Y, YGate, ZGate
} from './gates'

export Gates from './gates'

export {
  All, ControlledGate, DaggeredGate, C, Tensor
} from './metagates'
