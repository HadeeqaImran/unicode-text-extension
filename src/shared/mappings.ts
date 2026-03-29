const ASCII_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ASCII_LOWER = "abcdefghijklmnopqrstuvwxyz";
const ASCII_DIGITS = "0123456789";

function buildSequentialMap(source: string, startCodePoint: number): Record<string, string> {
  return Array.from(source).reduce<Record<string, string>>((accumulator, character, index) => {
    accumulator[character] = String.fromCodePoint(startCodePoint + index);
    return accumulator;
  }, {});
}

function buildListMap(source: string, target: string[]): Record<string, string> {
  return Array.from(source).reduce<Record<string, string>>((accumulator, character, index) => {
    const mapped = target[index];
    if (mapped) {
      accumulator[character] = mapped;
    }
    return accumulator;
  }, {});
}

function buildCaseAwareMap(lowerMap: Record<string, string>): Record<string, string> {
  const upperEntries = Object.entries(lowerMap).map(([source, target]) => [source.toUpperCase(), target]);
  return Object.fromEntries([...Object.entries(lowerMap), ...upperEntries]);
}

function combineMaps(...maps: Array<Record<string, string>>): Record<string, string> {
  return Object.assign({}, ...maps);
}

export function mapCharacters(input: string, map: Record<string, string>): string {
  return Array.from(input, (character) => map[character] ?? character).join("");
}

export function reverseByCodePoint(input: string): string {
  return Array.from(input).reverse().join("");
}

export function applyCombiningMarks(input: string, marks: string[]): string {
  return Array.from(input, (character) => {
    if (/^\s$/u.test(character)) {
      return character;
    }

    return `${character}${marks.join("")}`;
  }).join("");
}

export const circledMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x24b6),
  buildSequentialMap(ASCII_LOWER, 0x24d0),
  {
    "0": "⓪",
    "1": "①",
    "2": "②",
    "3": "③",
    "4": "④",
    "5": "⑤",
    "6": "⑥",
    "7": "⑦",
    "8": "⑧",
    "9": "⑨"
  }
);

export const negativeCircledMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1f150),
  {
    "0": "⓿",
    "1": "❶",
    "2": "❷",
    "3": "❸",
    "4": "❹",
    "5": "❺",
    "6": "❻",
    "7": "❼",
    "8": "❽",
    "9": "❾"
  }
);

export const fullwidthMap = combineMaps(
  Array.from({ length: 94 }, (_, index) => {
    const source = String.fromCodePoint(33 + index);
    const target = String.fromCodePoint(0xff01 + index);
    return { [source]: target };
  }).reduce((accumulator, entry) => Object.assign(accumulator, entry), {} as Record<string, string>),
  { " ": "　" }
);

export const boldMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d400),
  buildSequentialMap(ASCII_LOWER, 0x1d41a),
  buildSequentialMap(ASCII_DIGITS, 0x1d7ce)
);

export const boldItalicMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d468),
  buildSequentialMap(ASCII_LOWER, 0x1d482)
);

export const scriptMap = combineMaps(
  buildListMap(ASCII_UPPER, [
    "𝒜",
    "ℬ",
    "𝒞",
    "𝒟",
    "ℰ",
    "ℱ",
    "𝒢",
    "ℋ",
    "ℐ",
    "𝒥",
    "𝒦",
    "ℒ",
    "ℳ",
    "𝒩",
    "𝒪",
    "𝒫",
    "𝒬",
    "ℛ",
    "𝒮",
    "𝒯",
    "𝒰",
    "𝒱",
    "𝒲",
    "𝒳",
    "𝒴",
    "𝒵"
  ]),
  buildListMap(ASCII_LOWER, [
    "𝒶",
    "𝒷",
    "𝒸",
    "𝒹",
    "ℯ",
    "𝒻",
    "ℊ",
    "𝒽",
    "𝒾",
    "𝒿",
    "𝓀",
    "𝓁",
    "𝓂",
    "𝓃",
    "ℴ",
    "𝓅",
    "𝓆",
    "𝓇",
    "𝓈",
    "𝓉",
    "𝓊",
    "𝓋",
    "𝓌",
    "𝓍",
    "𝓎",
    "𝓏"
  ])
);

export const boldScriptMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d4d0),
  buildSequentialMap(ASCII_LOWER, 0x1d4ea)
);

export const doubleStruckMap = combineMaps(
  buildListMap(ASCII_UPPER, [
    "𝔸",
    "𝔹",
    "ℂ",
    "𝔻",
    "𝔼",
    "𝔽",
    "𝔾",
    "ℍ",
    "𝕀",
    "𝕁",
    "𝕂",
    "𝕃",
    "𝕄",
    "ℕ",
    "𝕆",
    "ℙ",
    "ℚ",
    "ℝ",
    "𝕊",
    "𝕋",
    "𝕌",
    "𝕍",
    "𝕎",
    "𝕏",
    "𝕐",
    "ℤ"
  ]),
  buildSequentialMap(ASCII_LOWER, 0x1d552),
  buildSequentialMap(ASCII_DIGITS, 0x1d7d8)
);

