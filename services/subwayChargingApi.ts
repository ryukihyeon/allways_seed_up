/**
 * 대구도시철도 전동 휠체어 급속 충전기 API 모듈 (XML 데이터 기반)
 * 
 * 1. XML 데이터에서 충전소가 있는 역 목록 추출
 * 2. 카카오 로컬 API로 해당 역들의 좌표 검색
 * 3. 마커 클릭 시 실시간으로 충전기 정보 조회
 */

// 대구 지하철 충전소 데이터 타입 정의
export interface SubwayChargingStation {
  id: string;
  stationName: string;        // 역명 (예: "반월당역")
  lineName: string;           // 호선 (예: "1호선")
  lineCode: string;           // 호선 코드 (예: "1")
  lat: number;                // 위도 (카카오맵에서 검색)
  lng: number;                // 경도 (카카오맵에서 검색)
  chargingLocation?: string;  // 충전기 위치
  fastChargerCount?: number;  // 급속충전기 수량
  normalChargerCount?: number; // 일반충전기 수량
  isAvailable: boolean;       // 이용 가능 여부
  operatingHours: string;     // 운영시간
}

// 충전기 정보 타입
export interface ChargingInfo {
  stationName: string;
  chargingLocation: string;
  fastChargerCount: number;
  normalChargerCount: number;
  hasCharger: boolean;
}

