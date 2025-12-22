# API 주소 및 환경 변수 설정 가이드

## 필수 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# 카카오 REST API 키 (필수)
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key_here

# Tmap API 키 (선택, 보행자 경로 API 사용 시)
VITE_TMAP_API_KEY=your_tmap_api_key_here
```

## 사용 중인 API 목록

### 1. 카카오 REST API (필수)

**환경 변수**: `VITE_KAKAO_REST_API_KEY`

**사용되는 엔드포인트**:
- 장소 검색: `/kakao-api/v2/local/search/keyword.json`
- 역지오코딩: `/kakao-api/v2/local/geo/coord2address.json`
- 네비게이션: `/kakao-navi/v1/directions`

**프록시 설정**: `vite.config.ts`에서 자동 처리
- 프록시 경로: `/kakao-api` → `https://dapi.kakao.com`
- 프록시 경로: `/kakao-navi` → `https://apis-navi.kakaomobility.com`

**API 키 발급 방법**:
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 → 애플리케이션 추가하기
3. REST API 키 복사
4. 플랫폼 설정에서 Web 플랫폼 등록 (localhost:3000)

---

### 2. Tmap API (선택, 보행자 경로용)

**환경 변수**: `VITE_TMAP_API_KEY`

**사용되는 엔드포인트**:
- 보행자 경로: `/tmap-api/routes/pedestrian?version=1`

**프록시 설정**: `vite.config.ts`에서 자동 처리
- 프록시 경로: `/tmap-api` → `https://apis.openapi.sk.com/tmap`

**API 키 발급 방법**:
1. https://openapi.sk.com/ 접속
2. 회원가입 및 로그인
3. 마이페이지 → 프로젝트 → 새 프로젝트 생성
4. Tmap API → "보행자 경로 안내" 선택
5. App Key 복사

**상세 가이드**: `TMAP_API_SETUP.md` 참고

---

### 3. 보조공학기기 API (공공데이터포털)

**API 키**: 하드코딩됨 (`services/wheelchairApi.ts`)
- 키: `b179524d5cba2dfcad393522f5a2f0b28e6ddae78afaeb08d27ce566ed45af92`

**엔드포인트**: `/wheelchair-api/product_list`
- 실제 URL: `https://apis.data.go.kr/B552583/product_list`

**프록시 설정**: `vite.config.ts`에서 자동 처리
- 프록시 경로: `/wheelchair-api` → `https://apis.data.go.kr/B552583/productlist`

**참고**: 현재는 API 호출이 실패해도 빈 배열을 반환하므로 필수는 아님

---

### 4. 안전지도 API (도로 차단 정보)

**API 키**: 하드코딩됨 (`services/roadBlockApi.ts`)
- 키: `7892694858`

**엔드포인트**: `/safemap-api/IF_0043`
- 실제 URL: `http://safemap.go.kr/openapi2/IF_0043`

**프록시 설정**: `vite.config.ts`에서 자동 처리
- 프록시 경로: `/safemap-api` → `http://safemap.go.kr/openapi2`

**참고**: 
- CORS 문제로 브라우저에서 직접 호출 불가
- 현재는 빈 배열 반환 (백엔드 서버 구축 필요)
- 프로덕션에서는 백엔드 서버를 통해 호출해야 함

---

### 5. 대구 지하철 API (선택)

**프록시 설정**: `vite.config.ts`에 설정되어 있으나 현재 미사용
- 프록시 경로: `/daegu-subway-api` → `https://www.dtro.or.kr/openApi`

**참고**: 현재는 XML 데이터를 직접 하드코딩하여 사용 중

---

## 프록시 설정 (vite.config.ts)

모든 API는 Vite 개발 서버의 프록시를 통해 호출됩니다:

```typescript
proxy: {
  '/kakao-api': {
    target: 'https://dapi.kakao.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/kakao-api/, ''),
    headers: {
      'Authorization': `KakaoAK ${env.VITE_KAKAO_REST_API_KEY}`
    }
  },
  '/kakao-navi': {
    target: 'https://apis-navi.kakaomobility.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/kakao-navi/, ''),
    headers: {
      'Authorization': `KakaoAK ${env.VITE_KAKAO_REST_API_KEY}`
    }
  },
  '/tmap-api': {
    target: 'https://apis.openapi.sk.com/tmap',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/tmap-api/, ''),
    configure: (proxy, options) => {
      proxy.on('proxyReq', (proxyReq, req, res) => {
        proxyReq.setHeader('appKey', env.VITE_TMAP_API_KEY || '');
        proxyReq.setHeader('Accept', 'application/json');
      });
    }
  },
  '/wheelchair-api': {
    target: 'https://apis.data.go.kr/B552583/productlist',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/wheelchair-api/, ''),
    secure: false
  },
  '/safemap-api': {
    target: 'http://safemap.go.kr/openapi2',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/safemap-api/, ''),
    secure: false
  }
}
```

---

## 빠른 시작 가이드

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# .env.local
VITE_KAKAO_REST_API_KEY=your_kakao_key_here
VITE_TMAP_API_KEY=your_tmap_key_here
```

### 2. 개발 서버 실행

```bash
npm install
npm run dev
```

### 3. API 키 확인

브라우저 콘솔(F12)에서 다음 로그 확인:
- ✅ 카카오 API 정상: 장소 검색, 역지오코딩 작동
- ✅ Tmap API 정상: 보행자 경로 계산 작동
- ⚠️ API 키 없음: 폴백 시스템 작동 (직선 거리 계산)

---

## API별 필수 여부

| API | 필수 여부 | 설명 |
|-----|----------|------|
| 카카오 REST API | **필수** | 장소 검색, 역지오코딩 필수 |
| Tmap API | 선택 | 보행자 경로 정확도 향상 (없어도 작동) |
| 보조공학기기 API | 선택 | 제품 정보 (없어도 작동) |
| 안전지도 API | 선택 | 도로 차단 정보 (현재 미구현) |
| 대구 지하철 API | 선택 | 현재 미사용 |

---

## 문제 해결

### 카카오 API 403 에러
- API 키가 올바른지 확인
- 카카오 개발자 콘솔에서 플랫폼 등록 확인 (localhost:3000)
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버 재시작

### Tmap API 403 에러
- API 키가 올바른지 확인
- SK Open API에서 프로젝트 활성화 확인
- `.env.local` 파일 확인
- 개발 서버 재시작

### CORS 에러
- 모든 API는 프록시를 통해 호출되므로 CORS 문제 없음
- 만약 CORS 에러가 발생하면 `vite.config.ts`의 프록시 설정 확인

---

## 프로덕션 배포 시 주의사항

1. **환경 변수 설정**
   - Vercel/Netlify 등 배포 플랫폼에서 환경 변수 설정
   - `VITE_` 접두사 유지

2. **프록시 설정**
   - 개발 환경: Vite 프록시 사용
   - 프로덕션: 백엔드 서버 또는 서버리스 함수 필요

3. **API 키 보안**
   - `.env.local` 파일은 `.gitignore`에 포함되어 있음
   - 절대 Git에 커밋하지 말 것
   - 프로덕션에서는 환경 변수로 관리

---

## 참고 문서

- 카카오 API: https://developers.kakao.com/docs
- Tmap API: https://tmapapi.sktelecom.com/
- 공공데이터포털: https://www.data.go.kr/
- 안전지도: http://safemap.go.kr/



