export default class Debugger {
  constructor() {
    //
    this.breakpoints = []
  }

  addBreakPoint(bp) {
    const idx = this.breakpoints.findIndex(looper => looper.equal(bp))
    if (idx === -1) {
      this.breakpoints.push(bp)
    } else {
      const current = this.breakpoints[idx]
      if (!current.enabled) {
        current.enabled = true
      }
    }
  }

  removeBreakPoint(bp) {
    const idx = this.breakpoints.findIndex(looper => looper.equal(bp))
    if (idx !== -1) {
      this.breakpoints.splice(idx, 1)
    }
  }

  deactiveAllBreakPoints() {
    this.breakpoints.forEach(looper => looper.disable())
  }

  stepInto() {

  }

  stepOver() {

  }
}
