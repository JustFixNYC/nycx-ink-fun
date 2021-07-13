import path from "path";
import fs from "fs";

export interface JsonStorage<T> {
  get(key: string): Promise<T | null>;
  put(key: string, data: T): Promise<void>;
}

export class FilesystemJsonStorage<T> implements JsonStorage<T> {
  constructor(readonly rootDir: string) {}

  private toPath(key: string): string {
    return path.join(this.rootDir, encodeURIComponent(key) + ".json");
  }

  async get(key: string): Promise<T | null> {
    const pathname = this.toPath(key);

    if (!fs.existsSync(pathname)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(pathname, { encoding: "utf-8" }));
  }

  async put(key: string, data: T): Promise<void> {
    const pathname = this.toPath(key);

    fs.writeFileSync(pathname, JSON.stringify(data, null, 2), {
      encoding: "utf-8",
    });
  }
}
