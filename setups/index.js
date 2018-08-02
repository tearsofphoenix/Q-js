import DecompositionRuleSet from '../cengines/replacer/decompositionruleset'
import TagRemover from '../cengines/tagremover'
import decompositions from './decompositions'

export function getEngineList() {
  const rule_set = DecompositionRuleSet([decompositions])
  return [new TagRemover(),
    new LocalOptimizer(10),
    new AutoReplacer(rule_set),
    new TagRemover(),
    new LocalOptimizer(10)]
}
