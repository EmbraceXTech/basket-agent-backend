import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from 'src/config';

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    useFactory: async () => {
      const pool = new Pool({
        connectionString: `${config.databaseUrl}?sslmode=no-verify`,
      });
      return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    },
  },
];
