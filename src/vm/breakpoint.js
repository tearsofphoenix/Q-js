/**
 * @class BreakPoint
 */
export class BreakPoint {
  constructor() {
    this._enabled = true
  }

  /**
   * @returns {boolean}
   */
  get enabled() {
    return this._enabled
  }

  set enabled(flag) {
    this._enabled = flag
  }

  disable() {
    this._enabled = false
  }

  /**
   *
   * @param {BreakPoint} other
   * @return {boolean}
   */
  equal(other) {
    throw new Error('Subclass should override this method')
  }

  /**
   *
   * @param {Operation} op
   * @return {boolean}
   */
  shouldBreakAt(op) {
    throw new Error('Subclass should override this method')
  }

  toString() {
    return 'BreakPoint'
  }
}

export class LineBreakPoint extends BreakPoint {
  constructor(sourceFile, lineNumber) {
    super()
    this.sourceFile = sourceFile
    this.lineNumber = lineNumber
  }

  /**
   * @param {Operation} op
   * @return {boolean}
   */
  shouldBreakAt(op) {
    if (this.enabled) {
      const {sourceFile, lineNumber} = op
      return sourceFile === this.sourceFile && lineNumber === this.lineNumber
    }
    return false
  }

  equal(other) {
    if (other instanceof LineBreakPoint) {
      return this.sourceFile === other.sourceFile && this.lineNumber === other.lineNumber
    }
    return false
  }
}
