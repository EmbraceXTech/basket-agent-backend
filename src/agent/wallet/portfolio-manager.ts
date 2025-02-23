import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { BalanceSnapshotInput } from './interfaces/balance-snapshot.interface';

export class PortfolioManager {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createBalanceSnapshot(
    agentId: string,
    balance: number,
    injection: number = 0,
    date: Date = new Date(),
    recalculate: boolean = false,
    transactionHash: string = null,
  ) {
    try {
      const lastSnapshot = await this.getLastSnapshot(agentId);
      const snapshotInput: BalanceSnapshotInput = {
        date,
        injection,
        balance,
      };
      const snapshot = this.calculateSnapshot(snapshotInput, lastSnapshot);
      const result = await this.db
        .insert(schema.balanceSnapshotsTable)
        .values({
          agentId: +agentId,
          ...snapshot,
          transactionHash: transactionHash
        } as any) // TODO: Fix type error
        .returning();

      if (recalculate) {
        await this.recalculateData(agentId);
      }

      return result[0];
    } catch (e) {
      console.error(e);
    }
  }

  async findExistingDeposit(agentId: string, transactionHash: string) {
    return this.db.query.balanceSnapshotsTable.findFirst({
      where: and(
        eq(schema.balanceSnapshotsTable.agentId, +agentId),
        eq(schema.balanceSnapshotsTable.transactionHash, transactionHash),
      ),
    });
  }

  calculateSnapshot(
    input: BalanceSnapshotInput,
    prevSnapshot: Omit<typeof schema.balanceSnapshotsTable.$inferSelect, 'agentId' | 'createdAt' | 'id'>,
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
      typeof schema.balanceSnapshotsTable.$inferSelect,
      'agentId' | 'createdAt' | 'id'
    >;
  }

  async recalculateData(agentId: string) {
    const snapshots = await this.getSnapshots(agentId);
    const snapshotsExcludFields = snapshots.map(snapshot => {
      const { id, agentId, createdAt, ...rest } = snapshot;
      return rest;
    });

    if (snapshots.length === 0) return [];

    snapshotsExcludFields[0] = this.calculateSnapshot(snapshotsExcludFields[0], null);

    for (let i = 1; i < snapshotsExcludFields.length; i++) {
      snapshotsExcludFields[i] = this.calculateSnapshot(snapshotsExcludFields[i], snapshotsExcludFields[i - 1]);
    }

    const promises = snapshotsExcludFields.map((snapshot, index) =>
      this.db.update(schema.balanceSnapshotsTable).set(snapshot).where(eq(schema.balanceSnapshotsTable.id, snapshots[index].id)),
    );

    return await Promise.all(promises);
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

  async getSnapshots(agentId: string) {
    return this.db.query.balanceSnapshotsTable.findMany({
      where: eq(schema.balanceSnapshotsTable.agentId, +agentId),
      orderBy: asc(schema.balanceSnapshotsTable.date),
    });
  }

}
