import mathjs from 'mathjs'
import {instanceOf} from './util';

const Complex = mathjs.complex().constructor
const Matrix = mathjs.matrix().constructor

export function isComplex(value) {
  return value instanceof Complex
}

export function isNumeric(value) {
  return (typeof value === 'number' || value instanceof Complex)
}

export function intersection(s1, s2) {
  return new Set([...s1].filter(x => s2.has(x)))
}

export function unionSet(s1, s2) {
  const s = [...s2].filter(x => !s1.has(x))
  const result = new Set(s1)
  s.forEach(x => result.add(x))
  return result
}

export function symmetricDifference(s1, s2) {
  const inset = intersection(s1, s2)
  const a = [...s1].filter(x => !inset.has(x))
  const b = [...s2].filter(x => !inset.has(x))
  return new Set([...a, ...b])
}

export function setEqual(s1, s2) {
  return symmetricDifference(s1, s2).size === 0
}

export function setIsSuperSet(superset, s) {
  const result = [...s].filter(x => !superset.has(x))
  return result.length === 0
}

export function arrayEqual(a1, a2, itemCompareFunc) {
  if (a1 === a2) {
    return true
  }

  if (Array.isArray(a1) && Array.isArray(a2)) {
    const l1 = a1.length
    const l2 = a2.length
    if (l1 === l2) {
      for (let i = 0; i < l1; ++i) {
        const c = a1[i]
        const d = a2[i]
        let func = itemCompareFunc
        if (!func && c.__proto__.equal) {
          func = (x, y) => Reflect.apply(c.__proto__.equal, x, [y])
        }
        if (Array.isArray(c) && Array.isArray(d)) {
          func = arrayEqual
        }
        if (!func) {
          func = (x, y) => x === y
        }
        const f = func(c, d)
        if (!f) {
          return false
        }
      }
      return true
    }
  }
  return false
}

Array.prototype.rforEach = function (callbackFunc) {
  if (typeof callbackFunc === 'function') {
    const count = this.length
    for (let i = count - 1; i >= 0; --i) {
      callbackFunc(this[i])
    }
  }
}

Array.prototype.rmap = function (callbackFunc) {
  const result = []
  if (typeof callbackFunc === 'function') {
    const count = this.length
    for (let i = count - 1; i >= 0; --i) {
      result.push(callbackFunc(this[i]))
    }
  }
  return result
}

export function len(v) {
  if (typeof v === 'undefined' || v === null) {
    return 0
  }
  if (Array.isArray(v)) {
    return v.length
  }
  if (v instanceof Set) {
    return v.size
  }
  if (v instanceof Matrix) {
    return v.size()[0]
  }
  if (instanceOf(v, String)) {
    return v.length
  }
  if (typeof v.length !== 'undefined') {
    if (typeof v.length === 'function') {
      return v.length()
    } else {
      return v.length
    }
  }
  if (typeof v === 'object') {
    return Object.keys(v).length
  }
  return 0
}

export function stringToBitArray(str) {
  if (Array.isArray(str)) {
    return str
  }
  const result = []
  if (instanceOf(str, String)) {
    for (let i = 0; i < str.length; ++i) {
      result.push(str.charAt(i) !== '0')
    }
  }
  return result
}
