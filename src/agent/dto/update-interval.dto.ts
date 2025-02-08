import { IsInt, Min } from 'class-validator';

export class UpdateIntervalDto {
  @IsInt()
  @Min(1)
  intervalSeconds: number;
}
