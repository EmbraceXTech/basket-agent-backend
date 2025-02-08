import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStrategyDto {
  @IsNotEmpty()
  @IsString()
  strategy: string;
}
