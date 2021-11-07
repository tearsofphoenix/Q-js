
import { IEngine } from './IEngine';

interface IQubit {
    engine: IEngine;
    id: number;

    toNumber(): number;
    toBoolean(): boolean;

    weakCopy(): IQubit;

    deallocate(): void;
}

interface IQureg extends Array<IQubit> {
    toNumber(): number;
    add(other: IQubit[] | IQureg): IQureg;
    deallocate(): void;
}

type QObject = IQubit | IQubit[] | IQureg | IQureg[];

export { IQubit, IQureg, QObject };
