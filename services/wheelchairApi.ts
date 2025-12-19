/**
 * 보조공학기기 제품 정보 API
 * 국립재활원 보조기기 종합정보시스템
 */

export interface WheelchairProduct {
  id: string;
  modelName: string;           // 모델명
  manufacturer: string;         // 제조사
  batteryCapacityAh: number;    // 배터리 용량 (Ah)
  batteryVoltage: number;       // 배터리 전압 (V)
  weight: number;               // 휠체어 자체 무게 (kg)
  maxLoad: number;              // 최대 적재 하중 (kg)
  maxSpeed: number;             // 최고 속도 (km/h)
  drivingDistance: number;      // 주행 거리 (km)
  width: number;                // 폭 (cm)
  length: number;               // 길이 (cm)
  price?: number;               // 가격 (원)
  imageUrl?: string;            // 이미지 URL
}

const API_KEY = 'b179524d5cba2dfcad393522f5a2f0b28e6ddae78afaeb08d27ce566ed45af92';

/**
 * 전동휠체어 제품 목록 조회
 * API: 보조기기 제품 목록 조회 (공공데이터포털)
 */
export async function fetchWheelchairProducts(): Promise<WheelchairProduct[]> {
  try {
    console.log('🔌 보조공학기기 API 호출 중...');
    
    // 공공데이터포털 API 파라미터
    const params = new URLSearchParams({
      serviceKey: API_KEY,
      pageNo: '1',
      numOfRows: '100'
      // 참고: 이 API는 XML만 지원할 수 있음
    });
    
    // 정확한 엔드포인트: /product_list
    const url = `/wheelchair-api/product_list?${params}`;
    
    console.log('📡 API URL:', url);
    
    const response = await fetch(url);
    
    console.log('📥 API 응답 상태:', response.status);
    
    if (response.ok) {
      const text = await response.text();
      console.log('📦 API 응답 (원본):', text.substring(0, 500));
      
      // XML 응답인지 확인
      if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
        console.log('📄 XML 응답 감지. XML 파싱 필요');
        const products = parseXMLResponse(text);
        if (products.length > 0) {
          console.log('✅ XML에서 제품 로드 성공:', products.length + '개');
          return products;
        }
      }
      
      // JSON 시도
      try {
        const data = JSON.parse(text);
        console.log('📦 API 응답 데이터 (JSON):', data);
      
      // 공공데이터포털 표준 응답 구조
      const items = data.response?.body?.items?.item || [];
      
      console.log('📋 파싱된 아이템 수:', Array.isArray(items) ? items.length : (items ? 1 : 0));
      
      // 단일 아이템인 경우
      if (!Array.isArray(items) && items) {
        const parsed = parseWheelchairProduct(items);
        if (parsed) {
          console.log('✅ API에서 제품 로드 성공: 1개');
          return [parsed];
        }
      }
      
        // 배열인 경우
        if (Array.isArray(items) && items.length > 0) {
          console.log('📋 전체 아이템 수:', items.length);
          
          // parseWheelchairProduct에서 필터링 수행
          const products = items
            .map(parseWheelchairProduct)
            .filter(Boolean) as WheelchairProduct[];
          
          console.log('🦽 전동휠체어 필터링 결과:', products.length + '개');
          
          if (products.length > 0) {
            console.log('✅ API에서 제품 로드 성공:', products.length + '개');
            return products;
          } else {
            console.warn('⚠️ 전동휠체어 제품을 찾을 수 없습니다. 목 데이터 사용');
          }
        }
      } catch (jsonError) {
        console.warn('JSON 파싱 실패:', jsonError);
      }
    } else {
      console.warn('⚠️ API 응답 실패:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📄 에러 응답:', errorText);
    }
  } catch (error) {
    console.error('❌ 보조공학기기 API 오류:', error);
  }
  
  // API 실패 시 빈 배열 반환
  console.log('📦 API 실패. 빈 데이터 반환');
  return [];
}

/**
 * API 응답 파싱
 * API 응답 구조:
 * - itemNm: 품목명
 * - mhrlsNm: 제품명
 * - mhrlsSeNm: 보조공학기기 기구구분
 * - troblNm: 장애유형
 */
