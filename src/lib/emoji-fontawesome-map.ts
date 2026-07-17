/**
 * Emoji → Font Awesome icon mapping.
 * Maps common emoji/unicode pictographs to Font Awesome icon classes.
 */

export interface EmojiMapping {
  emoji: string;
  name: string;
  faClass: string; // e.g., "fa-heart" → "heart"
  unicode: string;
}

// Emoji → FA mapping (curated top 100+)
const EMOJI_MAP: Record<string, Omit<EmojiMapping, "emoji">> = {
  "❤️": { name: "heart", faClass: "heart", unicode: "\uf004" },
  "🔥": { name: "fire", faClass: "fire", unicode: "\uf06d" },
  "⭐": { name: "star", faClass: "star", unicode: "\uf005" },
  "✨": { name: "sparkles", faClass: "star", unicode: "\uf005" },
  "⚡": { name: "zap", faClass: "bolt", unicode: "\uf0e7" },
  "💎": { name: "gem", faClass: "gem", unicode: "\uf3a5" },
  "👑": { name: "crown", faClass: "crown", unicode: "\uf521" },
  "🏆": { name: "trophy", faClass: "trophy", unicode: "\uf091" },
  "🎯": { name: "dart", faClass: "bullseye", unicode: "\uf140" },
  "🚀": { name: "rocket", faClass: "rocket", unicode: "\uf135" },
  "💡": { name: "bulb", faClass: "lightbulb", unicode: "\uf0eb" },
  "🔑": { name: "key", faClass: "key", unicode: "\uf084" },
  "🔒": { name: "lock", faClass: "lock", unicode: "\uf023" },
  "🔗": { name: "link", faClass: "link", unicode: "\uf0c1" },
  "📌": { name: "pin", faClass: "thumbtack", unicode: "\uf08d" },
  "💰": { name: "money", faClass: "sack-dollar", unicode: "\uf81d" },
  "📊": { name: "chart", faClass: "chart-bar", unicode: "\uf080" },
  "📈": { name: "chart-up", faClass: "chart-line", unicode: "\uf201" },
  "🎨": { name: "art", faClass: "palette", unicode: "\uf53f" },
  "✏️": { name: "pencil", faClass: "pencil", unicode: "\uf303" },
  "📝": { name: "memo", faClass: "pen-to-square", unicode: "\uf044" },
  "📖": { name: "book", faClass: "book", unicode: "\uf02d" },
  "💬": { name: "speech", faClass: "comment", unicode: "\uf075" },
  "📢": { name: "megaphone", faClass: "bullhorn", unicode: "\uf0a1" },
  "🔔": { name: "bell", faClass: "bell", unicode: "\uf0f3" },
  "🎁": { name: "gift", faClass: "gift", unicode: "\uf06b" },
  "🛒": { name: "cart", faClass: "cart-shopping", unicode: "\uf07a" },
  "🏠": { name: "house", faClass: "house", unicode: "\uf015" },
  "💻": { name: "laptop", faClass: "laptop", unicode: "\uf109" },
  "📱": { name: "mobile", faClass: "mobile", unicode: "\uf10b" },
  "⚙️": { name: "gear", faClass: "gear", unicode: "\uf013" },
  "🔧": { name: "wrench", faClass: "wrench", unicode: "\uf0ad" },
  "🔨": { name: "hammer", faClass: "hammer", unicode: "\uf6e3" },
  "✅": { name: "check", faClass: "circle-check", unicode: "\uf058" },
  "❌": { name: "cross", faClass: "circle-xmark", unicode: "\uf057" },
  "⚠️": { name: "warning", faClass: "triangle-exclamation", unicode: "\uf071" },
  "❗": { name: "exclamation", faClass: "exclamation", unicode: "\uf12a" },
  "❓": { name: "question", faClass: "question", unicode: "\uf128" },
  "💯": { name: "100", faClass: "hundred-points", unicode: "\uf896" },
  "👍": { name: "thumbs-up", faClass: "thumbs-up", unicode: "\uf164" },
  "👎": { name: "thumbs-down", faClass: "thumbs-down", unicode: "\uf165" },
  "👏": { name: "clap", faClass: "hands-clapping", unicode: "\uf817" },
  "🙏": { name: "pray", faClass: "hands-praying", unicode: "\uf684" },
  "💪": { name: "muscle", faClass: "hand-fist", unicode: "\uf6de" },
  "🤝": { name: "handshake", faClass: "handshake", unicode: "\uf2b5" },
  "😀": { name: "grinning", faClass: "face-smile", unicode: "\uf581" },
  "😂": { name: "joy", faClass: "face-laugh-beam", unicode: "\uf59b" },
  "😍": { name: "heart-eyes", faClass: "face-heart-eyes", unicode: "\uf7df" },
  "🤔": { name: "thinking", faClass: "face-thinking", unicode: "\uf5c4" },
  "😎": { name: "cool", faClass: "face-smile", unicode: "\uf581" },
  "😢": { name: "cry", faClass: "face-sad-tear", unicode: "\uf5b4" },
  "😡": { name: "angry", faClass: "face-angry", unicode: "\uf556" },
  "💀": { name: "skull", faClass: "skull", unicode: "\uf54c" },
  "👻": { name: "ghost", faClass: "ghost", unicode: "\uf6e2" },
  "🤖": { name: "robot", faClass: "robot", unicode: "\uf544" },
  "🐶": { name: "dog", faClass: "dog", unicode: "\uf6d3" },
  "🐱": { name: "cat", faClass: "cat", unicode: "\uf6c0" },
  "🦊": { name: "fox", faClass: "fox", unicode: "\uf813" },
  "🦁": { name: "lion", faClass: "cat", unicode: "\uf6c0" },
  "🐸": { name: "frog", faClass: "frog", unicode: "\uf6e8" },
  "🐝": { name: "bee", faClass: "bug", unicode: "\uf188" },
  "🦋": { name: "butterfly", faClass: "bug", unicode: "\uf188" },
  "🌸": { name: "blossom", faClass: "seedling", unicode: "\uf4d8" },
  "🌺": { name: "hibiscus", faClass: "seedling", unicode: "\uf4d8" },
  "🌹": { name: "rose", faClass: "seedling", unicode: "\uf4d8" },
  "🌿": { name: "herb", faClass: "leaf", unicode: "\uf06c" },
  "🍀": { name: "four-leaf", faClass: "leaf", unicode: "\uf06c" },
  "🍁": { name: "maple", faClass: "leaf", unicode: "\uf06c" },
  "🌴": { name: "palm", faClass: "tree-palm", unicode: "\uf82b" },
  "🌳": { name: "tree", faClass: "tree", unicode: "\uf1bb" },
  "🍎": { name: "apple", faClass: "apple-whole", unicode: "\uf5d1" },
  "🍕": { name: "pizza", faClass: "pizza-slice", unicode: "\uf818" },
  "🍔": { name: "burger", faClass: "burger", unicode: "\uf805" },
  "☕": { name: "coffee", faClass: "mug-hot", unicode: "\uf7b6" },
  "🍺": { name: "beer", faClass: "beer-mug-empty", unicode: "\uf0fc" },
  "🍷": { name: "wine", faClass: "wine-glass", unicode: "\uf4e3" },
  "⚽": { name: "soccer", faClass: "futbol", unicode: "\uf1e3" },
  "🏀": { name: "basketball", faClass: "basketball", unicode: "\uf434" },
  "🎮": { name: "gamepad", faClass: "gamepad", unicode: "\uf11b" },
  "🎲": { name: "dice", faClass: "dice", unicode: "\uf522" },
  "🎵": { name: "music", faClass: "music", unicode: "\uf001" },
  "🎸": { name: "guitar", faClass: "guitar", unicode: "\uf7a6" },
  "🎤": { name: "mic", faClass: "microphone", unicode: "\uf130" },
  "🎧": { name: "headphones", faClass: "headphones", unicode: "\uf025" },
  "🎬": { name: "clapper", faClass: "clapperboard", unicode: "\uf846" },
  "✈️": { name: "airplane", faClass: "plane", unicode: "\uf072" },
  "🚗": { name: "car", faClass: "car", unicode: "\uf1b9" },
  "⛵": { name: "sailboat", faClass: "sailboat", unicode: "\uf844" },
  "⚓": { name: "anchor", faClass: "anchor", unicode: "\uf13d" },
  "🌍": { name: "globe", faClass: "globe", unicode: "\uf0ac" },
  "☀️": { name: "sun", faClass: "sun", unicode: "\uf185" },
  "🌙": { name: "moon", faClass: "moon", unicode: "\uf186" },
  "🌈": { name: "rainbow", faClass: "rainbow", unicode: "\uf8bc" },
  "❄️": { name: "snowflake", faClass: "snowflake", unicode: "\uf2dc" },
  "🌊": { name: "wave", faClass: "water", unicode: "\uf773" },
  "💧": { name: "droplet", faClass: "droplet", unicode: "\uf043" },
  "♻️": { name: "recycle", faClass: "recycle", unicode: "\uf1b8" },
  "🚩": { name: "flag", faClass: "flag", unicode: "\uf024" },
  "🎉": { name: "party", faClass: "champagne-glass", unicode: "\uf79e" },
  "🎊": { name: "confetti", faClass: "champagne-glass", unicode: "\uf79e" },
  "🎀": { name: "ribbon", faClass: "ribbon", unicode: "\uf837" },
  "🔴": { name: "red-circle", faClass: "circle", unicode: "\uf111" },
  "🟢": { name: "green-circle", faClass: "circle", unicode: "\uf111" },
  "🔵": { name: "blue-circle", faClass: "circle", unicode: "\uf111" },
  "🌟": { name: "glowing-star", faClass: "star", unicode: "\uf005" },
  "💫": { name: "dizzy", faClass: "star", unicode: "\uf005" },
  "💥": { name: "boom", faClass: "explosion", unicode: "\uf666" },
  "💢": { name: "anger", faClass: "burst", unicode: "\uf633" },
  "💤": { name: "zzz", faClass: "zzz", unicode: "\uf880" },
  "👁️": { name: "eye", faClass: "eye", unicode: "\uf06e" },
  "🧠": { name: "brain", faClass: "brain", unicode: "\uf5dc" },
  "🧸": { name: "teddy", faClass: "bear", unicode: "\uf812" },
  "🧩": { name: "puzzle", faClass: "puzzle-piece", unicode: "\uf12e" },
  "🎭": { name: "theater", faClass: "masks-theater", unicode: "\uf630" },
  "📅": { name: "calendar", faClass: "calendar", unicode: "\uf133" },
  "✉️": { name: "envelope", faClass: "envelope", unicode: "\uf0e0" },
  "📞": { name: "phone", faClass: "phone", unicode: "\uf095" },
  "🔌": { name: "plug", faClass: "plug", unicode: "\uf1e6" },
  "🔋": { name: "battery", faClass: "battery-full", unicode: "\uf240" },
  "📷": { name: "camera", faClass: "camera", unicode: "\uf030" },
  "💾": { name: "floppy", faClass: "floppy-disk", unicode: "\uf0c7" },
  "🖨️": { name: "printer", faClass: "print", unicode: "\uf02f" },
  "🏷️": { name: "tag", faClass: "tag", unicode: "\uf02b" },
  "📦": { name: "package", faClass: "box", unicode: "\uf466" },
  "🛡️": { name: "shield", faClass: "shield", unicode: "\uf132" },
  "⚖️": { name: "scales", faClass: "scale-balanced", unicode: "\uf24e" },
  "🧲": { name: "magnet", faClass: "magnet", unicode: "\uf076" },
  "🏅": { name: "medal", faClass: "medal", unicode: "\uf5a2" },
  "🥇": { name: "gold", faClass: "medal", unicode: "\uf5a2" },
  "💡": { name: "idea", faClass: "lightbulb", unicode: "\uf0eb" },
  "📣": { name: "megaphone2", faClass: "bullhorn", unicode: "\uf0a1" },
  "❤️": { name: "love", faClass: "heart", unicode: "\uf004" },
  "💔": { name: "broken-heart", faClass: "heart-crack", unicode: "\uf7a9" },
  "❣️": { name: "heart-exclaim", faClass: "heart", unicode: "\uf004" },
  "💕": { name: "two-hearts", faClass: "heart", unicode: "\uf004" },
  "💖": { name: "sparkling-heart", faClass: "heart", unicode: "\uf004" },
  "💗": { name: "growing-heart", faClass: "heart", unicode: "\uf004" },
  "💘": { name: "heart-arrow", faClass: "heart", unicode: "\uf004" },
  "💝": { name: "heart-ribbon", faClass: "heart", unicode: "\uf004" },
  "♥️": { name: "heart-suit", faClass: "heart", unicode: "\uf004" },
  "👆": { name: "up", faClass: "hand-point-up", unicode: "\uf0a6" },
  "👇": { name: "down", faClass: "hand-point-down", unicode: "\uf0a7" },
  "👉": { name: "right", faClass: "hand-point-right", unicode: "\uf0a4" },
  "👈": { name: "left", faClass: "hand-point-left", unicode: "\uf0a5" },
  "✌️": { name: "peace", faClass: "hand-peace", unicode: "\uf25b" },
  "🤞": { name: "crossed-fingers", faClass: "hand-scissors", unicode: "\uf257" },
  "👋": { name: "wave2", faClass: "hand", unicode: "\uf256" },
  "✊": { name: "fist", faClass: "fist-raised", unicode: "\uf6de" },
  "👊": { name: "punch", faClass: "fist-raised", unicode: "\uf6de" },
  "🙌": { name: "raised-hands", faClass: "hands", unicode: "\uf255" },
  "🌍": { name: "earth", faClass: "globe", unicode: "\uf0ac" },
  "🌎": { name: "earth2", faClass: "globe", unicode: "\uf0ac" },
  "🌏": { name: "earth3", faClass: "globe", unicode: "\uf0ac" },
  "🪐": { name: "saturn", faClass: "globe", unicode: "\uf0ac" },
  "💫": { name: "star2", faClass: "star", unicode: "\uf005" },
  "🌪️": { name: "tornado", faClass: "wind", unicode: "\uf72e" },
  "🔥": { name: "fire2", faClass: "fire", unicode: "\uf06d" },
  "💥": { name: "collision2", faClass: "explosion", unicode: "\uf666" },
  "☀️": { name: "sun2", faClass: "sun", unicode: "\uf185" },
  "🌤️": { name: "sun-cloud", faClass: "cloud-sun", unicode: "\uf6c4" },
  "☁️": { name: "cloud", faClass: "cloud", unicode: "\uf0c2" },
  "🌧️": { name: "rain", faClass: "cloud-rain", unicode: "\uf73d" },
  "⛈️": { name: "thunderstorm", faClass: "cloud-bolt", unicode: "\uf76c" },
  "🌩️": { name: "lightning", faClass: "bolt", unicode: "\uf0e7" },
  "☃️": { name: "snowman", faClass: "snowflake", unicode: "\uf2dc" },
  "⛄": { name: "snowman2", faClass: "snowflake", unicode: "\uf2dc" },
  "🌊": { name: "ocean", faClass: "water", unicode: "\uf773" },
  "💧": { name: "drop", faClass: "droplet", unicode: "\uf043" },
  "🫧": { name: "bubbles", faClass: "droplet", unicode: "\uf043" },
  "👁️‍🗨️": { name: "eye-speech", faClass: "eye", unicode: "\uf06e" },
  "💬": { name: "comment", faClass: "comment", unicode: "\uf075" },
  "🗯️": { name: "anger-speech", faClass: "comment", unicode: "\uf075" },
  "💭": { name: "thought", faClass: "comment", unicode: "\uf075" },
  "🔴": { name: "red", faClass: "circle", unicode: "\uf111" },
  "🟠": { name: "orange", faClass: "circle", unicode: "\uf111" },
  "🟡": { name: "yellow", faClass: "circle", unicode: "\uf111" },
  "🟢": { name: "green", faClass: "circle", unicode: "\uf111" },
  "🔵": { name: "blue", faClass: "circle", unicode: "\uf111" },
  "🟣": { name: "purple", faClass: "circle", unicode: "\uf111" },
  "🟤": { name: "brown", faClass: "circle", unicode: "\uf111" },
  "⚫": { name: "black", faClass: "circle", unicode: "\uf111" },
  "⚪": { name: "white", faClass: "circle", unicode: "\uf111" },
  "➕": { name: "plus", faClass: "plus", unicode: "\uf067" },
  "➖": { name: "minus", faClass: "minus", unicode: "\uf068" },
  "➗": { name: "divide", faClass: "divide", unicode: "\uf529" },
  "✖️": { name: "multiply", faClass: "xmark", unicode: "\uf00d" },
  "♾️": { name: "infinity", faClass: "infinity", unicode: "\uf534" },
  "▶️": { name: "play", faClass: "play", unicode: "\uf04b" },
  "⏸️": { name: "pause", faClass: "pause", unicode: "\uf04c" },
  "⏹️": { name: "stop", faClass: "stop", unicode: "\uf04d" },
  "🔀": { name: "shuffle", faClass: "shuffle", unicode: "\uf074" },
  "🔁": { name: "repeat", faClass: "repeat", unicode: "\uf01e" },
  "⏮️": { name: "previous", faClass: "backward-step", unicode: "\uf048" },
  "⏭️": { name: "next", faClass: "forward-step", unicode: "\uf051" },
};

