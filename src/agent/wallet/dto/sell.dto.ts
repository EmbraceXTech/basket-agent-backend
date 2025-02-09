import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class SellDto {
  @IsNotEmpty()
  @IsString()
  tokenAddress: string;

  @IsNotEmpty()
  @IsNumber()
  tokenAmount: number;
}
