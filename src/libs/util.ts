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
import { size, flatten, subset, index as mindex, matrix as mm, dot as mdot, range, Matrix } from 'mathjs';

/**
 * @ignore
 * generate a n-Length Array filled by `0`
 */
export function zeros(n: number): number[] {
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
export function arrayIsTuple(value: any) {
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
export function markTuple(value: any) {
  value.$$__tuple = true
}

/**
 * create `tuple` from arguments
 * @param args
 * @return {Array}
 */
export function tuple(...args: any) {
  const result = new Array(...args)
  markTuple(result)
  return result
}

/**
 * @ignore
 * create copy of object, with same `class`
 */
export function ObjectCopy(obj: {}) {
  type Ctor = new (...args: any[]) => any;

  const copy = new (obj.constructor as Ctor)();
  Object.assign(copy, obj);
  return copy;
}

/**
 * return class hierachy of `cls`
 */
export function classHierachy(cls: any) {
  const result = []
  if (typeof cls === 'function') {
    let { name } = cls
    while (name.length > 0) {
      result.push({ name, class: cls })
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
export function isSubclassOf(cls: any, superClass: any): boolean {
  if (typeof cls === 'function' && typeof superClass === 'function') {
    const targetName = superClass.name
    let { name } = cls
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
 */
export function isKindclassOf(cls: any, superClass: any): boolean {
  if (typeof cls === 'function' && typeof superClass === 'function') {
    const targetName = superClass.name
    let { name } = cls
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
 */
export function instanceOf(inst: any, cls: any): boolean {
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
 */
export function genString(item: string, n: number): string {
  let str = ''
  for (let i = 0; i < n; ++i) {
    str += item
  }
  return str
}

/**
 * @ignore
 * assign value in `vector` into `matrix` by index in `indices`
 */
export function matrixRangeAssign(matrix: Matrix, indices: number[], vector: any) {
  if (Array.isArray(vector)) {
    indices.forEach(idx => matrix.subset(mindex(idx), vector[idx]))
  } else {
    indices.forEach((idx, i) => matrix.subset(mindex(idx), vector.subset(mindex(i))))
  }
}

export function matrixRangeIndicesAssign(matrix: Matrix, mstart: number, mend: number, vector: any, vstart: number) {
  if (Array.isArray(vector)) {
    for (let i = 0; i + mstart < mend; ++i) {
      matrix.subset(mindex(i + mstart), vector[vstart + i])
    }
  } else {
    for (let i = 0; i + mstart < mend; ++i) {
      matrix.subset(mindex(i + mstart), vector.subset(mindex(vstart + i)))
    }
  }
}

/**
 * @ignore
 * return a row of matrix
 */
export function matrixGetRow(matrix: Matrix, index: number) {
  const rows = size(matrix).valueOf()[1];
  return flatten(subset(matrix, mindex(index, range(0, rows))));
}

/**
 * @ignore
 * dot product of matrix & vector
 */
export function matrixDot(matrix: Matrix, vector: any) {
  const [rows] = matrix.size()
  const result = []
  for (let i = 0; i < rows; ++i) {
    const row = matrixGetRow(matrix, i)
    result.push(mdot(row, vector))
  }
  return mm(result);
}

export function hashArray<T>(array: T[]): string {
  return array.join('_');
}
