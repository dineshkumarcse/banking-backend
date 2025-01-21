import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdatePersonDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
