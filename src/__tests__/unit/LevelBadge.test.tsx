import React from 'react';
import { render, screen } from '@testing-library/react';
import LevelBadge from '@/components/profile/LevelBadge';
import { UserLevel } from '@/types/enums';

describe('LevelBadge', () => {
  it('renders Otondo label', () => {
    render(<LevelBadge level={UserLevel.OTONDO} />);
    expect(screen.getByText('Otondo')).toBeInTheDocument();
  });

  it('renders Kopa label', () => {
    render(<LevelBadge level={UserLevel.KOPA} />);
    expect(screen.getByText('Kopa')).toBeInTheDocument();
  });

  it('renders Corper label', () => {
    render(<LevelBadge level={UserLevel.CORPER} />);
    expect(screen.getByText('Corper')).toBeInTheDocument();
  });

  it('applies sm size classes (default)', () => {
    const { container } = render(<LevelBadge level={UserLevel.KOPA} />);
    expect(container.innerHTML).toContain('text-[10px]');
  });

  it('applies md size classes when size=md', () => {
    const { container } = render(<LevelBadge level={UserLevel.KOPA} size="md" />);
    expect(container.innerHTML).toContain('text-xs');
  });
});
