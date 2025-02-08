import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AgentService } from 'src/agent/agent.service';

@Injectable()
export class AgentGuard implements CanActivate {
  constructor(private agentService: AgentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const agentId = request.params.agentId;

    if (!agentId) {
      throw new BadRequestException('agentId is required');
    }

    const agent = await this.agentService.findOne(agentId);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.userId !== request.user.sub) {
      throw new ForbiddenException('You are not allowed to access this agent');
    }

    request.agentId = agentId;

    return true;
  }
}
