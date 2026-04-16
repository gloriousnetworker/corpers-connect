'use client';

import { useUIStore } from '@/store/ui.store';

interface HashtagTextProps {
  content: string;
  className?: string;
}

/**
 * Renders post text with #hashtags as tappable links.
 * Tapping a hashtag navigates to Discover → hashtag feed.
 */
export default function HashtagText({ content, className }: HashtagTextProps) {
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setHashtag = useUIStore((s) => s.setHashtag);

  // Split content into plain text + hashtag segments
  const parts = content.split(/(#[a-zA-Z][a-zA-Z0-9_]{0,49})/g);

  const handleHashtag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    setHashtag(tag.slice(1).toLowerCase()); // strip the # and lowercase
    setActiveSection('discover');
  };

  return (
    <p className={className}>
      {parts.map((part, i) =>
        /^#[a-zA-Z][a-zA-Z0-9_]{0,49}$/.test(part) ? (
          <button
            key={i}
            onClick={(e) => handleHashtag(e, part)}
            className="text-primary font-semibold hover:underline focus:outline-none"
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
