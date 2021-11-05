
import { IEngine } from './IEngine';

interface IQubit {
    engine: IEngine;
    id: number;

    weakCopy(): IQubit;

    deallocate(): void;
}

interface IQureg extends Array<IQubit> {

}

type QObject = IQubit | IQubit[] | IQureg | IQureg[];

export { IQubit, IQureg, QObject };
