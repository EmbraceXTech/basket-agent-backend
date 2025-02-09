import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class FaucetDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
