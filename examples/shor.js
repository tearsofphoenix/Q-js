
/*
Runs the quantum subroutine of Shor's algorithm for factoring.

Args:
    eng (MainEngine): Main compiler engine to use.
N (int): Number to factor.
a (int): Relative prime to use as a base for a^x mod N.
verbose (bool): If true, display intermediate measurement results.

    Returns:
r (float): Potential period of a.
 */
import {AddConstant, AddConstantModN, MultiplyByConstantModN} from "../libs/math/gates";
import {All, H, Measure, X, R, BasicMathGate} from "../ops";
import {Control} from "../meta";
import {getInverse} from "../ops/_cycle";

function run_shor(eng, N, a, verbose=false) {
  const n = Math.ceil(Math.log(N, 2))

  const x = eng.allocateQureg(n)

  X.or(x[0])

  const measurements = [0] * (2 * n)  // will hold the 2n measurement results

  const ctrl_qubit = eng.allocateQubit()

  for (let k = 0; k <2 * n; ++k) {
    const current_a = Math.pow(a, 1 << (2 * n - 1 - k), N)
    // one iteration of 1-qubit QPE
    H.or(ctrl_qubit)

    Control(eng, ctrl_qubit, () => new MultiplyByConstantModN(current_a, N).or(x))

    // perform inverse QFT --> Rotations conditioned on previous outcomes
    for (let i = 0; i < k; ++i) {
      if (measurements[i]) {
        new R(-Math.pi / (1 << (k - i))).or(ctrl_qubit)
      }
    }
    H.or(ctrl_qubit)

    // and measure
    Measure.or(ctrl_qubit)
    eng.flush()
    measurements[k] = ctrl_qubit.toNumber()
    if(measurements[k]) {
      X.or(ctrl_qubit)
    }

    if(verbose) {
      console.log(`\033[95m${measurements[k]}\033[0m`)
    }
  }


  new All(Measure).or(x)
  // turn the measured values into a number in [0,1)

  let sum = 0
  for (let i = 0; i < 2 * n; ++i) {
    sum += measurements[2 * n - 1 - i]*1. / (1 << (i + 1))
  }
  const y = sum

  // continued fraction expansion to get denominator (the period?)
  const r = Fraction(y).limit_denominator(N-1).denominator

  // return the (potential) period
  return r

}



// Filter function, which defines the gate set for the first optimization
// (don't decompose QFTs and iQFTs to make cancellation easier)
function high_level_gates(eng, cmd) {
  const g = cmd.gate
  if (g == QFT ||
  getInverse(g) == QFT
  ||
  g == Swap
  ) {
    return true
  }
  if(g instanceof BasicMathGate) {
    return false
  }

  if (g instanceof AddConstant) {
    return true
  } else if (g instanceof AddConstantModN) {
    return true
  }
  if isinstance(g, AddConstant):
  return true
  elif
  isinstance(g, AddConstantModN)
:
  return true
  return false
  return eng.next_engine.is_available(cmd)
}

if __name__ == "__main__":
// build compilation engine list
resource_counter = ResourceCounter()
rule_set = DecompositionRuleSet(modules=[projectq.libs.math,
  projectq.setups.decompositions])
compilerengines = [AutoReplacer(rule_set),
  InstructionFilter(high_level_gates),
  TagRemover(),
  LocalOptimizer(3),
  AutoReplacer(rule_set),
  TagRemover(),
  LocalOptimizer(3),
  resource_counter]

// make the compiler and run the circuit on the simulator backend
eng = MainEngine(Simulator(), compilerengines)

// print welcome message and ask the user for the number to factor
print("\n\t\033[37mprojectq\033[0m\n\t--------\n\tImplementation of Shor"
"\'s algorithm.", end="")
N = int(input('\n\tNumber to factor: '))
print("\n\tFactoring N = {}: \033[0m".format(N), end="")

// choose a base at random:
    a = int(random.random()*N)
if not gcd(a, N) == 1:
print("\n\n\t\033[92mOoops, we were lucky: Chose non relative prime"
" by accident :)")
print("\tFactor: {}\033[0m".format(gcd(a, N)))
else:
// run the quantum subroutine
r = run_shor(eng, N, a, true)

// try to determine the factors
if r % 2 != 0:
r *= 2
apowrhalf = pow(a, r >> 1, N)
f1 = gcd(apowrhalf + 1, N)
f2 = gcd(apowrhalf - 1, N)
if ((not f1 * f2 == N) and f1 * f2 > 1 and
int(1. * N / (f1 * f2)) * f1 * f2 == N):
f1, f2 = f1*f2, int(N/(f1*f2))
if f1 * f2 == N and f1 > 1 and f2 > 1:
print("\n\n\t\033[92mFactors found :-) : {} * {} = {}\033[0m"
    .format(f1, f2, N))
else:
print("\n\n\t\033[91mBad luck: Found {} and {}\033[0m".format(f1,
    f2))

print(resource_counter)  // print resource usage
