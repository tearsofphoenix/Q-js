/*
 * Copyright (c) 2018 Isaac Phoenix (tearsofphoenix@icloud.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { IQureg } from '@/interfaces';
import { BasicGate } from './BasicGate';
/**
Defines the BasicGate class, the base class of all gates, the
BasicRotationGate class, the SelfInverseGate, the FastForwardingGate, the
ClassicalInstruction gate, and the BasicMathGate class.

Gates overload the | operator to allow the following syntax:

 @example
Gate | (qureg1, qureg2, qureg2)
Gate | (qureg, qubit)
Gate | qureg
Gate | qubit
Gate | (qubit,)

This means that for more than one quantum argument (right side of | ), a tuple
needs to be made explicitely, while for one argument it is optional.
*/

/**
 * @class BasicMathGate
 * @desc
Base class for all math gates.

    It allows efficient emulation by providing a mathematical representation
which is given by the concrete gate which derives from this base class.
The AddConstant gate, for example, registers a function of the form

 @example

function add(x)
return (x+a,)

upon initialization. More generally, the function takes integers as
parameters and returns a tuple / list of outputs, each entry corresponding
to the function input. As an example, consider out-of-place
multiplication, which takes two input registers and adds the result into a
third, i.e., (a,b,c) -> (a,b,c+a*b). The corresponding function then is

 @example

function multiply(a,b,c)
return (a,b,c+a*b)
 */
export class BasicMathGate extends BasicGate {
  mathFunc: Function;
  /**
    Initialize a BasicMathGate by providing the mathematical function that it implements.

    @param mathFunc Function which takes as many int values as
input, as the gate takes registers. For each of these values,
    it then returns the output (i.e., it returns a list/tuple of
output values).

@example

function add(a,b)
return (a,a+b)
BasicMathGate.__init__(self, add)

If the gate acts on, e.g., fixed point numbers, the number of bits per
register is also required in order to describe the action of such a
mathematical gate. For this reason, there is

   @example

BasicMathGate.get_math_function(qubits)

which can be overwritten by the gate deriving from BasicMathGate.

    @example

function get_math_function(self, qubits)
n = len(qubits[0])
scal = 2.**n
function math_fun(a)
return (int(scal * (math.sin(math.pi * a / scal))),)
return math_fun
     */
  constructor(mathFunc: Function) {
    super();
    this.mathFunc = (x: any) => Array.from(mathFunc(...x));
  }

  /**
    Return the math function which corresponds to the action of this math
gate, given the input to the gate (a tuple of quantum registers).

  @param {Array.<Qureg>} qubits Qubits to which the math gate is being applied.

    @return {function} javascript function describing the action of this
    gate. (See BasicMathGate.constructor for an example).
   */
  getMathFunction(qubits: IQureg[]) {
    return this.mathFunc;
  }

  toString() {
    return 'MATH'
  }
}
