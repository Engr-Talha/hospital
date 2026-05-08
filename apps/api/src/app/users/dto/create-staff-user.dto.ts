import { Role } from '@hospital/shared';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class CreateStaffUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(Role)
  role!: Role;
}
