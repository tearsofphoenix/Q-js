export class NotMergeable extends Error {
  constructor(...args) {
    super(...args)
    this.__proto__ = NotMergeable.prototype
  }
}
