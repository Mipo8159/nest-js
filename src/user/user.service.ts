import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { sign } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseInterface } from './types/user-response.interface';
import { UserEntity } from './user.entity';
import { compare } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // REGISTER
  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const exists = await this.userRepository.findOne({ email: dto.email });
    if (exists) {
      throw new HttpException(
        'Email is already taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const user = new UserEntity();
    Object.assign(user, dto);
    return await this.userRepository.save(user);
  }

  // LOGIN
  async login(dto: LoginUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne(
      { email: dto.email },
      { select: ['id', 'username', 'email', 'bio', 'img', 'password'] },
    );

    if (!user) {
      throw new HttpException(
        'User not found',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isMatch = await compare(dto.password, user.password);
    if (!isMatch) {
      throw new HttpException(
        'Invalid credentials',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    delete user.password;
    return user;
  }

  // FIND BY ID
  async findById(id: number): Promise<UserEntity> {
    return await this.userRepository.findOne(id);
  }

  // BUILD RESPONSE
  buildUseresponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }

  // GENERATE JWT
  generateJwt(user: UserEntity): string {
    return sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
    );
  }
}
