import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UpdateBulkDto {
  @IsString()
  strategy: string;

  @IsInt()
  @Min(0)
  stopLossUSD: number;

  @IsInt()
  @Min(0)
  takeProfitUSD: number;

  @IsInt()
  @Min(0)
  intervalSeconds: number;

  @IsNotEmpty()
  endDate: Date;
}
