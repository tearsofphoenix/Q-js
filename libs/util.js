
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
  if (value.$$__tuple) {
    isTuple = value.$$__tuple
    return isTuple
  }
  if (Array.isArray(value)) {
    isTuple = value.some(item => item instanceof Array)
  }
  return isTuple
}

export function makeTuple(...args) {
  const result = new Array(...args)
  result.$$__tuple = true
  return result
}