// XML 데이터에서 추출한 충전소가 있는 역 목록 (실제 XML 데이터 기반)
const CHARGING_STATIONS_DATA = [
  { name: '반월당역', lineCode: '1', floor: '지하2층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-255-7735' },
  { name: '각산역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-963-7754' },
  { name: '반야월역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-962-7798' },
  { name: '신기역', lineCode: '1', floor: '지하1층', location: '쉼터 옆', fastChargers: 1, normalChargers: 2, tel: '053-962-7773' },
  { name: '율하역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-962-7729' },
  { name: '용계역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-985-7798' },
  { name: '방촌역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 2, tel: '053-984-7716' },
  { name: '해안역', lineCode: '1', floor: '지하2층', location: '계단 뒤', fastChargers: 1, normalChargers: 1, tel: '053-981-7775' },
  { name: '동촌역', lineCode: '1', floor: '지하3층', location: '대합실', fastChargers: 1, normalChargers: 2, tel: '053-981-7731' },
  { name: '아양교역', lineCode: '1', floor: '지하3층', location: '대합실', fastChargers: 1, normalChargers: 2, tel: '053-942-7724' },
  { name: '동구청역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-942-7721' },
  { name: '동대구역', lineCode: '1', floor: '지하1층', location: '1번출구 앞', fastChargers: 1, normalChargers: 2, tel: '053-742-7787' },
  { name: '신천역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-756-7706' },
  { name: '칠성시장역', lineCode: '1', floor: '지하2층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-427-7751' },
  { name: '대구역', lineCode: '1', floor: '지하2층', location: '역무실 앞', fastChargers: 1, normalChargers: 2, tel: '053-426-7797' },
  { name: '중앙로역', lineCode: '1', floor: '지하2층', location: '화장실 앞', fastChargers: 1, normalChargers: 2, tel: '053-256-7746' },
  { name: '안심역', lineCode: '1', floor: '지하1층', location: '역무실 앞', fastChargers: 1, normalChargers: 2, tel: '053-963-7769' },
  { name: '명덕역', lineCode: '1', floor: '지하1층', location: '역무실 앞', fastChargers: 1, normalChargers: 2, tel: '053-255-7723' },
  { name: '교대역', lineCode: '1', floor: '지하2층', location: '2발매기 옆', fastChargers: 1, normalChargers: 2, tel: '053-473-7702' },
  { name: '영대병원역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-626-7760' },
  { name: '현충로역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-651-7756' },
  { name: '안지랑역', lineCode: '1', floor: '지하1층', location: 'E/L 4호기 옆', fastChargers: 1, normalChargers: 1, tel: '053-626-7747' },
  { name: '대명역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-627-7746' },
  { name: '서부정류장역', lineCode: '1', floor: '지하1층', location: '역무실 옆', fastChargers: 1, normalChargers: 2, tel: '053-651-7736' },
  { name: '송현역', lineCode: '1', floor: '지하2층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-626-7730' },
  { name: '월촌역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 1, tel: '053-626-7710' },
  { name: '상인역', lineCode: '1', floor: '지하1층', location: '화장실 입구', fastChargers: 1, normalChargers: 2, tel: '053-642-7745' },
  { name: '월배역', lineCode: '1', floor: '지하1층', location: 'E/L 1호기 옆', fastChargers: 1, normalChargers: 1, tel: '053-642-7732' },
  { name: '진천역', lineCode: '1', floor: '지하1층', location: '대합실', fastChargers: 1, normalChargers: 2, tel: '053-642-7723' },
  { name: '대곡역', lineCode: '1', floor: '지하2층', location: '화장실 앞', fastChargers: 1, normalChargers: 2, tel: '053-644-7723' },
  { name: '화원역', lineCode: '1', floor: '지하1층', location: 'E/L 3호기 옆', fastChargers: 1, normalChargers: 1, tel: '053-634-5125' },
  { name: '설화명곡역', lineCode: '1', floor: '지하1층', location: 'E/L 3호기 옆', fastChargers: 1, normalChargers: 2, tel: '053-634-2674' }
];

/**
 * 카카오 로컬 API로 지하철역 좌표 검색
 */
async function searchStationCoordinates(stationName: string): Promise<{lat: number, lng: number} | null> {
  const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
  if (!REST_API_KEY) {
    console.warn('⚠️ 카카오 REST API 키가 없습니다');
    return null;
  }

  try {
    // 대구지하철 키워드로 검색
    const searchQuery = encodeURIComponent(`대구지하철 ${stationName}`);
    const response = await fetch(
      `/kakao-api/v2/local/search/keyword.json?query=${searchQuery}&category_group_code=SW8&size=5`
    );

    if (!response.ok) {
      throw new Error(`카카오 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      // 가장 관련성 높은 결과 선택
      const place = data.documents[0];
      return {
        lat: parseFloat(place.y),
        lng: parseFloat(place.x)
      };
    }

    console.warn(`⚠️ ${stationName} 카카오맵 검색 결과 없음`);
    return null;

  } catch (error) {
    console.error(`❌ ${stationName} 카카오맵 검색 실패:`, error);
    return null;
  }
}

/**
 * XML 데이터 기반으로 충전소가 있는 역들만 좌표 검색
 */
export async function fetchSubwayChargingStations(): Promise<SubwayChargingStation[]> {
  console.log('🚇 XML 데이터 기반 충전소 지하철역 검색 시작');
  console.log(`📋 XML에서 ${CHARGING_STATIONS_DATA.length}개 충전소 발견`);
  
  const stations: SubwayChargingStation[] = [];
  
  for (let i = 0; i < CHARGING_STATIONS_DATA.length; i++) {
    const stationInfo = CHARGING_STATIONS_DATA[i];
    
    console.log(`🔍 ${stationInfo.name} 좌표 검색 중... (${i + 1}/${CHARGING_STATIONS_DATA.length})`);
    
    const coordinates = await searchStationCoordinates(stationInfo.name);
    
    if (coordinates) {
      const station: SubwayChargingStation = {
        id: `daegu_${stationInfo.lineCode}_${i + 1}`,
        stationName: stationInfo.name,
        lineName: `${stationInfo.lineCode}호선`,
        lineCode: stationInfo.lineCode,
        lat: coordinates.lat,
        lng: coordinates.lng,
        chargingLocation: `${stationInfo.floor} ${stationInfo.location}`,
        fastChargerCount: stationInfo.fastChargers,
        normalChargerCount: stationInfo.normalChargers,
        isAvailable: true,
        operatingHours: '05:30-24:00'
      };
      
      stations.push(station);
      console.log(`✅ ${stationInfo.name}: ${coordinates.lat}, ${coordinates.lng} (급속:${stationInfo.fastChargers}, 일반:${stationInfo.normalChargers})`);
    } else {
      console.warn(`⚠️ ${stationInfo.name} 좌표 검색 실패`);
    }
    
    // API 호출 제한을 위한 딜레이 (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`🎯 총 ${stations.length}개 충전소 지하철역 좌표 검색 완료`);
  return stations;
}

/**
 * 특정 역의 충전기 정보를 실시간으로 조회 (XML 데이터 기반)
 */
export async function fetchChargingInfoByStation(stationName: string, lineCode: string): Promise<ChargingInfo | null> {
  console.log(`🔌 ${stationName} (${lineCode}호선) 충전기 정보 조회`);
  
  // XML 데이터에서 해당 역 정보 찾기
  const stationData = CHARGING_STATIONS_DATA.find(station => 
    station.name === stationName && station.lineCode === lineCode
  );
  
  if (stationData) {
    const chargingInfo: ChargingInfo = {
      stationName: stationData.name,
      chargingLocation: `${stationData.floor} ${stationData.location}`,
      fastChargerCount: stationData.fastChargers,
      normalChargerCount: stationData.normalChargers,
      hasCharger: (stationData.fastChargers + stationData.normalChargers) > 0
    };
    
    console.log(`✅ ${stationName} 충전기 정보:`, chargingInfo);
    return chargingInfo;
  } else {
    console.log(`ℹ️ ${stationName} 충전기 정보 없음`);
    return {
      stationName: stationName,
      chargingLocation: '정보 없음',
      fastChargerCount: 0,
      normalChargerCount: 0,
      hasCharger: false
    };
  }
}

/**
 * 노선별 충전소 조회
 */
export async function fetchSubwayChargingStationsByLine(lineCode: string): Promise<SubwayChargingStation[]> {
  const allStations = await fetchSubwayChargingStations();
  return allStations.filter(station => station.lineCode === lineCode);
}

/**
 * 특정 위치에서 가장 가까운 충전소 찾기
 */
export function findNearestStation(
  stations: SubwayChargingStation[], 
  userLat: number, 
  userLng: number, 
  maxCount: number = 5
): SubwayChargingStation[] {
  return stations
    .map(station => ({
      ...station,
      distance: calculateDistance(userLat, userLng, station.lat, station.lng)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxCount);
}

/**
 * 두 좌표 간 거리 계산 (km)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}