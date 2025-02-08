import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from 'src/config';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import * as schema from 'src/db/schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async loginWithTelegram(telegramId: string) {
    let userId = 0;

    const user = await this.db.query.usersTable.findFirst({
      where: eq(schema.usersTable.telegramId, telegramId),
    });

    if (user) {
      userId = user.id;
    } else {
      const newUser = await this.db.insert(schema.usersTable).values({
        telegramId,
      });
      userId = newUser.oid;
    }

    if (userId === 0) {
      throw new UnauthorizedException('User can not be authenticated');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      { secret: config.authSecret, expiresIn: '30d' },
    );

    return accessToken;
  }
}
