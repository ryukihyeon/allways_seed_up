// 대구도시철도공사 승강기 현황 API (공공데이터포털)
// API URL: https://api.odcloud.kr/api/3073003/v1/uddi:93db8d21-8419-405c-bbc3-ef63a121091f

export interface DaeguElevator {
  역명: string;
  구분: string; // "에스컬레이터" 또는 "엘리베이터"
  규격: string;
  제조사: string;
  운행방향?: string; // "UP" 또는 "DOWN" (에스컬레이터)
  지상1층?: string;
  지상2층?: string;
  지상3층?: string;
  지상4층?: string;
  지하1층?: string;
  지하2층?: string;
  지하3층?: string;
  지하4층?: string;
  "1층(중간)"?: string;
  "지하1층(중간)"?: string;
  "상가(M1)"?: string;
}

interface ApiResponse {
  currentCount: number;
  data: DaeguElevator[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export interface ElevatorInfo {
  stationName: string;
  lat: number;
  lng: number;
  elevators: {
    type: 'ELEVATOR' | 'ESCALATOR';
    direction?: 'UP' | 'DOWN';
    status: 'OPERATING' | 'BROKEN'; // 운행 중 또는 고장
    operatingFloors: string[]; // 운행 중인 층
    notOperatingFloors: string[]; // 미운행 층
  }[];
  hasIssue: boolean; // 고장이 있는지
}

export async function fetchDaeguElevators(): Promise<ElevatorInfo[]> {
  try {
    console.log('🔄 대구도시철도공사 승강기 현황 API 호출 시작...');

    // 환경 변수 검사 (VITE_SERVICE_KEY 권장)
    const API_KEY = import.meta.env.VITE_SERVICE_KEY || 'bcec21d25cad4c9bdcd721d37f38da3ffc4747530b6cf29f6e5dc544a4b6a703';
    const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

    // API 키가 없거나 기본값인 경우 경고
    if (!import.meta.env.VITE_SERVICE_KEY) {
      console.warn('⚠️ VITE_SERVICE_KEY가 .env.local에 설정되지 않았습니다. 기본 키를 사용하지만 400 오류가 발생할 수 있습니다.');
    }

    // API 키 인코딩 처리
    // 이미 인코딩된 키(%)가 아니면 인코딩 수행
    const serviceKey = API_KEY.includes('%') ? API_KEY : encodeURIComponent(API_KEY);

    // 승강기 데이터 가져오기
    const url = `https://api.odcloud.kr/api/3073003/v1/uddi:93db8d21-8419-405c-bbc3-ef63a121091f?page=1&perPage=1000&serviceKey=${serviceKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - API 키를 확인해주세요.`);
    }

    const jsonData: ApiResponse = await response.json();
    console.log('📥 승강기 현황 API 응답:', jsonData.data?.length || 0, '개');

    if (!jsonData.data || jsonData.data.length === 0) {
      console.warn('⚠️ API 응답에 데이터가 없습니다.');
      return [];
    }

    // 역별로 승강기 정보 그룹화
    const stationMap = new Map<string, DaeguElevator[]>();

    jsonData.data.forEach(item => {
      if (!item.역명) return;

      const cleanName = item.역명.trim();
      if (!stationMap.has(cleanName)) {
        stationMap.set(cleanName, []);
      }
      stationMap.get(cleanName)!.push(item);
    });

    console.log(`📊 총 ${stationMap.size}개 역의 승강기 정보 수집`);

    const elevatorInfos: ElevatorInfo[] = [];

    // 각 역의 좌표를 카카오 API로 검색
    for (const [stationName, elevators] of stationMap.entries()) {
      console.log(`🔍 카카오 API로 좌표 검색 중: ${stationName}역`);

      try {
        const searchResponse = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=대구 ${stationName}역`,
          {
            headers: {
              'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
            }
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();

          if (searchData.documents && searchData.documents.length > 0) {
            const place = searchData.documents[0];
            const coords = {
              lat: parseFloat(place.y),
              lng: parseFloat(place.x)
            };

            // 승강기 정보 정리
            const processedElevators = elevators.map(elev => {
              const operatingFloors: string[] = [];
              const notOperatingFloors: string[] = [];

              // 모든 층 상태 확인
              const floors = ['지상5층', '지상4층', '지상3층', '지상2층', '지상1층', '1층(중간)', '상가(M1)', '지하1층', '지하1층(중간)', '지하2층', '지하3층', '지하4층'];

              let totalFloors = 0;
              floors.forEach(floor => {
                const status = (elev as any)[floor];
                if (status === '운행') {
                  operatingFloors.push(floor);
                  totalFloors++;
                } else if (status === '미운행') {
                  notOperatingFloors.push(floor);
                  totalFloors++;
                }
              });

              // 전체 상태 판단 (운행 중 / 고장)
              let overallStatus: 'OPERATING' | 'BROKEN';

              if (operatingFloors.length === 0 && totalFloors > 0) {
                // 운행 중인 층이 하나도 없으면 고장
                overallStatus = 'BROKEN';
              } else {
                // 하나라도 운행 중이면 운행 중으로 표시
                overallStatus = 'OPERATING';
              }

              return {
                type: elev.구분 === '엘리베이터' ? 'ELEVATOR' as const : 'ESCALATOR' as const,
                direction: elev.운행방향 as 'UP' | 'DOWN' | undefined,
                status: overallStatus,
                operatingFloors,
                notOperatingFloors
              };
            });

            // 역에 고장이 있는지 확인
            const hasIssue = processedElevators.some(e => e.status === 'BROKEN');

            elevatorInfos.push({
              stationName,
              lat: coords.lat,
              lng: coords.lng,
              elevators: processedElevators,
              hasIssue
            });

            console.log(`✅ 추가됨: ${stationName}역 (승강기 ${elevators.length}개)`);
          } else {
            console.warn(`⚠️ 카카오 API 검색 결과 없음: ${stationName}역`);
          }
        }

        // API 호출 제한 방지
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ 좌표 검색 오류 (${stationName}역):`, error);
      }
    }

    console.log(`✅ 대구 지하철 승강기 정보 ${elevatorInfos.length}개 역 로드 완료`);
    return elevatorInfos;

  } catch (error) {
    console.error('❌ 승강기 현황 데이터 로드 실패:', error);
    return [];
  }
}
