
import { ICommand } from './ICommand';
import { IQubit, IQureg } from './IQubit';

interface IEngine {
    isLastEngine: boolean;
    main: IEngine;
    next: IEngine;
    dirtyQubits: Set<number>;
    activeQubits: Set<IQubit>;
    isAvailable(cmd: ICommand): boolean;
    getNewQubitID(): number;
    receive(command: ICommand[]): void;
    isMetaTagHandler?: (metaTag: Function) => boolean;

    getMeasurementResult(qubit: IQubit): boolean;
    allocateQubit(dirty?: boolean): IQureg;
    allocateQureg(n: number): IQureg;

    deallocateQubit(qubit: IQubit): void;

    isMetaTagSupported(tag: any): boolean;

    autoDeallocateQubits?: () => void;
}

export { IEngine };
