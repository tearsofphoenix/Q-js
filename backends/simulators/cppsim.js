const ext = require('../../scripts/extensions')
const path = ext.getBinaryPath()
console.log(3, path)
const All = require(path)

console.log(4, All)

export default All.Simulator
