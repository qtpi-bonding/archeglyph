// SPDX-License-Identifier: MPL-2.0

import { Component, JSX } from 'solid-js';
import type { TextFieldProps } from './color_field';

export interface EnumFieldProps extends TextFieldProps {
  /** Values offered by the enum, in display order. */
  options: string[];
}

function emptyOptionLabel(effective: string | undefined): string {
  if (effective === undefined) {
    return 'Default';
  }
  return `Default (${effective})`;
}

export const EnumFieldInput: Component<EnumFieldProps> = (
  props: EnumFieldProps,
): JSX.Element => {
  const handleChange = (event: Event): void => {
    const value: string = (event.currentTarget as HTMLSelectElement).value;
    props.onCommit(value === '' ? undefined : value);
  };

  const selectedValue = (): string => {
    if (props.field.mixed) {
      return '__mixed__';
    }
    if (props.field.override !== undefined) {
      return props.field.override;
    }
    return '';
  };

  return (
    <label>
      <span>{props.label}</span>
      <select value={selectedValue()} onChange={handleChange}>
        {props.field.mixed && (
          <option value="__mixed__" disabled>
            Mixed
          </option>
        )}
        <option value="">{emptyOptionLabel(props.field.effective)}</option>
        {props.options.map((option: string) => (
          <option value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
};
