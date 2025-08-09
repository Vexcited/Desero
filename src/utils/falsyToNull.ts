/**
 * Automatically cast [falsy](https://developer.mozilla.org/docs/Glossary/Falsy)
 * values to `null`.
 *
 * @example
 * falsyToNull(false) // null
 * falsyToNull(NaN) // null
 * falsyToNull("") // null
 * falsyToNull(0) // null
 *
 * // If not falsy, it returns the value, of course.
 * falsyToNull("Hello") // "Hello"
 * falsyToNull(1) // 1
 */
export const falsyToNull = <T>(any: T): null | T => any || null;
