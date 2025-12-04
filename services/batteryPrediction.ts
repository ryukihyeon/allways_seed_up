/**
 * 전동휠체어 정밀 배터리 예측 엔진
 * 논문 기반 Capacity Fade 모델 + 실시간 주행 조건 모델
 */

// ============================================
// 1. 타입 정의
// ============================================

export interface BatteryProfile {
  capacityAh: number;        // 배터리 용량 (Ah)
  voltage: number;           // 전압 (V)
  currentSOC: number;        // 현재 충전 상태 (%)
  currentSOH: number;        // 현재 건강 상태 (%)
  cycleCount: number;        // 충방전 사이클 수
  ageMonths: number;         // 사용 개월 수
}

export interface EnvironmentConditions {
  temperature: number;       // 기온 (°C)
  humidity: number;          // 습도 (%)
  windSpeed: number;         // 풍속 (m/s)
  windDirection: number;     // 풍향 (도, 0=북)
  slopeGrade: number;        // 경사도 (%)
  surfaceType: 'asphalt' | 'concrete' | 'rough' | 'gravel'; // 노면 상태
}

export interface UserProfile {
  totalWeight: number;       // 사용자 + 휠체어 무게 (kg)
  baselineWeight: number;    // 기준 무게 (kg)
  drivingPattern: 'smooth' | 'normal' | 'aggressive'; // 주행 패턴
  stopsPerKm: number;        // km당 정지 횟수
}

export interface PredictionResult {
  expectedRangeMeters: number;      // 예상 주행 가능 거리 (m)
  whPerKmEffective: number;         // 실효 km당 에너지 소모 (Wh/km)
  estimatedDurationMin: number;     // 예상 소요 시간 (분)
  sohAfter1Year: number;            // 1년 후 SOH (%)
  sohAfter500Cycles: number;        // 500 사이클 후 SOH (%)
  warningLevel: 'safe' | 'caution' | 'warning' | 'danger';
  recommendations: string[];
}

// ============================================
// 2. 상수 정의
// ============================================

const CONSTANTS = {
  // 기준 에너지 소모량 (Wh/km) - 전동휠체어 평균
  BASE_WH_PER_KM: 45,
  
  // 온도 계수
  TEMP_OPTIMAL: 25,          // 최적 온도 (°C)
  TEMP_ALPHA: 0.012,         // 온도 영향 계수
  
  // 경사도 계수
  SLOPE_BETA: 0.15,          // 경사도 영향 계수
  
  // 노면 계수
  SURFACE_FACTORS: {
    asphalt: 1.0,
    concrete: 1.05,
    rough: 1.3,
    gravel: 1.5
  },
  
  // 무게 계수
  WEIGHT_FACTOR: 0.05,       // 10kg당 5% 증가
  
  // 바람 계수
  WIND_FACTOR: 0.03,         // m/s당 3% 증가
  
  // 정지 계수
  STOP_FACTOR: 0.02,         // 정지당 2% 증가
  
  // 주행 패턴 계수
  DRIVING_PATTERN_FACTORS: {
    smooth: 0.9,
    normal: 1.0,
    aggressive: 1.2
  },
  
  // Capacity Fade 기준값
  CAP_REF_FADE: 0.000001,    // 기준 열화율 (Ah/s)
  
  // 안전 여유율
  SAFETY_MARGIN: 0.15,       // 15% 안전 여유
  
  // 평균 속도 (km/h)
  AVG_SPEED: 6.0
};

// ============================================
// 3. 단기 예측 모델 (실시간 소모량)
// ============================================

/**
 * 온도 보정 계수 계산
 */
function calculateTempFactor(temp: number): number {
  const tempDiff = CONSTANTS.TEMP_OPTIMAL - temp;
  
  if (temp < 0) {
    // 영하에서는 급격한 성능 저하
    return 1 + 0.4 + Math.abs(tempDiff) * 0.02;
  } else if (temp < 10) {
    // 저온에서 성능 저하
    return 1 + tempDiff * 0.02;
  } else if (temp > 35) {
    // 고온에서도 성능 저하
    return 1 + (temp - 35) * 0.015;
  }
  
  return 1 + tempDiff * CONSTANTS.TEMP_ALPHA;
}

