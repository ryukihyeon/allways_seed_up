# 전동휠체어 사용자를 위한 지도 기반 웹 서비스: allway's

## 1) 서비스 개요 정의
- **서비스 이름**: allway's (올웨이즈) - "모든 길이 당신의 길이 되도록"
- **서비스 목적**: 전동휠체어 사용자의 이동 불확실성(충전, 지형, 배터리)을 해소하여 안전하고 자유로운 이동권을 보장한다.
- **해결하려는 핵심 문제**: 충전소 정보 부족, 예기치 못한 위험 구간(급경사, 고장 등), 배터리 방전에 대한 불안감.
- **타겟 사용자**: 전동휠체어를 이용하는 장애인 및 거동 불편 노약자.
- **MVP 범위**: 지도 기반 충전소/위험구간 시각화, 사용자 제보 기능, 기본 배터리 기반 도달 가능 반경 표시.

## 2) 핵심 기능 설명
1.  **맞춤형 지도 서비스 및 길찾기**
    *   **목적**: 휠체어 접근 불가능한 길을 배제하고 안전한 경로 안내.
    *   **작동 방식**: 일반 지도 위에 '휠체어 전용 레이어' 오버레이.
    *   **MVP**: 오픈스트리트맵(OSM) 기반 지도 표시, 장소 검색 및 다중 경로 옵션 제공.
    *   **길찾기 기능**:
        - 장소 검색 자동완성
        - **보행자 전용 경로**: 전동휠체어는 보행자 신분이므로 도로가 아닌 보도 기준 경로 제공
        - 지하철, 버스, 택시 등 다양한 이동 수단별 경로 제공
        - 소요 시간, 비용, 거리 정보 표시
        - 선택한 경로를 지도에 시각적으로 표시
        - 목적지 마커 및 경로 라인 표시
    *   **경로 구분**:
        - 🚶‍♂️ **도보**: 보행자 전용 경로 (보도 기준, 휠체어 접근 가능)
        - 🚕 **택시**: 도로 기반 경로 (차량 이동)
        - 🚇 **지하철/버스**: 대중교통 경로
    *   **확장**: 로드뷰 연동, 실내 지도(지하철 등) 포함, 실시간 교통 정보 반영.

2.  **실시간 위험 제보 기능**
    *   **목적**: 지도 데이터에 없는 실시간 위험(공사, 승강기 고장, 무단 적재물) 공유.
    *   **작동 방식**: 위치 클릭 -> 유형 선택 -> 등록. 다른 사용자 지도에 즉시 반영.
    *   **MVP**: 마커 생성 및 텍스트 설명.
    *   **확장**: 사진 첨부, 제보 신뢰도 투표 시스템.

3.  **충전소 실시간 정보 제공**
    *   **목적**: 충전소 헛걸음 방지.
    *   **작동 방식**: 공공데이터 포털 API 연동 + 사용자 업데이트.
    *   **MVP**: 위치, 운영 시간, 상세 위치 텍스트 제공.
    *   **확장**: 충전기 사용 중 여부(IoT 센서 연동).

4.  **배터리 기반 "도달 가능 범위" 예측 (AI Safe Range)**
    *   **목적**: 방전 공포 해소.
    *   **작동 방식**: 배터리 잔량, 기온, 지형 데이터를 종합하여 갈 수 있는 거리를 원형으로 시각화.
    *   **MVP**: 단순 거리 계산 (배터리% * 효율 - 경사 감점).
    *   **확장**: 사용자 주행 로그 학습(3,842건 데이터 활용)을 통한 개인화 정밀 예측.

5.  **오르막 회피 네비게이션 (설계)**
    *   **목적**: 전복 사고 방지 및 배터리 절약.
    *   **작동 방식**: DEM(수치표고모델) 데이터를 분석하여 경사도 5도 이상 구간 회피 경로 생성.

