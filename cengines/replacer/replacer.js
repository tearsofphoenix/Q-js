import {BasicEngine} from '../basics'

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

//
// class AutoReplacer(BasicEngine):
// """
// The AutoReplacer is a compiler engine which uses engine.is_available in
// order to determine which commands need to be replaced/decomposed/compiled
// further. The loaded setup is used to find decomposition rules appropriate
// for each command (e.g., setups.default).
// """
// def __init__(self, decompositionRuleSet,
//     decomposition_chooser=lambda cmd,
//     decomposition_list: decomposition_list[0]):
// """
// Initialize an AutoReplacer.
//
//     Args:
// decomposition_chooser (function): A function which, given the
// Command to decompose and a list of potential Decomposition
// objects, determines (and then returns) the 'best'
// decomposition.
//
//     The default decomposition chooser simply returns the first list
// element, i.e., calling
//
//     .. code-block:: python
//
// repl = AutoReplacer()
//
// Amounts to
//
//     .. code-block:: python
//
// def decomposition_chooser(cmd, decomp_list):
// return decomp_list[0]
// repl = AutoReplacer(decomposition_chooser)
// """
// BasicEngine.__init__(self)
// self._decomp_chooser = decomposition_chooser
// self.decompositionRuleSet = decompositionRuleSet
//
// def _process_command(self, cmd):
// """
// Check whether a command cmd can be handled by further engines and,
// if not, replace it using the decomposition rules loaded with the setup
// (e.g., setups.default).
//
//     Args:
// cmd (Command): Command to process.
//
//     Raises:
// Exception if no replacement is available in the loaded setup.
// """
// if self.is_available(cmd):
// self.send([cmd])
// else:
// # check for decomposition rules
// decomp_list = []
// potential_decomps = []
//
// # First check for a decomposition rules of the gate class, then
// # the gate class of the inverse gate. If nothing is found, do the
// # same for the first parent class, etc.
//     gate_mro = type(cmd.gate).mro()[:-1]
// # If gate does not have an inverse it's parent classes are
// # DaggeredGate, BasicGate, object. Hence don't check the last two
// inverse_mro = type(get_inverse(cmd.gate)).mro()[:-2]
// rules = self.decompositionRuleSet.decompositions
// for level in range(max(len(gate_mro), len(inverse_mro))):
// # Check for forward rules
// if level < len(gate_mro):
// class_name = gate_mro[level].__name__
// try:
// potential_decomps = [d for d in rules[class_name]]
// except KeyError:
//     pass
// # throw out the ones which don't recognize the command
// for d in potential_decomps:
// if d.check(cmd):
// decomp_list.append(d)
// if len(decomp_list) != 0:
// break
// # Check for rules implementing the inverse gate
// # and run them in reverse
// if level < len(inverse_mro):
// inv_class_name = inverse_mro[level].__name__
// try:
// potential_decomps += [
//   d.get_inverse_decomposition()
// for d in rules[inv_class_name]
//     ]
// except KeyError:
//     pass
// # throw out the ones which don't recognize the command
// for d in potential_decomps:
// if d.check(cmd):
// decomp_list.append(d)
// if len(decomp_list) != 0:
// break
//
// if len(decomp_list) == 0:
// raise NoGateDecompositionError("\nNo replacement found for " +
//     str(cmd) + "!")
//
// # use decomposition chooser to determine the best decomposition
// chosen_decomp = self._decomp_chooser(cmd, decomp_list)
//
// # the decomposed command must have the same tags
// # (plus the ones it gets from meta-statements inside the
// # decomposition rule).
// # --> use a CommandModifier with a ForwarderEngine to achieve this.
//     old_tags = cmd.tags[:]
//
// def cmd_mod_fun(cmd):  # Adds the tags
// cmd.tags = old_tags[:] + cmd.tags
// cmd.engine = self.main_engine
// return cmd
// # the CommandModifier calls cmd_mod_fun for each command
// # --> commands get the right tags.
//     cmod_eng = CommandModifier(cmd_mod_fun)
// cmod_eng.next_engine = self  # send modified commands back here
// cmod_eng.main_engine = self.main_engine
// # forward everything to cmod_eng using the ForwarderEngine
// # which behaves just like MainEngine
// # (--> meta functions still work)
// forwarder_eng = ForwarderEngine(cmod_eng)
// cmd.engine = forwarder_eng  # send gates directly to forwarder
// # (and not to main engine, which would screw up the ordering).
//
// chosen_decomp.decompose(cmd)  # run the decomposition
//
// def receive(self, command_list):
// """
// Receive a list of commands from the previous compiler engine and, if
//     necessary, replace/decompose the gates according to the decomposition
// rules in the loaded setup.
//
//     Args:
// command_list (list<Command>): List of commands to handle.
// """
// for cmd in command_list:
// if not isinstance(cmd.gate, FlushGate):
// self._process_command(cmd)
// else:
// self.send([cmd])
