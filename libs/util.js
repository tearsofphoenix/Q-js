import math from 'mathjs'

math.import('cones', (n) => {
  const array = new Array(n)
  for (let i = 0; i < n; ++i) {
    array.push(math.complex(1, 1))
  }
  return math.matrix(array)
})

math.import('czeros', (n) => {
  const array = new Array(n)
  for (let i = 0; i < n; ++i) {
    array.push(math.complex(0, 0))
  }
  return math.matrix(array)
})

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
