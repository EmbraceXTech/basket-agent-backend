import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import * as schema from 'src/db/schema';

@Injectable()
export class AgentGuard implements CanActivate {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const agentId = request.params.agentId;

    if (!agentId) {
      throw new BadRequestException('agentId is required');
    }

    const agent = await this.findAgent(agentId);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.userId !== request.user.sub) {
      throw new ForbiddenException('You are not allowed to access this agent');
    }

    request.agentId = agentId;

    return true;
  }

  async findAgent(agentId: string) {
    const agent = await this.db.query.agentsTable.findFirst({
      where: eq(schema.agentsTable.id, +agentId),
    });
    return agent;
  }
}
