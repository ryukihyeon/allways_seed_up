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

/**
 * 도로 차단 정보 조회
 * 
 * 참고: 안전지도 API는 CORS 정책으로 인해 브라우저에서 직접 호출 불가
 * 프로덕션 환경에서는 백엔드 서버를 통해 호출해야 함
 * 현재는 목 데이터 사용
 */
export async function fetchRoadBlockInfo(
  pageNo: number = 1,
  numOfRows: number = 100
): Promise<RoadBlockInfo[]> {
  // 안전지도 API는 CORS 문제로 브라우저에서 직접 호출 불가
  // 백엔드 서버 구축 전까지는 빈 배열 반환
  console.log('🚧 도로 차단 정보: API 미구현으로 빈 데이터 반환');
  return [];
  
  /* 백엔드 서버 구축 후 사용할 코드:
  try {
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      pageNo: pageNo.toString(),
      numOfRows: numOfRows.toString(),
      returnType: 'json'
    });

    // 백엔드 API 엔드포인트
    const url = `/api/roadblocks?${params}`;
    
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
    return [];
  }
  */
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
