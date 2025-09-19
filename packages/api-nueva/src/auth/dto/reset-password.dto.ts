import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token received via email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
