
/*
 */
export function arrayRangeAssign(source, target, start, end) {
  for (let i = start; i < end; ++i) {
    target[i] = source[i]
  }
}

export function zeros(n) {
  const array = new Array(n)
  for (let i = 0; i < n; ++i) {
    array.push(0)
  }
  return array
}

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

export function markTuple(value) {
  value.$$__tuple = true
}

export function makeTuple(...args) {
  const result = new Array(...args)
  markTuple(result)
  return result
}

export const tuple = makeTuple

export function ObjectCopy(obj) {
  const copy = Object.create(obj.__proto__)
  Object.assign(copy, obj)
  return copy
}
