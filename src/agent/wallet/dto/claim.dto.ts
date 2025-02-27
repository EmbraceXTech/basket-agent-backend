import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ClaimPregensDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}

export default ClaimPregensDto;
