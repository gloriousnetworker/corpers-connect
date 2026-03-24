import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from '@/components/auth/PasswordInput';

describe('PasswordInput', () => {
  it('renders as password type by default', () => {
    const { container } = render(<PasswordInput />);
    const pwInput = container.querySelector('input') as HTMLInputElement;
    expect(pwInput?.type).toBe('password');
  });

  it('toggles visibility when eye button is clicked', async () => {
    const { container } = render(<PasswordInput />);
    const toggle = screen.getByRole('button', { name: /show password/i });
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('password');
    await userEvent.click(toggle);
    expect(input.type).toBe('text');

    await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input.type).toBe('password');
  });

  it('shows strength indicator when showStrength is true', () => {
    render(<PasswordInput showStrength value="MyP@ss1word" />);
    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
  });

  it('does not show strength indicator without showStrength prop', () => {
    render(<PasswordInput value="MyP@ss1word" />);
    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
  });

  it('shows Weak for short passwords', () => {
    render(<PasswordInput showStrength value="abc" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows Strong for complex passwords', () => {
    render(<PasswordInput showStrength value="MyStr0ng!Pass" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('does not show strength bar when password is empty', () => {
    render(<PasswordInput showStrength value="" />);
    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
  });
});
