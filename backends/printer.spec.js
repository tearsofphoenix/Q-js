import {expect} from 'chai'
import CommandPrinter from './printer'

describe('printer test', () => {

  it('should test_command_printer_is_available', function () {
    const inline_cmd_printer = new CommandPrinter()
    const cmd_printer = new CommandPrinter()

    const available_cmd = function(cmd) {
      return cmd.gate.equal(H)
    }

    const filter = new InstructionFilter(available_cmd)
    const eng = new MainEngine(cmd_printer, [inline_cmd_printer, filter])
    qubit = eng.allocate_qubit()
    cmd0 = Command(eng, H, (qubit,))
    cmd1 = Command(eng, T, (qubit,))
    assert inline_cmdnew is_available(cmd0)
    assert not inline_cmdnew is_available(cmd1)
    assert cmdnew is_available(cmd0)
    assert cmdnew is_available(cmd1)
  });

  it('should ', function () {

  });



  def test_command_printer_accept_input(monkeypatch):
  cmd_printer = new CommandPrinter()
  eng = MainEngine(backend=cmd_printer, engine_list=[DummyEngine()])
  monkeypatch.setattr(_printer, "input", lambda x: 1)
  qubit = eng.allocate_qubit()
  Measure | qubit
  assert int(qubit) == 1
  monkeypatch.setattr(_printer, "input", lambda x: 0)
  qubit = eng.allocate_qubit()
  NOT | qubit
  Measure | qubit
  assert int(qubit) == 0


  def test_command_printer_no_input_default_measure():
  cmd_printer = new CommandPrinter(accept_input=False)
  eng = MainEngine(backend=cmd_printer, engine_list=[DummyEngine()])
  qubit = eng.allocate_qubit()
  NOT | qubit
  Measure | qubit
  assert int(qubit) == 0


  def test_command_printer_measure_mapped_qubit():
  eng = MainEngine(new CommandPrinter(accept_input=False), [])
  qb1 = WeakQubitRef(engine=eng, idx=1)
  qb2 = WeakQubitRef(engine=eng, idx=2)
  cmd0 = Command(engine=eng, gate=Allocate, qubits=([qb1],))
  cmd1 = Command(engine=eng, gate=Measure, qubits=([qb1],), controls=[],
      tags=[LogicalQubitIDTag(2)])
  with pytest.raises(NotYetMeasuredError):
  int(qb1)
  with pytest.raises(NotYetMeasuredError):
  int(qb2)
  eng.send([cmd0, cmd1])
  eng.flush()
  with pytest.raises(NotYetMeasuredError):
  int(qb1)
  assert int(qb2) == 0

})