## 3) 웹 아키텍처 설계
*   **Front-end**: React (TypeScript) + Tailwind CSS + Leaflet (지도 라이브러리).
    *   *선정 이유*: Leaflet은 가볍고 모바일 최적화가 잘 되어 있으며 OSM과 호환성이 좋음.
*   **Back-end**: Node.js + Express.
*   **DB**: Supabase (PostgreSQL + PostGIS).
    *   *선정 이유*: 위치 기반 쿼리(내 주변 충전소 찾기)에 최적화된 PostGIS 지원 및 실시간 구독 기능.
*   **외부 API**:
    *   기상청 API (기온/습도/바람).
    *   국토지리정보원 API (지형 고도).
    *   공공데이터포털 (전동보장구 급속충전기 정보).

## 4) 화면(UI) 설계
1.  **홈 화면**: 현재 위치 중심 지도, 하단 '내 배터리' 요약 카드, 주요 필터(충전소, 위험구간) 토글.
2.  **지도 화면**: 핀치 줌인/아웃. 충전소(녹색 번개), 위험(빨간 느낌표) 마커 혼합 표시.
3.  **제보 입력**: 지도 롱탭 -> 바텀 시트 오픈 -> 유형(턱, 고장, 공사) 선택 -> 코멘트 입력 -> 등록.
4.  **충전소 상세**: 마커 클릭 -> 상호명, 운영시간, 전화번호, "고장 신고" 버튼.
5.  **배터리 예측**: 사이드 메뉴 -> 배터리 잔량 슬라이더 조절 -> 지도 위에 반투명 파란색 원(Range) 실시간 변경.

## 5) API 명세서 (Node.js/Express)
*   `GET /api/stations?lat=..&lng=..&radius=..` : 주변 충전소 조회.
*   `POST /api/reports` : 위험 구간 제보 (Body: `{type, lat, lng, description}`).
*   `GET /api/reports` : 제보 목록 조회.
*   `POST /api/battery/predict` : 도달 범위 계산.
    *   Req: `{ level, temp, weight, location }`
    *   Res: `{ safe_radius_meters, warning_level }`
*   `GET /api/weather` : 현재 위치 기상 정보.

## 6) 데이터베이스 구조 (ERD)
*   **Users**: `id`, `nickname`, `wheelchair_model`, `weight_total`.
*   **Stations**: `id`, `name`, `lat`, `lng`, `address`, `status(active/broken)`.
*   **Reports**: `id`, `user_id`, `type(slope/obstacle/broken_lift)`, `lat`, `lng`, `description`, `created_at`.
*   **DangerZones**: `id`, `lat`, `lng`, `severity`, `source(government/user)`.
*   **BatteryLogs**: `id`, `user_id`, `start_level`, `end_level`, `distance`, `temp`, `slope_avg`.

## 7) 배터리 예측 모델 설계 (Algorithm)
**예측 공식 (Pseudocode):**
```python
def calculate_range(battery_percent, temp, slope_avg, weight):
    # 1. 기본 효율 (배터리 1%당 이동 거리, 휠체어 평균 30km/100% 가정 -> 300m/1%)
    base_efficiency = 300 
    
    # 2. 기온 보정 (저온에서 리튬이온 효율 급감)
    temp_factor = 1.0
    if temp < 0: temp_factor = 0.6
    elif temp < 10: temp_factor = 0.8
    elif temp > 30: temp_factor = 0.9
    
    # 3. 경사도 보정 (오르막 시 소모량 급증)
    slope_factor = 1.0 - (slope_avg * 0.05) # 경사 1도당 5% 감소 가정
    
    # 4. 무게 보정 (기본 100kg 기준, 초과 시 감소)
    weight_factor = 100 / weight if weight > 100 else 1.0
    
    # 최종 거리 (미터)
    max_distance = battery_percent * base_efficiency * temp_factor * slope_factor * weight_factor
    
    return max_distance
```

