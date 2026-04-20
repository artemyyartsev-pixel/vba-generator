import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import { generations, type Generation, type InsertGeneration } from "@shared/schema";

const sqlite = new Database("vba-gen.db");
export const db = drizzle(sqlite, { schema });

db.run(`
  CREATE TABLE IF NOT EXISTS generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    code TEXT NOT NULL,
    explanation TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general'
  )
`);

export interface IStorage {
  saveGeneration(gen: InsertGeneration): Generation;
  getHistory(): Generation[];
}

export const storage: IStorage = {
  saveGeneration(gen: InsertGeneration): Generation {
    return db.insert(generations).values(gen).returning().get();
  },
  getHistory(): Generation[] {
    return db.select().from(generations).all().reverse().slice(0, 20);
  },
};
