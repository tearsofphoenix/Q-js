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
import arb1qubit2rzandry from './arb1qubit2rzandry'
import barrier from './barrier'
import cnot2cz from './cnot2cz'
import carb1qubit2cnotrzandry from './carb1qubit2cnotrzandry'
import entangle from './entangle'
import globalphase from './globalphase'
import ph2r from './ph2r'
import toffoli2cnotandtgate from './toffoli2cnotandtgate'
import crz2cxandrz from './crz2cxandrz'
import cnu2toffoliandcu from './cnu2toffoliandcu'
import qft2crandhadamard from './qft2crandhadamard'
import r2rzandph from './r2rzandph'
import rx2rz from './rx2rz'
import ry2rz from './ry2rz'
import sqrtswap2cnot from './sqrtswap2cnot'
import swap2cnot from './swap2cnot'
import timeevolution from './time_evolution'

export default [
  ...arb1qubit2rzandry,
  ...barrier,
  ...carb1qubit2cnotrzandry,
  ...cnot2cz,
  ...cnu2toffoliandcu,
  ...crz2cxandrz,
  ...entangle,
  ...globalphase,
  ...ph2r,
  ...qft2crandhadamard,
  ...r2rzandph,
  ...rx2rz,
  ...ry2rz,
  ...sqrtswap2cnot,
  ...swap2cnot,
  ...timeevolution,
  ...toffoli2cnotandtgate
]