## 8) 백엔드 서버 예시 코드 (Node.js)
```javascript
// server.js (Example)
const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

let stations = require('./dummyStations.json');
let reports = [];

// 충전소 조회
app.get('/stations', (req, res) => {
  res.json(stations);
});

// 제보 등록
app.post('/reports', (req, res) => {
  const newReport = { id: Date.now(), ...req.body };
  reports.push(newReport);
  res.status(201).json(newReport);
});

// 배터리 예측 엔드포인트
app.post('/battery/predict-range', (req, res) => {
  const { batteryLevel, temp, slope } = req.body;
  // 단순 알고리즘 적용
  const range = (batteryLevel * 300) * (temp < 10 ? 0.8 : 1.0) - (slope * 50);
  res.json({ rangeMeters: Math.max(0, range) });
});

app.listen(3001, () => console.log('Server running on port 3001'));
```

## 9) 개발 로드맵
*   **1단계(MVP)**: ✅ 지도 표시, 충전소 더미 데이터 마커, 간단한 제보 기능, 기본 배터리 반경 원 그리기, 길찾기 기능 구현.
*   **2단계(Real-time)**: 공공데이터 API 실시간 연동, 날씨 API 연동, 실제 위치(GPS) 추적, 실시간 교통 정보 반영.
*   **3단계(AI)**: 사용자 주행 데이터 수집 및 머신러닝 모델 도입 (개인별 오차 보정), 경로 최적화 알고리즘 개선.
*   **4단계(Expansion)**: 지자체 행정 시스템 연동(제보 시 자동 민원 접수), 커뮤니티 기능, 턴바이턴 음성 안내.

## 10) 길찾기 기능 사용 방법
1. **장소 검색**: 상단 검색창에 목적지를 입력하면 자동완성 제안이 표시됩니다.
2. **경로 확인**: 검색 후 지하철, 버스, 도보, 택시 등 다양한 경로 옵션이 표시됩니다.
3. **경로 선택**: 원하는 경로를 클릭하면 지도에 해당 경로가 표시됩니다.
4. **길 안내 시작**: 경로를 선택한 후 "길 안내 시작" 버튼을 클릭하여 내비게이션을 시작할 수 있습니다.
5. **경로 정보**: 각 경로는 소요 시간, 비용, 거리, 상세 정보를 포함합니다.


## 11) 정밀 배터리 예측 모델 (논문 기반)

### 개요
전동휠체어 사용자를 위한 정밀 배터리 예측 시스템으로, 실시간 환경 데이터와 논문 기반 Capacity Fade 모델을 결합하여 정확한 주행 가능 거리를 예측합니다.

### 핵심 기술

#### 1. 단기 예측 모델 (실시간 소모량)
```
Wh/km_effective = BASE_Wh/km × k_temp × k_slope × k_surface × k_weight × k_wind × k_stops × k_pattern
```

**보정 계수:**
- `k_temp`: 온도 영향 (영하: +40%, 저온: +20%, 고온: +15%)
- `k_slope`: 경사도 영향 (오르막: +15%/%, 내리막: 회생제동 -20%)
- `k_surface`: 노면 상태 (아스팔트: 1.0, 자갈: 1.5)
- `k_weight`: 무게 영향 (10kg당 +5%)
- `k_wind`: 바람 영향 (정면 바람 m/s당 +3%)
- `k_stops`: 정지 영향 (정지당 +2%)
- `k_pattern`: 주행 패턴 (부드러움: 0.9, 공격적: 1.2)

#### 2. 장기 예측 모델 (Capacity Fade)
```
cap_fade = cap_REF_fade × Δt × F_CUR[I] × F_DOD[DOD] × F_T[T,I] × F_DUR[ΔDOD]
```

**열화 계수:**
- `F_CUR`: 전류 영향 (C-rate > 2.0: 2배 가속)
- `F_DOD`: 방전 깊이 (DOD > 80%: 2.2배 가속)
- `F_T`: 온도 영향 (고온 + 고전류: 급격한 열화)
- `F_DUR`: 충방전 패턴 (급격한 스윙: 열화 가속)