function parseWheelchairProduct(item: any): WheelchairProduct | null {
  try {
    console.log('🔍 파싱 중인 아이템:', item);
    
    // 제품명 (mhrlsNm)
    const modelName = item.mhrlsNm || item.itemNm || '알 수 없음';
    
    // 제조사 (API에 없으므로 제품명에서 추출 시도)
    const manufacturer = '제조사 정보 없음';
    
    // 품목명과 기구구분으로 전동휠체어 여부 확인
    const itemName = (item.itemNm || '').toLowerCase();
    const category = (item.mhrlsSeNm || '').toLowerCase();
    
    // 전동휠체어가 아니면 null 반환
    if (!itemName.includes('전동') && 
        !itemName.includes('휠체어') && 
        !itemName.includes('wheelchair') &&
        !category.includes('전동') &&
        !category.includes('휠체어')) {
      return null;
    }
    
    // 배터리 정보는 API에 없으므로 기본값 사용
    // 실제 제품 스펙은 별도로 관리 필요
    const batteryCapacityAh = 35;
    const batteryVoltage = 24;
    const weight = 55;
    const maxLoad = 100;
    const drivingDistance = 25;
    
    return {
      id: item.rno || item.rnum || `product_${Date.now()}_${Math.random()}`,
      modelName,
      manufacturer,
      batteryCapacityAh,
      batteryVoltage,
      weight,
      maxLoad,
      maxSpeed: 6,
      drivingDistance,
      width: 65,
      length: 110,
      price: undefined,
      imageUrl: undefined
    };
  } catch (error) {
    console.error('제품 정보 파싱 실패:', error, item);
    return null;
  }
}



/**
 * XML 응답 파싱
 */
function parseXMLResponse(xmlText: string): WheelchairProduct[] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // 에러 체크
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML 파싱 에러:', parseError.textContent);
      return [];
    }
    
    const items = xmlDoc.querySelectorAll('item');
    console.log('📋 XML에서 찾은 아이템 수:', items.length);
    
    const products: WheelchairProduct[] = [];
    
    items.forEach((item, index) => {
      const itemNm = item.querySelector('itemNm')?.textContent || '';
      const mhrlsNm = item.querySelector('mhrlsNm')?.textContent || '';
      const mhrlsSeNm = item.querySelector('mhrlsSeNm')?.textContent || '';
      const rno = item.querySelector('rno')?.textContent || '';
      const rnum = item.querySelector('rnum')?.textContent || '';
      
      console.log(`🔍 아이템 ${index + 1}:`, { itemNm, mhrlsNm, mhrlsSeNm });
      
      // 전동휠체어 필터링
      const isWheelchair = 
        itemNm.includes('전동') || 
        itemNm.includes('휠체어') || 
        mhrlsNm.includes('전동') ||
        mhrlsNm.includes('휠체어') ||
        mhrlsSeNm.includes('전동') ||
        mhrlsSeNm.includes('휠체어');
      
      if (isWheelchair) {
        products.push({
          id: rno || rnum || `product_${Date.now()}_${index}`,
          modelName: mhrlsNm || itemNm || '알 수 없음',
          manufacturer: '제조사 정보 없음',
          batteryCapacityAh: 35,
          batteryVoltage: 24,
          weight: 55,
          maxLoad: 100,
          maxSpeed: 6,
          drivingDistance: 25,
          width: 65,
          length: 110
        });
      }
    });
    
    console.log('🦽 전동휠체어 필터링 결과:', products.length + '개');
    return products;
  } catch (error) {
    console.error('XML 파싱 실패:', error);
    return [];
  }
}

/**
 * 사용자 몸무게를 포함한 총 무게 계산
 */
export function calculateTotalWeight(
  wheelchairWeight: number,
  userWeight: number
): number {
  return wheelchairWeight + userWeight;
}

/**
 * 배터리 총 용량 계산 (Wh)
 */
export function calculateBatteryCapacity(
  capacityAh: number,
  voltage: number
): number {
  return capacityAh * voltage;
}
