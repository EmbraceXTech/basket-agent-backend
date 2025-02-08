import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  telegramId: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  agents: many(agentsTable),
}));

export const agentsTable = pgTable('agents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  walletKeyId: integer()
    .notNull()
    .references(() => walletKeysTable.id),
  chainId: varchar({ length: 255 }).notNull(),
  selectedTokens: text('selected_tokens').array(),
  strategy: varchar({ length: 255 }).notNull(),
  intervalSeconds: integer().notNull(),
  endDate: timestamp('end_date').notNull(),
  stopLossUSD: integer().notNull(),
  takeProfitUSD: integer().notNull(),
  isRunning: boolean().notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agentsRelations = relations(agentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [agentsTable.userId],
    references: [usersTable.id],
  }),
  walletKey: one(walletKeysTable, {
    fields: [agentsTable.walletKeyId],
    references: [walletKeysTable.id],
  }),
  logs: many(logsTable),
  knowledge: one(knowledgesTable),
}));

export const logsTable = pgTable('logs', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  agentId: integer()
    .notNull()
    .references(() => agentsTable.id),
  thought: text().notNull(),
  action: varchar({ length: 255 }).notNull(),
  amount: integer().notNull(),
  tokenAddr: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const logsRelations = relations(logsTable, ({ one }) => ({
  agent: one(agentsTable, {
    fields: [logsTable.agentId],
    references: [agentsTable.id],
  }),
}));

export const knowledgesTable = pgTable('knowledges', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  agentId: integer()
    .notNull()
    .references(() => agentsTable.id),
  name: varchar({ length: 255 }).notNull(),
  content: text().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const knowledgesRelations = relations(knowledgesTable, ({ one }) => ({
  agent: one(agentsTable, {
    fields: [knowledgesTable.agentId],
    references: [agentsTable.id],
  }),
}));

export const walletKeysTable = pgTable('wallet_keys', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  agentId: integer()
    .references(() => agentsTable.id)
    .unique(),
  walletAddress: varchar({ length: 255 }).notNull().unique(),
  walletKey: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const walletKeysRelations = relations(walletKeysTable, ({ one }) => ({
  agent: one(agentsTable),
}));
