import {expect} from 'chai'
import {DummyEngine} from '../cengines/testengine'
import MainEngine from '../cengines/main'
import {dropEngineAfter, insertEngine} from './util'

describe('util test', () => {
  it('should test_insert_then_drop', () => {
    const d1 = new DummyEngine()
    const d2 = new DummyEngine()
    const d3 = new DummyEngine()
    const eng = new MainEngine(d3, [d1])

    expect(d1.next === d3).to.equal(true)
    expect(typeof d2.next === 'undefined').to.equal(true)
    expect(typeof d3.next === 'undefined').to.equal(true)
    expect(d1.main).to.equal(eng)
    expect(typeof d2.main === 'undefined').to.equal(true)
    expect(d3.main).to.equal(eng)

    insertEngine(d1, d2)
    expect(d1.next === d2).to.equal(true)
    expect(d2.next === d3).to.equal(true)
    expect(d3.next === undefined).to.equal(true)
    expect(d1.main === eng).to.equal(true)
    expect(d2.main === eng).to.equal(true)
    expect(d3.main === eng).to.equal(true)

    dropEngineAfter(d1)
    expect(d1.next === d3).to.equal(true)
    expect(d2.next === undefined).to.equal(true)
    expect(d3.next === undefined).to.equal(true)
    expect(d1.main === eng).to.equal(true)
    expect(d2.main === undefined).to.equal(true)
    expect(d3.main === eng).to.equal(true)
  });
})
