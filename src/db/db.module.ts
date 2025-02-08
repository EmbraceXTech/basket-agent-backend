import { Global, Module } from '@nestjs/common';
import { DrizzleAsyncProvider } from './drizzle.provider';
import { drizzleProvider } from './drizzle.provider';

@Global()
@Module({
  providers: [...drizzleProvider],
  exports: [DrizzleAsyncProvider],
})
export class DbModule {}
