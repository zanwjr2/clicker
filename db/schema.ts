import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameSaves = sqliteTable("game_saves", {
  userId: text("user_id").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: integer("updated_at").notNull(),
});

// Game profiles use a simple username/password/nickname, while the hosting
// platform still authenticates the visitor and owns the browser session.
export const playerAccounts = sqliteTable("player_accounts", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  nickname: text("nickname").notNull().unique(),
  creatorUserId: text("creator_user_id").notNull().unique(),
  passwordSalt: text("password_salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  bestPower: integer("best_power").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const playerAccountLinks = sqliteTable("player_account_links", {
  platformUserId: text("platform_user_id").primaryKey(),
  accountId: text("account_id").notNull().references(() => playerAccounts.id),
  updatedAt: integer("updated_at").notNull(),
});

export const playerLoginAttempts = sqliteTable("player_login_attempts", {
  platformUserId: text("platform_user_id").primaryKey(),
  failures: integer("failures").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});
