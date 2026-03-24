import React from 'react';
import { render } from '@testing-library/react';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';

describe('PostCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PostCardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('has animate-pulse class', () => {
    const { container } = render(<PostCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders skeleton avatar placeholder', () => {
    const { container } = render(<PostCardSkeleton />);
    // Avatar is a skeleton div rounded-full
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
