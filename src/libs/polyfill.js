/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import math from 'mathjs'
import {instanceOf} from './util';

const Complex = math.complex().constructor
const Matrix = math.matrix().constructor

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

export function setDifference(s1, s2) {
  return new Set([...s1].filter(x => !s2.has(x)))
}

export function setFromRange(n) {
  const result = new Set()
  for (let i = 0; i < n; i++) {
    result.add(i)
  }
  return result
}

export function arrayFromRange(start, end, step) {
  if (typeof end === 'undefined') {
    end = start
    start = 0
  }
  if (typeof step === 'undefined') {
    step = 1
  }
  const n = end - start
  const result = new Array(n)
  for (let i = 0; i < n; i += step) {
    result[i] = i + start
  }
  return result
}

export function randomSample(array, count) {
  const result = []
  const {length} = array
  if (length >= count) {
    const copy = array.slice(0)
    while (result.length < count) {
      const idx = Math.floor(Math.random() * copy.length)
      result.push(copy[idx])
      copy.splice(idx, 1)
    }
  }
  return result
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

Array.prototype.count = function (item) {
  let count = 0
  for (let i = 0; i < this.length; ++i) {
    if (this[i] === item) {
      ++count
    }
  }
  return count
}

Array.prototype.remove = function (target) {
  let idx = -1
  for (let i = 0; i < this.length; ++i) {
    if (arrayEqual(this[i], target)) {
      idx = i
      break
    }
  }
  if (idx !== -1) {
    this.splice(idx, 1)
  }
}

String.prototype.count = function (substring) {
  const exp = new RegExp(substring, 'g')
  const result = this.match(exp)
  if (result) return result.length
  return 0
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

export function complexVectorDot(a1, a2) {
  let real = 0
  let image = 0
  a1.forEach((c1, [i]) => {
    const c2 = a2.subset(math.index(i))
    const r1 = math.re(c1)
    const i1 = math.im(c1)
    const r2 = math.re(c2)
    const i2 = math.im(c2)
    real += r1 * r2 - (-i1 * i2)
    image += r1 * i2 - r2 * i1
  })
  return math.complex(real, image)
}

export function narray(item, count) {
  const result = []
  if (typeof item === 'function') {
    for (let i = 0; i < count; ++i) {
      result.push(item())
    }
  } else {
    for (let i = 0; i < count; ++i) {
      result.push(item)
    }
  }
  return result
}

export function productLoop(p1, p2, func) {
  for (let i = 0; i < p1.length; ++i) {
    for (let j = 0; j < p2.length; ++j) {
      const stop = func(p1[i], p2[j])
      if (stop) {
        return
      }
    }
  }
}

export function productLoop3(p1, p2, p3, func) {
  for (let i = 0; i < p1.length; ++i) {
    for (let j = 0; j < p2.length; ++j) {
      for (let k = 0; k < p3.length; ++k) {
        const stop = func(p1[i], p2[j], p3[k])
        if (stop) {
          return
        }
      }
    }
  }
}

export function expmod(base, exp, mod) {
  if (exp === 0) return 1
  if (exp % 2 === 0) {
    return Math.pow(expmod(base, (exp / 2), mod), 2) % mod
  } else {
    return (base * expmod(base, (exp - 1), mod)) % mod
  }
}