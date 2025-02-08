import { Module } from '@nestjs/common';
import { DrizzleAsyncProvider } from './drizzle.provider';
import { drizzleProvider } from './drizzle.provider';

@Module({
  providers: [...drizzleProvider],
  exports: [DrizzleAsyncProvider],
})
export class DbModule {}
