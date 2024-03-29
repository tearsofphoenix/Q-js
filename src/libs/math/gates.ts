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
import { BasicMathGate } from '@/ops/basics'
import { IGate } from '@/interfaces';

/**
 * @desc
Add a constant to a quantum number represented by a quantum register,
    stored from low- to high-bit.

    @example

qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[1] # qunum is now equal to 2
AddConstant(3) | qunum # qunum is now equal to 5
 */
export class AddConstant extends BasicMathGate {
  a: number;
  /**
  Initializes the gate to the number to add.

    @param a Number to add to a quantum register.

    It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  constructor(a: number) {
    super((x: number) => [x + a]);
    this.a = a
  }

  getInverse() {
    return SubConstant(this.a);
  }

  toString() {
    return `AddConstant(${this.a})`;
  }

  equal(other: IGate) {
    return other instanceof AddConstant && other.a === this.a
  }
}

/**
Subtract a constant from a quantum number represented by a quantum
register, stored from low- to high-bit.

    @param a Constant to subtract

    @example

qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[2] # qunum is now equal to 4
SubConstant(3) | qunum # qunum is now equal to 1
 */
export function SubConstant(a: number) {
  return new AddConstant(-a)
}

/**
 * @desc
Add a constant to a quantum number represented by a quantum register
modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

    @example

qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[1] # qunum is now equal to 2
AddConstantModN(3, 4) | qunum # qunum is now equal to 1
 */
export class AddConstantModN extends BasicMathGate {
  a: number;
  N: number;
  /**
  Initializes the gate to the number to add modulo N.

    @param a Number to add to a quantum register (0 <= a < N).
    @param N Number modulo which the addition is carried out.

    It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  constructor(a: number, N: number) {
    super((x: number) => [math.mod(x + a, N)]);
    this.a = a;
    this.N = N;
  }

  toString() {
    return `AddConstantModN(${this.a}, ${this.N})`
  }

  getInverse() {
    return SubConstantModN(this.a, this.N)
  }

  equal(other: IGate) {
    return other instanceof AddConstantModN && other.a === this.a && other.N === this.N
  }
}

/**
Subtract a constant from a quantum number represented by a quantum
register modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

 @param a Constant to add
 @param N Constant modulo which the addition of a should be carried out.

    @example

qunum = eng.allocateQureg(3) # 3-qubit number
X | qunum[1] # qunum is now equal to 2
SubConstantModN(4,5) | qunum # qunum is now -2 = 6 = 1 (mod 5)
 */
export function SubConstantModN(a: number, N: number) {
  return new AddConstantModN(N - a, N)
}

/**
 * @desc
Multiply a quantum number represented by a quantum register by a constant
modulo N.

    The number is stored from low- to high-bit, i.e., qunum[0] is the LSB.

    @example
qunum = eng.allocateQureg(5) # 5-qubit number
X | qunum[2] # qunum is now equal to 4
MultiplyByConstantModN(3,5) | qunum # qunum is now 2.
 */
export class MultiplyByConstantModN extends BasicMathGate {
  a: number;
  N: number;
  /**
  Initializes the gate to the number to multiply with modulo N.

   @param a Number by which to multiply a quantum register (0 <= a < N).
   @param N Number modulo which the multiplication is carried out.

    It also initializes its base class, BasicMathGate, with the
  corresponding function, so it can be emulated efficiently.
   */
  constructor(a: number, N: number) {
    super((x: number) => [(a * x) % N]);
    this.a = a
    this.N = N
  }

  toString() {
    return `MultiplyByConstantModN(${this.a}, ${this.N})`
  }

  equal(other: IGate): boolean {
    return Boolean(other instanceof MultiplyByConstantModN && other.a === this.a && other.N === this.N);
  }
}
