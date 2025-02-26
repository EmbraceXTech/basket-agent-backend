import {
  boolean,
  integer,
  doublePrecision,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  telegramId: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  agents: many(agentsTable),
}));

export const agentsTable = pgTable('agents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  chainId: varchar({ length: 255 }).notNull(),
  selectedTokens: text().array().notNull(),
  strategy: text().notNull(),
  intervalSeconds: integer().notNull(),
  stopLossUSD: integer(),
  takeProfitUSD: integer(),
  isRunning: boolean().notNull().default(false),
  endDate: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const agentsRelations = relations(agentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [agentsTable.userId],
    references: [usersTable.id],
  }),
  walletKey: one(walletKeysTable),
  log: many(logsTable),
  knowledge: many(knowledgesTable),
}));

export const logsTable = pgTable('logs', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  agentId: integer()
    .notNull()
    .references(() => agentsTable.id, { onDelete: 'cascade' }),
  thought: text().notNull(),
  action: varchar({ length: 255 }).notNull(),
  amount: integer().notNull(),
  tokenAddr: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
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
    .references(() => agentsTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
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
    .references(() => agentsTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  address: varchar({ length: 255 }).notNull().unique(),
  ivString: varchar({ length: 255 }),
  encryptedWalletData: text(),
  userShare: text(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const walletKeysRelations = relations(walletKeysTable, ({ one }) => ({
  agent: one(agentsTable, {
    fields: [walletKeysTable.agentId],
    references: [agentsTable.id],
  }),
}));

export const balanceSnapshotsTable = pgTable('balance_snapshots', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  agentId: integer()
    .notNull()
    .references(() => agentsTable.id, { onDelete: 'cascade' }),
  date: timestamp().notNull(),
  injection: doublePrecision().notNull(),
  equity: doublePrecision().notNull(),
  balance: doublePrecision().notNull(),
  startPeriodValue: doublePrecision(),
  growthRate: doublePrecision(),
  cumulativeMultiplier: doublePrecision(),
  performance: doublePrecision(),
  transactionHash: varchar({ length: 255 }),
  createdAt: timestamp().notNull().defaultNow(),
});

export const balanceSnapshotsRelations = relations(
  balanceSnapshotsTable,
  ({ one }) => ({
    agent: one(agentsTable, {
      fields: [balanceSnapshotsTable.agentId],
      references: [agentsTable.id],
    }),
  }),
);
