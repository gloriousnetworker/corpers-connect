'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <div className="flex items-center gap-1 bg-surface border border-border rounded-2xl rounded-bl-sm px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-foreground-muted animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
          />
        ))}
      </div>
    </div>
  );
}