export const monospaceMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d670),
  buildSequentialMap(ASCII_LOWER, 0x1d68a),
  buildSequentialMap(ASCII_DIGITS, 0x1d7f6)
);

export const sansMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d5a0),
  buildSequentialMap(ASCII_LOWER, 0x1d5ba),
  buildSequentialMap(ASCII_DIGITS, 0x1d7e2)
);

export const sansBoldMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d5d4),
  buildSequentialMap(ASCII_LOWER, 0x1d5ee),
  buildSequentialMap(ASCII_DIGITS, 0x1d7ec)
);

export const sansItalicMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d608),
  buildSequentialMap(ASCII_LOWER, 0x1d622)
);

export const sansBoldItalicMap = combineMaps(
  buildSequentialMap(ASCII_UPPER, 0x1d63c),
  buildSequentialMap(ASCII_LOWER, 0x1d656)
);

export const parenthesizedMap = combineMaps(
  buildSequentialMap(ASCII_LOWER, 0x249c),
  {
    "1": "⑴",
    "2": "⑵",
    "3": "⑶",
    "4": "⑷",
    "5": "⑸",
    "6": "⑹",
    "7": "⑺",
    "8": "⑻",
    "9": "⑼"
  }
);

export const regionalIndicatorMap = combineMaps(buildSequentialMap(ASCII_UPPER, 0x1f1e6), buildSequentialMap(ASCII_LOWER, 0x1f1e6));

export const squaredMap = buildSequentialMap(ASCII_UPPER, 0x1f130);

export const negativeSquaredMap = buildSequentialMap(ASCII_UPPER, 0x1f170);

export const superscriptMap = combineMaps(
  {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    "=": "⁼",
    "(": "⁽",
    ")": "⁾"
  },
  buildCaseAwareMap({
    a: "ᵃ",
    b: "ᵇ",
    c: "ᶜ",
    d: "ᵈ",
    e: "ᵉ",
    f: "ᶠ",
    g: "ᵍ",
    h: "ʰ",
    i: "ⁱ",
    j: "ʲ",
    k: "ᵏ",
    l: "ˡ",
    m: "ᵐ",
    n: "ⁿ",
    o: "ᵒ",
    p: "ᵖ",
    r: "ʳ",
    s: "ˢ",
    t: "ᵗ",
    u: "ᵘ",
    v: "ᵛ",
    w: "ʷ",
    x: "ˣ",
    y: "ʸ",
    z: "ᶻ"
  }),
  {
    A: "ᴬ",
    B: "ᴮ",
    D: "ᴰ",
    E: "ᴱ",
    G: "ᴳ",
    H: "ᴴ",
    I: "ᴵ",
    J: "ᴶ",
    K: "ᴷ",
    L: "ᴸ",
    M: "ᴹ",
    N: "ᴺ",
    O: "ᴼ",
    P: "ᴾ",
    R: "ᴿ",
    T: "ᵀ",
    U: "ᵁ",
    V: "ⱽ",
    W: "ᵂ"
  }
);

export const smallCapsMap = buildCaseAwareMap({
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ꜰ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  r: "ʀ",
  s: "ꜱ",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  y: "ʏ",
  z: "ᴢ"
});

export const upsideDownMap = combineMaps(
  {
    a: "ɐ",
    b: "q",
    c: "ɔ",
    d: "p",
    e: "ǝ",
    f: "ɟ",
    g: "ƃ",
    h: "ɥ",
    i: "ᴉ",
    j: "ɾ",
    k: "ʞ",
    l: "l",
    m: "ɯ",
    n: "u",
    o: "o",
    p: "d",
    q: "b",
    r: "ɹ",
    s: "s",
    t: "ʇ",
    u: "n",
    v: "ʌ",
    w: "ʍ",
    y: "ʎ",
    A: "∀",
    B: "𐐒",
    C: "Ɔ",
    D: "◖",
    E: "Ǝ",
    F: "Ⅎ",
    G: "⅁",
    J: "ſ",
    L: "˥",
    M: "W",
    P: "Ԁ",
    T: "┴",
    U: "∩",
    V: "Λ",
    Y: "⅄",
    "1": "⇂",
    "2": "ᄅ",
    "3": "Ɛ",
    "4": "ㄣ",
    "6": "9",
    "7": "ㄥ",
    "9": "6",
    ".": "˙",
    ",": "'",
    "'": ",",
    "\"": "„",
    "?": "¿",
    "!": "¡",
    "(": ")",
    ")": "(",
    "[": "]",
    "]": "[",
    "{": "}",
    "}": "{",
    "<": ">",
    ">": "<",
    "&": "⅋",
    "_": "‾"
  },
  {
    x: "x",
    X: "X",
    z: "z",
    Z: "Z"
  }
);