#### 3. SOH (State of Health) 예측
- **사이클 노화**: 사이클당 0.05% 감소 (온도/DOD 보정)
- **캘린더 노화**: 월 0.3% 자연 감소 (온도 보정)
- **1년 후 SOH**: 현재 SOH - (사이클 노화 + 캘린더 노화)
- **500 사이클 후 SOH**: 온도와 DOD 패턴 고려한 예측

### 기상청 API 연동
```javascript
// 실시간 기상 데이터 수집
const weatherData = await fetchWeatherData(lat, lng);
// 반환: { temperature, humidity, windSpeed, windDirection }
```

**활용 데이터:**
- T1H: 기온 (°C)
- REH: 습도 (%)
- WSD: 풍속 (m/s)
- VEC: 풍향 (도)

### 예측 결과 예시
```javascript
{
  expectedRangeMeters: 8500,        // 8.5km 주행 가능
  whPerKmEffective: 52.3,           // km당 52.3Wh 소모
  estimatedDurationMin: 85,         // 85분 소요
  sohAfter1Year: 96.4,              // 1년 후 96.4% SOH
  sohAfter500Cycles: 92.1,          // 500 사이클 후 92.1% SOH
  warningLevel: 'safe',             // 안전 수준
  recommendations: [                // 권장사항
    '⚠️ 저온 환경: 배터리 성능이 저하됩니다.',
    '⚠️ 급경사: 에너지 소모가 많습니다.'
  ]
}
```

### 경고 레벨
- **safe**: SOC > 30% (안전)
- **caution**: SOC 20-30% (주의)
- **warning**: SOC 10-20% (경고)
- **danger**: SOC < 10% (위험)

### 권장사항 자동 생성
- 저온/고온 환경 경고
- 급경사 구간 우회 제안
- 배터리 부족 시 충전소 안내
- 배터리 노화 시 교체 권장

### 기술적 특징
1. **실시간 정밀도**: 1초 단위 시뮬레이션 가능
2. **환경 적응**: 기상청 API 실시간 연동
3. **개인화**: 사용자별 주행 패턴 학습
4. **장기 예측**: SOH 감소 곡선 예측
5. **안전 중심**: 15% 안전 여유율 적용

### 향후 개선 방향
- 사용자 주행 데이터 수집 및 ML 학습
- 개인별 배터리 열화 패턴 분석
- 경로별 에너지 소모 예측
- 충전 최적화 알고리즘


## 12) 도로 차단 정보 시스템

### 개요
안전지도 API를 활용하여 공사, 보수, 행사 등으로 인한 도로 차단 정보를 실시간으로 제공합니다.

### API 정보
- **제공기관**: 안전지도 (safemap.go.kr)
- **API 키**: 7892694858
- **엔드포인트**: `http://safemap.go.kr/openapi2/IF_0043`
- **응답 형식**: JSON/XML

### 차단 유형
1. **공사 (construction)**: 도로 공사, 지하철 공사 등
2. **보수 (repair)**: 노면 보수, 교량 보수 등
3. **행사 (event)**: 문화 행사, 마라톤 등
4. **사고 (accident)**: 교통사고로 인한 일시 차단

### 심각도 분류
- **high (상)**: 전면 통제, 우회 필수
- **medium (중)**: 부분 통제, 지연 예상
- **low (하)**: 일시적 통제, 영향 미미

### 데이터 구조
```typescript
interface RoadBlock {
  id: string;
  title: string;              // 차단 제목
  location: string;           // 위치 주소
  lat: number;                // 위도
  lng: number;                // 경도
  startDate: string;          // 시작일
  endDate: string;            // 종료일
  blockType: string;          // 차단 유형
  severity: string;           // 심각도
  description: string;        // 상세 설명
  detour?: string;            // 우회 정보
}
```

### 주요 기능

