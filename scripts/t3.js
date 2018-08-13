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

/*
  _|_|_
  _|_|_
  _|_|_
 */
import {permutations} from 'itertools'

const winSteps = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

const N = 3

function isSuperset(superset, s1) {
  let count = 0
  s1.forEach(item => {
    if (superset.has(item)) {
      ++count
    }
  })
  return count === s1.size
}

function setDifference(superset, s2) {
  const diff = []
  for (const looper of superset) {
    if (!s2.has(looper)) {
      diff.push(looper)
    }
  }
  return diff
}

function gatherSteps(current, user) {
  const mySteps = []
  current.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === user) {
        mySteps.push(rowIndex * N + columnIndex)
      }
    })
  })
  return mySteps
}

function printState(current) {
  const format = (v) => (v !== 'e' ? v : '_')
  console.log(`
      ${format(current[0][0])}|${format(current[0][1])}|${format(current[0][2])}
      ${format(current[1][0])}|${format(current[1][1])}|${format(current[1][2])}
      ${format(current[2][0])}|${format(current[2][1])}|${format(current[2][2])}
    `)
}

function randomeChoose(myStepSet, opStepSet) {
  if (!opStepSet.has(4) && !myStepSet.has(4)) {
    return 4
  }

  for (let i = 0; i < N * N; ++i) {
    if (!opStepSet.has(i) && !myStepSet.has(i)) {
      console.log(60, myStepSet, opStepSet, i)
      return i
    }
  }

  throw new Error('no valid move!')
}

function solveT3(current, user, oppersite) {

  // gather my steps
  const mySteps = gatherSteps(current, user)
  const opSteps = gatherSteps(current, oppersite)

  const myStepSet = new Set(mySteps)
  const opSet = new Set(opSteps)

  console.log(myStepSet, opSet)

  for (let i = 0; i < winSteps.length; ++i) {
    const setLooper = new Set(winSteps[i])
    if (isSuperset(myStepSet, setLooper)) {
      // win !
      return [true, [winSteps[i][2]]]
    }
  }

  // try to solve
  const solves = []
  for (const looper of permutations(mySteps, 2)) {
    for (let i = 0; i < winSteps.length; ++i) {
      const setLooper = new Set(winSteps[i])
      const diff = setDifference(setLooper, new Set(looper))
      if (diff.length === 1 && !opSet.has(diff[0]) && !myStepSet.has(diff[0])) {
        // win !
        solves.push(diff[0])
      }
    }
  }

  if (solves.length > 0) {
    return [true, solves]
  }

  //
  mySteps.forEach(looper => {
    for (let i = 0; i < winSteps.length; ++i) {
      const setLooper = new Set(winSteps[i])
      if (setLooper.has(looper)) {
        // win !
        solves.push(winSteps[i][1])
      }
    }
  })

  if (solves.length > 0) {
    return [false, solves]
  } else {
    return [false, [randomeChoose(myStepSet, opSet)]]
  }
}


function main() {
  const current = [
    ['e', 'e', 'e'],
    ['e', 'e', 'e'],
    ['e', 'e', 'e']
  ]

  let win = false
  let me = 'x'
  let op = 'o'
  let i = 0
  while (!win) {
    const result = solveT3(current, me, op)
    win = result[0]
    const moves = result[1]

    const row = Math.floor(moves[0] / N)
    const column = moves[0] % N
    current[row][column] = me

    console.log(`[${win}]${me} move to (${row}, ${column})`)
    printState(current)

    const tmp = me
    me = op
    op = tmp
    ++i
    if (i > 100) {
      break
    }
  }
}

main()
