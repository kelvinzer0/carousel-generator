/**
 * Emoji → Font Awesome icon mapping.
 * Maps common emoji/unicode pictographs to Font Awesome icon classes.
 */

export interface EmojiMapping {
  emoji: string;
  name: string;
  faClass: string; // FA CSS class name (e.g., "fa-heart")
  unicode: string; // FA unicode char
}

// Emoji → FA mapping (curated top 100+)
const EMOJI_MAP: Record<string, Omit<EmojiMapping, "emoji">> = {
  "❤️": { name: "heart", faClass: "fa-heart", unicode: "\uf004" },
  "🔥": { name: "fire", faClass: "fa-fire", unicode: "\uf06d" },
  "⭐": { name: "star", faClass: "fa-star", unicode: "\uf005" },
  "✨": { name: "sparkles", faClass: "fa-star", unicode: "\uf005" },
  "⚡": { name: "zap", faClass: "fa-bolt", unicode: "\uf0e7" },
  "💎": { name: "gem", faClass: "fa-gem", unicode: "\uf3a5" },
  "👑": { name: "crown", faClass: "fa-crown", unicode: "\uf521" },
  "🏆": { name: "trophy", faClass: "fa-trophy", unicode: "\uf091" },
  "🎯": { name: "dart", faClass: "fa-bullseye", unicode: "\uf140" },
  "🚀": { name: "rocket", faClass: "fa-rocket", unicode: "\uf135" },
  "💡": { name: "bulb", faClass: "fa-lightbulb", unicode: "\uf0eb" },
  "🔑": { name: "key", faClass: "fa-key", unicode: "\uf084" },
  "🔒": { name: "lock", faClass: "fa-lock", unicode: "\uf023" },
  "🔗": { name: "link", faClass: "fa-link", unicode: "\uf0c1" },
  "📌": { name: "pin", faClass: "fa-thumbtack", unicode: "\uf08d" },
  "💰": { name: "money", faClass: "fa-sack-dollar", unicode: "\uf81d" },
  "📊": { name: "chart", faClass: "fa-chart-bar", unicode: "\uf080" },
  "📈": { name: "chart-up", faClass: "fa-chart-line", unicode: "\uf201" },
  "🎨": { name: "art", faClass: "fa-palette", unicode: "\uf53f" },
  "✏️": { name: "pencil", faClass: "fa-pencil", unicode: "\uf303" },
  "📝": { name: "memo", faClass: "fa-pen-to-square", unicode: "\uf044" },
  "📖": { name: "book", faClass: "fa-book", unicode: "\uf02d" },
  "💬": { name: "speech", faClass: "fa-comment", unicode: "\uf075" },
  "📢": { name: "megaphone", faClass: "fa-bullhorn", unicode: "\uf0a1" },
  "🔔": { name: "bell", faClass: "fa-bell", unicode: "\uf0f3" },
  "🎁": { name: "gift", faClass: "fa-gift", unicode: "\uf06b" },
  "🛒": { name: "cart", faClass: "fa-cart-shopping", unicode: "\uf07a" },
  "🏠": { name: "house", faClass: "fa-house", unicode: "\uf015" },
  "💻": { name: "laptop", faClass: "fa-laptop", unicode: "\uf109" },
  "📱": { name: "mobile", faClass: "fa-mobile", unicode: "\uf10b" },
  "⚙️": { name: "gear", faClass: "fa-gear", unicode: "\uf013" },
  "🔧": { name: "wrench", faClass: "fa-wrench", unicode: "\uf0ad" },
  "🔨": { name: "hammer", faClass: "fa-hammer", unicode: "\uf6e3" },
  "✅": { name: "check", faClass: "fa-circle-check", unicode: "\uf058" },
  "❌": { name: "cross", faClass: "fa-circle-xmark", unicode: "\uf057" },
  "⚠️": { name: "warning", faClass: "fa-triangle-exclamation", unicode: "\uf071" },
  "❗": { name: "exclamation", faClass: "fa-exclamation", unicode: "\uf12a" },
  "❓": { name: "question", faClass: "fa-question", unicode: "\uf128" },
  "💯": { name: "100", faClass: "fa-hundred-points", unicode: "\uf896" },
  "👍": { name: "thumbs-up", faClass: "fa-thumbs-up", unicode: "\uf164" },
  "👎": { name: "thumbs-down", faClass: "fa-thumbs-down", unicode: "\uf165" },
  "👏": { name: "clap", faClass: "fa-hands-clapping", unicode: "\uf817" },
  "🙏": { name: "pray", faClass: "fa-hands-praying", unicode: "\uf684" },
  "💪": { name: "muscle", faClass: "fa-hand-fist", unicode: "\uf6de" },
  "🤝": { name: "handshake", faClass: "fa-handshake", unicode: "\uf2b5" },
  "😀": { name: "grinning", faClass: "fa-face-smile", unicode: "\uf581" },
  "😂": { name: "joy", faClass: "fa-face-laugh-beam", unicode: "\uf59b" },
  "😍": { name: "heart-eyes", faClass: "fa-face-heart-eyes", unicode: "\uf7df" },
  "🤔": { name: "thinking", faClass: "fa-face-thinking", unicode: "\uf5c4" },
  "😎": { name: "cool", faClass: "fa-face-smile", unicode: "\uf581" },
  "😢": { name: "cry", faClass: "fa-face-sad-tear", unicode: "\uf5b4" },
  "😡": { name: "angry", faClass: "fa-face-angry", unicode: "\uf556" },
  "💀": { name: "skull", faClass: "fa-skull", unicode: "\uf54c" },
  "👻": { name: "ghost", faClass: "fa-ghost", unicode: "\uf6e2" },
  "🤖": { name: "robot", faClass: "fa-robot", unicode: "\uf544" },
  "🐶": { name: "dog", faClass: "fa-dog", unicode: "\uf6d3" },
  "🐱": { name: "cat", faClass: "fa-cat", unicode: "\uf6c0" },
  "🦊": { name: "fox", faClass: "fa-fox", unicode: "\uf813" },
  "🐸": { name: "frog", faClass: "fa-frog", unicode: "\uf6e8" },
  "🐝": { name: "bee", faClass: "fa-bug", unicode: "\uf188" },
  "🦋": { name: "butterfly", faClass: "fa-bug", unicode: "\uf188" },
  "🌸": { name: "blossom", faClass: "fa-seedling", unicode: "\uf4d8" },
  "🌹": { name: "rose", faClass: "fa-seedling", unicode: "\uf4d8" },
  "🌿": { name: "herb", faClass: "fa-leaf", unicode: "\uf06c" },
  "🍀": { name: "four-leaf", faClass: "fa-leaf", unicode: "\uf06c" },
  "🍁": { name: "maple", faClass: "fa-leaf", unicode: "\uf06c" },
  "🌴": { name: "palm", faClass: "fa-tree-palm", unicode: "\uf82b" },
  "🌳": { name: "tree", faClass: "fa-tree", unicode: "\uf1bb" },
  "🍎": { name: "apple", faClass: "fa-apple-whole", unicode: "\uf5d1" },
  "🍕": { name: "pizza", faClass: "fa-pizza-slice", unicode: "\uf818" },
  "🍔": { name: "burger", faClass: "fa-burger", unicode: "\uf805" },
  "☕": { name: "coffee", faClass: "fa-mug-hot", unicode: "\uf7b6" },
  "🍺": { name: "beer", faClass: "fa-beer-mug-empty", unicode: "\uf0fc" },
  "🍷": { name: "wine", faClass: "fa-wine-glass", unicode: "\uf4e3" },
  "⚽": { name: "soccer", faClass: "fa-futbol", unicode: "\uf1e3" },
  "🏀": { name: "basketball", faClass: "fa-basketball", unicode: "\uf434" },
  "🎮": { name: "gamepad", faClass: "fa-gamepad", unicode: "\uf11b" },
  "🎲": { name: "dice", faClass: "fa-dice", unicode: "\uf522" },
  "🎵": { name: "music", faClass: "fa-music", unicode: "\uf001" },
  "🎸": { name: "guitar", faClass: "fa-guitar", unicode: "\uf7a6" },
  "🎤": { name: "mic", faClass: "fa-microphone", unicode: "\uf130" },
  "🎧": { name: "headphones", faClass: "fa-headphones", unicode: "\uf025" },
  "🎬": { name: "clapper", faClass: "fa-clapperboard", unicode: "\uf846" },
  "✈️": { name: "airplane", faClass: "fa-plane", unicode: "\uf072" },
  "🚗": { name: "car", faClass: "fa-car", unicode: "\uf1b9" },
  "⚓": { name: "anchor", faClass: "fa-anchor", unicode: "\uf13d" },
  "🌍": { name: "globe", faClass: "fa-globe", unicode: "\uf0ac" },
  "☀️": { name: "sun", faClass: "fa-sun", unicode: "\uf185" },
  "🌙": { name: "moon", faClass: "fa-moon", unicode: "\uf186" },
  "🌈": { name: "rainbow", faClass: "fa-rainbow", unicode: "\uf8bc" },
  "❄️": { name: "snowflake", faClass: "fa-snowflake", unicode: "\uf2dc" },
  "🌊": { name: "wave", faClass: "fa-water", unicode: "\uf773" },
  "💧": { name: "droplet", faClass: "fa-droplet", unicode: "\uf043" },
  "♻️": { name: "recycle", faClass: "fa-recycle", unicode: "\uf1b8" },
  "🚩": { name: "flag", faClass: "fa-flag", unicode: "\uf024" },
  "🎉": { name: "party", faClass: "fa-champagne-glass", unicode: "\uf79e" },
  "🎊": { name: "confetti", faClass: "fa-champagne-glass", unicode: "\uf79e" },
  "🎀": { name: "ribbon", faClass: "fa-ribbon", unicode: "\uf837" },
  "🔴": { name: "red-circle", faClass: "fa-circle", unicode: "\uf111" },
  "🟢": { name: "green-circle", faClass: "fa-circle", unicode: "\uf111" },
  "🔵": { name: "blue-circle", faClass: "fa-circle", unicode: "\uf111" },
  "🌟": { name: "glowing-star", faClass: "fa-star", unicode: "\uf005" },
  "💫": { name: "dizzy", faClass: "fa-star", unicode: "\uf005" },
  "💥": { name: "boom", faClass: "fa-explosion", unicode: "\uf666" },
  "💤": { name: "zzz", faClass: "fa-zzz", unicode: "\uf880" },
  "👁️": { name: "eye", faClass: "fa-eye", unicode: "\uf06e" },
  "🧠": { name: "brain", faClass: "fa-brain", unicode: "\uf5dc" },
  "🧩": { name: "puzzle", faClass: "fa-puzzle-piece", unicode: "\uf12e" },
  "🎭": { name: "theater", faClass: "fa-masks-theater", unicode: "\uf630" },
  "📅": { name: "calendar", faClass: "fa-calendar", unicode: "\uf133" },
  "✉️": { name: "envelope", faClass: "fa-envelope", unicode: "\uf0e0" },
  "📞": { name: "phone", faClass: "fa-phone", unicode: "\uf095" },
  "🔋": { name: "battery", faClass: "fa-battery-full", unicode: "\uf240" },
  "📷": { name: "camera", faClass: "fa-camera", unicode: "\uf030" },
  "💾": { name: "floppy", faClass: "fa-floppy-disk", unicode: "\uf0c7" },
  "🏷️": { name: "tag", faClass: "fa-tag", unicode: "\uf02b" },
  "📦": { name: "package", faClass: "fa-box", unicode: "\uf466" },
  "🛡️": { name: "shield", faClass: "fa-shield", unicode: "\uf132" },
  "⚖️": { name: "scales", faClass: "fa-scale-balanced", unicode: "\uf24e" },
  "🧲": { name: "magnet", faClass: "fa-magnet", unicode: "\uf076" },
  "🏅": { name: "medal", faClass: "fa-medal", unicode: "\uf5a2" },
  "💔": { name: "broken-heart", faClass: "fa-heart-crack", unicode: "\uf7a9" },
  "❣️": { name: "heart-exclaim", faClass: "fa-heart", unicode: "\uf004" },
  "💕": { name: "two-hearts", faClass: "fa-heart", unicode: "\uf004" },
  "💖": { name: "sparkling-heart", faClass: "fa-heart", unicode: "\uf004" },
  "💗": { name: "growing-heart", faClass: "fa-heart", unicode: "\uf004" },
  "💘": { name: "heart-arrow", faClass: "fa-heart", unicode: "\uf004" },
  "💝": { name: "heart-ribbon", faClass: "fa-heart", unicode: "\uf004" },
  "♥️": { name: "heart-suit", faClass: "fa-heart", unicode: "\uf004" },
  "👆": { name: "up", faClass: "fa-hand-point-up", unicode: "\uf0a6" },
  "👇": { name: "down", faClass: "fa-hand-point-down", unicode: "\uf0a7" },
  "👉": { name: "right", faClass: "fa-hand-point-right", unicode: "\uf0a4" },
  "👈": { name: "left", faClass: "fa-hand-point-left", unicode: "\uf0a5" },
  "✌️": { name: "peace", faClass: "fa-hand-peace", unicode: "\uf25b" },
  "👋": { name: "wave", faClass: "fa-hand", unicode: "\uf256" },
  "✊": { name: "fist", faClass: "fa-fist-raised", unicode: "\uf6de" },
  "👊": { name: "punch", faClass: "fa-fist-raised", unicode: "\uf6de" },
  "🙌": { name: "raised-hands", faClass: "fa-hands", unicode: "\uf255" },
  "🌎": { name: "earth", faClass: "fa-globe", unicode: "\uf0ac" },
  "🌏": { name: "earth2", faClass: "fa-globe", unicode: "\uf0ac" },
  "➕": { name: "plus", faClass: "fa-plus", unicode: "\uf067" },
  "➖": { name: "minus", faClass: "fa-minus", unicode: "\uf068" },
  "✖️": { name: "multiply", faClass: "fa-xmark", unicode: "\uf00d" },
  "▶️": { name: "play", faClass: "fa-play", unicode: "\uf04b" },
  "⏸️": { name: "pause", faClass: "fa-pause", unicode: "\uf04c" },
  "⏹️": { name: "stop", faClass: "fa-stop", unicode: "\uf04d" },
  "🔀": { name: "shuffle", faClass: "fa-shuffle", unicode: "\uf074" },
  "🔁": { name: "repeat", faClass: "fa-repeat", unicode: "\uf01e" },
  "⏮️": { name: "previous", faClass: "fa-backward-step", unicode: "\uf048" },
  "⏭️": { name: "next", faClass: "fa-forward-step", unicode: "\uf051" },
};

