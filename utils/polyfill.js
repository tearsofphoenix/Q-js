import mathjs from 'mathjs'

/*
    @return {bool}
 */
export function isNumeric(value) {
  return (typeof value === 'number' || value instanceof mathjs.complex)
}
