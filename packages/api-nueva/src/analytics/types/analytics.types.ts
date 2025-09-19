export enum EventType {
  APP_START = 'app_start',
  SCREEN_VIEW = 'screen_view',
  USER_ACTION = 'user_action',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
}

export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  UNKNOWN = 'unknown',
}
