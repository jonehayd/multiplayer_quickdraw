import { describe, it, expect } from "vitest";
import { getRandomWordsArray } from "../src/game";

describe("Game Utilities", () => {
  describe("getRandomWordsArray", () => {
    it("should return array of specified length", async () => {
      const categories = ["apple", "banana", "cat", "dog", "elephant"];
      const result = await getRandomWordsArray(categories, 3);

      expect(result).toHaveLength(3);
      result.forEach((word) => {
        expect(categories).toContain(word);
      });
    });

    it("should handle requesting more words than available", async () => {
      const categories = ["apple", "banana"];
      const result = await getRandomWordsArray(categories, 5);

      expect(result).toHaveLength(5);
      result.forEach((word) => {
        expect(categories).toContain(word);
      });
    });

    it("should return empty array if categories is empty", async () => {
      const result = await getRandomWordsArray([], 5);
      expect(result).toHaveLength(0);
    });
  });
});
