import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { AppState } from '../schemas/user-session.schema';

export class UpdateAppStateDto {
  @IsEnum(AppState)
  appState: AppState;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class UpdatePushTokenDto {
  @IsString()
  expoPushToken: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class DeviceInfoDto {
  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  brand?: string;
}
