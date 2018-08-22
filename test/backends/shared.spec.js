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

import BasicMapperEngine from '../../src/cengines/basicmapper';

export class TrivialMapper extends BasicMapperEngine {
  constructor() {
    super()
    this.currentMapping = {}
  }

  receive(command_list) {
    command_list.forEach((cmd) => {
      cmd.allQubits.forEach((qureg) => {
        qureg.forEach((qubit) => {
          if (qubit.id !== -1) {
            const v = this.currentMapping[qubit.id]
            if (typeof v === 'undefined') {
              const previous_map = this.currentMapping
              previous_map[qubit.id] = qubit.id + 1
              this.currentMapping = previous_map
            }
          }
        })
      })
      this.sendCMDWithMappedIDs(cmd)
    })
  }
}
