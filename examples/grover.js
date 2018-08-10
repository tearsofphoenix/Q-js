
/*
Runs Grover's algorithm on n qubit using the provided quantum oracle.

Args:
    eng (MainEngine): Main compiler engine to run Grover on.
n (int): Number of bits in the solution.
oracle (function): Function accepting the engine, an n-qubit register,
    and an output qubit which is flipped by the oracle for the correct
bit string.

    Returns:
solution (list<int>): Solution bit-string.
 */
import {
  Compute, Control, Loop, Uncompute
} from '../meta';
import {
  All, Measure, H, X, Z
} from '../ops';
import MainEngine from '../cengines/main';

function run_grover(eng, n, oracle) {
  const x = eng.allocateQureg(n)

  // start in uniform superposition
  new All(H).or(x)

  // number of iterations we have to run:
  const num_it = Math.floor(Math.PI / 4.0 * Math.sqrt(1 << n))

  // prepare the oracle output qubit (the one that is flipped to indicate the
  // solution. start in state 1/sqrt(2) * (|0> - |1>) s.t. a bit-flip turns
  // into a (-1)-phase.
  const oracle_out = eng.allocateQubit()
  X.or(oracle_out)
  H.or(oracle_out)

  // run num_it iterations
  Loop(eng, num_it, () => {
    // oracle adds a (-1)-phase to the solution
    oracle(eng, x, oracle_out)

    // reflection across uniform superposition
    Compute(eng, () => {
      new All(H).or(x)
      new All(X).or(x)
    })

    Control(eng, x.slice(0, x.length - 1), () => Z.or(x[x.length - 1]))

    Uncompute(eng)
  })

  new All(Measure).or(x)
  Measure.or(oracle_out)

  eng.flush()
  // return result
  return x.map(qubit => qubit.toNumber())
}

/*
Marks the solution string 1,0,1,0,...,0,1 by flipping the output qubit,
    conditioned on qubits being equal to the alternating bit-string.

    Args:
eng (MainEngine): Main compiler engine the algorithm is being run on.
qubits (Qureg): n-qubit quantum register Grover search is run on.
output (Qubit): Output qubit to flip in order to mark the solution.
 */
function alternating_bits_oracle(eng, qubits, output) {
  Compute(eng, () => new All(X).or(qubits.slice(1, 2)))
  Control(eng, qubits, () => X.or(output))
  Uncompute(eng)
}

const eng = new MainEngine() // use default compiler engine
// run Grover search to find a 7-bit solution
console.log(run_grover(eng, 7, alternating_bits_oracle))
