import fs from 'fs'
import path from 'path'

/**
 * @class Library
 */
export default class Library {
  static searchPaths = []

  constructor(name) {
    this.name = name

    let foundPath
    for (let i = 0; i < Library.searchPaths.length; ++i) {
      foundPath = path.resolve(Library.searchPaths[i], this.name)
      if (fs.existsSync(foundPath)) {
        break
      }
    }

    if (foundPath) {
      this.path = foundPath
    } else {
      throw new Error(`library: ${this.name} not found in ${Library.searchPaths.join('\n')}`)
    }
  }

  static addSearchPath(newPath) {
    newPath = path.resolve(newPath)
    if (!Library.searchPaths.includes(newPath)) {
      Library.searchPaths.push(newPath)
    }
  }

  load(vm) {
    const content = fs.readFileSync(this.path, {encoding: 'utf8'})
    vm.run(content)
  }
}
