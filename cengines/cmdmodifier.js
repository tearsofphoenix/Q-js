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

/*
Contains a CommandModifier engine, which can be used to, e.g., modify the tags
of all commands which pass by (see the AutoReplacer for an example).

*/

import {BasicEngine} from './basics'

/*
CommandModifier is a compiler engine which applies a function to all
incoming commands, sending on the resulting command instead of the
original one.
 */
export default class CommandModifier extends BasicEngine {
  /*
  Initialize the CommandModifier.

    Args:
cmd_mod_fun (function): Function which, given a command cmd,
    returns the command it should send instead.

    Example:
.. code-block:: javascript

def cmd_mod_fun(cmd):
cmd.tags += [MyOwnTag()]
compiler_engine = CommandModifier(cmd_mod_fun)
...
   */
  constructor(cmdModFunc) {
    super()
    this._cmdModFunc = cmdModFunc
  }

  /*
  Receive a list of commands from the previous engine, modify all
commands, and send them on to the next engine.

    Args:
command_list (list<Command>): List of commands to receive and then
(after modification) send on.
   */
  receive(cmdList) {
    const newList = cmdList.map(cmd => this._cmdModFunc(cmd))
    this.send(newList)
  }
}
