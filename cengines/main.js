// Contains the main engine of every compiler engine pipeline, called MainEngine.
import {BasicEngine} from './basics'
import {FlushGate} from '../ops/gates'
import BasicMapperEngine from './basicmapper'
import {Command} from '../ops/command'
import {BasicQubit} from "../types/qubit";

/*
The MainEngine class provides all functionality of the main compiler
engine.

    It initializes all further compiler engines (calls, e.g.,
    .next_engine=...) and keeps track of measurement results and active
qubits (and their IDs).

Attributes:
    next_engine (BasicEngine): Next compiler engine (or the back-end).
main_engine (MainEngine): Self.
active_qubits (WeakSet): WeakSet containing all active qubits
dirty_qubits (Set): Containing all dirty qubit ids
backend (BasicEngine): Access the back-end.
mapper (BasicMapperEngine): Access to the mapper if there is one.
 */
export class MainEngine extends BasicEngine {
  /*
  Initialize the main compiler engine and all compiler engines.

    Sets 'next_engine'- and 'main_engine'-attributes of all compiler
engines and adds the back-end as the last engine.

    Args:
backend (BasicEngine): Backend to send the compiled circuit to.
engine_list (list<BasicEngine>): List of engines / backends to use
as compiler engines. Note: The engine list must not contain
multiple mappers (instances of BasicMapperEngine).
Default: projectq.setups.default.get_engine_list()
verbose (bool): Either print full or compact error messages.
    Default: False (i.e. compact error messages).

Example:
    .. code-block:: python

from projectq import MainEngine
eng = MainEngine() # uses default engine_list and the Simulator

Instead of the default `engine_list` one can use, e.g., one of the IBM
setups which defines a custom `engine_list` useful for one of the IBM
chips

Example:
    .. code-block:: python

import projectq.setups.ibm as ibm_setup
from projectq import MainEngine
eng = MainEngine(engine_list=ibm_setup.get_engine_list())
# eng uses the default Simulator backend

Alternatively, one can specify all compiler engines explicitly, e.g.,

    Example:
.. code-block:: python

from projectq.cengines import (TagRemover, AutoReplacer,
    LocalOptimizer,
    DecompositionRuleSet)
from projectq.backends import Simulator
  from projectq import MainEngine
rule_set = DecompositionRuleSet()
engines = [AutoReplacer(rule_set), TagRemover(),
  LocalOptimizer(3)]
eng = MainEngine(Simulator(), engines)
   */
  constructor(backend, engineList, verbose = false) {
    super()
    if (!backend) {
      backend = new Simulator()
    } else if (!(backend instanceof BasicEngine)) {
      throw new Error('\nYou supplied a backend which is not supported,\n'
      + 'i.e. not an instance of BasicEngine.\n'
      + 'Did you forget the brackets to create an instance?\n'
      + 'E.g. MainEngine(backend=Simulator) instead of \n'
      + '     MainEngine(backend=Simulator())')
    }

    if (!engineList) {
      engineList = getEngineList()
    }

    this.mapper = null
    if (Array.isArray(engineList)) {
      engineList.forEach((looper) => {
        if (!(looper instanceof BasicEngine)) {
          throw new Error('\nYou supplied an unsupported engine in engine_list,'
          + '\ni.e. not an instance of BasicEngine.\n'
          + 'Did you forget the brackets to create an instance?\n'
          + 'E.g. MainEngine(engine_list=[AutoReplacer]) instead '
          + 'of\n     MainEngine(engine_list=[AutoReplacer()])')
        }
        if (looper instanceof BasicMapperEngine) {
          if (!this.mapper) {
            this.mapper = looper
          } else {
            throw new Error('More than one mapper engine is not supported.')
          }
        }
      })
    } else {
      throw new Error('The provided list of engines is not a list!')
    }

    engineList = [...engineList, backend]

    this.backend = backend

    // Test that user did not supply twice the same engine instance
    const num_different_engines = new Set(engineList).size
    if (engineList.length !== num_different_engines) {
      throw new Error('\nError:\n You supplied twice the same engine as backend'
      + " or item in engine_list. This doesn't work. Create two \n"
      + ' separate instances of a compiler engine if it is needed\n'
      + ' twice.\n')
    }

    this._qubitIdx = 0
    for (let i = 0; i < engineList.length - 1; ++i) {
      engineList[i].next = engineList[i + 1]
      engineList[i].main = this
    }

    backend.main = this
    backend.isLastEngine = true

    this.next = engineList[0]
    this.main = this
    this.activeQubits = new Set()
    this._measurements = {}
    this.dirtyQubits = new Set()
    this.verbose = verbose
  }

  /*
  Register a measurement result

The engine being responsible for measurement results needs to register
these results with the master engine such that they are available when
the user calls an int() or bool() conversion operator on a measured
qubit.

    Args:
qubit (BasicQubit): Qubit for which to register the measurement
result.
value (bool): Boolean value of the measurement outcome
(True / False = 1 / 0 respectively).
   */
  setMeasurementResult(qubit, value) {
    this._measurements[qubit.id] = !!value
  }

  /*
  Return the classical value of a measured qubit, given that an engine
registered this result previously (see setMeasurementResult).

Args:
    qubit (BasicQubit): Qubit of which to get the measurement result.

    Example:
.. code-block:: python

from projectq.ops import H, Measure
from projectq import MainEngine
eng = MainEngine()
qubit = eng.allocate_qubit() # quantum register of size 1
H | qubit
Measure | qubit
eng.get_measurement_result(qubit[0]) == int(qubit)
   */
  getMeasurementResult(qubit) {
    const v = this._measurements[qubit.id]
    if (typeof v === 'undefined') {
      throw new Error(`${"\nError: Can't access measurement result for "
      + 'qubit #'}${qubit.id}. The problem may `
      + 'be:\n\t1. Your '
      + 'code lacks a measurement statement\n\t'
      + '2. You have not yet called engine.flush() to '
      + 'force execution of your code\n\t3. The '
      + 'underlying backend failed to register '
      + 'the measurement result\n')
    } else {
      return v
    }
  }

  /*
  Returns a unique qubit id to be used for the next qubit allocation.

    Returns:
new_qubit_id (int): New unique qubit id.
   */
  getNewQubitID() {
    this._qubitIdx += 1
    return this._qubitIdx - 1
  }

  /*
  Forward the list of commands to the first engine.

    Args:
command_list (list<Command>): List of commands to receive (and
then send on)
   */
  receive(commandList) {
    this.send(commandList)
  }

  /*
  Forward the list of commands to the next engine in the pipeline.

    It also shortens exception stack traces if self.verbose is False.
   */
  send(commandList) {
    try {
      this.next.receive(commandList)
    } catch (e) {
      if (this.verbose) {
        console.log(e)
      }
      throw e
    }
  }

  /*
  Flush the entire circuit down the pipeline, clearing potential buffers
(of, e.g., optimizers).

    Args:
deallocate_qubits (bool): If True, deallocates all qubits that are
still alive (invalidating references to them by setting their
id to -1).
   */
  flush(deallocateQubits = false) {
    if (deallocateQubits) {
      for (const qb of this.activeQubits) {
        qb.deallocate()
      }
      this.activeQubits = new Set()
    }

    this.receive([new Command(this, new FlushGate(), [[new BasicQubit(this, -1)]])])
  }
}