/**
 * 경사도 보정 계수 계산
 */
function calculateSlopeFactor(grade: number): number {
  // 오르막: 에너지 소모 증가
  // 내리막: 회생제동 효과 (최대 20% 절감)
  if (grade > 0) {
    return 1 + grade * CONSTANTS.SLOPE_BETA;
  } else {
    // 내리막 회생제동 효과
    return Math.max(0.8, 1 + grade * 0.1);
  }
}

/**
 * 노면 보정 계수 계산
 */
function calculateSurfaceFactor(surfaceType: EnvironmentConditions['surfaceType']): number {
  return CONSTANTS.SURFACE_FACTORS[surfaceType];
}

/**
 * 무게 보정 계수 계산
 */
function calculateWeightFactor(totalWeight: number, baselineWeight: number): number {
  const deltaWeight = Math.max(0, totalWeight - baselineWeight);
  return 1 + CONSTANTS.WEIGHT_FACTOR * (deltaWeight / 10);
}

/**
 * 바람 보정 계수 계산
 */
function calculateWindFactor(
  windSpeed: number, 
  windDirection: number, 
  travelDirection: number = 0
): number {
  // 풍향과 이동 방향의 차이 계산
  const angleDiff = Math.abs(windDirection - travelDirection);
  const angleRad = (angleDiff * Math.PI) / 180;
  
  // 정면 바람 성분 계산
  const headwindComponent = windSpeed * Math.cos(angleRad);
  
  // 정면 바람일 때만 영향
  if (headwindComponent > 0) {
    return 1 + CONSTANTS.WIND_FACTOR * headwindComponent;
  }
  
  return 1.0;
}

/**
 * 정지 보정 계수 계산
 */
function calculateStopFactor(stopsPerKm: number): number {
  return 1 + CONSTANTS.STOP_FACTOR * stopsPerKm;
}

/**
 * 주행 패턴 보정 계수
 */
function calculateDrivingPatternFactor(pattern: UserProfile['drivingPattern']): number {
  return CONSTANTS.DRIVING_PATTERN_FACTORS[pattern];
}

/**
 * 실효 에너지 소모량 계산 (Wh/km)
 */
export function calculateEffectiveWhPerKm(
  env: EnvironmentConditions,
  user: UserProfile
): number {
  const kTemp = calculateTempFactor(env.temperature);
  const kSlope = calculateSlopeFactor(env.slopeGrade);
  const kSurface = calculateSurfaceFactor(env.surfaceType);
  const kWeight = calculateWeightFactor(user.totalWeight, user.baselineWeight);
  const kWind = calculateWindFactor(env.windSpeed, env.windDirection);
  const kStops = calculateStopFactor(user.stopsPerKm);
  const kPattern = calculateDrivingPatternFactor(user.drivingPattern);
  
  const whPerKm = CONSTANTS.BASE_WH_PER_KM * 
    kTemp * kSlope * kSurface * kWeight * kWind * kStops * kPattern;
  
  return whPerKm;
}

// ============================================
// 4. 장기 예측 모델 (Capacity Fade)
// ============================================

/**
 * 전류 보정 계수 (FCUR)
 */
function calculateCurrentFactor(current: number, capacityAh: number): number {
  const cRate = Math.abs(current) / capacityAh;
  
  // C-rate에 따른 열화 가속
  if (cRate < 0.5) return 1.0;
  if (cRate < 1.0) return 1.2;
  if (cRate < 2.0) return 1.5;
  return 2.0;
}

/**
 * DOD 보정 계수 (FDOD)
 */
function calculateDODFactor(dod: number): number {
  // DOD가 클수록 열화 가속
  // 80% 이상 방전 시 급격한 열화
  if (dod < 0.5) return 1.0;
  if (dod < 0.7) return 1.3;
  if (dod < 0.8) return 1.6;
  return 2.2;
}

