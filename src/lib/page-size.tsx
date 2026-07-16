export const SIZE_PRESETS = {
  linkedin: {
    label: "LinkedIn",
    width: 400,
    height: 500,
    aspectRatio: "4:5",
  },
  instagram: {
    label: "Instagram",
    width: 432,
    height: 540,
    aspectRatio: "4:5",
  },
  tiktok: {
    label: "TikTok",
    width: 360,
    height: 640,
    aspectRatio: "9:16",
  },
} as const;

export type SizePresetKey = keyof typeof SIZE_PRESETS;

// Default size (LinkedIn for backward compatibility)
export const SIZE = SIZE_PRESETS.linkedin;
