import BasicMapperEngine from './basicmapper'

/*
Manual Mapper which adds QubitPlacementTags to Allocate gate commands
according to a user-specified mapping.

    Attributes:
map (function): The function which maps a given qubit id to its
location. It gets set when initializing the mapper.
 */
export default class ManualMapper extends BasicMapperEngine {
  /*
    Initialize the mapper to a given mapping. If no mapping function is
provided, the qubit id is used as the location.

    Args:
map_fun (function): Function which, given the qubit id, returns
an integer describing the physical location (must be constant).
     */
  constructor(mapFunc = x => x) {
    super()
    this.map = mapFunc
    this.currentMapping = {}
  }

  /*
    Receives a command list and passes it to the next engine, adding
    qubit placement tags to allocate gates.

    Args:
        command_list (list of Command objects): list of commands to
    receive.
     */
  receive(command_list) {
    command_list.forEach((cmd) => {
      const ids = []
      cmd.qubits.forEach((qr) => {
        qr.forEach(qb => ids.push(qb.id))
      })
      ids.forEach((id) => {
        const v = this.currentMapping[id]
        if (typeof v === 'undefined') {
          this.currentMapping[id] = this.map(id)
        }
      })
      this.sendCMDWithMappedIDs(cmd)
    })
  }
}
