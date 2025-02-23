import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { BalanceSnapshotInput } from './interfaces/balance-snapshot.interface';

export class PortfolioManager {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createBalanceSnapshot(
    agentId: string,
    balance: number,
    injection: number = 0,
  ) {
    try {
      const lastSnapshot = await this.getLastSnapshot(agentId);
      const snapshotInput: BalanceSnapshotInput = {
        date: new Date(),
        injection: injection,
        balance: balance,
      };
      const snapshot = this.calculateSnapshot(snapshotInput, lastSnapshot);
      const result = await this.db
        .insert(schema.balanceSnapshotsTable)
        .values({
          agentId: +agentId,
          ...snapshot,
        })
        .returning();
      return result[0];
    } catch (e) {
      console.error(e);
    }
  }

  async getFirstSnapshot(agentId: string) {
    return this.db.query.balanceSnapshotsTable.findFirst({
      where: eq(schema.balanceSnapshotsTable.agentId, +agentId),
      orderBy: asc(schema.balanceSnapshotsTable.date),
    });
  }

  async getLastSnapshot(agentId: string) {
    return this.db.query.balanceSnapshotsTable.findFirst({
      where: eq(schema.balanceSnapshotsTable.agentId, +agentId),
      orderBy: desc(schema.balanceSnapshotsTable.date),
    });
  }

  calculateSnapshot(
    input: BalanceSnapshotInput,
    prevSnapshot: typeof schema.balanceSnapshotsTable.$inferSelect,
  ) {
    let equity: number;
    let startPeriodValue: number;
    let growthRate: number;
    let cumulativeMultiplier: number;
    let performance: number;

    if (!prevSnapshot) {
      equity = Number(input.injection);
      startPeriodValue = Number(input.balance);
      growthRate = 1;
      cumulativeMultiplier = 1;
      performance = 0;
    } else {
      equity = Number(prevSnapshot.equity) + Number(input.injection);
      startPeriodValue =
        Number(input.injection) !== 0
          ? Number(input.balance)
          : Number(prevSnapshot.startPeriodValue);

      growthRate =
        Number(startPeriodValue) === 0
          ? 1
          : Number(input.balance / startPeriodValue);

      cumulativeMultiplier =
        Number(input.injection) !== 0
          ? Number(prevSnapshot.growthRate) *
            Number(prevSnapshot.cumulativeMultiplier)
          : Number(prevSnapshot.cumulativeMultiplier);

      performance = Number(growthRate) * Number(cumulativeMultiplier) - 1;
    }

    return {
      date: input.date,
      injection: input.injection,
      balance: input.balance,
      equity,
      startPeriodValue,
      growthRate,
      cumulativeMultiplier,
      performance,
    } as Omit<
      typeof schema.balanceSnapshotsTable.$inferInsert,
      'agentId' | 'createdAt' | 'id'
    >;
  }
}
