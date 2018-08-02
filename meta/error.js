export class NotMergeable extends Error {
  constructor(...args) {
    super(...args)
    this.__proto__ = NotMergeable.prototype
  }
}

export class LastEngineError extends Error {
  constructor(...args) {
    super(...args)
    this.__proto__ = LastEngineError.prototype
  }
}
