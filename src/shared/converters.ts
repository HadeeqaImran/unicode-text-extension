import {
  applyCombiningMarks,
  boldItalicMap,
  boldMap,
  boldScriptMap,
  circledMap,
  doubleStruckMap,
  fullwidthMap,
  mapCharacters,
  monospaceMap,
  negativeCircledMap,
  negativeSquaredMap,
  parenthesizedMap,
  regionalIndicatorMap,
  reverseByCodePoint,
  sansBoldItalicMap,
  sansBoldMap,
  sansItalicMap,
  sansMap,
  scriptMap,
  smallCapsMap,
  squaredMap,
  superscriptMap,
  upsideDownMap
} from "./mappings";
import type { StyleDefinition } from "./types";

export const STYLE_DEFINITIONS: StyleDefinition[] = [
  {
    id: "circled",
    label: "Circled",
    category: "enclosed",
    previewExample: "ⓗⓔⓛⓛⓞ ①②③",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["circle", "enclosed"],
    convert: (input) => mapCharacters(input, circledMap)
  },
  {
    id: "negative-circled",
    label: "Negative Circled",
    category: "enclosed",
    previewExample: "🅗🅔🅛🅛🅞 ❶❷❸",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["filled circle", "inverse"],
    convert: (input) => mapCharacters(input, negativeCircledMap)
  },
  {
    id: "fullwidth",
    label: "Fullwidth",
    category: "symbolic",
    previewExample: "Ｈｅｌｌｏ　１２３",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["wide", "zenkaku"],
    convert: (input) => mapCharacters(input, fullwidthMap)
  },
  {
    id: "bold",
    label: "Mathematical Bold",
    category: "mathematical",
    previewExample: "𝐇𝐞𝐥𝐥𝐨 𝟏𝟐𝟑",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["math", "strong"],
    convert: (input) => mapCharacters(input, boldMap)
  },
  {
    id: "bold-italic",
    label: "Mathematical Bold Italic",
    category: "mathematical",
    previewExample: "𝑯𝒆𝒍𝒍𝒐 123",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["math", "slanted"],
    convert: (input) => mapCharacters(input, boldItalicMap)
  },
  {
    id: "script",
    label: "Script",
    category: "mathematical",
    previewExample: "𝒢𝒶𝓁𝓁𝑒𝓇𝓎",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["calligraphy", "cursive"],
    convert: (input) => mapCharacters(input, scriptMap)
  },
  {
    id: "bold-script",
    label: "Bold Script",
    category: "mathematical",
    previewExample: "𝓖𝓵𝓸𝔀",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["calligraphy", "bold cursive"],
    convert: (input) => mapCharacters(input, boldScriptMap)
  },
  {
    id: "double-struck",
    label: "Double Struck",
    category: "mathematical",
    previewExample: "𝔻𝕠𝕦𝕓𝕝𝕖 𝟙𝟚𝟛",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["blackboard", "board"],
    convert: (input) => mapCharacters(input, doubleStruckMap)
  },
  {
    id: "monospace",
    label: "Monospace",
    category: "mathematical",
    previewExample: "𝙼𝚘𝚗𝚘 𝟷𝟸𝟹",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["code", "fixed"],
    convert: (input) => mapCharacters(input, monospaceMap)
  },
  {
    id: "sans",
    label: "Sans Serif",
    category: "mathematical",
    previewExample: "𝖲𝖺𝗇𝗌 𝟣𝟤𝟥",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["clean", "modern"],
    convert: (input) => mapCharacters(input, sansMap)
  },
  {
    id: "sans-bold",
    label: "Sans Serif Bold",
    category: "mathematical",
    previewExample: "𝗦𝗮𝗻𝘀 𝟭𝟮𝟯",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["clean", "strong"],
    convert: (input) => mapCharacters(input, sansBoldMap)
  },
  {
    id: "sans-italic",
    label: "Sans Serif Italic",
    category: "mathematical",
    previewExample: "𝘚𝘢𝘯𝘴 123",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["clean", "slanted"],
    convert: (input) => mapCharacters(input, sansItalicMap)
  },
  {
    id: "sans-bold-italic",
    label: "Sans Serif Bold Italic",
    category: "mathematical",
    previewExample: "𝙎𝙖𝙣𝙨 123",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["clean", "emphasis"],
    convert: (input) => mapCharacters(input, sansBoldItalicMap)
  },
  {
    id: "parenthesized",
    label: "Parenthesized",
    category: "enclosed",
    previewExample: "⒣⒠⒧⒧⒪ ⑴⑵⑶",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["paren", "numbered"],
    convert: (input) => mapCharacters(input, parenthesizedMap)
  },
  {
    id: "regional-indicator",
    label: "Regional Indicator",
    category: "symbolic",
    previewExample: "🇭🇪🇱🇱🇴",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["flag", "indicator"],
    convert: (input) => mapCharacters(input, regionalIndicatorMap)
  },
  {
    id: "squared",
    label: "Squared",
    category: "enclosed",
    previewExample: "🄷🄴🄻🄻🄾",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["box", "caps"],
    convert: (input) => mapCharacters(input, squaredMap)
  },
  {
    id: "negative-squared",
    label: "Negative Squared",
    category: "enclosed",
    previewExample: "🅷🅴🅻🅻🅾",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["filled box", "caps"],
    convert: (input) => mapCharacters(input, negativeSquaredMap)
  },
  {
    id: "superscript",
    label: "Superscript",
    category: "symbolic",
    previewExample: "ˢᵘᵖᵉʳ ¹²³",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["raised", "tiny"],
    convert: (input) => mapCharacters(input, superscriptMap)
  },
  {
    id: "small-caps",
    label: "Small Caps",
    category: "symbolic",
    previewExample: "ꜱᴍᴀʟʟ ᴄᴀᴘꜱ",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["caps", "petite"],
    convert: (input) => mapCharacters(input, smallCapsMap)
  },
  {
    id: "reversed",
    label: "Reversed",
    category: "directional",
    previewExample: "olleH",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["mirror", "backwards"],
    convert: (input) => reverseByCodePoint(input)
  },
  {
    id: "upside-down",
    label: "Upside Down",
    category: "directional",
    previewExample: "oʅʅǝH",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["flip", "turned"],
    convert: (input) => reverseByCodePoint(mapCharacters(input, upsideDownMap))
  },
  {
    id: "strikethrough",
    label: "Strikethrough",
    category: "effects",
    previewExample: "s̶t̶r̶i̶k̶e̶",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["combining", "overlay"],
    convert: (input) => applyCombiningMarks(input, ["\u0336"])
  },
  {
    id: "underline",
    label: "Underline",
    category: "effects",
    previewExample: "u̲n̲d̲e̲r̲",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["combining", "line"],
    convert: (input) => applyCombiningMarks(input, ["\u0332"])
  },
  {
    id: "double-underline",
    label: "Double Underline",
    category: "effects",
    previewExample: "d̳o̳u̳b̳l̳e̳",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["combining", "line"],
    convert: (input) => applyCombiningMarks(input, ["\u0333"])
  },
  {
    id: "dotted-underline",
    label: "Dotted Underline",
    category: "effects",
    previewExample: "d̤o̤t̤t̤e̤d̤",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["combining", "dots"],
    convert: (input) => applyCombiningMarks(input, ["\u0324"])
  },
  {
    id: "slash",
    label: "Slash Overlay",
    category: "effects",
    previewExample: "s̷l̷a̷s̷h̷",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["combining", "diagonal"],
    convert: (input) => applyCombiningMarks(input, ["\u0337"])
  },
  {
    id: "boxed",
    label: "Boxed Effect",
    category: "effects",
    previewExample: "b⃞o⃞x⃞e⃞d⃞",
    supportsReplace: true,
    supportsCopy: true,
    keywords: ["combining", "square"],
    convert: (input) => applyCombiningMarks(input, ["\u20de"])
  }
];

const styleMap = new Map(STYLE_DEFINITIONS.map((style) => [style.id, style] satisfies [string, StyleDefinition]));

export function getStyleById(styleId: string): StyleDefinition | undefined {
  return styleMap.get(styleId);
}

export function convertText(styleId: string, input: string): string {
  return getStyleById(styleId)?.convert(input) ?? input;
}

export function filterStyles(query: string): StyleDefinition[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return STYLE_DEFINITIONS;
  }

  return STYLE_DEFINITIONS.filter((style) => {
    const haystack = [style.label, style.category, style.id, ...style.keywords].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}
