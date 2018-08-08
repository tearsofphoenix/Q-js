
// Insure that no HTTP request can be made in all tests in this module
import {expect} from 'chai'
import Gates, {
  Allocate, Barrier, Deallocate, Entangle, Measure, NOT, Rx, Ry, Rz, S, T, X, Y, Z
} from '../../ops/gates';
import {DummyEngine} from '../../cengines/testengine';
import IBMBackend from './ibm';
import {Command} from '../../ops/command';
import {tuple} from '../../libs/util';
import MainEngine from '../../cengines/main';
import IBM5QubitMapper, {ibmqx4_connections} from '../../cengines/ibm5qubitmapper';
import SwapAndCNOTFlipper from '../../cengines/swapandcnotflipper'
import IBMHTTPClient from './ibmhttpclient'
import DecompositionRuleSet from '../../cengines/replacer/decompositionruleset'
import decompositions from '../../setups/decompositions'
import TagRemover from '../../cengines/tagremover';
import LocalOptimizer from '../../cengines/optimize';
import {AutoReplacer} from '../../cengines/replacer/replacer';
import {All} from '../../ops/metagates';

const {Tdag, Sdag} = Gates

const single_qubit_gates = [
  X, Y, Z, T, Tdag, S, Sdag, Allocate, Deallocate, Measure, NOT, new Rx(0.5),
  new Ry(0.5), new Rz(0.5), Barrier, Entangle
]
const isAvailables = [
  true, true, true, true, true, true, true, true, true, true, true, true,
  true, true, true, false]

const OriginSend = IBMHTTPClient.send
const OriginRetrieve = IBMHTTPClient.retrieve

