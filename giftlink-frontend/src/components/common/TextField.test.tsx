import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TextField from './TextField';

describe('<TextField />', () => {
  it('labels the control and links help text', () => {
    render(
      <TextField
        id="pw"
        label="Password"
        help="At least 8 characters."
        value=""
        onChange={() => undefined}
      />,
    );
    const input = screen.getByLabelText('Password');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAccessibleDescription('At least 8 characters.');
  });

  it('announces errors to assistive technology', () => {
    render(
      <TextField
        id="email"
        label="Email"
        error="Email is required"
        value=""
        onChange={() => undefined}
      />,
    );
    const input = screen.getByLabelText('Email');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('is-invalid');
    expect(input).toHaveAccessibleDescription('Email is required');
  });
});
