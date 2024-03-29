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

import assert from 'assert'
import { BasicEngine } from './basics'
import { ComputeTag, UncomputeTag } from '../meta/tag'
import { instanceOf } from '../libs/util'
import { ICommand } from '@/interfaces';

/**
 *  @class TagRemover
 *  @desc is a compiler engine which removes temporary command tags (see the tag classes such as LoopTag in `loop`).

Removing tags is important (after having handled them if necessary) in
order to enable optimizations across meta-function boundaries (compute/
action/uncompute or loops after unrolling)
 */
export class TagRemover extends BasicEngine {
  private _tags: any[];
  /**
    @param tags A list of meta tag classes (e.g., [ComputeTag, UncomputeTag])
    denoting the tags to remove
  */
  constructor(tags = [ComputeTag, UncomputeTag]) {
    super()
    assert(Array.isArray(tags))
    this._tags = tags
  }

  _isTagIn(tag: any) {
    return instanceOf(tag, this._tags);
  }

  /**
    Receive a list of commands from the previous engine, remove all tags
  which are an instance of at least one of the meta tags provided in the
  constructor, and then send them on to the next compiler engine.
  
    @param commandList List of commands to receive and then (after removing tags) send on.
  */
  receive(commandList: ICommand[]) {
    commandList.forEach((cmd) => {
      cmd.tags = cmd.tags.filter(t => !this._isTagIn(t))
      this.send([cmd])
    })
  }
}
