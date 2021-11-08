
import { DecompositionRuleSet } from '../cengines/replacer/decompositionruleset'
import { AutoReplacer, InstructionFilter } from '../cengines'
import { TagRemover } from '../cengines/tagremover'
import { LocalOptimizer } from '../cengines/optimize'
import { GridMapper } from '../cengines/twodmapper'
import math from '../libs/math/defaultrules'
import decompositions from './decompositions'
import SwapAndCNOTFlipper from '../cengines/swapandcnotflipper';
import { high_level_gates } from './grid'

export const ibmqx5_connections = new Set([
  '1,0', '1,2', '2,3', '3,4', '3,14', '5,4',
  '6,5', '6,7', '6,11', '7,10', '8,7', '9,8',
  '9,10', '11,10', '12,5', '12,11', '12,13',
  '13,4', '13,14', '15,0', '15,2', '15,14'])


const grid_to_physical = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 0,
  9: 15,
  10: 14,
  11: 13,
  12: 12,
  13: 11,
  14: 10,
  15: 9
}

export function getEngineList() {
  const rule_set = new DecompositionRuleSet([...math, ...decompositions])
  return [
    new TagRemover(),
    new LocalOptimizer(5),
    new AutoReplacer(rule_set),
    new InstructionFilter(high_level_gates),
    new TagRemover(),
    new LocalOptimizer(5),
    new AutoReplacer(rule_set),
    new TagRemover(),
    new GridMapper({ num_rows: 2, num_columns: 8, mapped_ids_to_backend_ids: grid_to_physical }),
    new LocalOptimizer(5),
    new SwapAndCNOTFlipper(ibmqx5_connections),
    new LocalOptimizer(5)]
}
