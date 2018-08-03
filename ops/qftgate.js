import {BasicGate} from './basics'

/*
Quantum Fourier Transform gate
 */
export default class QFTGate extends BasicGate {
  toString() {
    return 'QFT'
  }
}

export const QFT = new QFTGate()

// Shortcut (instance of) :class:`projectq.ops.QFTGate`
QFTGate.QFT = QFT
