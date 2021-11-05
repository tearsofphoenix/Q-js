import { ICopy } from './ICopy';
import { QObject } from './IQubit';

interface IGate extends ICopy<IGate> {
    interchangeableQubitIndices: number[][];
    equal(other: IGate): boolean;
    getMerged(other: IGate): IGate;
    getInverse(): IGate;
    or(q: QObject): void;
}

interface IMathGate extends IGate {
    a: number;
    N: number;
}

export { IGate, IMathGate };
