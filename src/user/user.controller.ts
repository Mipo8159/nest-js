import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { BackendValidationPipe } from 'src/shared/pipes/backend-validation.pipe';
import { User } from './decorators/user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from './guards/auth.guard';
import { UserResponseInterface } from './types/user-response.interface';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // REGISTER
  @Post('register')
  @UsePipes(new BackendValidationPipe())
  public async createUser(
    @Body('user') dto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.createUser(dto);
    return this.userService.buildUseresponse(user);
  }

  // LOGIN
  @Post('login')
  @UsePipes(new BackendValidationPipe())
  async login(@Body('user') dto: LoginUserDto): Promise<UserResponseInterface> {
    const user = await this.userService.login(dto);
    return this.userService.buildUseresponse(user);
  }

  // ACCESS
  @Get('access')
  @UseGuards(AuthGuard)
  async access(@User() user: UserEntity): Promise<UserResponseInterface> {
    return this.userService.buildUseresponse(user);
  }
}
