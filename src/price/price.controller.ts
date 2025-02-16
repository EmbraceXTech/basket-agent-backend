import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PriceService } from './price.service';

@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get('/:tokens')
  async getPrices(@Param('tokens') tokens: string) {
    try {
      return await this.priceService.getPrices(tokens.split(','));
    } catch (e) {
      throw new NotFoundException(`Tokens ${tokens} price not found`);
    }
  }
}
