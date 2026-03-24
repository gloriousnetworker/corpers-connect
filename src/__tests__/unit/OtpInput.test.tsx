import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpInput from '@/components/auth/OtpInput';

describe('OtpInput', () => {
  const setup = (value = '', onChange = jest.fn()) => {
    const utils = render(
      <OtpInput value={value} onChange={onChange} autoFocus={false} />
    );
    const inputs = screen.getAllByRole('textbox');
    return { ...utils, inputs, onChange };
  };

  it('renders 6 input boxes by default', () => {
    const { inputs } = setup();
    expect(inputs).toHaveLength(6);
  });

  it('renders custom length', () => {
    const { getAllByRole } = render(
      <OtpInput value="" onChange={jest.fn()} length={4} autoFocus={false} />
    );
    expect(getAllByRole('textbox')).toHaveLength(4);
  });

  it('displays digits in correct boxes', () => {
    const { inputs } = setup('1234');
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('4');
    expect(inputs[4]).toHaveValue('');
  });

  it('calls onChange with new digit', async () => {
    const onChange = jest.fn();
    const { inputs } = setup('', onChange);
    await userEvent.type(inputs[0], '5');
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('ignores non-numeric input', async () => {
    const onChange = jest.fn();
    const { inputs } = setup('', onChange);
    await userEvent.type(inputs[0], 'a');
    // onChange may be called with empty string, but never with a letter
    const calls = onChange.mock.calls.map((c) => c[0]);
    expect(calls.every((v: string) => /^\d*$/.test(v))).toBe(true);
  });

  it('handles paste to fill all boxes', () => {
    const onChange = jest.fn();
    const { inputs } = setup('', onChange);
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '123456' },
    });
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('applies error styling when error prop is true', () => {
    render(<OtpInput value="" onChange={jest.fn()} error autoFocus={false} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input.className).toContain('border-danger');
    });
  });

  it('disables all inputs when disabled', () => {
    const { unmount } = render(
      <OtpInput value="" onChange={jest.fn()} disabled autoFocus={false} />
    );
    const disabledInputs = screen.getAllByRole('textbox');
    disabledInputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
    unmount();
  });
});
