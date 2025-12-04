import { Station, Report, WeatherData } from './types';

// 서울시청 중심
export const INITIAL_CENTER = { lat: 37.5665, lng: 126.9780 };

export const MOCK_STATIONS: Station[] = [
  // === 서울특별시 ===
  // 중구
  { id: 1, name: '서울시청 충전소', lat: 37.5665, lng: 126.9780, address: '서울 중구 세종대로 110', isAvailable: true, type: 'FAST' },
  { id: 2, name: '광화문역 고객센터', lat: 37.5716, lng: 126.9768, address: '서울 종로구 세종대로 172', isAvailable: true, type: 'NORMAL' },
  { id: 3, name: '을지로입구역', lat: 37.5660, lng: 126.9826, address: '서울 중구 을지로 42', isAvailable: true, type: 'FAST' },
  { id: 4, name: '명동 주민센터', lat: 37.5600, lng: 126.9850, address: '서울 중구 퇴계로 20길', isAvailable: true, type: 'NORMAL' },
  
  // 강남구
  { id: 5, name: '강남구청 충전소', lat: 37.5173, lng: 127.0473, address: '서울 강남구 학동로 426', isAvailable: true, type: 'FAST' },
  { id: 6, name: '강남역 9번출구', lat: 37.4979, lng: 127.0276, address: '서울 강남구 강남대로 396', isAvailable: true, type: 'NORMAL' },
  { id: 7, name: '선릉역 충전소', lat: 37.5044, lng: 127.0490, address: '서울 강남구 테헤란로 427', isAvailable: true, type: 'FAST' },
  { id: 8, name: '삼성역 코엑스', lat: 37.5115, lng: 127.0595, address: '서울 강남구 영동대로 513', isAvailable: true, type: 'NORMAL' },
  { id: 9, name: '역삼역 충전소', lat: 37.5004, lng: 127.0364, address: '서울 강남구 역삼로 156', isAvailable: true, type: 'FAST' },
  
  // 서초구
  { id: 10, name: '서초구청 충전소', lat: 37.4837, lng: 127.0324, address: '서울 서초구 남부순환로 347길 15', isAvailable: true, type: 'FAST' },
  { id: 11, name: '교대역 충전소', lat: 37.4934, lng: 127.0143, address: '서울 서초구 서초중앙로 194', isAvailable: true, type: 'NORMAL' },
  { id: 12, name: '강남역 충전소', lat: 37.4979, lng: 127.0276, address: '서울 서초구 서초대로 396', isAvailable: true, type: 'FAST' },
  
  // 송파구
  { id: 13, name: '잠실역 충전소', lat: 37.5133, lng: 127.1000, address: '서울 송파구 올림픽로 240', isAvailable: true, type: 'FAST' },
  { id: 14, name: '송파구청 충전소', lat: 37.5145, lng: 127.1066, address: '서울 송파구 올림픽로 326', isAvailable: true, type: 'NORMAL' },
  { id: 15, name: '문정역 충전소', lat: 37.4845, lng: 127.1223, address: '서울 송파구 문정로 98', isAvailable: true, type: 'FAST' },
  
  // 마포구
  { id: 16, name: '홍대입구역 충전소', lat: 37.5571, lng: 126.9240, address: '서울 마포구 양화로 160', isAvailable: true, type: 'FAST' },
  { id: 17, name: '마포구청 충전소', lat: 37.5663, lng: 126.9019, address: '서울 마포구 월드컵로 212', isAvailable: true, type: 'NORMAL' },
  { id: 18, name: '합정역 충전소', lat: 37.5495, lng: 126.9139, address: '서울 마포구 양화로 45', isAvailable: true, type: 'FAST' },
  
  // 영등포구
  { id: 19, name: '여의도역 충전소', lat: 37.5219, lng: 126.9245, address: '서울 영등포구 의사당대로 83', isAvailable: true, type: 'FAST' },
  { id: 20, name: '영등포구청역', lat: 37.5264, lng: 126.8962, address: '서울 영등포구 당산로 123', isAvailable: true, type: 'NORMAL' },
  { id: 21, name: '신도림역 충전소', lat: 37.5088, lng: 126.8913, address: '서울 영등포구 경인로 661', isAvailable: true, type: 'FAST' },
  
  // 용산구
  { id: 22, name: '용산역 충전소', lat: 37.5299, lng: 126.9649, address: '서울 용산구 한강대로 405', isAvailable: true, type: 'FAST' },
  { id: 23, name: '이태원역 충전소', lat: 37.5346, lng: 126.9946, address: '서울 용산구 이태원로 177', isAvailable: true, type: 'NORMAL' },
  
  // 성동구
  { id: 24, name: '왕십리역 충전소', lat: 37.5611, lng: 127.0374, address: '서울 성동구 왕십리로 222', isAvailable: true, type: 'FAST' },
  { id: 25, name: '성수역 충전소', lat: 37.5445, lng: 127.0557, address: '서울 성동구 성수일로 13', isAvailable: true, type: 'NORMAL' },
  
  // 동대문구
  { id: 26, name: '동대문역 충전소', lat: 37.5714, lng: 127.0098, address: '서울 동대문구 천호대로 428', isAvailable: true, type: 'FAST' },
  { id: 27, name: '청량리역 충전소', lat: 37.5800, lng: 127.0474, address: '서울 동대문구 왕산로 205', isAvailable: true, type: 'NORMAL' },
  
  // 강북구
  { id: 28, name: '수유역 충전소', lat: 37.6387, lng: 127.0256, address: '서울 강북구 도봉로 348', isAvailable: true, type: 'FAST' },
  { id: 29, name: '강북구청 충전소', lat: 37.6397, lng: 127.0256, address: '서울 강북구 한천로 1027', isAvailable: true, type: 'NORMAL' },
  
  // 노원구
  { id: 30, name: '노원역 충전소', lat: 37.6552, lng: 127.0615, address: '서울 노원구 동일로 1414', isAvailable: true, type: 'FAST' },
  { id: 31, name: '노원구청 충전소', lat: 37.6544, lng: 127.0565, address: '서울 노원구 노해로 437', isAvailable: true, type: 'NORMAL' },
  
  // === 경기도 ===
  // 수원시
  { id: 32, name: '수원역 충전소', lat: 37.2663, lng: 127.0011, address: '경기 수원시 팔달구 덕영대로 924', isAvailable: true, type: 'FAST' },
  { id: 33, name: '수원시청 충전소', lat: 37.2636, lng: 127.0286, address: '경기 수원시 팔달구 효원로 241', isAvailable: true, type: 'FAST' },
  { id: 34, name: '영통역 충전소', lat: 37.2395, lng: 127.0768, address: '경기 수원시 영통구 봉영로 1591', isAvailable: true, type: 'NORMAL' },
  
  // 성남시
  { id: 35, name: '판교역 충전소', lat: 37.3951, lng: 127.1113, address: '경기 성남시 분당구 판교역로 166', isAvailable: true, type: 'FAST' },
  { id: 36, name: '성남시청 충전소', lat: 37.4201, lng: 127.1287, address: '경기 성남시 중원구 성남대로 997', isAvailable: true, type: 'NORMAL' },
  { id: 37, name: '모란역 충전소', lat: 37.4340, lng: 127.1288, address: '경기 성남시 중원구 광명로 11', isAvailable: true, type: 'FAST' },
  
  // 고양시
  { id: 38, name: '일산역 충전소', lat: 37.6764, lng: 126.7734, address: '경기 고양시 일산동구 중앙로 1275', isAvailable: true, type: 'FAST' },
  { id: 39, name: '고양시청 충전소', lat: 37.6584, lng: 126.8320, address: '경기 고양시 덕양구 고양대로 1955', isAvailable: true, type: 'NORMAL' },
  { id: 40, name: '화정역 충전소', lat: 37.6341, lng: 126.8323, address: '경기 고양시 덕양구 화정로 104', isAvailable: true, type: 'FAST' },
  
  // 용인시
  { id: 41, name: '기흥역 충전소', lat: 37.2757, lng: 127.1158, address: '경기 용인시 기흥구 구갈로 98', isAvailable: true, type: 'FAST' },
  { id: 42, name: '용인시청 충전소', lat: 37.2410, lng: 127.1776, address: '경기 용인시 처인구 중부대로 1199', isAvailable: true, type: 'NORMAL' },
  
  // 부천시
  { id: 43, name: '부천역 충전소', lat: 37.4849, lng: 126.7831, address: '경기 부천시 원미구 길주로 180', isAvailable: true, type: 'FAST' },
  { id: 44, name: '부천시청 충전소', lat: 37.5034, lng: 126.7660, address: '경기 부천시 원미구 평천로 655', isAvailable: true, type: 'NORMAL' },
  
  // 안양시
  { id: 45, name: '안양역 충전소', lat: 37.4012, lng: 126.9227, address: '경기 안양시 만안구 장내로 140', isAvailable: true, type: 'FAST' },
  { id: 46, name: '안양시청 충전소', lat: 37.3943, lng: 126.9568, address: '경기 안양시 동안구 시민대로 230', isAvailable: true, type: 'NORMAL' },
  
  // === 인천광역시 ===
  { id: 47, name: '인천시청 충전소', lat: 37.4562, lng: 126.7052, address: '인천 남동구 정각로 29', isAvailable: true, type: 'FAST' },
  { id: 48, name: '부평역 충전소', lat: 37.4907, lng: 126.7227, address: '인천 부평구 부평대로 296', isAvailable: true, type: 'FAST' },
  { id: 49, name: '송도역 충전소', lat: 37.3845, lng: 126.6385, address: '인천 연수구 센트럴로 263', isAvailable: true, type: 'NORMAL' },
  { id: 50, name: '인천공항 충전소', lat: 37.4602, lng: 126.4407, address: '인천 중구 공항로 272', isAvailable: true, type: 'FAST' },
  
  // === 대전광역시 ===
  { id: 51, name: '대전역 충전소', lat: 36.3315, lng: 127.4345, address: '대전 동구 중앙로 215', isAvailable: true, type: 'FAST' },
  { id: 52, name: '대전시청 충전소', lat: 36.3504, lng: 127.3845, address: '대전 서구 둔산로 100', isAvailable: true, type: 'NORMAL' },
  { id: 53, name: '유성온천역 충전소', lat: 36.3621, lng: 127.3438, address: '대전 유성구 온천로 17', isAvailable: true, type: 'FAST' },
  
  // === 대구광역시 ===
  { id: 54, name: '대구역 충전소', lat: 35.8788, lng: 128.6289, address: '대구 북구 태평로 161', isAvailable: true, type: 'FAST' },
  { id: 55, name: '대구시청 충전소', lat: 35.8714, lng: 128.6014, address: '대구 중구 공평로 88', isAvailable: true, type: 'NORMAL' },
  { id: 56, name: '반월당역 충전소', lat: 35.8580, lng: 128.5933, address: '대구 중구 달구벌대로 2095', isAvailable: true, type: 'FAST' },
  
  // === 광주광역시 ===
  { id: 57, name: '광주역 충전소', lat: 35.1467, lng: 126.9165, address: '광주 북구 무등로 255', isAvailable: true, type: 'FAST' },
  { id: 58, name: '광주시청 충전소', lat: 35.1595, lng: 126.8526, address: '광주 서구 내방로 111', isAvailable: true, type: 'NORMAL' },
  
  // === 부산광역시 ===
  { id: 59, name: '부산역 충전소', lat: 35.1151, lng: 129.0410, address: '부산 동구 중앙대로 206', isAvailable: true, type: 'FAST' },
  { id: 60, name: '부산시청 충전소', lat: 35.1796, lng: 129.0756, address: '부산 연제구 중앙대로 1001', isAvailable: true, type: 'NORMAL' },
  { id: 61, name: '서면역 충전소', lat: 35.1580, lng: 129.0595, address: '부산 부산진구 중앙대로 지하 691', isAvailable: true, type: 'FAST' },
  { id: 62, name: '해운대역 충전소', lat: 35.1628, lng: 129.1635, address: '부산 해운대구 중동 1394-82', isAvailable: true, type: 'FAST' },
  
  // === 울산광역시 ===
  { id: 63, name: '울산역 충전소', lat: 35.5664, lng: 129.3374, address: '울산 남구 삼산로 282', isAvailable: true, type: 'FAST' },
  { id: 64, name: '울산시청 충전소', lat: 35.5384, lng: 129.3114, address: '울산 남구 중앙로 201', isAvailable: true, type: 'NORMAL' },
  
  // === 세종특별자치시 ===
  { id: 65, name: '세종시청 충전소', lat: 36.4800, lng: 127.2890, address: '세종 한누리대로 2130', isAvailable: true, type: 'FAST' },
  { id: 66, name: '세종정부청사 충전소', lat: 36.5000, lng: 127.2650, address: '세종 한누리대로 411', isAvailable: true, type: 'NORMAL' },
];

export const MOCK_REPORTS: Report[] = [
  { id: 1, lat: 37.5655, lng: 126.9770, type: 'CONSTRUCTION', description: '보도블럭 공사중 우회 필요', createdAt: '2023-10-25T10:00:00Z', severity: 'WARNING' },
  { id: 2, lat: 37.5670, lng: 126.9800, type: 'BROKEN_LIFT', description: '1번 출구 엘리베이터 고장', createdAt: '2023-10-26T09:30:00Z', severity: 'DANGER' },
];

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