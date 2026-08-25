import { describe, it, expect } from "vitest";
import {
  autoTagScriptWithTemplate,
  extractCleanScriptLines,
  stripTagsFromLine,
  TemplatePreset,
} from "../lib/templateAutoTagger";
import { BUILTIN_TAGS, TAG_CATEGORIES } from "../lib/tagDefinitions";

describe("Template Auto-Tagger and Tags System", () => {
  it("should have over 30 built-in tags categorized correctly", () => {
    expect(BUILTIN_TAGS.length).toBeGreaterThan(30);
    expect(TAG_CATEGORIES.length).toBe(6);

    const categories = new Set(BUILTIN_TAGS.map((t) => t.category));
    expect(categories.has("emotion")).toBe(true);
    expect(categories.has("pause")).toBe(true);
    expect(categories.has("gesture")).toBe(true);
    expect(categories.has("director")).toBe(true);
  });

  it("extractCleanScriptLines should remove existing director note headers", () => {
    const rawWithHeaders = `Read the following transcript based on the director's note.
# Director's note
Pace: Fast.
## Scene:
Studio scene.
## Sample Context:
Sample tone.
## Transcript:
Speaker 1: Hello world.
Speaker 2: Welcome to KobeanAudio.`;

    const lines = extractCleanScriptLines(rawWithHeaders);
    expect(lines).toEqual(["Speaker 1: Hello world.", "Speaker 2: Welcome to KobeanAudio."]);
  });

  it("stripTagsFromLine should cleanly strip emotion, pauses and gestures", () => {
    const line = "Speaker 1: [reading] [warm] Welcome to our universe [pause: 1.0s] <laugh> It is beautiful!";
    const cleaned = stripTagsFromLine(line);
    expect(cleaned).toBe("Welcome to our universe It is beautiful!");
  });

  it("autoTagScriptWithTemplate applies meditation template with calming tags and long pauses", () => {
    const customText = "Take a slow breath in. Release all tension from your shoulders. Find stillness.";
    const template: TemplatePreset = {
      id: "meditation",
      name: "Mindfulness & Guided Meditation",
      icon: "🧘",
      scene: "A tranquil Japanese bamboo garden at sunrise with gentle water flowing nearby.",
      context: "Relaxing, therapeutic wellness guidance. Soft whispers and soothing breathing spaces.",
      pace: "Very slow, calming, peaceful tempo.",
    };

    const result = autoTagScriptWithTemplate(customText, template);
    expect(result.scene).toContain("bamboo garden");
    expect(result.pace).toContain("calming");
    expect(result.blocks.length).toBe(3);
    expect(result.blocks[0].speaker).toBe("Guide");
    expect(result.blocks[0].text).toContain("[soft, gentle]");
    expect(result.blocks[0].text).toContain("[pause: 3.0s]");
    expect(result.compiledText).toContain("# Director's note");
    expect(result.compiledText).toContain("## Scene:\n" + template.scene);
  });

  it("autoTagScriptWithTemplate applies podcast template with 2 alternating speakers and energetic tags", () => {
    const customText = "Welcome to today's episode. Thanks for having me here. Let's talk about neural speech synthesis.";
    const template: TemplatePreset = {
      id: "podcast-dialogue",
      name: "Podcast Interview (2 Speakers)",
      icon: "🎙️",
      scene: "Modern broadcast studio.",
      context: "Two tech enthusiasts discussing AI.",
      pace: "Upbeat and engaging.",
    };

    const result = autoTagScriptWithTemplate(customText, template);
    expect(result.blocks.length).toBe(3);
    expect(result.blocks[0].speaker).toBe("Host (Alex)");
    expect(result.blocks[1].speaker).toBe("Guest (Zephyr)");
    expect(result.blocks[2].speaker).toBe("Host (Alex)");
    expect(result.blocks[0].text).toContain("[excited]");
  });

  it("autoTagScriptWithTemplate applies cinematic trailer template with deep suspense", () => {
    const customText = "In a distant galaxy. One hero dared to speak out. The reckoning begins.";
    const template: TemplatePreset = {
      id: "cinematic-trailer",
      name: "Cinematic Movie Trailer",
      icon: "🎬",
      scene: "Dark sci-fi metropolis.",
      context: "Deep dramatic movie trailer voice.",
      pace: "Very slow, epic, suspenseful delivery.",
    };

    const result = autoTagScriptWithTemplate(customText, template);
    expect(result.blocks.length).toBe(3);
    expect(result.blocks[0].speaker).toBe("Trailer Voice");
    expect(result.blocks[0].text).toContain("[intense, deep]");
    expect(result.blocks[0].text).toContain("[pause: 2.2s]");
  });
});
