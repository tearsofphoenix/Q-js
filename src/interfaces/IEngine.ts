
import { ICommand } from './ICommand';
import { IQubit } from './IQubit';

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
    allocateQubit(): IQubit;
    deallocateQubit(qubit: IQubit): void;
}

export { IEngine };
