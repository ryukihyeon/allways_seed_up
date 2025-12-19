import { Station, Report, WeatherData } from './types';

// 대구 중앙로역 중심 (대구도시철도 테스트용)
export const INITIAL_CENTER = { lat: 35.8694, lng: 128.6061 };

export const MOCK_STATIONS: Station[] = [];

export const MOCK_REPORTS: Report[] = [];

export const REPORT_TYPES = [
  { value: 'OBSTACLE', label: '장애물/단차', color: 'red' },
  { value: 'BROKEN_LIFT', label: '승강기 고장', color: 'orange' },
  { value: 'SLOPE', label: '급경사', color: 'purple' },
  { value: 'CONSTRUCTION', label: '공사중', color: 'blue' },
];

export const SEVERITY_LEVELS = [
    { value: 'CAUTION', label: '주의', color: 'yellow', border: 'border-yellow-500', bg: 'bg-yellow-500' },
    { value: 'WARNING', label: '경고', color: 'orange', border: 'border-orange-500', bg: 'bg-orange-500' },
    { value: 'DANGER', label: '위험', color: 'red', border: 'border-red-500', bg: 'bg-red-500' },
];

export const MOCK_WEATHER: WeatherData = {
  temp: 18,
  condition: 'Cloudy',
  windSpeed: 2.5
};

export const WHEELCHAIR_MODELS = [
  { name: 'Standard Light (경량형)', capacity: 20, weight: 60 },
  { name: 'Standard Heavy (일반형)', capacity: 35, weight: 90 },
  { name: 'Power Pro (고출력형)', capacity: 50, weight: 110 },
  { name: 'Long Range (장거리형)', capacity: 70, weight: 100 },
  { name: 'Custom (직접 입력)', capacity: 40, weight: 100 },
];