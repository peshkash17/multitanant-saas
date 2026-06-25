import { IsNumber, IsString, IsOptional, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentRequestDto {
  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
