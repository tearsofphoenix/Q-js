/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
