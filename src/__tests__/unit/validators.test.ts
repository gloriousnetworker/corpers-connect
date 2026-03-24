import {
  loginSchema,
  registerInitiateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validators';

describe('loginSchema', () => {
  it('passes with valid email and password', () => {
    expect(() =>
      loginSchema.parse({ identifier: 'user@email.com', password: 'secret' })
    ).not.toThrow();
  });

  it('passes with state code identifier', () => {
    expect(() =>
      loginSchema.parse({ identifier: 'LA/23A/1234', password: 'secret' })
    ).not.toThrow();
  });

  it('fails when identifier is empty', () => {
    const result = loginSchema.safeParse({ identifier: '', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('fails when password is empty', () => {
    const result = loginSchema.safeParse({ identifier: 'user@email.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerInitiateSchema', () => {
  const validPayload = {
    stateCode: 'LA/23A/1234',
    password: 'MyP@ss1word',
    confirmPassword: 'MyP@ss1word',
  };

  it('passes with valid data', () => {
    expect(() => registerInitiateSchema.parse(validPayload)).not.toThrow();
  });

  it('fails with invalid state code format', () => {
    const result = registerInitiateSchema.safeParse({
      ...validPayload,
      stateCode: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('fails with weak password', () => {
    const result = registerInitiateSchema.safeParse({
      ...validPayload,
      password: 'weakpass',
      confirmPassword: 'weakpass',
    });
    expect(result.success).toBe(false);
  });

  it('fails when passwords do not match', () => {
    const result = registerInitiateSchema.safeParse({
      ...validPayload,
      confirmPassword: 'DifferentPass1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.errors.map((e) => e.path.join('.'));
      expect(fields).toContain('confirmPassword');
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('passes with valid email', () => {
    expect(() =>
      forgotPasswordSchema.parse({ email: 'user@email.com' })
    ).not.toThrow();
  });

  it('fails with invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'notanemail' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const validPayload = {
    otpToken: 'token123',
    otp: '123456',
    newPassword: 'MyP@ss1word',
    confirmPassword: 'MyP@ss1word',
  };

  it('passes with valid data', () => {
    expect(() => resetPasswordSchema.parse(validPayload)).not.toThrow();
  });

  it('fails with non-numeric OTP', () => {
    const result = resetPasswordSchema.safeParse({
      ...validPayload,
      otp: 'abcdef',
    });
    expect(result.success).toBe(false);
  });

  it('fails with OTP that is not 6 digits', () => {
    const result = resetPasswordSchema.safeParse({
      ...validPayload,
      otp: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('fails when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({
      ...validPayload,
      confirmPassword: 'WrongPass1!',
    });
    expect(result.success).toBe(false);
  });
});
