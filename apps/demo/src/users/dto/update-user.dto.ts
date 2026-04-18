import { ApiPropertyOptional, IsString, IsEmail, IsOptional, MaxLength } from '@loonyjs/common';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Updated name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Updated email' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