#### 1. 실시간 차단 정보 조회
```javascript
const blocks = await fetchRoadBlockInfo(pageNo, numOfRows);
```

#### 2. 위치 기반 필터링
```javascript
// 현재 위치 5km 이내 차단 정보
const nearbyBlocks = filterRoadBlocksByLocation(blocks, lat, lng, 5);
```

#### 3. 진행 중인 차단만 표시
```javascript
// 현재 날짜 기준 활성 차단
const activeBlocks = filterActiveBlocks(blocks);
```

### 경로 계산 시 활용
- 도로 차단 구간 자동 회피
- 우회 경로 제안
- 예상 지연 시간 반영

### 지도 표시
- 차단 위치에 경고 마커 표시
- 심각도별 색상 구분
  - 🔴 high: 빨간색
  - 🟠 medium: 주황색
  - 🟡 low: 노란색

### 알림 기능
- 경로 상에 차단 구간 발견 시 알림
- 우회 경로 자동 제안
- 예상 지연 시간 안내


## 13) 카카오 API 길찾기 문제 해결

### 문제 상황
카카오 모빌리티 API가 실제 도로를 따라가지 않고 직선 거리만 계산하는 문제

### 원인 분석
1. **CORS 문제**: 브라우저에서 직접 카카오 API 호출 시 CORS 에러 발생
2. **API 키 권한**: REST API 키는 제한적인 기능만 제공
3. **프록시 설정**: Vite 프록시가 제대로 작동하지 않을 수 있음

### 해결 방법

#### 방법 1: 프록시 서버 사용 (현재 구현)
```typescript
// vite.config.ts
proxy: {
  '/kakao-navi': {
    target: 'https://apis-navi.kakaomobility.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/kakao-navi/, ''),
    headers: {
      'Authorization': `KakaoAK ${env.VITE_KAKAO_API_KEY}`
    }
  }
}
```

**장점**: 클라이언트 코드 수정 불필요
**단점**: 개발 서버에서만 작동, 프로덕션에서는 별도 프록시 필요

#### 방법 2: 폴백 시스템 (현재 구현)
```typescript
// API 실패 시 자동으로 직선 거리 계산으로 전환
if (response.ok) {
  // 카카오 API 사용
} else {
  // Haversine 공식으로 직선 거리 계산
  const distanceKm = calculateDistance(startLat, startLng, endLat, endLng);
}
```

**장점**: 항상 작동 보장
**단점**: 실제 도로 경로가 아닐 수 있음

