import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
}
