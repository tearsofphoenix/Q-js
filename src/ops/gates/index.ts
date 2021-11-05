
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

/**
Contains definitions of standard gates such as
* Hadamard (H)
* Pauli-X (X / NOT)
* Pauli-Z (Z)
* T and its inverse (T / Tdagger)
* Swap gate (Swap)
* Phase gate (Ph)
* Rotation-Z (Rz)
* Phase-shift (R)
* Measurement (Measure)

and meta gates, i.e.,
* Allocate / Deallocate qubits
* Flush gate (end of circuit)
*/
import { IGate } from '@/interfaces';
import { getInverse } from '@/ops/_cycle';
export * from './AllocateQubitGate';
export * from './BarrierGate';
export * from './EntangleGate';
export * from './FlushGate';
export * from './HGate';
export * from './MeasureGate';
export * from './Ph';
export * from './R';
export * from './Rx';
export * from './Ry';
export * from './Rz';

export * from './SqrtSwapGate';
export * from './SqrtXGate';
export * from './SwapGate';
export * from './XGate';
export * from './YGate';
export * from './ZGate';

import { SGate, S } from './SGate';
import { TGate, T } from './TGate';

export { SGate, S };
export { TGate, T };

const obj: {
    Sdag: IGate;
    Sdagger: IGate;
    Tdag: IGate;
    Tdagger: IGate;
} = {} as any;

let _sdag: IGate;
let _tdag: IGate;
Object.defineProperties(obj, {
    Sdag: {
        get() {
            if (!_sdag) {
                _sdag = getInverse(S);
            }
            return _sdag
        }
    },
    Sdagger: {
        get() {
            return obj.Sdag
        }
    },
    Tdag: {
        get() {
            if (!_tdag) {
                _tdag = getInverse(T)
            }
            return _tdag
        }
    },
    Tdagger: {
        get() {
            return obj.Tdag
        }
    }
})

export default obj