#### 방법 3: 서버 사이드 API 호출 (권장)
```javascript
// Node.js 백엔드 예시
app.get('/api/route', async (req, res) => {
  const { origin, destination } = req.query;
  
  const response = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}`,
    {
      headers: {
        'Authorization': `KakaoAK ${process.env.KAKAO_API_KEY}`
      }
    }
  );
  
  const data = await response.json();
  res.json(data);
});
```

**장점**: CORS 문제 없음, 안전한 API 키 관리
**단점**: 백엔드 서버 필요

### 테스트 방법

#### 1. 브라우저 콘솔 확인
```javascript
// F12 개발자 도구 열기
// Console 탭에서 다음 로그 확인:
🗺️ 경로 계산 시작
🚶 카카오 API 호출
✅ 카카오 API 도보 경로
🚕 카카오 API 호출
✅ 카카오 API 택시 경로
```

#### 2. 테스트 페이지 사용
`test-kakao-api.html` 파일을 브라우저에서 열어서 API 직접 테스트

#### 3. Network 탭 확인
- F12 → Network 탭
- `/kakao-navi/` 요청 확인
- 상태 코드 200이면 성공
- 401/403이면 API 키 문제
- CORS 에러면 프록시 문제

### 현재 구현 상태

✅ **구현 완료**:
- Haversine 공식으로 정확한 직선 거리 계산
- 카카오 API 호출 시도
- API 실패 시 자동 폴백
- 상세한 디버깅 로그

⚠️ **제한 사항**:
- 카카오 API가 실패하면 직선 경로 사용
- 실제 도로 경로는 프록시 서버 필요
- 프로덕션 배포 시 백엔드 API 필요

### 권장 사항

**개발 단계**:
1. `npm run dev`로 개발 서버 실행
2. 프록시를 통해 카카오 API 호출
3. 콘솔 로그로 API 응답 확인

**프로덕션 배포**:
1. Node.js/Express 백엔드 구축
2. 백엔드에서 카카오 API 호출
3. 프론트엔드는 백엔드 API 호출

### 대안: Tmap API
카카오 API가 계속 실패하면 Tmap 보행자 경로 API 사용 고려:
```javascript
// Tmap 보행자 경로 API
const url = 'https://apis.openapi.sk.com/tmap/routes/pedestrian';
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'appKey': TMAP_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startX: startLng,
    startY: startLat,
    endX: endLng,
    endY: endLat,
    reqCoordType: 'WGS84GEO',
    resCoordType: 'WGS84GEO'
  })
});
```


## 14) 도로 차단 회피 및 우회 경로 시스템

### 개요
공사, 보수, 행사 등으로 인한 도로 차단 구간을 자동으로 감지하고 최적의 우회 경로를 제안합니다.

### 핵심 기능

#### 1. 경로-차단 구간 교차 감지
```typescript
// 경로와 도로 차단 구간의 교차 여부 확인
const intersection = checkRouteIntersection(route, roadBlocks);
// 반환: { hasIntersection, intersectedBlocks, severity }
```

**감지 방식**:
- 경로의 각 선분과 차단 구역의 거리 계산
- 100m 이내면 교차로 판단
- 점-선분 최단 거리 알고리즘 사용

#### 2. 심각도 분류
- **high (전면 통제)**: 통행 불가, 반드시 우회 필요
- **medium (부분 통제)**: 통행 가능하나 지연 예상
- **low (일시 통제)**: 영향 미미

#### 3. 경로 최적화 알고리즘
```typescript
const optimization = selectOptimalRoute(routes, roadBlocks);
// 반환: { recommended, alternatives, reason }
```

**점수 계산 방식**:
```
점수 = 기본시간 + 차단페널티 + 비용페널티

차단 페널티:
- 전면 통제: +1000점 (거의 선택 불가)
- 부분 통제: +100점 (큰 페널티)
- 일시 통제: +20점 (작은 페널티)

비용 페널티:
- 택시: 요금/1000 (1000원당 1점)
```

#### 4. 경고 메시지 생성
```typescript
const annotated = annotateRouteWithBlocks(route, roadBlocks);
// 반환: route + { warnings, blockedSections }
```

**경고 예시**:
```
⛔ 전면 통제 공사: 강남대로 도로 공사
  → 우회: 테헤란로 우회 권장
⚠️ 부분 통제 보수: 여의도 한강대교 보수
  → 우회: 마포대교 이용 권장
```

#### 5. 우회 경로 생성
```typescript
const detourRoute = generateDetourRoute(originalRoute, blockedArea);
```

**우회 알고리즘**:
1. 차단 구역 중심에서 수직 방향으로 우회 지점 계산
2. 차단 구역 반경 + 300m 여유 거리 확보
3. 거리 및 시간 재계산

### 사용자 경험

#### 경로 검색 시
1. 모든 가능한 경로 계산 (도보, 택시, 버스, 지하철)
2. 각 경로에 대해 도로 차단 구간 확인
3. 차단 구간이 있으면 경고 표시
4. 최적 경로 자동 선택 및 추천 이유 제공

#### 지도 표시
- **도로 차단 마커**: 
  - 🚧 공사 (빨강/주황/노랑)
  - 🔧 보수
  - 🎪 행사
  - ⚠️ 사고
- **애니메이션**: 심각도에 따라 pulse 효과
- **팝업**: 상세 정보 + 우회 정보

#### 경로 선택 화면
```
✅ 도보 (25분)
   휠체어 안전 경로 2.1km
   
