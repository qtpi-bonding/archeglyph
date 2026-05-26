// SPDX-License-Identifier: AGPL-3.0-or-later
import { createContext, useContext } from 'solid-js';

export enum ElementKind {
  NODE,
  EDGE,
  GROUP,
  ANNOTATION,
}

export interface SelectedElement {
  id: string;
  kind: ElementKind;
}

export interface SelectionState {
  selected(): SelectedElement | null;
  setSelected(element: SelectedElement | null): void;
}

/** Solid Context object. Canvas provides a SelectionState value via
 * <SelectionContext.Provider>. Consumers call useSelection() — do not
 * call useContext(SelectionContext) directly. */
export const SelectionContext = createContext<SelectionState>();

export function useSelection(): SelectionState {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be called within a Canvas subtree');
  return ctx;
}
