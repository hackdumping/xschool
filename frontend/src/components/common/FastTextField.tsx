import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

/**
 * FastTextField is a drop-in replacement for MUI's TextField.
 * It manages its own internal state for every keystroke to completely eliminate 
 * typing lag (re-renders) in large parent components (like DataGrids or complex pages).
 * The parent's onChange is ONLY triggered when the user finishes typing (onBlur).
 */
export const FastTextField = (props: TextFieldProps) => {
  const { value, onChange, onBlur, ...rest } = props;
  const [localValue, setLocalValue] = useState(value || '');

  // Sync with parent when parent's value changes externally
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Only pass the event to the parent if the value actually changed
    if (onChange && localValue !== value) {
      // We must synthesize an event-like object because React 17+ pools events,
      // but in generic setups it's safer to just pass the original event and let the parent read e.target.value.
      // However, e.target.value is already correct on blur.
      onChange(e as any);
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <TextField
      {...rest}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