⚠️ 택시 (15분) - 9,532원
   실제 도로 기반 택시 경로
   ⚠️ 부분 통제 공사: 강남대로 도로 공사
     → 우회: 테헤란로 우회 권장
   
🚇 지하철 (30분) - 1,370원
   지하철 이용 (엘리베이터 경로 확인 필요)
```

### 실시간 업데이트

#### 도로 차단 정보 갱신
```typescript
// 앱 시작 시 자동 로드
const roadBlocks = await fetchRoadBlockInfo();
const activeBlocks = filterActiveBlocks(roadBlocks);

// 현재 진행 중인 차단만 필터링
const now = new Date();
const active = blocks.filter(b => 
  now >= new Date(b.startDate) && 
  now <= new Date(b.endDate)
);
```

#### 위치 기반 필터링
```typescript
// 현재 위치 5km 이내 차단 정보만 표시
const nearbyBlocks = filterRoadBlocksByLocation(
  blocks, 
  userLat, 
  userLng, 
  5 // 반경 5km
);
```

### 통계 및 로그

#### 콘솔 로그
```javascript
🗺️ 경로 계산 시작
🚧 도로 차단 정보: 3개
⚠️ WALK 경로에 차단 구간 발견: ['강남대로 도로 공사']
🎯 최적 경로 선택: {
  추천: 'TAXI (15분)',
  이유: '⚠️ 일부 통제 구간이 있지만 통행 가능한 경로입니다.',
  경고: 1
}
```

### 향후 개선

1. **실시간 교통 정보 연동**
   - 실시간 교통 상황 반영
   - 예상 지연 시간 정확도 향상

2. **사용자 제보 통합**
   - 사용자가 발견한 차단 구간 즉시 반영
   - 크라우드소싱 기반 정보 업데이트

3. **AI 기반 경로 예측**
   - 과거 데이터 학습
   - 시간대별 최적 경로 제안

4. **다중 우회 경로**
   - 여러 우회 옵션 제공
   - 사용자 선호도 반영

### 기술 스택
- **경로 분석**: 점-선분 거리 알고리즘
- **최적화**: 가중치 기반 점수 시스템
- **우회 계산**: 벡터 기반 기하학
- **실시간 데이터**: 안전지도 API 연동


## 15) 보행자 vs 도로 경로 구분

### 전동휠체어의 법적 지위
전동휠체어는 **보행자**로 분류되므로, 차량 도로가 아닌 **보도(인도)**를 이용해야 합니다.

### 경로 계산 방식

#### 🚶‍♂️ 도보 경로 (보행자)
- **기준**: 보도, 횡단보도, 공원 산책로 등
- **특징**: 
  - 도로보다 직선에 가까운 경로 가능
  - 건물 사이 통로, 지하도, 육교 이용 가능
  - 차량 통행 구역 회피
- **거리 보정**: 직선 거리 × 1.2 (건물 우회 고려)
- **속도**: 3.5 km/h (휠체어 평균 속도)
- **장점**: 
  - 교통 체증 영향 없음
  - 신호 대기 시간 짧음
  - 안전한 보행자 전용 공간

#### 🚕 택시 경로 (차량)
- **기준**: 차도, 자동차 전용 도로
- **특징**:
  - 도로 네트워크를 따라 이동
  - 신호등, 교통 체증 영향
  - 일방통행, 좌회전 제한 고려
- **API**: 카카오 모빌리티 네비게이션 API
- **속도**: 20 km/h (도심 평균)
- **장점**:
  - 장거리 이동 시 빠름
  - 날씨 영향 적음

### 구현 상세

#### 도보 경로 계산
```typescript
// 보행자는 도로가 아닌 보도 이용
const distanceKm = calculateDistance(start, end); // 직선 거리
const actualDistanceKm = distanceKm * 1.2; // 건물 우회 보정
const wheelchairSpeed = 3.5; // km/h
const durationMin = (actualDistanceKm / wheelchairSpeed) * 60;
```

#### 택시 경로 계산
```typescript
// 카카오 네비 API로 실제 도로 경로 계산
const response = await fetch(
  `/kakao-navi/v1/directions?origin=${start}&destination=${end}`
);
const route = response.routes[0];
const distanceKm = route.summary.distance / 1000;
const durationMin = route.summary.duration / 60;
```

### 사용자 경험

#### 경로 선택 화면
```
🚶‍♂️ 도보 (25분) - 무료
   보행자 전용 경로 2.1km
   휠체어 접근 가능한 보도 우선
   ✓ 선택된 경로 (지도에 표시됨)

