/**
 * qasm program state
 * @class State
 */
import {MainEngine} from '../cengines'
import Scope from './scope';

export default class State {
  /**
   *
   */
  constructor() {
    this.engine = new MainEngine()
    this.scope = new Scope()
    this.current = this.scope
  }

  /**
   *
   * @param {string} name
   * @param {*} value
   */
  addToCurrentScope(name, value) {
    this.current.addValue(name, value)
  }

  /**
   *
   * @param {string} name
   */
  resolve(name) {
    return this.current.resolve(name)
  }

  /**
   *
   * @param {string[]}nameList
   * @return {*}
   */
  resolveList(nameList) {
    return nameList.map(name => this.resolve(name))
  }
}
