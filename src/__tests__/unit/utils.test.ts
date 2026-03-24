import {
  cn,
  formatPrice,
  formatCount,
  getInitials,
  maskEmail,
  formatRelativeTime,
} from '@/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('merges conflicting tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('formatPrice()', () => {
  it('converts kobo to naira', () => {
    expect(formatPrice(150000)).toBe('₦1,500');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('₦0');
  });

  it('formats large amounts', () => {
    expect(formatPrice(1400000)).toBe('₦14,000');
  });
});

describe('formatCount()', () => {
  it('returns raw number under 1000', () => {
    expect(formatCount(999)).toBe('999');
  });

  it('abbreviates thousands', () => {
    expect(formatCount(1500)).toBe('1.5K');
  });

  it('abbreviates millions', () => {
    expect(formatCount(2000000)).toBe('2M');
  });
});

describe('getInitials()', () => {
  it('returns two-letter initials', () => {
    expect(getInitials('Tunde', 'Adeyemi')).toBe('TA');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('john', 'doe')).toBe('JD');
  });
});

describe('maskEmail()', () => {
  it('masks email address keeping first 2 chars', () => {
    const masked = maskEmail('tunde@gmail.com');
    expect(masked).toMatch(/^tu\*+@gmail\.com$/);
  });

  it('returns input if no @ sign', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
  });
});

describe('formatRelativeTime()', () => {
  it('returns a non-empty string for any valid date', () => {
    const result = formatRelativeTime(new Date(Date.now() - 10000).toISOString());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a string containing minutes for ~5min ago', () => {
    const result = formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000).toISOString());
    expect(result).toMatch(/minute/);
  });

  it('returns a string containing hours for ~3h ago', () => {
    const result = formatRelativeTime(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString());
    expect(result).toMatch(/hour/);
  });

  it('returns empty string for invalid date', () => {
    const result = formatRelativeTime('not-a-date');
    expect(result).toBe('');
  });
});