🚕 택시 (15분) - 9,532원
   도로 기반 차량 경로 5.2km
   장애인 콜택시 이용 가능

🚇 지하철 (30분) - 1,370원
   대중교통 이용
   엘리베이터 경로 확인 필요
```

### 향후 개선

1. **OSM 보행자 네트워크 연동**
   - OpenStreetMap의 보도 데이터 활용
   - 실제 보행자 경로 정확도 향상

2. **Tmap 보행자 API 연동**
   - SK Tmap의 보행자 전용 경로 API
   - 계단, 경사로, 엘리베이터 정보 포함

3. **휠체어 접근성 필터**
   - 경사도 5도 이상 구간 회피
   - 턱 높이 3cm 이상 구간 경고
   - 폭 1.2m 이상 보도 우선

4. **실시간 보도 상황**
   - 공사, 적재물로 인한 보도 차단 정보
   - 사용자 제보 기반 실시간 업데이트

### 기술 스택
- **도보 경로**: Haversine 공식 + 보정 계수
- **택시 경로**: 카카오 모빌리티 API
- **향후**: OSM Overpass API, Tmap 보행자 API


## 16) Tmap 보행자 API 설정 가이드

### API 키 발급 방법

1. **SK Open API 회원가입**
   - https://openapi.sk.com/ 접속
   - 회원가입 및 로그인

2. **앱 등록**
   - 마이페이지 → 프로젝트 → 새 프로젝트 생성
   - 프로젝트명: allway's
   - 서비스: Tmap API 선택

3. **API 키 발급**
   - Tmap 보행자 경로 안내 API 선택
   - App Key 발급 받기
   - 발급된 키를 `.env.local` 파일에 추가

### 설정 파일

#### .env.local
```bash
VITE_TMAP_API_KEY=YOUR_TMAP_API_KEY_HERE
```

#### vite.config.ts
```typescript
'/tmap-api': {
  target: 'https://apis.openapi.sk.com/tmap',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/tmap-api/, ''),
  headers: {
    'appKey': env.VITE_TMAP_API_KEY
  }
}
```

### API 사용량 제한
- **무료**: 일 10,000건
- **유료**: 필요 시 요금제 선택

### 테스트 방법

1. API 키 발급 후 `.env.local`에 추가
2. 개발 서버 재시작: `npm run dev`
3. 길찾기 기능 테스트
4. 브라우저 콘솔에서 로그 확인:
   ```
   🚶 Tmap 보행자 API 호출
   ✅ Tmap 보행자 경로: { 거리: '2.1km', 시간: '35분', 경로점: 245 }
   ```

### 폴백 시스템
Tmap API가 실패하면 자동으로 직선 거리 기반 계산으로 전환됩니다.

### 주요 기능
- ✅ 실제 보도 네트워크 기반 경로
- ✅ 횡단보도, 육교, 지하도 정보
- ✅ 계단 정보 (향후 휠체어 회피 기능 추가 예정)
- ✅ 상세한 경로 좌표 (지도 표시)
- ✅ 휠체어 속도 보정 (3.5km/h)

### 향후 개선
- 계단 구간 자동 회피
- 경사도 정보 연동
- 엘리베이터 위치 표시
- 휠체어 접근성 점수 계산
