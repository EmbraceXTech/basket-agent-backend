import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class BuyDto {
  @IsNotEmpty()
  @IsString()
  tokenAddress: string;

  @IsNotEmpty()
  @IsNumber()
  usdAmount: number;
}
