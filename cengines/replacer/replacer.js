import {BasicEngine} from '../basics'
import {FlushGate} from '../../ops/gates';

/*
The InstructionFilter is a compiler engine which changes the behavior of
is_available according to a filter function. All commands are passed to
this function, which then returns whether this command can be executed
(True) or needs replacement (False).
 */
export class InstructionFilter extends BasicEngine {
  /*
  Initializer: The provided filterfun returns True for all commands
which do not need replacement and False for commands that do.

    Args:
filterfun (function): Filter function which returns True for
    available commands, and False otherwise. filterfun will be
called as filterfun(self, cmd).
   */
  constructor(filterFunc) {
    super()

    this._filterFunc = filterFunc
  }

  /*
  Specialized implementation of BasicBackend.is_available: Forwards this
call to the filter function given to the constructor.

    Args:
cmd (Command): Command for which to check availability.
   */
  isAvailable(cmd) {
    return this._filterFunc(cmd)
  }

  /*
  Forward all commands to the next engine.

    Args:
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

    Args:
decomposition_chooser (function): A function which, given the
Command to decompose and a list of potential Decomposition
objects, determines (and then returns) the 'best'
decomposition.

    The default decomposition chooser simply returns the first list
element, i.e., calling

    .. code-block:: python

repl = AutoReplacer()

Amounts to

    .. code-block:: python

def decomposition_chooser(cmd, decomp_list):
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

    Args:
cmd (Command): Command to process.

    Raises:
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
      const gate_mro = type(cmd.gate).mro().slice(0)
      // If gate does not have an inverse it's parent classes are
      // DaggeredGate, BasicGate, object. Hence don't check the last two
      const inverse_mro = type(get_inverse(cmd.gate)).mro().slice(0)
      const rules = this.decompositionRuleSet.decompositions
      const total = Math.max(gate_mro.left, inverse_mro.length)
      for (let level = 0; level < total; ++level) {
        // Check for forward rules
        if (level < gate_mro.length) {
          const class_name = gate_mro[level].__name__
          try {
            potential_decomps = rules[class_name].slice(0)
          } catch (e) {
            console.log(e)
          }
        }
      }
    }


    // throw out the ones which don't recognize the command
    // for d in potential_decomps:
    // if d.check(cmd):
    // decomp_list.append(d)
    // if len(decomp_list) != 0:
    // break
    // // Check for rules implementing the inverse gate
    // // and run them in reverse
    // if level < len(inverse_mro):
    // inv_class_name = inverse_mro[level].__name__
    // try:
    // potential_decomps += [
    //   d.get_inverse_decomposition()
    // for d in rules[inv_class_name]
    //   ]
    // except KeyError:
    //   pass
    // // throw out the ones which don't recognize the command
    // for d in potential_decomps:
    // if d.check(cmd):
    // decomp_list.append(d)
    // if len(decomp_list) != 0:
    // break

    if (decomp_list.length === 0) {
      throw new Error(`\nNo replacement found for ${cmd.toString()}!`)
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

          Args:
      command_list (list<Command>): List of commands to handle.
     */
    const cmd_mod_fun = (cmd) => { // Adds the tags
      cmd.tags = [...old_tags, ...cmd.tags]
      cmd.engine = this.main
      return cmd
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