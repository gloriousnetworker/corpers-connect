import React from 'react';
import { render, screen } from '@testing-library/react';
import StoryProgress from '@/components/stories/StoryProgress';

describe('StoryProgress', () => {
  it('renders the correct number of progress bars', () => {
    const { container } = render(<StoryProgress count={3} activeIndex={0} progress={0.5} />);
    // Each bar is a flex-1 div inside the progressbar
    const bars = container.querySelectorAll('.flex-1');
    expect(bars).toHaveLength(3);
  });

  it('fills completed bars fully', () => {
    const { container } = render(<StoryProgress count={3} activeIndex={2} progress={0.3} />);
    const fills = container.querySelectorAll('.h-full.bg-white');
    // bars 0 and 1 should be 100%, bar 2 should be 30%
    expect((fills[0] as HTMLElement).style.width).toBe('100%');
    expect((fills[1] as HTMLElement).style.width).toBe('100%');
    expect((fills[2] as HTMLElement).style.width).toBe('30%');
  });

  it('renders a single bar for single story', () => {
    const { container } = render(<StoryProgress count={1} activeIndex={0} progress={0.7} />);
    const bars = container.querySelectorAll('.flex-1');
    expect(bars).toHaveLength(1);
  });

  it('sets aria-valuenow correctly', () => {
    render(<StoryProgress count={4} activeIndex={1} progress={0} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');
  });

  it('leaves future bars empty', () => {
    const { container } = render(<StoryProgress count={3} activeIndex={0} progress={0} />);
    const fills = container.querySelectorAll('.h-full.bg-white');
    // bar 0 is active with 0 progress, bars 1 and 2 are 0%
    expect((fills[1] as HTMLElement).style.width).toBe('0%');
    expect((fills[2] as HTMLElement).style.width).toBe('0%');
  });
});
