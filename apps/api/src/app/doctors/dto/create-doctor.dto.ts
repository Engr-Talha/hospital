import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDoctorBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1, { message: 'Medical field is required' })
  @MaxLength(512)
  medicalField!: string;
}
