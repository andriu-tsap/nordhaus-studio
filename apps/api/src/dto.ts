import {
  IsEmail,
  IsString,
  Length,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsInt,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { employees, stages } from '@nordhaus/domain';
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @Length(8, 200) password!: string;
}
export class ConfigurationDto {
  @ApiProperty() @IsNumber() @Min(3) @Max(7) width!: number;
  @ApiProperty() @IsNumber() @Min(2) @Max(5) depth!: number;
  @ApiProperty() @IsNumber() @Min(2.3) @Max(3.2) height!: number;
  @ApiProperty() @IsIn(['louvres', 'glass', 'polycarbonate']) roof!:
    'louvres' | 'glass' | 'polycarbonate';
  @ApiProperty() @IsIn(['#343b3c', '#ede8de', '#867761']) ral!: string;
  @ApiProperty() @IsBoolean() led!: boolean;
  @ApiProperty() @IsBoolean() blinds!: boolean;
}
export class LeadDto {
  @ApiProperty() @IsString() @Length(2, 100) name!: string;
  @ApiProperty() @IsEmail() @Length(3, 200) email!: string;
  @ApiProperty() @IsString() @Length(0, 2000) message!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfigurationDto)
  configuration?: ConfigurationDto;
}
export class BookingDto {
  @ApiProperty() @IsIn(employees) employee!: string;
  @ApiProperty() @IsISO8601() start!: string;
  @ApiProperty() @IsString() @Length(2, 100) name!: string;
  @ApiProperty() @IsEmail() @Length(3, 200) email!: string;
}
export class StageDto {
  @ApiProperty({ enum: stages }) @IsIn(stages) stage!: (typeof stages)[number];
}
export class ItemDto {
  @ApiProperty() @IsString() @Length(1, 100) productId!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(20) quantity!: number;
  @ApiProperty() @IsString() @Length(1, 100) color!: string;
  @ApiProperty() @IsString() @Length(1, 100) size!: string;
}
export class CheckoutDto {
  @ApiProperty() @IsEmail() @Length(3, 200) email!: string;
  @ApiProperty({ type: [ItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
}
export class RoofRatesDto {
  @ApiProperty() @IsInt() @Min(100) @Max(1000000) louvres!: number;
  @ApiProperty() @IsInt() @Min(100) @Max(1000000) glass!: number;
  @ApiProperty() @IsInt() @Min(100) @Max(1000000) polycarbonate!: number;
}
export class PriceDto {
  @ApiProperty() @IsInt() @Min(100) @Max(10000000) base!: number;
  @ApiProperty() @ValidateNested() @Type(() => RoofRatesDto) perM2!: RoofRatesDto;
  @ApiProperty() @IsInt() @Min(0) @Max(1000000) led!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(1000000) blinds!: number;
  @ApiProperty() @IsInt() @IsIn([23]) vat!: number;
}
