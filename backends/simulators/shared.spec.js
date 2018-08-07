import BasicMapperEngine from '../../cengines/basicmapper';

export class TrivialMapper extends BasicMapperEngine {
  constructor() {
    super()
    this.currentMapping = {}
  }

  receive(command_list) {
    command_list.forEach((cmd) => {
      cmd.allQubits.forEach((qureg) => {
        qureg.forEach((qubit) => {
          if (qubit.id !== -1) {
            const v = this.currentMapping[qubit.id]
            if (typeof v === 'undefined') {
              const previous_map = this.currentMapping
              previous_map[qubit.id] = qubit.id + 1
              this.currentMapping = previous_map
            }
          }
        })
      })
      this.sendCMDWithMappedIDs(cmd)
    })
  }
}
