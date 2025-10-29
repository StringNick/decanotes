/**
 * Common emoji shortcode mappings
 * Supports GitHub-style emoji shortcodes like :smile:
 */
export const emojiMap: Record<string, string> = {
  // Smileys & Emotion
  smile: '😄',
  grin: '😁',
  joy: '😂',
  laughing: '😆',
  wink: '😉',
  heart_eyes: '😍',
  kissing_heart: '😘',
  smirk: '😏',
  neutral_face: '😐',
  expressionless: '😑',
  confused: '😕',
  slight_frown: '🙁',
  frowning: '☹️',
  worried: '😟',
  cry: '😢',
  sob: '😭',
  scream: '😱',
  angry: '😠',
  rage: '😡',
  fire: '🔥',
  star: '⭐',
  sparkles: '✨',
  tada: '🎉',

  // Hand gestures
  thumbsup: '👍',
  thumbsdown: '👎',
  ok_hand: '👌',
  punch: '👊',
  fist: '✊',
  v: '✌️',
  wave: '👋',
  clap: '👏',
  pray: '🙏',

  // Hearts
  heart: '❤️',
  yellow_heart: '💛',
  green_heart: '💚',
  blue_heart: '💙',
  purple_heart: '💜',
  broken_heart: '💔',

  // Nature
  sunny: '☀️',
  cloud: '☁️',
  umbrella: '☔',
  snowflake: '❄️',
  zap: '⚡',
  rainbow: '🌈',

  // Objects
  bulb: '💡',
  bell: '🔔',
  no_bell: '🔕',
  mag: '🔍',
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  pencil: '✏️',
  memo: '📝',
  book: '📖',
  bookmark: '🔖',
  link: '🔗',
  paperclip: '📎',

  // Symbols
  heavy_check_mark: '✔️',
  x: '❌',
  warning: '⚠️',
  question: '❓',
  exclamation: '❗',
  information_source: 'ℹ️',
  white_check_mark: '✅',
  ballot_box_with_check: '☑️',
  arrow_right: '➡️',
  arrow_left: '⬅️',
  arrow_up: '⬆️',
  arrow_down: '⬇️',

  // Common dev/tech
  computer: '💻',
  iphone: '📱',
  email: '📧',
  rocket: '🚀',
  gear: '⚙️',
  wrench: '🔧',
  hammer: '🔨',
  bug: '🐛',
  package: '📦',

  // Food & Drink
  coffee: '☕',
  tea: '🍵',
  beer: '🍺',
  pizza: '🍕',
  hamburger: '🍔',
  apple: '🍎',
  banana: '🍌',

  // Time
  hourglass: '⌛',
  watch: '⌚',
  alarm_clock: '⏰',
  calendar: '📅',

  // Flags (common)
  us: '🇺🇸',
  uk: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹',
  jp: '🇯🇵',
  kr: '🇰🇷',
  cn: '🇨🇳',
  ru: '🇷🇺',
};

/**
 * Process text and replace emoji shortcodes with actual emoji
 */
export const replaceEmojiShortcodes = (text: string): string => {
  return text.replace(/:([a-z0-9_+-]+):/gi, (match, shortcode) => {
    const emoji = emojiMap[shortcode.toLowerCase()];
    return emoji || match;
  });
};
