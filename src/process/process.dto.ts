import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class ProcessDto {
  @IsInt()
  @Min(1)
  @Max(3)
  processId: number;

  @IsInt()
  @IsOptional()
  personId?: number;
}
