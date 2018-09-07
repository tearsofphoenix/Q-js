export default class BaseOperation {
  constructor(code, args, fileName, sourceCode, line) {
    this._code = code
    this._args = args
    this._sourceFileName = fileName
    this._sourceCode = sourceCode
    this._line = line
  }

  /**
   * @return {number}
   */
  get code() {
    return this._code
  }

  /**
   * @param {State} state
   */
  execute(state) {
    //
  }

  /**
   * @return {string}
   */
  toString() {
    return `${this.constructor.name}(${this._sourceCode || ''})`
  }
}
