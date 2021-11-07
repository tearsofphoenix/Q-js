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
import { matrix } from 'mathjs'
import { expect } from 'chai'
import { classHierachy, isSubclassOf, isKindclassOf, matrixDot } from '@/libs/util'
import { hashArray, arrayFromHash } from '@/libs/term';
import { HGate } from '@/ops/gates'
import { BasicGate, SelfInverseGate } from '@/ops/basics'
import { Qureg } from '@/meta/qubit'
import { expmod } from '@/libs/polyfill';

describe('util test', () => {
  it('should test class hierachy 1', () => {
    const hierachy = classHierachy(HGate)
    expect(hierachy).to.deep.equal([
      { name: 'HGate', class: HGate },
      { name: 'SelfInverseGate', class: SelfInverseGate },
      { name: 'BasicGate', class: BasicGate }])

    const h1 = classHierachy(Qureg)
    expect(h1).to.deep.equal([
      { name: 'Qureg', class: Qureg },
      { name: 'Array', class: Array }])
  });

  it('should test isSubclassOf', () => {
    expect(isSubclassOf(HGate, BasicGate)).to.equal(true)
    expect(isSubclassOf(BasicGate, BasicGate)).to.equal(false)
    expect(isSubclassOf(BasicGate, Array)).to.equal(false)
    expect(isSubclassOf(Qureg, Array)).to.equal(true)
  });

  it('should test isKindclassOf', () => {
    expect(isKindclassOf(HGate, BasicGate)).to.equal(true)
    expect(isKindclassOf(BasicGate, BasicGate)).to.equal(true)
    expect(isKindclassOf(HGate, Array)).to.equal(false)
    expect(isKindclassOf(Qureg, Array)).to.equal(true)
  });

  it('should test matrixDot', () => {
    const m = matrix([[1, 2], [3, 4]])
    const v = matrix([1, 2])
    const result = matrixDot(m, v)
    expect(result).to.deep.equal(matrix([5, 11]))
  });

  it('should test expmod', () => {
    expect(expmod(2, 10, 3)).to.equal(1)
    expect(expmod(3, 200, 6)).to.equal(3)
    expect(expmod(6, 278, 65)).to.equal(36)
    expect(expmod(7, 399, 165)).to.equal(118)
    expect(expmod(67, 32768, 212)).to.equal(81)
  });

  describe('hashArray', () => {
    it('should has same hash', () => {
      const a = [[1, 'X'], [2, 'Y']];
      expect(hashArray(a)).to.equal('X1 Y2');
      // @ts-ignore
      expect(hashArray([])).to.equal('');
    });
  });

  describe('array from hash', () => {
    it('should convert hash to array', () => {
      const hash = 'X1 Y2';
      expect(arrayFromHash(hash)).to.deep.equal([[1, 'X'], [2, 'Y']]);
      const h2 = 'X1';
      expect(arrayFromHash(h2)).to.deep.equal([[1, 'X']]);
      const h3 = 'X2 Y0 Z13';
      expect(arrayFromHash(h3)).to.deep.equal([[0, 'Y'], [2, 'X'], [13, 'Z']]);
    });
  });
});
