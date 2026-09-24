// SPDX-License-Identifier: MPL-2.0

export type Option<T> = T | null;

export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> { readonly kind: "ok"; readonly value: T; }
export interface Err<E> { readonly kind: "err"; readonly error: E; }

export function Some<T>(value: T): Option<T> { return value; }
export function Ok<T>(value: T): Ok<T> { return { kind: "ok", value }; }
export function Err<E>(error: E): Err<E> { return { kind: "err", error }; }
