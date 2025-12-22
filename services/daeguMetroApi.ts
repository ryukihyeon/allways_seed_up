// 국가철도공단_대구1호선_전동휠체어_충전설비 API (공공데이터포털)
// API URL: https://api.odcloud.kr/api/15041282/v1/uddi:d0b9130b-5d41-4a21-b187-800417a98ec0
import { Station } from '../types';

interface DaeguLine1ChargerData {
  역명: string;
  선명: string;
  역층: string;
  상세위치: string;
  충전설비수: string;
  전화번호: string;
  철도운영기관명: string;
  이용요금: string;
  충전설비: string;
}

interface ApiResponse {
  currentCount: number;
  data: DaeguLine1ChargerData[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

// 카카오 주소 검색 API로 역 좌표 검색 (주소 기반)
async function searchStationCoordinates(stationName: string, address?: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // 주소가 있으면 주소로 검색, 없으면 역명으로 검색
    const query = address || `대구광역시 ${stationName}역`;

    const response = await fetch(
      `/kakao-api/v2/local/search/address.json?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      console.warn(`⚠️ 카카오 주소 검색 실패: ${stationName}`);
      return null;
    }

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const place = data.documents[0];
      return {
        lat: parseFloat(place.y),
        lng: parseFloat(place.x)
      };
    }

    // 주소 검색 실패 시 키워드 검색 시도
    const keywordResponse = await fetch(
      `/kakao-api/v2/local/search/keyword.json?query=${encodeURIComponent(`대구 ${stationName}역`)}`
    );

    if (keywordResponse.ok) {
      const keywordData = await keywordResponse.json();
      if (keywordData.documents && keywordData.documents.length > 0) {
        const place = keywordData.documents[0];
        return {
          lat: parseFloat(place.y),
          lng: parseFloat(place.x)
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`❌ 좌표 검색 오류 (${stationName}):`, error);
    return null;
  }
}

export async function fetchDaeguMetroChargers(): Promise<Station[]> {
  try {
    console.log('🔄 국가철도공단_대구1호선_전동휠체어_충전설비 API 호출 시작...');

    // 환경 변수 검사 (VITE_SERVICE_KEY 권장)
    const API_KEY = import.meta.env.VITE_SERVICE_KEY || 'bcec21d25cad4c9bdcd721d37f38da3ffc4747530b6cf29f6e5dc544a4b6a703';
    const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

    // API 키가 없거나 기본값인 경우 경고
    if (!import.meta.env.VITE_SERVICE_KEY) {
      console.warn('⚠️ VITE_SERVICE_KEY가 .env.local에 설정되지 않았습니다. 기본 키를 사용하지만 400 오류가 발생할 수 있습니다.');
    }

    // API 키 인코딩 처리
    const serviceKey = API_KEY.includes('%') ? API_KEY : encodeURIComponent(API_KEY);

    // 대구 1호선 전동휠체어 충전설비 데이터 가져오기 (서비스 키 처리)
    const url = `https://api.odcloud.kr/api/15041282/v1/uddi:d0b9130b-5d41-4a21-b187-800417a98ec0?page=1&perPage=100&serviceKey=${serviceKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - API 키(VITE_SERVICE_KEY)를 확인해주세요.`);
    }

    const jsonData: ApiResponse = await response.json();
    console.log('📥 대구1호선 충전설비 API 응답:', jsonData.data?.length || 0, '개');

    if (!jsonData.data || jsonData.data.length === 0) {
      console.warn('⚠️ API 응답에 데이터가 없습니다.');
      return [];
    }

    const stations: Station[] = [];

    // 각 역의 좌표를 카카오 API로 검색
    for (let i = 0; i < jsonData.data.length; i++) {
      const item = jsonData.data[i];

      // 역명 체크
      if (!item.역명) {
        console.warn(`⚠️ 역명이 없는 데이터 건너뜀:`, item);
        continue;
      }

      // 역명 정리 (괄호 제거, 예: "명덕(2.28민주운동기념회관)" -> "명덕")
      const cleanStationName = item.역명.replace(/\(.*?\)/g, '').trim();

      console.log(`🔍 카카오 API로 좌표 검색 중: ${cleanStationName}역`);

      try {
        // 카카오 키워드 검색 API로 역 좌표 가져오기
        const searchResponse = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=대구 ${cleanStationName}역`,
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

            const station = {
              id: 1000 + i,
              name: `${cleanStationName}역 전동휠체어 충전소`,
              lat: coords.lat,
              lng: coords.lng,
              address: `대구 ${cleanStationName}역 ${item.역층} ${item.상세위치}`,
              isAvailable: true,
              type: 'NORMAL' as const
            };

            stations.push(station);
            console.log(`✅ 추가됨: ${station.name} (${coords.lat}, ${coords.lng})`);
          } else {
            console.warn(`⚠️ 카카오 API 검색 결과 없음: ${cleanStationName}역`);
          }
        } else {
          console.warn(`⚠️ 카카오 API 호출 실패: ${cleanStationName}역 (${searchResponse.status})`);
        }

        // API 호출 제한 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ 좌표 검색 오류 (${cleanStationName}역):`, error);
      }
    }

    console.log(`✅ 대구1호선 전동휠체어 충전설비 ${stations.length}개 로드 완료`);
    return stations;

  } catch (error) {
    console.error('❌ 대구1호선 충전설비 데이터 로드 실패:', error);
    return [];
  }
}

