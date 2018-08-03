import DecompositionRuleSet from '../cengines/replacer/decompositionruleset'
import TagRemover from '../cengines/tagremover'
import decompositions from './decompositions'
import LocalOptimizer from '../cengines/optimize'
import {AutoReplacer} from '../cengines/replacer/replacer'

export function getEngineList() {
  const rule_set = new DecompositionRuleSet(decompositions)
  return [new TagRemover(),
    new LocalOptimizer(10),
    new AutoReplacer(rule_set),
    new TagRemover(),
    new LocalOptimizer(10)]
}
