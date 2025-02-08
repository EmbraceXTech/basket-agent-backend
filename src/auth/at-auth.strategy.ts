import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from 'src/config';
import { AccessTokenPayload } from './at-payload.model';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.authSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: AccessTokenPayload) {
    return payload;
  }
}
