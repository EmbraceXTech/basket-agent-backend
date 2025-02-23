import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BuyDto } from '../wallet/dto/buy.dto';
import { SellDto } from '../wallet/dto/sell.dto';

export class TradeStepDto {
  @IsString()
  @IsNotEmpty()
  type: 'buy' | 'sell' | 'hold';

  data: BuyDto | SellDto | null;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TradePlanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TradeStepDto)
  steps: TradeStepDto[];
}
