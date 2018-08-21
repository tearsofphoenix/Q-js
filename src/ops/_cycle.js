
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

const shared = {}

export function add(key, value) {
  shared[key] = value
}

export function get(key) {
  return shared[key]
}


/**
Return the inverse of a gate.

    Tries to call gate.getInverse and, upon failure, creates a DaggeredGate
instead.

    @param {BasicGate} gate Gate of which to get the inverse

@example
    @code

getInverse(H) // returns a Hadamard gate (HGate object)
 */
export function getInverse(gate) {
  try {
    return gate.getInverse()
  } catch (e) {
    const DaggeredGate = get('DaggeredGate')
    return new DaggeredGate(gate)
  }
}

export default {
  add,
  get
}