/**
 * 온도 보정 계수 (FT) - 열화용
 */
function calculateTempFactorForFade(temp: number, current: number): number {
  // 고온 + 고전류 = 급격한 열화
  const tempFactor = temp < 25 ? 1.0 : 1 + (temp - 25) * 0.05;
  const currentBoost = Math.abs(current) > 10 ? 1.2 : 1.0;
  
  return tempFactor * currentBoost;
}

/**
 * 충방전 패턴 보정 계수 (FDUR)
 */
function calculateDurationFactor(deltaDOD: number): number {
  // 급격한 충방전 스윙은 열화 가속
  return 1 + Math.abs(deltaDOD) * 0.5;
}

/**
 * Capacity Fade 계산 (1초당)
 */
function calculateCapacityFadePerSecond(
  battery: BatteryProfile,
  env: EnvironmentConditions,
  current: number,
  dod: number,
  deltaDOD: number
): number {
  const fCur = calculateCurrentFactor(current, battery.capacityAh);
  const fDOD = calculateDODFactor(dod);
  const fT = calculateTempFactorForFade(env.temperature, current);
  const fDur = calculateDurationFactor(deltaDOD);
  
  const capFade = CONSTANTS.CAP_REF_FADE * fCur * fDOD * fT * fDur;
  
  return capFade;
}

/**
 * SOH 예측 (N 사이클 후)
 */
export function predictSOHAfterCycles(
  battery: BatteryProfile,
  cycles: number,
  avgTemp: number = 25,
  avgDOD: number = 0.7
): number {
  // 간단한 선형 모델 (실제로는 비선형)
  const baseDecayPerCycle = 0.05; // 사이클당 0.05% 감소
  
  // 온도 영향
  const tempMultiplier = avgTemp > 25 ? 1 + (avgTemp - 25) * 0.02 : 1.0;
  
  // DOD 영향
  const dodMultiplier = avgDOD > 0.7 ? 1 + (avgDOD - 0.7) * 0.5 : 1.0;
  
  const totalDecay = baseDecayPerCycle * cycles * tempMultiplier * dodMultiplier;
  
  const newSOH = Math.max(50, battery.currentSOH - totalDecay);
  
  return newSOH;
}

/**
 * SOH 예측 (N 개월 후)
 */
export function predictSOHAfterMonths(
  battery: BatteryProfile,
  months: number,
  avgTemp: number = 25
): number {
  // 캘린더 노화 (시간 경과에 따른 자연 열화)
  const baseDecayPerMonth = 0.3; // 월 0.3% 감소
  
  // 온도 영향
  const tempMultiplier = avgTemp > 25 ? 1 + (avgTemp - 25) * 0.03 : 1.0;
  
  const totalDecay = baseDecayPerMonth * months * tempMultiplier;
  
  const newSOH = Math.max(50, battery.currentSOH - totalDecay);
  
  return newSOH;
}

// ============================================
// 5. 통합 예측 엔진
// ============================================

/**
 * 종합 배터리 예측
 */
