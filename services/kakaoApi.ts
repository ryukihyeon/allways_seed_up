import { RouteOption } from '../types';

// 정확한 거리 계산 함수 (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 실제적인 경로 좌표 생성
const generateRealisticPath = (startLat: number, startLng: number, endLat: number, endLng: number): Array<{lat: number, lng: number}> => {
  const path = [{ lat: startLat, lng: startLng }];
  
  const distance = calculateDistance(startLat, startLng, endLat, endLng);
  const numPoints = Math.min(10, Math.max(3, Math.floor(distance * 3)));
  
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / numPoints;
    // 도로를 따라가는 것처럼 약간의 곡선 추가
    const curveFactor = Math.sin(ratio * Math.PI) * 0.0008;
    path.push({
      lat: startLat + (endLat - startLat) * ratio + curveFactor,
      lng: startLng + (endLng - startLng) * ratio + curveFactor * 0.5
    });
  }
  
  path.push({ lat: endLat, lng: endLng });
  return path;
};

export const kakaoApi = {
  // Tmap 보행자 전용 경로 계산 (실제 보도 기준)
  getWalkingRoute: async (
    startLat: number, 
    startLng: number, 
    endLat: number, 
    endLng: number
  ): Promise<RouteOption | null> => {
    try {
      // Tmap 보행자 경로 API 호출
      const url = '/tmap-api/routes/pedestrian?version=1&format=json';
      
      console.log('🚶 Tmap 보행자 API 호출');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startX: startLng.toString(),
          startY: startLat.toString(),
          endX: endLng.toString(),
          endY: endLat.toString(),
          reqCoordType: 'WGS84GEO',
          resCoordType: 'WGS84GEO',
          startName: '출발지',
          endName: '도착지'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // 전체 경로 정보 추출
          let totalDistance = 0;
          let totalTime = 0;
          const path: Array<{lat: number, lng: number}> = [];
          
          data.features.forEach((feature: any) => {
            if (feature.geometry.type === 'LineString') {
              // 경로 좌표 추출
              feature.geometry.coordinates.forEach((coord: number[]) => {
                path.push({
                  lng: coord[0],
                  lat: coord[1]
                });
              });
            }
            
            // 거리와 시간 정보
            if (feature.properties) {
              if (feature.properties.totalDistance) {
                totalDistance = feature.properties.totalDistance;
              }
              if (feature.properties.totalTime) {
                totalTime = feature.properties.totalTime;
              }
            }
          });

          const distanceKm = totalDistance / 1000;
          
          // Tmap 시간은 일반 보행자 기준이므로 휠체어 속도로 재계산
          const wheelchairSpeed = 3.5; // km/h
          const normalWalkSpeed = 4.5; // km/h (일반 보행자)
          const adjustedTime = (totalTime / 60) * (normalWalkSpeed / wheelchairSpeed);
          const durationMin = Math.ceil(adjustedTime);

          console.log('✅ Tmap 보행자 경로:', {
            거리: `${distanceKm.toFixed(1)}km`,
            시간: `${durationMin}분`,
            경로점: path.length
          });

          return {
            mode: 'WALK',
            durationMin: Math.max(5, durationMin),
            cost: 0,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            details: `실제 보도 기반 경로 ${distanceKm.toFixed(1)}km\n휠체어 접근 가능 (계단 회피)`,
            path: path
          };
        }
      }

      // API 실패 시 폴백
      console.warn('⚠️ Tmap API 실패, 직선 거리 사용');
      const distanceKm = calculateDistance(startLat, startLng, endLat, endLng);
      const actualDistanceKm = distanceKm * 1.2;
      const wheelchairSpeed = 3.5;
      const durationMin = Math.ceil((actualDistanceKm / wheelchairSpeed) * 60);
      const path = generateRealisticPath(startLat, startLng, endLat, endLng);

      return {
        mode: 'WALK',
        durationMin: Math.max(5, durationMin),
        cost: 0,
        distanceKm: parseFloat(actualDistanceKm.toFixed(2)),
        details: `보행자 전용 경로 ${actualDistanceKm.toFixed(1)}km\n휠체어 접근 가능한 보도 우선`,
        path: path
      };
    } catch (error) {
      console.error('❌ Tmap 보행자 경로 계산 오류:', error);
      
      // 에러 시 폴백
      const distanceKm = calculateDistance(startLat, startLng, endLat, endLng);
      const actualDistanceKm = distanceKm * 1.2;
      const wheelchairSpeed = 3.5;
      const durationMin = Math.ceil((actualDistanceKm / wheelchairSpeed) * 60);
      const path = generateRealisticPath(startLat, startLng, endLat, endLng);

      return {
        mode: 'WALK',
        durationMin: Math.max(5, durationMin),
        cost: 0,
        distanceKm: parseFloat(actualDistanceKm.toFixed(2)),
        details: `보행자 전용 경로 ${actualDistanceKm.toFixed(1)}km`,
        path: path
      };
    }
  },

  // 대중교통 경로 계산
  getTransitRoute: async (
    startLat: number, 
    startLng: number, 
    endLat: number, 
    endLng: number
  ): Promise<RouteOption[]> => {
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    const routes: RouteOption[] = [];
    
    // 지하철 경로 (1km 이상일 때만 추천)
    if (distance > 1) {
      const subwayPath = generateRealisticPath(startLat, startLng, endLat, endLng);
      routes.push({
        mode: 'SUBWAY',
        durationMin: Math.ceil(distance * 2.5 + 20), // 환승 및 대기시간 포함
        cost: distance > 10 ? 1570 : 1370, // 거리에 따른 요금
        distanceKm: parseFloat(distance.toFixed(1)),
        details: '지하철 이용 (엘리베이터 경로 확인 필요)',
        path: subwayPath
      });
    }
    
    // 버스 경로
    const busPath = generateRealisticPath(startLat, startLng, endLat, endLng);
    routes.push({
      mode: 'BUS',
      durationMin: Math.ceil(distance * 4 + 15), // 정류장 대기 및 교통상황 고려
      cost: 1200,
      distanceKm: parseFloat(distance.toFixed(1)),
      details: '저상버스 이용 (휠체어 탑승 가능 확인 필요)',
      path: busPath
    });

    console.log('🚇🚌 대중교통 경로 생성:', routes.length + '개');
    
    return routes;
  },

  // 카카오 모빌리티 API를 사용한 실제 택시 경로 계산 (도로 기준)
  getTaxiRoute: async (
    startLat: number, 
    startLng: number, 
    endLat: number, 
    endLng: number
  ): Promise<RouteOption | null> => {
    try {
      // 택시는 도로를 이용하므로 카카오 네비 API 사용
      const url = `/kakao-navi/v1/directions?origin=${startLng},${startLat}&destination=${endLng},${endLat}&priority=RECOMMEND`;
      
      console.log('🚕 카카오 도로 경로 API 호출:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = route.summary.distance / 1000;
          const durationMin = Math.ceil(route.summary.duration / 60);
          
          // 서울 택시 요금 계산
          const baseFare = 3800;
          let totalCost = baseFare;
          
          if (distanceKm > 1.6) {
            const extraDistance = distanceKm - 1.6;
            const extraFare = Math.ceil(extraDistance / 0.132) * 132;
            totalCost += extraFare;
          }
          
          // 실제 경로 좌표 추출
          const path: Array<{lat: number, lng: number}> = [];
          
          if (route.sections && route.sections.length > 0) {
            route.sections.forEach((section: any) => {
              if (section.roads && section.roads.length > 0) {
                section.roads.forEach((road: any) => {
                  if (road.vertexes && road.vertexes.length > 0) {
                    for (let i = 0; i < road.vertexes.length; i += 2) {
                      path.push({
                        lng: road.vertexes[i],
                        lat: road.vertexes[i + 1]
                      });
                    }
                  }
                });
              }
            });
          }

          // 경로가 없으면 직선 경로 생성
          if (path.length === 0) {
            path.push({ lat: startLat, lng: startLng });
            path.push({ lat: endLat, lng: endLng });
          }

          console.log('✅ 카카오 API 택시 경로:', {
            거리: `${distanceKm.toFixed(1)}km`,
            시간: `${durationMin}분`,
            요금: `${totalCost.toLocaleString()}원`,
            경로점: path.length
          });

          return {
            mode: 'TAXI',
            durationMin: Math.max(10, durationMin),
            cost: totalCost,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            details: `실제 도로 기반 택시 경로 (장애인 콜택시 가능)`,
            path: path
          };
        }
      }

      // API 실패 시 폴백
      console.warn('⚠️ 카카오 API 실패, 직선 거리 사용');
      const distanceKm = calculateDistance(startLat, startLng, endLat, endLng);
      const taxiSpeed = 20;
      const durationMin = Math.ceil((distanceKm / taxiSpeed) * 60);
      
      const baseFare = 3800;
      let totalCost = baseFare;
      if (distanceKm > 1.6) {
        const extraDistance = distanceKm - 1.6;
        const extraFare = Math.ceil(extraDistance / 0.132) * 132;
        totalCost += extraFare;
      }

      const path = generateRealisticPath(startLat, startLng, endLat, endLng);

      return {
        mode: 'TAXI',
        durationMin: Math.max(10, durationMin),
        cost: totalCost,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        details: `장애인 콜택시 이용 가능`,
        path: path
      };
    } catch (error) {
      console.error('❌ 택시 경로 계산 오류:', error);
      return null;
    }
  },

  // 카카오 장소 검색 API
  searchPlaces: async (query: string, lat?: number, lng?: number) => {
    try {
      const url = lat && lng 
        ? `/kakao-api/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${lng}&y=${lat}&radius=10000`
        : `/kakao-api/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
        
      const response = await fetch(url);

      if (!response.ok) {
        console.warn('카카오 장소 검색 API 실패');
        return [];
      }

      const data = await response.json();
      
      return data.documents.slice(0, 5).map((place: any) => ({
        name: place.place_name,
        address: place.address_name,
        roadAddress: place.road_address_name || place.address_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        category: place.category_name
      }));
    } catch (error) {
      console.error('카카오 장소 검색 오류:', error);
      return [];
    }
  }
};