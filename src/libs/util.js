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

/**
 * @ignore
 * generate a n-Length Array filled by `0`
 * @param {number} n
 * @return {number[]}
 */
export function zeros(n) {
  const array = new Array(n)
  for (let i = 0; i < n; ++i) {
    array[i] = 0
  }
  return array
}

/**
 * @ignore
 * check if an array is `tuple`
 * @param {Array} value
 * @return {boolean}
 */
export function arrayIsTuple(value) {
  let isTuple = false
  if (typeof value.$$__tuple !== 'undefined') {
    isTuple = value.$$__tuple
    return isTuple
  }
  if (Array.isArray(value)) {
    isTuple = value.some(item => item instanceof Array)
  }
  return isTuple
}

/**
 * @ignore
 * force mark a value as `tuple`, internal usage only
 * @param value
 */
export function markTuple(value) {
  value.$$__tuple = true
}

/**
 * create `tuple` from arguments
 * @param args
 * @return {Array}
 */
export function tuple(...args) {
  const result = new Array(...args)
  markTuple(result)
  return result
}

/**
 * @ignore
 * create copy of object, with same `class`
 * @param {Object} obj
 * @return {Object}
 */
export function ObjectCopy(obj) {
  const copy = Object.create(obj.__proto__)
  Object.assign(copy, obj)
  return copy
}

/**
 * return class hierachy of `cls`
 * @param {function} cls
 * @return {function[]}
 */
export function classHierachy(cls) {
  const result = []
  if (typeof cls === 'function') {
    let {name} = cls
    while (name.length > 0) {
      result.push({name, class: cls})
      cls = cls.__proto__
      name = cls.name
    }
  }
  return result
}

/**
 * check if `cls` is subclass of `superClass`, will return false if cls is superClass
 * @param {function} cls
 * @param {function} superClass
 * @return {boolean}
 */
export function isSubclassOf(cls, superClass) {
  if (typeof cls === 'function' && typeof superClass === 'function') {
    const targetName = superClass.name
    let {name} = cls
    let level = 0
    while (name.length > 0) {
      if (name === targetName && level > 0) {
        return true
      }
      cls = cls.__proto__
      name = cls.name
      ++level
    }
  }
  return false
}

/**
 * check if `cls` is kind of `superClass`, will return true if cls is superClass
 * @param {function} cls
 * @param {function} superClass
 * @return {boolean}
 */
export function isKindclassOf(cls, superClass) {
  if (typeof cls === 'function' && typeof superClass === 'function') {
    const targetName = superClass.name
    let {name} = cls
    while (name.length > 0) {
      if (name === targetName) {
        return true
      }
      cls = cls.__proto__
      name = cls.name
    }
  }
  return false
}

/**
 * check if `inst` is instance of `cls`, specialized for some class
 * @param {any} inst
 * @param {function} cls
 * @return {boolean}
 */
export function instanceOf(inst, cls) {
  if (Array.isArray(cls)) {
    return cls.some(looper => instanceOf(inst, looper))
  }
  switch (cls.name) {
    case 'String': {
      return typeof inst === 'string' || inst instanceof cls
    }
    case 'Number': {
      return typeof inst === 'number' || inst instanceof cls
    }
    default: {
      return inst instanceof cls
    }
  }
}

/**
 * @ignore
 * return item * n string like python does.
 * @param {string} item
 * @param {number} n
 * @return {string}
 */
export function genString(item, n) {
  let str = ''
  for (let i = 0; i < n; ++i) {
    str += item
  }
  return str
}

/**
 * @ignore
 * assign value in `vector` into `matrix` by index in `indices`
 * @param {math.matrix} matrix
 * @param {number[]} indices
 * @param {number[]} vector
 */
export function matrixRangeAssign(matrix, indices, vector) {
  if (Array.isArray(vector)) {
    indices.forEach(idx => matrix.subset(math.index(idx), vector[idx]))
  } else {
    indices.forEach((idx, i) => matrix.subset(math.index(idx), vector.subset(math.index(i))))
  }
}

/**
 * @ignore
 * @param matrix
 * @param mstart
 * @param mend
 * @param vector
 * @param vstart
 */
export function matrixRangeIndicesAssign(matrix, mstart, mend, vector, vstart) {
  if (Array.isArray(vector)) {
    for (let i = 0; i + mstart < mend; ++i) {
      matrix.subset(math.index(i + mstart), vector[vstart + i])
    }
  } else {
    for (let i = 0; i + mstart < mend; ++i) {
      matrix.subset(math.index(i + mstart), vector.subset(math.index(vstart + i)))
    }
  }
}

/**
 * @ignore
 * return a row of matrix
 * @param {math.matrix} matrix
 * @param {number} index
 * @return {number[]}
 */
export function matrixGetRow(matrix, index) {
  const rows = math.size(matrix).valueOf()[1];
  return math.flatten(math.subset(matrix, math.index(index, math.range(0, rows))));
}

/**
 * @ignore
 * dot product of matrix & vector
 * @param {math.matrix} matrix
 * @param {number[]} vector
 * @return {math.matrix}
 */
export function matrixDot(matrix, vector) {
  const [rows] = matrix.size()
  const result = []
  for (let i = 0; i < rows; ++i) {
    const row = matrixGetRow(matrix, i)
    result.push(math.dot(row, vector))
  }
  return math.matrix(result)
}
