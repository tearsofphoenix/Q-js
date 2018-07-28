import mathjs from 'mathjs'

/*
    @return {bool}
 */
export function isNumeric(value) {
  return (typeof value === 'number' || value instanceof mathjs.complex)
}

export function intersection(s1, s2) {
  return new Set([...s1].filter(x => s2.has(x)))
}

export function union(s1, s2) {

}

export function symmetricDifference(s1, s2) {
  const inset = intersection(s1, s2)
  const a = [...s1].filter(x => !inset.has(x))
  const b = [...s2].filter(x => !inset.has(x))
  return new Set([...a, ...b])
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
