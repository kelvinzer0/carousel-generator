import React, { useMemo } from "react";

interface DecorativeEmojisProps {
  emojis: string[];
  className?: string;
}

/**
 * Renders emojis as decorative background elements at random positions.
 * Each emoji gets a random position, size, rotation, and opacity.
 */
export function DecorativeEmojis({ emojis, className = "" }: DecorativeEmojisProps) {
  const positions = useMemo(() => {
    // Use a seeded random based on emoji content for consistent positions
    const seed = emojis.join("").length;
    let seedVal = seed;

    const seededRandom = () => {
      seedVal = (seedVal * 16807 + 0) % 2147483647;
      return (seedVal - 1) / 2147483646;
    };

    return emojis.map((emoji, i) => {
      const x = seededRandom() * 90 + 5; // 5% to 95%
      const y = seededRandom() * 85 + 5; // 5% to 90%
      const size = seededRandom() * 32 + 24; // 24px to 56px
      const rotation = seededRandom() * 60 - 30; // -30deg to 30deg
      const opacity = seededRandom() * 0.15 + 0.05; // 0.05 to 0.20

      return {
        emoji,
        x,
        y,
        size,
        rotation,
        opacity,
      };
    });
  }, [emojis]);

  if (!emojis || emojis.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {positions.map((pos, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            fontSize: `${pos.size}px`,
            transform: `rotate(${pos.rotation}deg)`,
            opacity: pos.opacity,
            lineHeight: 1,
          }}
        >
          {pos.emoji}
        </span>
      ))}
    </div>
  );
}
