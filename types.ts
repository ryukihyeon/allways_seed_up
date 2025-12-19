export interface Station {
  id: number | string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  isAvailable: boolean; // 충전기 상태
  type: 'FAST' | 'NORMAL' | 'SUBWAY';
  // 지하철 충전소 전용 필드
  lineCode?: string;
  lineName?: string;
  chargingLocation?: string;
  // 실시간 충전기 정보 필드
  fastChargerCount?: number;
  normalChargerCount?: number;
  hasCharger?: boolean;
}

export interface Report {
  id: number;
  lat: number;
  lng: number;
  type: 'OBSTACLE' | 'BROKEN_LIFT' | 'SLOPE' | 'CONSTRUCTION';
  description: string;
  createdAt: string;
  severity: 'CAUTION' | 'WARNING' | 'DANGER';
  imageUrl?: string;
}

// 사용자 입력 정보 (초기 설정)
export interface UserProfile {
  modelName: string;
  batteryCapacityAh: number; // 배터리 용량 (Ampere-hours)
  batteryVoltage: number; // 배터리 전압 (V)
  wheelchairWeight: number; // 휠체어 자체 무게 (kg)
  userWeight: number; // 사용자 몸무게 (kg)
  weightTotal: number; // 총 무게 (휠체어 + 사용자) (kg)
  productId?: string; // 제품 ID (API 연동용)
}

// 자동 수집되는 환경 정보
export interface EnvironmentData {
  temp: number; // 기온 (Celsius)
  slopeAvg: number; // 평균 경사도 (Degrees or %)
  windSpeed: number; // 풍속 (m/s)
}

export interface WeatherData {
  temp: number;
  condition: string;
  windSpeed: number;
}

// 길찾기 및 위치 정보 관련
export interface RouteOption {
  mode: 'SUBWAY' | 'BUS' | 'WALK' | 'TAXI';
  durationMin: number;
  cost: number;
  distanceKm: number;
  details: string;
  path?: Array<{lat: number, lng: number}>; // 경로 좌표
  warnings?: string[]; // 경고 메시지
  blockedSections?: Array<{
    block: RoadBlock;
    distance: number;
  }>; // 차단 구간 정보
}

export interface LocationInfo {
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  name?: string;
}

// 도로 차단 정보
export interface RoadBlock {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  blockType: 'construction' | 'repair' | 'event' | 'accident';
  severity: 'low' | 'medium' | 'high';
  description: string;
  detour?: string;
}