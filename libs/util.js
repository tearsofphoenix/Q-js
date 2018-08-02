
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

export function classHierachy(cls) {
  const result = []
  if (typeof cls === 'function') {
    let {name} = cls
    while (name.length > 0) {
      result.push(name)
      cls = cls.__proto__
      name = cls.name
    }
  }
  return result
}

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

export function instanceOf(inst, cls) {
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
