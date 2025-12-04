/**
 * 배터리 예측 모델 테스트 및 예시
 */

import {
  predictBatteryPerformance,
  predictSOHAfterCycles,
  predictSOHAfterMonths,
  calculateEffectiveWhPerKm,
  type BatteryProfile,
  type EnvironmentConditions,
  type UserProfile
} from './batteryPrediction';

// ============================================
// 테스트 시나리오 1: 이상적인 조건
// ============================================
console.log('=== 테스트 1: 이상적인 조건 ===');

const idealBattery: BatteryProfile = {
  capacityAh: 35,
  voltage: 24,
  currentSOC: 80,
  currentSOH: 100,
  cycleCount: 50,
  ageMonths: 6
};

const idealEnv: EnvironmentConditions = {
  temperature: 25,
  humidity: 60,
  windSpeed: 1,
  windDirection: 0,
  slopeGrade: 0,
  surfaceType: 'asphalt'
};

const idealUser: UserProfile = {
  totalWeight: 100,
  baselineWeight: 100,
  drivingPattern: 'smooth',
  stopsPerKm: 1
};

const result1 = predictBatteryPerformance(idealBattery, idealEnv, idealUser);
console.log('결과:', {
  '주행 가능 거리': `${(result1.expectedRangeMeters / 1000).toFixed(1)}km`,
  'km당 소모량': `${result1.whPerKmEffective}Wh/km`,
  '예상 시간': `${result1.estimatedDurationMin}분`,
  '1년 후 SOH': `${result1.sohAfter1Year}%`,
  '500 사이클 후 SOH': `${result1.sohAfter500Cycles}%`,
  '경고 레벨': result1.warningLevel,
  '권장사항': result1.recommendations
});

// ============================================
// 테스트 시나리오 2: 악조건 (저온 + 경사)
// ============================================
console.log('\n=== 테스트 2: 악조건 (저온 + 경사) ===');

const harshBattery: BatteryProfile = {
  capacityAh: 35,
  voltage: 24,
  currentSOC: 50,
  currentSOH: 85,
  cycleCount: 300,
  ageMonths: 18
};

const harshEnv: EnvironmentConditions = {
  temperature: 0,
  humidity: 80,
  windSpeed: 5,
  windDirection: 0,
  slopeGrade: 8,
  surfaceType: 'rough'
};

const harshUser: UserProfile = {
  totalWeight: 130,
  baselineWeight: 100,
  drivingPattern: 'aggressive',
  stopsPerKm: 5
};

const result2 = predictBatteryPerformance(harshBattery, harshEnv, harshUser);
console.log('결과:', {
  '주행 가능 거리': `${(result2.expectedRangeMeters / 1000).toFixed(1)}km`,
  'km당 소모량': `${result2.whPerKmEffective}Wh/km`,
  '예상 시간': `${result2.estimatedDurationMin}분`,
  '1년 후 SOH': `${result2.sohAfter1Year}%`,
  '500 사이클 후 SOH': `${result2.sohAfter500Cycles}%`,
  '경고 레벨': result2.warningLevel,
  '권장사항': result2.recommendations
});

// ============================================
// 테스트 시나리오 3: 배터리 부족
// ============================================
console.log('\n=== 테스트 3: 배터리 부족 ===');

const lowBattery: BatteryProfile = {
  capacityAh: 35,
  voltage: 24,
  currentSOC: 15,
  currentSOH: 90,
  cycleCount: 150,
  ageMonths: 12
};

const normalEnv: EnvironmentConditions = {
  temperature: 20,
  humidity: 65,
  windSpeed: 2,
  windDirection: 90,
  slopeGrade: 2,
  surfaceType: 'concrete'
};

const normalUser: UserProfile = {
  totalWeight: 110,
  baselineWeight: 100,
  drivingPattern: 'normal',
  stopsPerKm: 3
};

const result3 = predictBatteryPerformance(lowBattery, normalEnv, normalUser);
console.log('결과:', {
  '주행 가능 거리': `${(result3.expectedRangeMeters / 1000).toFixed(1)}km`,
  'km당 소모량': `${result3.whPerKmEffective}Wh/km`,
  '예상 시간': `${result3.estimatedDurationMin}분`,
  '1년 후 SOH': `${result3.sohAfter1Year}%`,
  '500 사이클 후 SOH': `${result3.sohAfter500Cycles}%`,
  '경고 레벨': result3.warningLevel,
  '권장사항': result3.recommendations
});

// ============================================
// 테스트 시나리오 4: 고온 환경
// ============================================
console.log('\n=== 테스트 4: 고온 환경 ===');

