/**
 * 도로 차단 정보 API (안전지도)
 * 공사 및 도로 차단 계획 정보 제공
 */

export interface RoadBlockInfo {
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

const API_KEY = '7892694858';
const BASE_URL = 'http://safemap.go.kr/openapi2/IF_0043';

/**
 * 도로 차단 정보 조회
 */
export async function fetchRoadBlockInfo(
  pageNo: number = 1,
  numOfRows: number = 100
): Promise<RoadBlockInfo[]> {
  try {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      returnType: 'json'
    });

    const url = `${BASE_URL}?${params}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('도로 차단 정보 API 호출 실패:', response.status);
      return [];
    }

    const data = await response.json();
    
    // API 응답 파싱
    const items = data.response?.body?.items?.item || [];
    
    if (!Array.isArray(items)) {
      return items ? [parseRoadBlockItem(items)] : [];
    }
    
    return items.map(parseRoadBlockItem).filter(Boolean);
  } catch (error) {
    console.error('도로 차단 정보 조회 실패:', error);
    return getMockRoadBlocks(); // 폴백: 목 데이터
  }
}

/**
 * API 응답 아이템 파싱
 */
function parseRoadBlockItem(item: any): RoadBlockInfo | null {
  try {
    return {
      id: item.id || `block_${Date.now()}_${Math.random()}`,
      title: item.title || item.constNm || '도로 차단',
      location: item.location || item.addr || '위치 정보 없음',
      lat: parseFloat(item.lat || item.latitude || '37.5665'),
      lng: parseFloat(item.lng || item.longitude || '126.9780'),
      startDate: item.startDate || item.constStartDt || new Date().toISOString(),
      endDate: item.endDate || item.constEndDt || new Date().toISOString(),
      blockType: parseBlockType(item.type || item.constType),
      severity: parseSeverity(item.severity || item.grade),
      description: item.description || item.constCont || '상세 정보 없음',
      detour: item.detour || item.detourInfo
    };
  } catch (error) {
    console.error('도로 차단 정보 파싱 실패:', error);
    return null;
  }
}

/**
 * 차단 유형 파싱
 */
function parseBlockType(type: string): RoadBlockInfo['blockType'] {
  const typeStr = (type || '').toLowerCase();
  
  if (typeStr.includes('공사') || typeStr.includes('construction')) return 'construction';
  if (typeStr.includes('보수') || typeStr.includes('repair')) return 'repair';
  if (typeStr.includes('행사') || typeStr.includes('event')) return 'event';
  if (typeStr.includes('사고') || typeStr.includes('accident')) return 'accident';
  
  return 'construction';
}

/**
 * 심각도 파싱
 */
function parseSeverity(severity: string): RoadBlockInfo['severity'] {
  const sevStr = (severity || '').toLowerCase();
  
  if (sevStr.includes('high') || sevStr.includes('상')) return 'high';
  if (sevStr.includes('medium') || sevStr.includes('중')) return 'medium';
  
  return 'low';
}

/**
 * 목 데이터 (API 실패 시 사용)
 */
function getMockRoadBlocks(): RoadBlockInfo[] {
  return [
    {
      id: 'mock_1',
      title: '강남대로 도로 공사',
      location: '서울 강남구 강남대로 396',
      lat: 37.4979,
      lng: 127.0276,
      startDate: '2024-01-15',
      endDate: '2024-03-31',
      blockType: 'construction',
      severity: 'high',
      description: '지하철 9호선 연장 공사로 인한 차선 통제',
      detour: '테헤란로 우회 권장'
    },
    {
      id: 'mock_2',
      title: '여의도 한강대교 보수',
      location: '서울 영등포구 여의도동',
      lat: 37.5219,
      lng: 126.9245,
      startDate: '2024-02-01',
      endDate: '2024-04-30',
      blockType: 'repair',
      severity: 'medium',
      description: '한강대교 노면 보수 공사',
      detour: '마포대교 이용 권장'
    },
    {
      id: 'mock_3',
      title: '광화문 광장 행사',
      location: '서울 종로구 세종대로 172',
      lat: 37.5716,
      lng: 126.9768,
      startDate: '2024-03-01',
      endDate: '2024-03-03',
      blockType: 'event',
      severity: 'low',
      description: '문화 행사로 인한 일시적 통행 제한',
      detour: '율곡로 우회'
    }
  ];
}

/**
 * 특정 위치 주변의 도로 차단 정보 조회
 */
export function filterRoadBlocksByLocation(
  blocks: RoadBlockInfo[],
  lat: number,
  lng: number,
  radiusKm: number = 5
): RoadBlockInfo[] {
  return blocks.filter(block => {
    const distance = calculateDistance(lat, lng, block.lat, block.lng);
    return distance <= radiusKm;
  });
}

/**
 * 거리 계산 (Haversine)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * 현재 진행 중인 차단 정보만 필터링
 */
export function filterActiveBlocks(blocks: RoadBlockInfo[]): RoadBlockInfo[] {
  const now = new Date();
  
  return blocks.filter(block => {
    const startDate = new Date(block.startDate);
    const endDate = new Date(block.endDate);
    
    return now >= startDate && now <= endDate;
  });
}
