import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ValidateUser } from 'src/common/decorators/validate-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check-at-valid')
  async checkATIsValid(@ValidateUser() userId: string) {
    console.log(userId);
    return true;
  }
}
