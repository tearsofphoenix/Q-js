
import { BasicGate } from '../basics';

export let Barrier: BasicGate;

export class BarrierGate extends BasicGate {
    toString() {
        return 'Barrier';
    }

    getInverse() {
        return Barrier;
    }
}

// Shortcut (instance of) BarrierGate
Barrier = new BarrierGate();