/**
 * Extract all emoji from a text string.
 */
export function extractEmoji(text: string): string[] {
  if (!text) return [];
  // Comprehensive emoji regex covering all Unicode emoji ranges
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  const matches = text.match(emojiRegex);
  if (!matches) return [];
  // Deduplicate
  return [...new Set(matches)];
}

/**
 * Remove all emoji from text.
 */
export function removeEmoji(text: string): string {
  if (!text) return "";
  return text
    .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map emoji to Font Awesome icon data.
 */
export function mapEmojiToFontAwesome(emoji: string): EmojiMapping | null {
  const mapping = EMOJI_MAP[emoji];
  if (!mapping) return null;
  return { emoji, ...mapping };
}

/**
 * Get all unique FA icons from a text's emoji.
 */
export function getFontAwesomeFromText(text: string): EmojiMapping[] {
  const emojiList = extractEmoji(text);
  return emojiList
    .map(mapEmojiToFontAwesome)
    .filter((m): m is EmojiMapping => m !== null);
}

/**
 * Generate a repeating canvas pattern data URL with FA icons.
 * This renders FA icons on a canvas and returns a data URL.
 */
export function generatePatternDataUrl(
  icons: EmojiMapping[],
  patternSize: number = 80,
  iconSize: number = 28,
  color: string = "#ffffff",
  opacity: number = 0.15,
  fill: "solid" | "outline" = "solid"
): string {
  if (icons.length === 0) return "";

  // Create off-screen canvas
  const canvas = document.createElement("canvas");
  canvas.width = patternSize;
  canvas.height = patternSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Clear canvas
  ctx.clearRect(0, 0, patternSize, patternSize);

  // Icon positions in a 2x2 grid within the pattern tile
  const positions = [
    { x: patternSize * 0.15, y: patternSize * 0.25 },
    { x: patternSize * 0.6, y: patternSize * 0.15 },
    { x: patternSize * 0.1, y: patternSize * 0.7 },
    { x: patternSize * 0.55, y: patternSize * 0.65 },
  ];

  // Set font - FA uses "Font Awesome 6 Free" or "Font Awesome 6 Pro"
  const fontWeight = "900";
  ctx.font = `${fontWeight} ${iconSize}px "Font Awesome 6 Free"`;

  if (fill === "solid") {
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = opacity;
  }

  // Draw each icon
  icons.slice(0, 4).forEach((icon, i) => {
    const pos = positions[i % positions.length];
    if (fill === "solid") {
      ctx.fillText(icon.unicode, pos.x, pos.y);
    } else {
      ctx.strokeText(icon.unicode, pos.x, pos.y);
    }
  });

  return canvas.toDataURL("image/png");
}

/**
 * Async version that waits for FA font to load before generating pattern.
 */
export async function generatePatternDataUrlAsync(
  icons: EmojiMapping[],
  patternSize: number = 80,
  iconSize: number = 28,
  color: string = "#ffffff",
  opacity: number = 0.15,
  fill: "solid" | "outline" = "solid"
): Promise<string> {
  if (icons.length === 0) return "";

  // Wait for FA font to load
  try {
    await document.fonts.load(`900 ${iconSize}px "Font Awesome 6 Free"`);
  } catch {
    // Font might already be loaded, continue anyway
  }

  return generatePatternDataUrl(icons, patternSize, iconSize, color, opacity, fill);
}

/**
 * Check if text has emoji.
 */
export function hasEmoji(text: string): boolean {
  return extractEmoji(text).length > 0;
}