/**
 * Extract all emoji from a text string.
 */
export function extractEmoji(text: string): string[] {
  if (!text) return [];
  // Match emoji: explicit emoji presentations + extended pictographic
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
  const matches = text.match(emojiRegex);
  if (!matches) return [];
  // Filter out variation selectors and joiners
  const filtered = matches.filter(
    (m) => m !== "\uFE0F" && m !== "\u200D" && m.length > 0
  );
  return [...new Set(filtered)];
}

/**
 * Remove all emoji from text.
 */
export function removeEmoji(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
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
 * Get Font Awesome SVG URL from CDN.
 */
export function getFAIconUrl(faClass: string): string {
  return `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/svgs/solid/${faClass}.svg`;
}

/**
 * Generate a repeating SVG pattern using Font Awesome icon images.
 */
export function generatePatternSvg(
  icons: EmojiMapping[],
  patternSize: number = 60,
  iconSize: number = 24,
  color: string = "#ffffff",
  opacity: number = 0.15,
  fill: "solid" | "outline" = "solid"
): string {
  if (icons.length === 0) return "";

  // Create icon positions in a grid
  const positions = [
    { x: 8, y: 8 },
    { x: patternSize / 2 + 8, y: 8 },
    { x: 8, y: patternSize / 2 + 8 },
    { x: patternSize / 2 + 8, y: patternSize / 2 + 8 },
  ];

  const iconElements = icons
    .slice(0, 4) // Max 4 icons per pattern tile
    .map((icon, i) => {
      const pos = positions[i % positions.length];
      const url = getFAIconUrl(icon.faClass);
      const style = fill === "outline"
        ? `opacity="${opacity}"`
        : `opacity="${opacity}" style="filter: brightness(0) invert(1)"`;
      return `<image href="${url}" x="${pos.x}" y="${pos.y}" width="${iconSize}" height="${iconSize}" ${style}/>`;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${patternSize}" height="${patternSize}" viewBox="0 0 ${patternSize} ${patternSize}">
    ${iconElements}
  </svg>`;
}

/**
 * Generate a pattern as a data URL for use in CSS background-image.
 */
export function generatePatternDataUrl(
  icons: EmojiMapping[],
  patternSize: number = 60,
  iconSize: number = 24,
  color: string = "#ffffff",
  opacity: number = 0.15,
  fill: "solid" | "outline" = "solid"
): string {
  const svg = generatePatternSvg(icons, patternSize, iconSize, color, opacity, fill);
  if (!svg) return "";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
