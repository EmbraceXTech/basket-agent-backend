import { IsInt, Min } from 'class-validator';

export class UpdateStopLossDto {
  @IsInt()
  @Min(0)
  stopLossUSD: number;
}
