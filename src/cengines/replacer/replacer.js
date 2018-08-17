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

import {BasicEngine, ForwarderEngine} from '../basics'
import {FlushGate} from '../../ops/gates'
import CommandModifier from '../cmdmodifier'
import {classHierachy} from '../../libs/util';
import {getInverse} from '../../ops/_cycle';
import {NoGateDecompositionError} from "../../meta/error";

/*
The InstructionFilter is a compiler engine which changes the behavior of
is_available according to a filter function. All commands are passed to
this function, which then returns whether this command can be executed
(true) or needs replacement (false).
 */
export class InstructionFilter extends BasicEngine {
  /*
  Initializer: The provided filterfun returns true for all commands
which do not need replacement and false for commands that do.

    @param
filterfun (function): Filter function which returns true for
    available commands, and false otherwise. filterfun will be
called as filterfun(self, cmd).
   */
  constructor(filterFunc) {
    super()

    this._filterFunc = filterFunc
  }

  /*
  Specialized implementation of BasicBackend.is_available: Forwards this
call to the filter function given to the constructor.

    @param
cmd (Command): Command for which to check availability.
   */
  isAvailable(cmd) {
    return this._filterFunc(this, cmd)
  }

  /*
  Forward all commands to the next engine.

    @param
command_list (list<Command>): List of commands to receive.
   */
  receive(commandList) {
    this.next.receive(commandList)
  }
}

/*
The AutoReplacer is a compiler engine which uses engine.is_available in
order to determine which commands need to be replaced/decomposed/compiled
further. The loaded setup is used to find decomposition rules appropriate
for each command (e.g., setups.default).
 */
export class AutoReplacer extends BasicEngine {
  /*
  Initialize an AutoReplacer.

    @param
decomposition_chooser (function): A function which, given the
Command to decompose and a list of potential Decomposition
objects, determines (and then returns) the 'best'
decomposition.

    The default decomposition chooser simply returns the first list
element, i.e., calling

    @code

repl = AutoReplacer()

Amounts to

    @code

function decomposition_chooser(cmd, decomp_list):
return decomp_list[0]
repl = AutoReplacer(decomposition_chooser)
   */
  constructor(decompositionRuleSet, decomposition_chooser) {
    if (!decomposition_chooser) {
      decomposition_chooser = (cmd, decomposition_list) => decomposition_list[0]
    }

    super()
    this._decomp_chooser = decomposition_chooser
    this.decompositionRuleSet = decompositionRuleSet
  }

  /*
  Check whether a command cmd can be handled by further engines and,
if not, replace it using the decomposition rules loaded with the setup
(e.g., setups.default).

    @param
cmd (Command): Command to process.

    @throws
Exception if no replacement is available in the loaded setup.
   */
  _processCommand(cmd) {
    if (this.isAvailable(cmd)) {
      this.send([cmd])
    } else {
    // check for decomposition rules
      const decomp_list = []
      let potential_decomps = []

      // First check for a decomposition rules of the gate class, then
      // the gate class of the inverse gate. If nothing is found, do the
      // same for the first parent class, etc.
      const gate_mro = classHierachy(cmd.gate.constructor)
      // If gate does not have an inverse it's parent classes are
      // DaggeredGate, BasicGate, object. Hence don't check the last two
      const inverse_mro = classHierachy(getInverse(cmd.gate).constructor)
      const rules = this.decompositionRuleSet.decompositions
      const total = Math.max(gate_mro.length, inverse_mro.length)
      for (let level = 0; level < total; ++level) {
        // Check for forward rules
        if (level < gate_mro.length) {
          const class_name = gate_mro[level].name
          try {
            potential_decomps = rules[class_name] || []
          } catch (e) {
            console.log(e)
          }

          potential_decomps.forEach(d => d.check(cmd) && decomp_list.push(d))
          if (decomp_list.length > 0) {
            break
          }
        }
        // Check for rules implementing the inverse gate
        // and run them in reverse

        if (level < inverse_mro.length) {
          const inv_class_name = inverse_mro[level].name
          try {
            let list = rules[inv_class_name] || []
            list = list.map(d => d.getInverseDecomposition())
            potential_decomps = potential_decomps.concat(list)
          } catch (e) {
            console.log(e)
          }

          // throw out the ones which don't recognize the command
          potential_decomps.forEach(d => d.check(cmd) && decomp_list.push(d))
          if (decomp_list.length > 0) {
            break
          }
        }
      }

      if (decomp_list.length === 0) {
        throw new NoGateDecompositionError(`\nNo replacement found for ${cmd.toString()}!`)
      }

      // use decomposition chooser to determine the best decomposition
      const chosen_decomp = this._decomp_chooser(cmd, decomp_list)

      // the decomposed command must have the same tags
      // (plus the ones it gets from meta-statements inside the
      // decomposition rule).
      // --> use a CommandModifier with a ForwarderEngine to achieve this.
      const old_tags = cmd.tags.slice(0)

      /*
      Receive a list of commands from the previous compiler engine and, if
            necessary, replace/decompose the gates according to the decomposition
        rules in the loaded setup.

            @param
        command_list (list<Command>): List of commands to handle.
       */
      const cmd_mod_fun = (command) => { // Adds the tags
        command.tags = [...old_tags, ...command.tags]
        command.engine = this.main
        return command
      }
      // the CommandModifier calls cmd_mod_fun for each command
      // --> commands get the right tags.
      const cmod_eng = new CommandModifier(cmd_mod_fun)
      cmod_eng.next = this // send modified commands back here
      cmod_eng.main = this.main
      // forward everything to cmod_eng using the ForwarderEngine
      // which behaves just like MainEngine
      // (--> meta functions still work)
      const forwarder_eng = new ForwarderEngine(cmod_eng)
      cmd.engine = forwarder_eng // send gates directly to forwarder
      // (and not to main engine, which would screw up the ordering).

      chosen_decomp.decompose(cmd) // run the decomposition
    }
  }

  receive(commandList) {
    commandList.forEach((cmd) => {
      if (!(cmd.gate instanceof FlushGate)) {
        this._processCommand(cmd)
      } else {
        this.send([cmd])
      }
    })
  }
}
