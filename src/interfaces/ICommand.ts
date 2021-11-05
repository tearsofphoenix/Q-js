import { IGate } from './IGate';
import { IQubit, IQureg } from './IQubit';
import { IEngine } from './IEngine';

interface ICommand {
    gate: IGate;
    tags: any[];
    qubits: IQureg[];
    controlQubits: IQubit[];
    engine: IEngine;
    allQubits: IQubit[];
    controlCount: number;
    addControlQubits(qubits: IQubit[]): void;
    apply(): void;
    getInverse(): ICommand;
    copy(): ICommand;
}

type CommandModifyFunction = (cmd: ICommand) => ICommand;

export { ICommand, CommandModifyFunction };