describe('ibm test', () => {
  beforeEach(() => {
    IBMHTTPClient.send = OriginSend
    IBMHTTPClient.retrieve = OriginRetrieve
  })

  it('should test_ibm_backend_is_available', () => {
    single_qubit_gates.forEach((gate, idx) => {
      const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
      const qubit1 = eng.allocateQubit()
      const ibm_backend = new IBMBackend()
      const cmd = new Command(eng, gate, tuple(qubit1))

      expect(ibm_backend.isAvailable(cmd)).to.equal(isAvailables[idx])
    })
  });

  it('should test_ibm_backend_is_available_control_not', () => {
    const numCtrlQubits = [0, 1, 2, 3]
    const availables = [true, true, false, false]

    numCtrlQubits.forEach((num, i) => {
      const eng = new MainEngine(new DummyEngine(), [new DummyEngine()])
      const qubit1 = eng.allocateQubit()
      const qureg = eng.allocateQureg(num)
      const ibm_backend = new IBMBackend()
      const cmd = new Command(eng, NOT, tuple(qubit1), qureg)

      expect(ibm_backend.isAvailable(cmd)).to.equal(availables[i])
    })
  });

  it('should test_ibm_backend_init', () => {
    const backend = new IBMBackend({verbose: true, user_hardware: true})
    expect(backend.qasm).to.equal('')
  });

  it('should test_ibm_empty_circuit', () => {
    const backend = new IBMBackend(false, 1024, true)
    const eng = new MainEngine(backend)
    eng.flush()
  });

  it('should test_ibm_sent_error', () => {
    const mock_send = async () => {
      throw new Error('')
    }

    IBMHTTPClient.send = mock_send

    const backend = new IBMBackend({verbose: true})
    backend.didRunCallback = () => expect(backend.errors.length).to.equal(1)
    const eng = new MainEngine(backend, [new IBM5QubitMapper(), new SwapAndCNOTFlipper(new Set())])
    const qubit = eng.allocateQubit()
    X.or(qubit)

    qubit[0].deallocate()
    eng.flush()

    // atexit sends another FlushGate, therefore we remove the backend:
    const dummy = new DummyEngine()
    dummy.isLastEngine = true
    eng.next = dummy
  });

  it('should test_ibm_retrieve', () => {
    IBMHTTPClient.retrieve = async () => {
      return {
        'date': '2017-01-19T14:28:47.622Z',
        'data': {
          'time': 14.429004907608032,
          'counts': {
            '00111': 396,
            '00101': 27,
            '00000': 601
          },
          'qasm': ('...')
        }
      }
    }
    const backend = new IBMBackend({retrieve_execution: 'ab1s2'})
    const rule_set = new DecompositionRuleSet([...decompositions])
    const connectivity = new Set([[1, 2], [2, 4], [0, 2], [3, 2], [4, 3], [0, 1]])
    const engine_list = [new TagRemover(),
      new LocalOptimizer(10),
      new AutoReplacer(rule_set),
      new TagRemover(),
      new IBM5QubitMapper(),
      new SwapAndCNOTFlipper(connectivity),
      new LocalOptimizer(10)]
    const eng = new MainEngine(backend, engine_list)
    const unused_qubit = eng.allocateQubit()
    const qureg = eng.allocateQureg(3)
    // entangle the qureg
    Entangle.or(qureg)
    Tdag.or(qureg[0])
    Sdag.or(qureg[0])
    Barrier.or(qureg)
    new Rx(0.2).or(qureg[0])

    unused_qubit.deallocate()
    // measure; should be all-0 or all-1
    new All(Measure).or(qureg)
    // run the circuit
    eng.flush()
    const prob_dict = eng.backend.getProbability([qureg[0], qureg[2], qureg[1]])
    console.log(prob_dict)

    expect(prob_dict['111']).to.be.closeTo(0.38671875, 1e-12)
    expect(prob_dict['101']).to.be.closeTo(0.0263671875, 1e-12)
  });

  it('should test_ibm_backend_functional_test', () => {
    const correct_info = ('{"qasms": [{"qasm": "\\ninclude \\"qelib1.inc\\";'
+ '\\nqreg q[3];\\ncreg c[3];\\nh q[2];\\ncx q[2], q[0];'
        + '\\ncx q[2], q[1];\\ntdg q[2];\\nsdg q[2];'
        + '\\nbarrier q[2], q[0], q[1];'
        + '\\nu3(0.2, -pi/2, pi/2) q[2];\\nmeasure q[2] -> '
        + 'c[2];\\nmeasure q[0] -> c[0];\\nmeasure q[1] -> c[1];"}]'
        + ', "shots": 1024, "maxCredits": 5, "backend": {"name": '
        + '"simulator"}}')

    const mock_send = async (args) => {
      console.log(162, args)
      return {
        'date': '2017-01-19T14:28:47.622Z',
        'data': {
          'time': 14.429004907608032,
          'counts': {
            '00111': 396,
            '00101': 27,
            '00000': 601
          },
          'qasm': ('...')
        }
      }
    }

    IBMHTTPClient.send = mock_send

    const backend = new IBMBackend({verbose: true})
    // no circuit has been executed -> raises exception
    expect(() => backend.getProbabilities([])).to.throw()

    const rule_set = new DecompositionRuleSet(decompositions)

    const engine_list = [new TagRemover(),
      new LocalOptimizer(10),
      new AutoReplacer(rule_set),
      new TagRemover(),
      new IBM5QubitMapper(),
      new SwapAndCNOTFlipper(ibmqx4_connections),
      new LocalOptimizer(10)]
    const eng = new MainEngine(backend, engine_list)
    const unused_qubit = eng.allocateQubit()
    const qureg = eng.allocateQureg(3)
    // entangle the qureg
    Entangle.or(qureg)
    Tdag.or(qureg[0])
    Sdag.or(qureg[0])
    Barrier.or(qureg)
    new Rx(0.2).or(qureg[0])

    unused_qubit.deallocate()
    // measure; should be all-0 or all-1
    new All(Measure).or(qureg)
    // run the circuit
    eng.flush()
    const prob_dict = eng.backend.getProbabilities([qureg[0], qureg[2], qureg[1]])
    expect(prob_dict['111']).to.be.closeTo(0.38671875, 1e-12)
    expect(prob_dict['101']).to.be.closeTo(0.0263671875, 1e-12)

    expect(() => eng.backend.getProbabilities(eng.allocateQubit())).to.throw()
  });
})
