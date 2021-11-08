
import { IEngine } from './IEngine';

interface ISimulator extends IEngine {
    run(): void;
}

export { ISimulator };
