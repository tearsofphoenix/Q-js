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

import { IEquality } from "@/interfaces"

/**
 * @class ComputeTag
 */
export class ComputeTag {
  equal(other: any) {
    return other instanceof ComputeTag
  }
}

/**
 * @class UncomputeTag
 */
export class UncomputeTag {
  equal(other: any) {
    return other instanceof UncomputeTag
  }
}

/**
 * @class DirtyQubitTag
 */
export class DirtyQubitTag {
  equal(other: any) {
    return other instanceof DirtyQubitTag
  }
}

/**
 * @class LogicalQubitIDTag
 */
export class LogicalQubitIDTag {
  logicalQubitID: number;
  constructor(logicalQubitID: number) {
    this.logicalQubitID = logicalQubitID;
  }

  equal(other: any) {
    return other instanceof LogicalQubitIDTag && other.logicalQubitID === this.logicalQubitID;
  }

  /**
   * check if self is in `array`
   * @param array
   */
  isInArray<T>(array: IEquality<T>[]) {
    if (Array.isArray(array)) {
      for (let i = 0; i < array.length; ++i) {
        if (this.equal(array[i])) {
          return true;
        }
      }
    }
    return false;
  }
}
