import { ClassicalInstructionGate, FastForwardingGate } from '../basics';

export let Deallocate: DeallocateQubitGate;

export class AllocateQubitGate extends ClassicalInstructionGate {
    toString() {
        return 'Allocate'
    }

    getInverse() {
        return Deallocate
    }
}

// Shortcut (instance of) `AllocateQubitGate`
export const Allocate = new AllocateQubitGate()

export class DeallocateQubitGate extends FastForwardingGate {
    toString() {
        return 'Deallocate'
    }

    getInverse() {
        return Allocate
    }
}

// Shortcut (instance of) `DeallocateQubitGate`
Deallocate = new DeallocateQubitGate()


export class AllocateDirtyQubitGate extends ClassicalInstructionGate {
    toString() {
        return 'AllocateDirty'
    }

    getInverse() {
        return Deallocate
    }
}

// Shortcut (instance of) AllocateDirtyQubitGate
export const AllocateDirty = new AllocateDirtyQubitGate()
