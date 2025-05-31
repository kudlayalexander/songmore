import { CreateUserDto } from '@songmore/common';
import { IsString, MinLength } from 'class-validator';
import { OmitType } from '@nestjs/swagger';

export class RegisterDto extends OmitType(CreateUserDto, ['password'] as const) {
  @IsString()
  @MinLength(6)
  password: string;
} 