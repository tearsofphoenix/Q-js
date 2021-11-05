import { Matrix } from 'mathjs';
import { ICopy } from './ICopy';
import { QObject } from './IQubit';

interface IGate extends ICopy<IGate> {
    interchangeableQubitIndices: number[][];
    equal(other: IGate): boolean;
    getMerged(other: IGate): IGate;
    getInverse(): IGate;
    or(q: QObject): void;

    texString?: () => string;
}

interface IMathGate extends IGate {
    a: number;
    N: number;
    angle: number;
    matrix: Matrix;
    hamiltonian: any;
}

type GateClass = new (...args: any[]) => IGate;

export { IGate, IMathGate, GateClass };
