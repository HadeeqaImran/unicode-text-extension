import test from "node:test";
import assert from "node:assert/strict";

import { convertText, filterStyles, getStyleById } from "../shared/converters";

test("mathematical bold maps ASCII letters and digits", () => {
  assert.equal(convertText("bold", "Abc123"), "𝐀𝐛𝐜𝟏𝟐𝟑");
});

test("double struck preserves unsupported punctuation", () => {
  assert.equal(convertText("double-struck", "Hi!?"), "ℍ𝕚!?");
});

test("fullwidth expands ASCII punctuation and spaces deterministically", () => {
  assert.equal(convertText("fullwidth", "Hi 1!"), "Ｈｉ　１！");
});

test("script keeps unsupported digits unchanged", () => {
  assert.equal(convertText("script", "Code 123"), "𝒞ℴ𝒹ℯ 123");
});

test("combining underline skips spaces while styling glyphs", () => {
  assert.equal(convertText("underline", "a b"), "a̲ b̲");
});

test("upside down reverses and flips characters", () => {
  assert.equal(convertText("upside-down", "ab!"), "¡qɐ");
});

test("filterStyles matches labels and keywords", () => {
  const results = filterStyles("blackboard");
  assert.equal(results.some((style) => style.id === "double-struck"), true);
});

test("style registry exposes metadata for popup and picker rendering", () => {
  const style = getStyleById("circled");
  assert.equal(style?.label, "Circled");
  assert.equal(style?.supportsReplace, true);
});
