import { IsNotEmpty, IsString } from 'class-validator';

export class SimulateTradeDto {
  @IsString()
  @IsNotEmpty()
  strategyDescription: string;
}
