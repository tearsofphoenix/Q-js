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
