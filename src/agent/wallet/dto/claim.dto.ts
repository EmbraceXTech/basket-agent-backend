import { OAuthMethod } from '@getpara/server-sdk';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimPregensDto {
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  identifierType:
    | 'EMAIL'
    | 'PHONE'
    | 'CUSTOM_ID'
    | OAuthMethod.TWITTER
    | OAuthMethod.DISCORD
    | OAuthMethod.TELEGRAM;
}

export default ClaimPregensDto;
