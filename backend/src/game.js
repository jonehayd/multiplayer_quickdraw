import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the possible words to be drawn
export async function readCategoriesFile() {
  try {
    const filePath = path.join(__dirname, "../assets/selected_categories.txt");
    const data = await fs.readFile(filePath, "utf8");

    const categories = data
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return categories;
  } catch (err) {
    console.error("Error reading file:", err);
    return [];
  }
}

// Return a random array of the words without repeats
export async function getRandomWordsArray(categories, numWords) {
  if (categories.length === 0) return [];

  const result = [];

  while (result.length < numWords) {
    const shuffled = [...categories];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const remaining = numWords - result.length;
    result.push(...shuffled.slice(0, remaining));
  }

  return result;
}
