/*
Inserts an engine into the singly-linked list of engines.

    It also sets the correct main_engine for engine_to_insert.

                                                 Args:
prev_engine (projectq.cengines.BasicEngine):
The engine just before the insertion point.
engine_to_insert (projectq.cengines.BasicEngine):
The engine to insert at the insertion point.

 */
export function insertEngine(prevEngine, engineToInsert) {
  engineToInsert.main = prevEngine.main
  engineToInsert.next = prevEngine.next
  prevEngine.next = engineToInsert
}

/*

Removes an engine from the singly-linked list of engines.

    Args:
prev_engine (projectq.cengines.BasicEngine):
The engine just before the engine to drop.
    Returns:
Engine: The dropped engine.
 */
export function dropEngineAfter(engine) {
  const e = engine.next
  engine.next = e.next
  delete e.next
  delete e.main
  return e
}
