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


import DecompositionRuleSet from '../cengines/replacer/decompositionruleset'
import TagRemover from '../cengines/tagremover'
import LocalOptimizer from '../cengines/optimize'
import { AutoReplacer } from '../cengines/replacer/replacer'
import SwapAndCNOTFlipper from '../cengines/swapandcnotflipper'
import decompositions from './decompositions'
import IBM5QubitMapper, {ibmqx4_connections} from '../cengines/ibm5qubitmapper';

export function getEngineList() {
  const rule_set = new DecompositionRuleSet(decompositions)
  return [new TagRemover(),
    new LocalOptimizer(10),
    new AutoReplacer(rule_set),
    new TagRemover(),
    new IBM5QubitMapper(),
    new SwapAndCNOTFlipper(ibmqx4_connections),
    new LocalOptimizer(10)
  ]
}
