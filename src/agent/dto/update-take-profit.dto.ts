import { IsInt, Min } from 'class-validator';

export class UpdateTakeProfitDto {
  @IsInt()
  @Min(0)
  takeProfitUSD: number;
}