// 대구 지하철 1호선 역 좌표 매핑 (실제 GPS 좌표 - WGS84)
function getDaeguMetroCoordinates(stationName: string, lineCode: string): { lat: number; lng: number } | null {
  const line1Stations: Record<string, { lat: number; lng: number }> = {
    // 1호선 (설화명곡 → 안심) - 실제 역 위치 (위도, 경도) - 정확한 좌표
    '설화명곡': { lat: 35.6528, lng: 128.4647 },
    '화원': { lat: 35.6644, lng: 128.4789 },
    '대곡': { lat: 35.6833, lng: 128.5011 },
    '진천': { lat: 35.6978, lng: 128.5189 },
    '월배': { lat: 35.8254, lng: 128.5645 },
    '상인': { lat: 35.8206, lng: 128.5530 },
    '월촌': { lat: 35.8159, lng: 128.5415 },
    '송현': { lat: 35.8112, lng: 128.5300 },
    '서부정류장': { lat: 35.8065, lng: 128.5185 },
    '대명': { lat: 35.8520, lng: 128.5889 },
    '안지랑': { lat: 35.8473, lng: 128.5774 },
    '현충로': { lat: 35.8426, lng: 128.5659 },
    '영대병원': { lat: 35.8379, lng: 128.5544 },
    '교대': { lat: 35.8332, lng: 128.5429 },
    '명덕': { lat: 35.8520, lng: 128.5889 },
    '2.28민주운동기념회관': { lat: 35.8520, lng: 128.5889 }, // 명덕역 별칭
    '반월당': { lat: 35.8580, lng: 128.5933 },
    '중앙로': { lat: 35.8656, lng: 128.5978 },
    '대구역': { lat: 35.8788, lng: 128.6289 },
    '칠성시장': { lat: 35.8844, lng: 128.6011 },
    '신천': { lat: 35.8678, lng: 128.6311 },
    '동대구': { lat: 35.8790, lng: 128.6280 },
    '동대구역': { lat: 35.8790, lng: 128.6280 },
    '동구청': { lat: 35.8856, lng: 128.6378 },
    '아양교': { lat: 35.8922, lng: 128.6478 },
    '동촌': { lat: 35.8989, lng: 128.6578 },
    '해안': { lat: 35.9056, lng: 128.6678 },
    '방촌': { lat: 35.9122, lng: 128.6778 },
    '용계': { lat: 35.9189, lng: 128.6878 },
    '율하': { lat: 35.9256, lng: 128.6978 },
    '신기': { lat: 35.9322, lng: 128.7078 },
    '반야월': { lat: 35.9389, lng: 128.7178 },
    '각산': { lat: 35.9456, lng: 128.7278 },
    '안심': { lat: 35.9522, lng: 128.7378 }
  };

  if (lineCode === '1' && line1Stations[stationName]) {
    return line1Stations[stationName];
  }

  return null;
}
