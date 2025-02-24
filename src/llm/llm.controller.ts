import { Controller, Get } from '@nestjs/common';
import { LlmService } from './llm.service';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('generate-trade-plan')
  generateTradePlan() {
    return this.llmService.generateTradePlan('3');
  }
}
