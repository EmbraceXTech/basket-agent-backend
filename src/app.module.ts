import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [DbModule, AgentModule],
})
export class AppModule {}
