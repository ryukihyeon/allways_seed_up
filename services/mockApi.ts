import { MOCK_STATIONS, MOCK_REPORTS, MOCK_WEATHER } from '../constants';
import { Station, Report, UserProfile, EnvironmentData, LocationInfo, RouteOption } from '../types';
import { kakaoApi } from './kakaoApi';
import { 
  predictBatteryPerformance, 
  fetchWeatherData,
  type BatteryProfile,
  type EnvironmentConditions,
  type UserProfile as BatteryUserProfile
} from './batteryPrediction';
import { 
  selectOptimalRoute, 
  annotateRouteWithBlocks,
  checkRouteIntersection 
} from './routeOptimizer';
import { fetchRoadBlockInfo, filterActiveBlocks } from './roadBlockApi';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Autocomplete Data (충전소 포함)
const MOCK_PLACES = [
  "강남구청", "강남 복지관", "강남 도서관",
  "서울시청", "서울역", "서초구청",
  "성동구민 체육센터", "성수역 2번 출구",
  "장애인 고용공단", "국립 재활원",
  "휠체어 수리센터 강북점", "한강공원 잠원지구 입구",
  
  // 충전소 검색 키워드
  "충전소", "급속충전소", "전동휠체어 충전",
  "서울시청 충전소", "강남구청 충전소", "강남역 충전소",
  "홍대입구역 충전소", "잠실역 충전소", "용산역 충전소",
  "가까운 충전소", "근처 충전소", "이용 가능한 충전소"
];

