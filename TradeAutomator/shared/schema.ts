import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  oandaTradeId: text("oanda_trade_id"),
  instrument: text("instrument").notNull().default("XAU_USD"),
  side: text("side").notNull(), // "buy" or "sell"
  lotSize: decimal("lot_size", { precision: 10, scale: 4 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 5 }),
  currentPrice: decimal("current_price", { precision: 10, scale: 5 }),
  tp1: decimal("tp1", { precision: 10, scale: 5 }).notNull(),
  tp2: decimal("tp2", { precision: 10, scale: 5 }).notNull(),
  sl: decimal("sl", { precision: 10, scale: 5 }).notNull(),
  partialClosePercent: integer("partial_close_percent").notNull().default(75),
  status: text("status").notNull().default("open"), // "open", "tp1_hit", "closed"
  tp1Hit: boolean("tp1_hit").notNull().default(false),
  slMovedToBreakeven: boolean("sl_moved_to_breakeven").notNull().default(false),
  unrealizedPL: decimal("unrealized_pl", { precision: 10, scale: 2 }).default("0"),
  realizedPL: decimal("realized_pl", { precision: 10, scale: 2 }).default("0"),
  openTime: timestamp("open_time").notNull().defaultNow(),
  closeTime: timestamp("close_time"),
});

export const account = pgTable("account", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("10000"),
  unrealizedPL: decimal("unrealized_pl", { precision: 10, scale: 2 }).notNull().default("0"),
  marginUsed: decimal("margin_used", { precision: 10, scale: 2 }).notNull().default("0"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  side: true,
  lotSize: true,
  tp1: true,
  tp2: true,
  sl: true,
  partialClosePercent: true,
}).extend({
  side: z.enum(["buy", "sell"]),
  lotSize: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Lot size must be a positive number"
  }),
  tp1: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "TP1 must be a positive number"
  }),
  tp2: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "TP2 must be a positive number"
  }),
  sl: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "SL must be a positive number"
  }),
  partialClosePercent: z.number().min(1).max(100),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type Account = typeof account.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