export function predictBatteryPerformance(
  battery: BatteryProfile,
  env: EnvironmentConditions,
  user: UserProfile
): PredictionResult {
  // 1. 실효 에너지 소모량 계산
  const whPerKmEff = calculateEffectiveWhPerKm(env, user);
  
  // 2. 사용 가능한 에너지 계산
  const totalWh = battery.capacityAh * battery.voltage;
  const usableSOC = (battery.currentSOC - CONSTANTS.SAFETY_MARGIN * 100) / 100;
  const usableWh = totalWh * usableSOC * (battery.currentSOH / 100);
  
  // 3. 예상 주행 거리 계산
  const rangeKm = Math.max(0, usableWh / whPerKmEff);
  const rangeMeters = rangeKm * 1000;
  
  // 4. 예상 소요 시간 계산
  const durationMin = (rangeKm / CONSTANTS.AVG_SPEED) * 60;
  
  // 5. 장기 SOH 예측
  const sohAfter1Year = predictSOHAfterMonths(battery, 12, env.temperature);
  const sohAfter500Cycles = predictSOHAfterCycles(battery, 500, env.temperature);
  
  // 6. 경고 레벨 결정
  let warningLevel: PredictionResult['warningLevel'] = 'safe';
  if (battery.currentSOC < 30) warningLevel = 'caution';
  if (battery.currentSOC < 20) warningLevel = 'warning';
  if (battery.currentSOC < 10) warningLevel = 'danger';
  
  // 7. 권장사항 생성
  const recommendations: string[] = [];
  
  if (env.temperature < 5) {
    recommendations.push('⚠️ 저온 환경: 배터리 성능이 저하됩니다. 실내 보관을 권장합니다.');
  }
  if (env.temperature > 35) {
    recommendations.push('⚠️ 고온 환경: 배터리 열화가 가속됩니다. 그늘에서 휴식하세요.');
  }
  if (env.slopeGrade > 5) {
    recommendations.push('⚠️ 급경사: 에너지 소모가 많습니다. 우회 경로를 고려하세요.');
  }
  if (battery.currentSOC < 20) {
    recommendations.push('🔋 배터리 부족: 가까운 충전소를 찾아주세요.');
  }
  if (battery.currentSOH < 80) {
    recommendations.push('🔧 배터리 노화: 배터리 교체를 고려하세요.');
  }
  
  return {
    expectedRangeMeters: Math.floor(rangeMeters),
    whPerKmEffective: parseFloat(whPerKmEff.toFixed(2)),
    estimatedDurationMin: Math.ceil(durationMin),
    sohAfter1Year: parseFloat(sohAfter1Year.toFixed(1)),
    sohAfter500Cycles: parseFloat(sohAfter500Cycles.toFixed(1)),
    warningLevel,
    recommendations
  };
}

// ============================================
// 6. 기상청 API 연동
// ============================================

export interface WeatherAPIResponse {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
}

/**
 * 기상청 API 호출
 */
export async function fetchWeatherData(
  lat: number, 
  lng: number
): Promise<WeatherAPIResponse> {
  try {
    // 위경도를 기상청 격자 좌표로 변환 (간단한 근사)
    const nx = Math.round(55 + (lng - 126.0) * 10);
    const ny = Math.round(127 + (lat - 37.0) * 10);
    
    const now = new Date();
    const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    const baseTime = now.getHours().toString().padStart(2, '0') + '00';
    
    const apiKey = '03ea2a02da7c80f30638612b4106a7c297432911fb0351c233e67c20a5ac076b';
    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`;
    
    const params = new URLSearchParams({
      serviceKey: apiKey,
      pageNo: '1',
      numOfRows: '10',
      dataType: 'JSON',
      base_date: baseDate,
      base_time: baseTime,
      nx: nx.toString(),
      ny: ny.toString()
    });
    
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();
    
    // 응답 파싱
    let temperature = 20;
    let humidity = 60;
    let windSpeed = 2;
    let windDirection = 0;
    
    if (data.response?.body?.items?.item) {
      const items = data.response.body.items.item;
      
      items.forEach((item: any) => {
        switch (item.category) {
          case 'T1H': // 기온
            temperature = parseFloat(item.obsrValue);
            break;
          case 'REH': // 습도
            humidity = parseFloat(item.obsrValue);
            break;
          case 'WSD': // 풍속
            windSpeed = parseFloat(item.obsrValue);
            break;
          case 'VEC': // 풍향
            windDirection = parseFloat(item.obsrValue);
            break;
        }
      });
    }
    
    return { temperature, humidity, windSpeed, windDirection };
  } catch (error) {
    console.error('기상청 API 호출 실패:', error);
    // 기본값 반환
    return {
      temperature: 20,
      humidity: 60,
      windSpeed: 2,
      windDirection: 0
    };
  }
}
