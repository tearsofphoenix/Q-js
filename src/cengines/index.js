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

export TagRemover from './tagremover';

export IBM5QubitMapper from './ibm5qubitmapper';

export {BasicEngine, ForwarderEngine} from './basics'

export CommandModifier from './cmdmodifier'

export MainEngine from './main'

export ManualMapper from './manualmapper'

export Optimize from './optimize'

export SwapAndCNOTFlipper from './swapandcnotflipper'

export {DummyEngine, CompareEngine} from './testengine'

export DecompositionRuleSet from './replacer/decompositionruleset'

export DecompositionRule from './replacer/decompositionrule'

export {AutoReplacer, InstructionFilter} from './replacer/replacer'
