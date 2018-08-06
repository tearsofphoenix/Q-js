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

import barrier from './barrier'
import cnot2cz from './cnot2cz'
import entangle from './entangle'
import globalphase from './globalphase'
import ph2r from './ph2r'
import toffoli2cnotandtgate from './toffoli2cnotandtgate'

export default [
    ...barrier,
    ...cnot2cz,
    ...entangle,
    ...globalphase,
    ...ph2r,
    ...toffoli2cnotandtgate
]
