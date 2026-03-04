// === Emoji Icon Catalog ===

export const ICON_CATALOG = {
  "Matin": ["🌅", "☀️", "🌤️", "⏰", "🔔"],
  "Hygiène": ["🪥", "🧼", "🚿", "🛁", "🧴", "💇"],
  "Vêtements": ["👕", "👖", "👗", "🧦", "👟", "🧥", "🎒"],
  "Repas": ["🥣", "🍞", "🥛", "🍎", "🥪", "🍽️", "🥤"],
  "École": ["📚", "✏️", "📖", "🏫", "📝", "🎨"],
  "Activités": ["⚽", "🎵", "🎮", "🚴", "🏊", "🎭", "🧩"],
  "Soir": ["🌙", "⭐", "🛏️", "📖", "🧸", "😴"],
  "Maison": ["🏠", "🧹", "🗑️", "🐕", "🌱", "🍳"],
  "Émotions": ["😊", "😎", "🤩", "💪", "👍", "❤️", "🎉"],
};

export const AVATAR_ICONS = [
  "🦊", "🐱", "🐶", "🐰", "🐼", "🦁", "🐸", "🦄",
  "🐨", "🐯", "🐮", "🐷", "🐵", "🦋", "🐲", "🦖",
  "🤖", "👸", "🧙", "🦸", "🧑‍🚀", "🧑‍🎨", "🧑‍🔬", "⚡",
];

export const REWARD_ICONS = ["⭐", "🌟", "🏆", "🎖️", "👑", "💎", "🔥", "🎯", "💯", "🤩"];

export const COLOR_THEMES = [
  { id: "pink", name: "Rose", color: "#E91E63" },
  { id: "blue", name: "Bleu", color: "#2196F3" },
  { id: "green", name: "Vert", color: "#4CAF50" },
  { id: "purple", name: "Violet", color: "#9C27B0" },
  { id: "orange", name: "Orange", color: "#FF9800" },
  { id: "teal", name: "Turquoise", color: "#009688" },
  { id: "red", name: "Rouge", color: "#F44336" },
  { id: "yellow", name: "Jaune", color: "#FFC107" },
];

// Get all icons as flat array
export function getAllIcons() {
  return Object.values(ICON_CATALOG).flat();
}
