import { describe, it, expect } from "vitest";
import { useTagStore } from "../stores/tagStore";
import { BUILTIN_TAGS } from "../lib/tagDefinitions";

describe("Tag Store & Library", () => {
  it("initializes with rich catalog of builtin tags", () => {
    const store = useTagStore.getState();
    expect(store.tags.length).toBeGreaterThanOrEqual(40);
    expect(BUILTIN_TAGS.length).toBeGreaterThanOrEqual(40);
  });

  it("includes example snippets for all builtin tags", () => {
    BUILTIN_TAGS.forEach((tag) => {
      expect(tag.syntax).toBeDefined();
      expect(tag.exampleSnippet).toBeDefined();
      expect(tag.exampleSnippet.length).toBeGreaterThan(0);
    });
  });

  it("can filter tags by category and search query", () => {
    useTagStore.getState().setSelectedCategory("emotion");
    expect(useTagStore.getState().selectedCategory).toBe("emotion");

    useTagStore.getState().setSearchQuery("whisper");
    expect(useTagStore.getState().searchQuery).toBe("whisper");
  });

  it("supports adding and deleting custom tags", () => {
    const store = useTagStore.getState();
    const initialCount = store.tags.length;

    store.addCustomTag({
      name: "Cyberpunk Glitch",
      syntax: "[glitch, distorted]",
      category: "custom",
      description: "Robotic stutter effect for sci-fi characters.",
      exampleSnippet: "[glitch, distorted] System integrity compromised.",
      engines: ["gemini", "orpheus"],
    });

    const afterAdd = useTagStore.getState();
    expect(afterAdd.tags.length).toBe(initialCount + 1);

    const addedTag = afterAdd.tags.find((t) => t.syntax === "[glitch, distorted]");
    expect(addedTag).toBeDefined();

    if (addedTag) {
      afterAdd.deleteCustomTag(addedTag.id);
      const afterDelete = useTagStore.getState();
      expect(afterDelete.tags.length).toBe(initialCount);
    }
  });
});
