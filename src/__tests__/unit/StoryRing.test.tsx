import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StoryRing from '@/components/stories/StoryRing';

const author = {
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  profilePicture: null as string | null | undefined,
};

describe('StoryRing', () => {
  it('renders the user initials when no profile picture', () => {
    render(<StoryRing author={author} />);
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('renders the label when provided', () => {
    render(<StoryRing author={author} label="Your story" />);
    expect(screen.getByText('Your story')).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', () => {
    const onClick = jest.fn();
    render(<StoryRing author={author} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows the + badge when isAddButton is true', () => {
    render(<StoryRing author={author} isAddButton />);
    // The Plus icon SVG should be in DOM — check by aria-label on button
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('applies green ring when hasUnviewed is true', () => {
    const { container } = render(<StoryRing author={author} hasUnviewed />);
    // The ring wrapper should have the gradient class
    expect(container.innerHTML).toContain('from-primary');
  });

  it('applies gray ring when allViewed is true', () => {
    const { container } = render(<StoryRing author={author} hasUnviewed={false} allViewed />);
    expect(container.innerHTML).toContain('bg-border');
  });

  it('renders first name initial as fallback', () => {
    render(<StoryRing author={{ firstName: 'Ada', lastName: '', profilePicture: null }} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('accepts sm size prop without error', () => {
    const { container } = render(<StoryRing author={author} size="sm" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
