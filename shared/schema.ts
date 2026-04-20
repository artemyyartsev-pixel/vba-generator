import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const generations = sqliteTable("generations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task: text("task").notNull(),
  code: text("code").notNull(),
  explanation: text("explanation").notNull(),
  category: text("category").notNull().default("general"),
});

export const insertGenerationSchema = createInsertSchema(generations).omit({ id: true });
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type Generation = typeof generations.$inferSelect;