const hotEnv: EnvironmentConditions = {
  temperature: 38,
  humidity: 40,
  windSpeed: 3,
  windDirection: 180,
  slopeGrade: -3, // 내리막
  surfaceType: 'asphalt'
};

const result4 = predictBatteryPerformance(idealBattery, hotEnv, normalUser);
console.log('결과:', {
  '주행 가능 거리': `${(result4.expectedRangeMeters / 1000).toFixed(1)}km`,
  'km당 소모량': `${result4.whPerKmEffective}Wh/km`,
  '예상 시간': `${result4.estimatedDurationMin}분`,
  '1년 후 SOH': `${result4.sohAfter1Year}%`,
  '500 사이클 후 SOH': `${result4.sohAfter500Cycles}%`,
  '경고 레벨': result4.warningLevel,
  '권장사항': result4.recommendations
});

// ============================================
// SOH 장기 예측 테스트
// ============================================
console.log('\n=== SOH 장기 예측 ===');

const testBattery: BatteryProfile = {
  capacityAh: 35,
  voltage: 24,
  currentSOC: 80,
  currentSOH: 100,
  cycleCount: 0,
  ageMonths: 0
};

console.log('초기 SOH: 100%');
console.log('6개월 후:', predictSOHAfterMonths(testBattery, 6, 25).toFixed(1) + '%');
console.log('1년 후:', predictSOHAfterMonths(testBattery, 12, 25).toFixed(1) + '%');
console.log('2년 후:', predictSOHAfterMonths(testBattery, 24, 25).toFixed(1) + '%');
console.log('3년 후:', predictSOHAfterMonths(testBattery, 36, 25).toFixed(1) + '%');

console.log('\n사이클 기반 예측:');
console.log('100 사이클 후:', predictSOHAfterCycles(testBattery, 100, 25, 0.7).toFixed(1) + '%');
console.log('300 사이클 후:', predictSOHAfterCycles(testBattery, 300, 25, 0.7).toFixed(1) + '%');
console.log('500 사이클 후:', predictSOHAfterCycles(testBattery, 500, 25, 0.7).toFixed(1) + '%');
console.log('1000 사이클 후:', predictSOHAfterCycles(testBattery, 1000, 25, 0.7).toFixed(1) + '%');

// ============================================
// 에너지 소모량 비교
// ============================================
console.log('\n=== 조건별 에너지 소모량 비교 ===');

const conditions = [
  { name: '이상적', env: idealEnv, user: idealUser },
  { name: '저온', env: { ...idealEnv, temperature: 0 }, user: idealUser },
  { name: '고온', env: { ...idealEnv, temperature: 38 }, user: idealUser },
  { name: '급경사', env: { ...idealEnv, slopeGrade: 10 }, user: idealUser },
  { name: '강풍', env: { ...idealEnv, windSpeed: 8 }, user: idealUser },
  { name: '과체중', env: idealEnv, user: { ...idealUser, totalWeight: 150 } },
  { name: '거친 노면', env: { ...idealEnv, surfaceType: 'gravel' as const }, user: idealUser },
];

conditions.forEach(({ name, env, user }) => {
  const whPerKm = calculateEffectiveWhPerKm(env, user);
  console.log(`${name}: ${whPerKm.toFixed(1)} Wh/km`);
});

// ============================================
// 실제 사용 예시
// ============================================
console.log('\n=== 실제 사용 예시 ===');
console.log(`
// 웹 앱에서 사용하는 방법:

import { predictBatteryPerformance, fetchWeatherData } from './batteryPrediction';

// 1. 사용자 정보 수집
const battery = {
  capacityAh: 35,
  voltage: 24,
  currentSOC: 70,
  currentSOH: 95,
  cycleCount: 200,
  ageMonths: 12
};

// 2. 실시간 기상 데이터 가져오기
const weather = await fetchWeatherData(37.5665, 126.9780);

// 3. 환경 조건 설정
const env = {
  temperature: weather.temperature,
  humidity: weather.humidity,
  windSpeed: weather.windSpeed,
  windDirection: weather.windDirection,
  slopeGrade: 3, // GPS 고도 데이터로 계산
  surfaceType: 'asphalt'
};

// 4. 사용자 프로필
const user = {
  totalWeight: 110,
  baselineWeight: 100,
  drivingPattern: 'normal',
  stopsPerKm: 2
};

// 5. 예측 실행
const prediction = predictBatteryPerformance(battery, env, user);

// 6. 결과 표시
console.log(\`주행 가능 거리: \${(prediction.expectedRangeMeters / 1000).toFixed(1)}km\`);
console.log(\`예상 시간: \${prediction.estimatedDurationMin}분\`);
console.log(\`경고: \${prediction.warningLevel}\`);
prediction.recommendations.forEach(rec => console.log(rec));
`);

export {};
