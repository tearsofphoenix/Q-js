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

import { IEngine } from '@/interfaces';
/**
Inserts an engine into the singly-linked list of engines.
    It also sets the correct main_engine for engine_to_insert.

@param prevEngine The engine just before the insertion point.
@param engineToInsert The engine to insert at the insertion point.
 */
export function insertEngine(prevEngine: IEngine, engineToInsert: IEngine): void {
  engineToInsert.main = prevEngine.main;
  engineToInsert.next = prevEngine.next;
  prevEngine.next = engineToInsert;
}

/**
Removes an engine from the singly-linked list of engines.

    @param engine The engine just before the engine to drop.
    @return The dropped engine.
 */
export function dropEngineAfter(engine: IEngine): IEngine {
  const e = engine.next;
  engine.next = e.next;
  // @ts-ignore
  delete e.next;
  // @ts-ignore
  delete e.main;
  return e;
}
