// SPDX-License-Identifier: MPL-2.0

/**
 * `Object.assign(new Foo(), {...})`, with the fields actually checked.
 *
 * Never use `Object.assign` to build one of these: it is typed
 * `(target: T, source: U) => T & U`, so U is never checked against T.
 */
export function init<T extends object>(target: T, source: Partial<T>): T {
  return Object.assign(target, source);
}