export const api = {
  getStations: async (): Promise<Station[]> => {
    await delay(300);
    return MOCK_STATIONS;
  },

  getReports: async (): Promise<Report[]> => {
    await delay(300);
    const storedReports = localStorage.getItem('wheely_reports');
    const localReports = storedReports ? JSON.parse(storedReports) : [];
    return [...MOCK_REPORTS, ...localReports];
  },

  postReport: async (report: Omit<Report, 'id' | 'createdAt'>): Promise<Report> => {
    await delay(500);
    const newReport: Report = {
      ...report,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    const storedReports = localStorage.getItem('wheely_reports');
    const localReports = storedReports ? JSON.parse(storedReports) : [];
    localStorage.setItem('wheely_reports', JSON.stringify([...localReports, newReport]));
    
    return newReport;
  },

  getWeather: async () => {
    await delay(200);
    // Simulate slight temperature fluctuation for real-time effect
    const variation = (Math.random() - 0.5) * 0.5; 
    return {
      ...MOCK_WEATHER,
      temp: parseFloat((MOCK_WEATHER.temp + variation).toFixed(1))
    };
  },

  getSlopeByLocation: async (lat: number, lng: number): Promise<number> => {
    await delay(150);
    const randomSlope = (Math.abs(lat * 1000) % 5) + (Math.abs(lng * 1000) % 3);
    return Math.min(10, parseFloat(randomSlope.toFixed(1)));
  },

  // 카카오 API를 사용한 역지오코딩
  reverseGeocode: async (lat: number, lng: number): Promise<LocationInfo> => {
    await delay(200);
    
    try {
      const response = await fetch(
        `/kakao-api/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0];
          return {
            lat,
            lng,
            address: doc.address?.address_name || '주소 정보 없음',
            roadAddress: doc.road_address?.address_name || doc.address?.address_name || '도로명 주소 없음',
            name: '선택된 위치'
          };
        }
      }
    } catch (error) {
      console.error('카카오 역지오코딩 실패:', error);
    }

    // API 실패 시 기본값 반환
    return {
      lat,
      lng,
      address: `서울 중구 세종대로 ${Math.floor(Math.random() * 100)}길`,
      roadAddress: `서울특별시 중구 태평로 ${Math.floor(Math.random() * 50)}`,
      name: '선택된 위치'
    };
  },

  // 카카오 API를 사용한 장소 검색
  searchLocations: async (query: string): Promise<LocationInfo[]> => {
    await delay(200);
    if (!query) return [];

    const results: LocationInfo[] = [];
    
    try {
      // 카카오 API로 실제 장소 검색
      const kakaoResults = await kakaoApi.searchPlaces(query);
      results.push(...kakaoResults.slice(0, 5));
    } catch (error) {
      console.error('카카오 장소 검색 실패, 로컬 데이터 사용:', error);
    }
    
    // 충전소 검색 (로컬 데이터)
    if (query.includes('충전') || query.includes('전동') || query.includes('배터리')) {
      const stations = await api.getStations();
      const matchingStations = stations
        .filter(station => 
          station.name.includes(query) || 
          station.address.includes(query) ||
          (query.includes('충전') && station.name.includes('충전소')) ||
          (query.includes('가까운') || query.includes('근처'))
        )
        .slice(0, 3)
        .map(station => ({
          name: `🔌 ${station.name}`,
          address: station.address,
          roadAddress: station.address,
          lat: station.lat,
          lng: station.lng
        }));
      
      results.push(...matchingStations);
    }
    
    // 카카오 API 결과가 없으면 로컬 데이터 사용
    if (results.length === 0) {
      const matches = MOCK_PLACES.filter(place => place.includes(query));
      const placeResults = matches.slice(0, 5).map((name, idx) => ({
        name: name,
        address: `서울시 가상구 ${name}로 ${idx + 1}길`,
        roadAddress: `서울시 가상구 ${name}대로 ${idx + 10}`,
        lat: 37.5665 + (Math.random() - 0.5) * 0.05,
        lng: 126.9780 + (Math.random() - 0.5) * 0.05
      }));
      
      results.push(...placeResults);
    }
    
    return results.slice(0, 8);
  },

  // 카카오 API를 사용한 실제 경로 계산 (도로 차단 고려)
  calculateRoutes: async (from: {lat: number, lng: number}, to: {lat: number, lng: number}): Promise<RouteOption[]> => {
    console.log('🗺️ 경로 계산 시작:', {
      출발: `${from.lat.toFixed(4)}, ${from.lng.toFixed(4)}`,
      도착: `${to.lat.toFixed(4)}, ${to.lng.toFixed(4)}`
    });

    await delay(300);
    const routes: RouteOption[] = [];

    // 1. 도보 경로 (항상 제공)
    const walkingRoute = await kakaoApi.getWalkingRoute(from.lat, from.lng, to.lat, to.lng);
    if (walkingRoute) {
      console.log('✅ 도보 경로 추가:', walkingRoute);
      routes.push(walkingRoute);
    } else {
      console.warn('❌ 도보 경로 생성 실패');
    }

    // 2. 택시 경로 (항상 제공)
    const taxiRoute = await kakaoApi.getTaxiRoute(from.lat, from.lng, to.lat, to.lng);
    if (taxiRoute) {
      console.log('✅ 택시 경로 추가:', taxiRoute);
      routes.push(taxiRoute);
    } else {
      console.warn('❌ 택시 경로 생성 실패');
    }

    // 3. 대중교통 경로
    const transitRoutes = await kakaoApi.getTransitRoute(from.lat, from.lng, to.lat, to.lng);
    if (transitRoutes && transitRoutes.length > 0) {
      console.log('✅ 대중교통 경로 추가:', transitRoutes.length + '개');
      routes.push(...transitRoutes);
    } else {
      console.warn('❌ 대중교통 경로 생성 실패');
    }

    // 4. 도로 차단 정보 확인 및 경로 최적화
    try {
      const roadBlocks = await fetchRoadBlockInfo();
      const activeBlocks = filterActiveBlocks(roadBlocks);
      
      if (activeBlocks.length > 0) {
        console.log('🚧 도로 차단 정보:', activeBlocks.length + '개');
        
        // 각 경로에 도로 차단 정보 추가
        const annotatedRoutes = routes.map(route => {
          const annotated = annotateRouteWithBlocks(route, activeBlocks);
          const intersection = checkRouteIntersection(route, activeBlocks);
          
          if (intersection.hasIntersection) {
            console.warn(`⚠️ ${route.mode} 경로에 차단 구간 발견:`, 
              intersection.intersectedBlocks.map(b => b.title));
          }
          
          return annotated;
        });
        
        // 최적 경로 선택
        if (annotatedRoutes.length > 0) {
          const optimization = selectOptimalRoute(annotatedRoutes, activeBlocks);
          
          console.log('🎯 최적 경로 선택:', {
            추천: `${optimization.recommended.mode} (${optimization.recommended.durationMin}분)`,
            이유: optimization.reason,
            경고: optimization.recommended.warnings?.length || 0
          });
          
          // 경고가 있는 경로는 details에 추가
          return annotatedRoutes.map(route => {
            const routeWithWarnings = route as RouteOption & { warnings?: string[] };
            if (routeWithWarnings.warnings && routeWithWarnings.warnings.length > 0) {
              return {
                ...route,
                details: `${route.details}\n⚠️ ${routeWithWarnings.warnings.join('\n')}`
              } as RouteOption;
            }
            return route as RouteOption;
          });
        }
      }
    } catch (error) {
      console.error('도로 차단 정보 확인 실패:', error);
    }

    // 경로가 없으면 기본 경로 제공
    if (routes.length === 0) {
      const dist = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)) * 111;
      const distKm = parseFloat(dist.toFixed(1)) || 1.5;

      const generateFallbackPath = () => {
        return [
          { lat: from.lat, lng: from.lng },
          { lat: from.lat + (to.lat - from.lat) * 0.5, lng: from.lng + (to.lng - from.lng) * 0.5 },
          { lat: to.lat, lng: to.lng }
        ];
      };

      routes.push(
        { 
          mode: 'WALK', 
          durationMin: Math.ceil(distKm / 3.5 * 60), 
          cost: 0, 
          distanceKm: distKm, 
          details: '휠체어 접근 가능 경로',
          path: generateFallbackPath()
        },
        { 
          mode: 'TAXI', 
          durationMin: Math.ceil(distKm / 20 * 60), 
          cost: 3800 + Math.floor((distKm - 1.6) / 0.132 * 132), 
          distanceKm: distKm, 
          details: '장애인 콜택시 이용 가능',
          path: generateFallbackPath()
        }
      );
    }

    console.log('📊 총 경로 수:', routes.length);
    
    // 도보 경로를 첫 번째로 정렬
    const sortedRoutes = routes.sort((a, b) => {
      if (a.mode === 'WALK') return -1;
      if (b.mode === 'WALK') return 1;
      if (a.mode === 'TAXI') return -1;
      if (b.mode === 'TAXI') return 1;
      return a.durationMin - b.durationMin;
    });

    console.log('✅ 경로 계산 완료:', sortedRoutes.map(r => ({
      모드: r.mode,
      거리: `${r.distanceKm}km`,
      시간: `${r.durationMin}분`,
      비용: `${r.cost}원`,
      경로점: r.path?.length || 0
    })));

    return sortedRoutes;
  },

  // --- 정밀 배터리 예측 모델 (논문 기반) ---
  predictRange: async (currentLevel: number, profile: UserProfile, env: EnvironmentData): Promise<number> => {
    try {
      // 배터리 프로필 생성
      const batteryProfile: BatteryProfile = {
        capacityAh: profile.batteryCapacityAh,
        voltage: 24,
        currentSOC: currentLevel,
        currentSOH: 100, // 기본값, 추후 사용자 입력으로 변경 가능
        cycleCount: 0,
        ageMonths: 0
      };

      // 환경 조건 생성
      const envConditions: EnvironmentConditions = {
        temperature: env.temp,
        humidity: 60, // 기본값
        windSpeed: env.windSpeed,
        windDirection: 0, // 기본값
        slopeGrade: env.slopeAvg,
        surfaceType: 'asphalt' // 기본값
      };

      // 사용자 프로필 생성
      const userProfile: BatteryUserProfile = {
        totalWeight: profile.weightTotal,
        baselineWeight: 100,
        drivingPattern: 'normal',
        stopsPerKm: 2
      };

      // 정밀 예측 실행
      const prediction = predictBatteryPerformance(
        batteryProfile,
        envConditions,
        userProfile
      );

      console.log('🔋 정밀 배터리 예측:', {
        예상거리: `${(prediction.expectedRangeMeters / 1000).toFixed(1)}km`,
        소모량: `${prediction.whPerKmEffective}Wh/km`,
        경고레벨: prediction.warningLevel,
        권장사항: prediction.recommendations
      });

      return prediction.expectedRangeMeters;
    } catch (error) {
      console.error('정밀 예측 실패, 기본 모델 사용:', error);
      
      // 폴백: 기본 모델
      const soc = currentLevel;
      const capacity_Ah = profile.batteryCapacityAh;
      const voltage = 24;
      const capacity_Wh = capacity_Ah * voltage;
      const base_Wh_per_km = 50;
      const reserve_soc = 15;

      if (soc <= reserve_soc) return 0;

      const soc_use = (soc - reserve_soc) / 100.0;
      const E_usable = capacity_Wh * soc_use;

      const k_temp = env.temp < 20 ? 1 + 0.015 * (20 - env.temp) : 1.0;
      const k_weight = 1 + 0.05 * (Math.max(0, profile.weightTotal - 100) / 10.0);
      const k_slope = 1 + 0.12 * env.slopeAvg;
      const k_wind = 1 + 0.03 * env.windSpeed;

      const Wh_per_km_eff = base_Wh_per_km * k_temp * k_weight * k_slope * k_wind;
      const D_batt_km = E_usable / Wh_per_km_eff;
      const D_reachable_km = Math.min(D_batt_km * 0.7, 15.0);

      return Math.floor(D_reachable_km * 1000);
    }
  }
};