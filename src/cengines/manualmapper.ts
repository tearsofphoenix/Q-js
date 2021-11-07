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
import { ICommand } from '@/interfaces';
import BasicMapperEngine from './basicmapper'

/**
 * @desc
Manual Mapper which adds QubitPlacementTags to Allocate gate commands
according to a user-specified mapping.
    @property map The function which maps a given qubit id to its
    location. It gets set when initializing the mapper.
 */
export default class ManualMapper extends BasicMapperEngine {
  private map: Function;
  /**
    Initialize the mapper to a given mapping. If no mapping function is
provided, the qubit id is used as the location.

    @param mapFunc Function which, given the qubit id, returns
an integer describing the physical location (must be constant).
     */
  constructor(mapFunc = (x: any) => x) {
    super()
    this.map = mapFunc;
    this.currentMapping = {}
  }

  /**
    Receives a command list and passes it to the next engine, adding
    qubit placement tags to allocate gates.

    @param commandList list of commands to receive.
  */
  receive(commandList: ICommand[]) {
    commandList.forEach((cmd) => {
      const ids: number[] = [];
      cmd.qubits.forEach((qr) => {
        qr.forEach(qb => ids.push(qb.id))
      })
      ids.forEach((id) => {
        const v = this._currentMapping[id];
        if (typeof v === 'undefined') {
          this._currentMapping[id] = this.map(id)
        }
      })
      this.sendCMDWithMappedIDs(cmd)
    })
  }
}
