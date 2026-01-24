import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readCategoriesFile(): Promise<string[]> {
  try {
    const filePath: string = path.join(
      __dirname,
      "../../assets/selected_categories.txt",
    );
    const data: string = await fs.readFile(filePath, "utf8");

    const categories: string[] = data
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return categories;
  } catch (err) {
    console.error("Error reading file:", err);
    return [];
  }
}

async function getRandomWordsArray(
  categories: string[],
  numWords: number,
): Promise<string[]> {
  if (categories.length === 0) return [];

  const result: string[] = [];

  while (result.length < numWords) {
    const shuffled: string[] = [...categories];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i]!, shuffled[j]!] = [shuffled[j]!, shuffled[i]!];
    }

    const remaining = numWords - result.length;
    result.push(...shuffled.slice(0, remaining));
  }

  return result;
}

export class CategoryService {
  private static instance: CategoryService;
  private categories: string[] = [];
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
      CategoryService.instance.initPromise =
        CategoryService.instance.loadCategories();
    }
    return CategoryService.instance;
  }

  private async loadCategories(): Promise<void> {
    this.categories = await readCategoriesFile();
  }

  async ensureLoaded(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadCategories();
    }
    await this.initPromise;
  }

  async getRandomWords(count: number): Promise<string[]> {
    await this.ensureLoaded();
    return getRandomWordsArray(this.categories, count);
  }

  getCategories(): string[] {
    return [...this.categories];
  }

  async reloadCategories(): Promise<void> {
    await this.loadCategories();
  }
}
