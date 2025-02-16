import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [PriceController],
  providers: [PriceService],
  imports: [TokenModule],
  exports: [PriceService],
})
export class PriceModule {}
