import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PriceService } from './price.service';

@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Get(':token')
  async getPrice(@Param('token') token: string) {
    try {
      return await this.priceService.getPrice(token);
    } catch (e) {
      throw new NotFoundException(`Token ${token} price not found`);
    }
  }
}
