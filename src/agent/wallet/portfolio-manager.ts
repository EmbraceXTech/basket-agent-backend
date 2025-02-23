import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { BalanceSnapshotInput, ChartPoint, LineData } from './interfaces/balance-snapshot.interface';
import { DateTime } from 'luxon';
import * as R from 'ramda';

export class PortfolioManager {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async createBalanceSnapshot(
    agentId: string,
    data: BalanceSnapshotInput,
    recalculate: boolean = false,
  ) {
    try {
      const lastSnapshot = await this.getLastSnapshot(agentId);
      const snapshot = this.calculateSnapshot(data, lastSnapshot);
      const result = await this.db
        .insert(schema.balanceSnapshotsTable)
        .values({
          agentId: +agentId,
          ...snapshot,
        } as typeof schema.balanceSnapshotsTable.$inferSelect)
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
      transactionHash: input.transactionHash,
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

  async getBalanceSnapshotTimeSeries(agentId: string) {
    const snapshots = await this.getSnapshots(agentId);

    if (snapshots.length === 0) return [];

    const data = [{
      title: 'balance',
      times: snapshots.map(s => s.date),
      values: snapshots.map(s => s.balance)
    }];

    return this.createChartData(data);
  }

  private generateTimeSeries(
    start: number = 0,
    end: number = 0, 
    stepMinutes: number,
  ): DateTime[] {
    let times: DateTime[] = [];
    let currentTime = DateTime.fromMillis(start);

    while (currentTime.valueOf() <= end) {
      times.push(currentTime);
      currentTime = currentTime.plus({ minutes: stepMinutes });
    }

    times.push(currentTime);

    return times;
  }

  private createChartData = <T>(data: (T & LineData)[]): ChartPoint[] => {
    if (data.length === 0) return [];

    const allTimes = R.flatten(
      data.map((d) => d.times.map((time) => time.valueOf())),
    );
    const minTime = R.reduce(R.min, allTimes[0], allTimes);
    const maxTime = R.reduce(R.max, allTimes[0], allTimes);

    const stepMinutes = 15;
    const timeSeries = this.generateTimeSeries(
      minTime as number,
      maxTime as number,
      stepMinutes,
    );

    const dataIndices = data.map(() => 0);

    const chartData: ChartPoint[] = timeSeries.reduce(
      (prev, timePoint, timeIndex) => {
        const entry: ChartPoint = {
          date: timePoint.toFormat('dd/LL/yyyy'),
        };

        const binLeft = timePoint;
        const binRight = timePoint.plus({ minutes: stepMinutes });

        dataIndices.forEach((startIndex, dataIndex) => {
          const dataItem = data[dataIndex];
          const valuesInBin: number[] = [];

          let i = startIndex;
          for (; i < dataItem.times.length; i++) {
            const itemTime = DateTime.fromISO(dataItem.times[i].toISOString());

            if (itemTime >= binLeft && itemTime < binRight) {
              valuesInBin.push(dataItem.values[i]);
            } else if (itemTime >= binRight) {
              break;
            }
          }

          dataIndices[dataIndex] = i;

          if (valuesInBin.length > 0) {
            entry[dataItem.title] = R.mean(valuesInBin);
          } else {
            const prevDataPoint =
              timeIndex === 0 ? 0 : prev[timeIndex - 1][dataItem.title];
            entry[dataItem.title] = prevDataPoint;
          }
        });

        return [...prev, entry];
      },
      [] as ChartPoint[],
    );

    return chartData;
  };

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
