
import { FastForwardingGate } from '../basics';
/**
 * @class FlushGate
 * @desc
Flush gate (denotes the end of the circuit).

Note:
    All compiler engines (cengines) which cache/buffer gates are obligated
to flush and send all gates to the next compiler engine (followed by
the flush command).

Note:
    This gate is sent when calling

 @example

eng.flush()

on the MainEngine `eng`.

 */
export class FlushGate extends FastForwardingGate {
    toString() {
        return ''
    }
}
