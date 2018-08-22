"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.insertEngine = insertEngine;
exports.dropEngineAfter = dropEngineAfter;
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

/**
Inserts an engine into the singly-linked list of engines.
    It also sets the correct main_engine for engine_to_insert.

@param {BasicEngine} prevEngine The engine just before the insertion point.
@param {BasicEngine} engineToInsert The engine to insert at the insertion point.
 */
function insertEngine(prevEngine, engineToInsert) {
  engineToInsert.main = prevEngine.main;
  engineToInsert.next = prevEngine.next;
  prevEngine.next = engineToInsert;
}

/**
Removes an engine from the singly-linked list of engines.

    @param {BasicEngine} engine The engine just before the engine to drop.
    @return {BasicEngine} The dropped engine.
 */
function dropEngineAfter(engine) {
  var e = engine.next;
  engine.next = e.next;
  delete e.next;
  delete e.main;
  return e;
}