import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from 'src/auth/at-payload.model';

export const GetJwtPayload = createParamDecorator(
  (
    data: keyof AccessTokenPayload | undefined = 'sub',
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest();
    if (!data) return request.user;
    return request.user[data];
  },
);
