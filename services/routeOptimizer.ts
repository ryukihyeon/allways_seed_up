/**
 * 경로 최적화 및 도로 차단 회피 시스템
 */

import { RouteOption } from '../types';
import type { RoadBlockInfo } from './roadBlockApi';

// 경로와 도로 차단 구간의 교차 여부 확인
export function checkRouteIntersection(
  route: RouteOption,
  roadBlocks: RoadBlockInfo[]
): {
  hasIntersection: boolean;
  intersectedBlocks: RoadBlockInfo[];
  severity: 'none' | 'low' | 'medium' | 'high';
} {
  const intersectedBlocks: RoadBlockInfo[] = [];
  
  if (!route.path || route.path.length === 0) {
    return { hasIntersection: false, intersectedBlocks: [], severity: 'none' };
  }

  // 경로의 각 구간과 도로 차단 위치의 거리 계산
  for (const block of roadBlocks) {
    for (let i = 0; i < route.path.length - 1; i++) {
      const segmentStart = route.path[i];
      const segmentEnd = route.path[i + 1];
      
      // 선분과 점 사이의 최단 거리 계산
      const distance = pointToSegmentDistance(
        block.lat, block.lng,
        segmentStart.lat, segmentStart.lng,
        segmentEnd.lat, segmentEnd.lng
      );
      
      // 100m 이내면 교차로 판단
      if (distance < 0.1) { // 0.1km = 100m
        intersectedBlocks.push(block);
        break;
      }
    }
  }

  // 심각도 결정
  let severity: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (intersectedBlocks.length > 0) {
    const maxSeverity = Math.max(...intersectedBlocks.map(b => {
      if (b.severity === 'high') return 3;
      if (b.severity === 'medium') return 2;
      if (b.severity === 'low') return 1;
      return 0;
    }));
    
    if (maxSeverity >= 3) severity = 'high';
    else if (maxSeverity >= 2) severity = 'medium';
    else if (maxSeverity >= 1) severity = 'low';
  }

  return {
    hasIntersection: intersectedBlocks.length > 0,
    intersectedBlocks,
    severity
  };
}

// 점과 선분 사이의 최단 거리 계산 (km)
function pointToSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy) * 111; // 대략적인 km 변환
}

// 경로에 도로 차단 정보 추가
export function annotateRouteWithBlocks(
  route: RouteOption,
  roadBlocks: RoadBlockInfo[]
): RouteOption & { 
  warnings: string[];
  blockedSections: Array<{
    block: RoadBlockInfo;
    distance: number;
  }>;
} {
  const intersection = checkRouteIntersection(route, roadBlocks);
  const warnings: string[] = [];
  const blockedSections: Array<{ block: RoadBlockInfo; distance: number }> = [];

  if (intersection.hasIntersection) {
    for (const block of intersection.intersectedBlocks) {
      const blockTypeText = {
        construction: '공사',
        repair: '보수',
        event: '행사',
        accident: '사고'
      }[block.blockType];

      const severityText = {
        high: '⛔ 전면 통제',
        medium: '⚠️ 부분 통제',
        low: '⚡ 일시 통제'
      }[block.severity];

      warnings.push(`${severityText} ${blockTypeText}: ${block.title}`);
      
      if (block.detour) {
        warnings.push(`  → 우회: ${block.detour}`);
      }

      blockedSections.push({
        block,
        distance: 0 // 실제 거리는 경로 분석 필요
      });
    }

    // 심각도에 따른 추가 경고
    if (intersection.severity === 'high') {
      warnings.unshift('🚫 경로 상에 전면 통제 구간이 있습니다. 다른 경로를 선택하세요.');
    } else if (intersection.severity === 'medium') {
      warnings.unshift('⚠️ 경로 상에 부분 통제 구간이 있습니다. 지연이 예상됩니다.');
    }
  }

  return {
    ...route,
    warnings,
    blockedSections
  };
}

// 여러 경로 중 최적 경로 선택 (도로 차단 고려)
export function selectOptimalRoute(
  routes: RouteOption[],
  roadBlocks: RoadBlockInfo[]
): {
  recommended: RouteOption;
  alternatives: RouteOption[];
  reason: string;
} {
  if (routes.length === 0) {
    throw new Error('경로가 없습니다');
  }

  // 각 경로에 도로 차단 정보 추가
  const annotatedRoutes = routes.map(route => 
    annotateRouteWithBlocks(route, roadBlocks)
  );

  // 점수 계산 (낮을수록 좋음)
  const scoredRoutes = annotatedRoutes.map(route => {
    let score = 0;
    
    // 기본 점수: 시간
    score += route.durationMin;
    
    // 도로 차단 페널티
    const intersection = checkRouteIntersection(route, roadBlocks);
    if (intersection.severity === 'high') {
      score += 1000; // 전면 통제는 거의 선택 불가
    } else if (intersection.severity === 'medium') {
      score += 100; // 부분 통제는 큰 페널티
    } else if (intersection.severity === 'low') {
      score += 20; // 일시 통제는 작은 페널티
    }
    
    // 비용 고려 (택시는 약간의 페널티)
    if (route.mode === 'TAXI') {
      score += route.cost / 1000; // 1000원당 1점
    }
    
    return { route, score };
  });

  // 점수순 정렬
  scoredRoutes.sort((a, b) => a.score - b.score);

  const recommended = scoredRoutes[0].route;
  const alternatives = scoredRoutes.slice(1).map(s => s.route);

  // 추천 이유 생성
  let reason = '';
  const recIntersection = checkRouteIntersection(recommended, roadBlocks);
  
  if (recIntersection.hasIntersection) {
    if (recIntersection.severity === 'high') {
      reason = '⚠️ 모든 경로에 차단 구간이 있습니다. 가장 영향이 적은 경로를 선택했습니다.';
    } else if (recIntersection.severity === 'medium') {
      reason = '⚠️ 일부 통제 구간이 있지만 통행 가능한 경로입니다.';
    } else {
      reason = '✅ 일시적 통제 구간이 있지만 큰 영향은 없습니다.';
    }
  } else {
    reason = '✅ 도로 차단 구간이 없는 최적 경로입니다.';
  }

  console.log('🎯 경로 선택:', {
    추천경로: `${recommended.mode} (${recommended.durationMin}분)`,
    점수: scoredRoutes[0].score,
    이유: reason,
    경고수: recommended.warnings?.length || 0
  });

  return { recommended, alternatives, reason };
}

// 우회 경로 생성
export function generateDetourRoute(
  originalRoute: RouteOption,
  blockedArea: { lat: number; lng: number; radius: number }
): RouteOption {
  if (!originalRoute.path || originalRoute.path.length < 2) {
    return originalRoute;
  }

  const detourPath: Array<{ lat: number; lng: number }> = [];
  
  for (let i = 0; i < originalRoute.path.length; i++) {
    const point = originalRoute.path[i];
    const distance = calculateDistance(
      point.lat, point.lng,
      blockedArea.lat, blockedArea.lng
    );

    // 차단 구역에서 충분히 멀면 그대로 사용
    if (distance > blockedArea.radius + 0.2) { // 200m 여유
      detourPath.push(point);
    } else {
      // 차단 구역 근처면 우회 지점 생성
      if (i > 0 && detourPath.length > 0) {
        const lastPoint = detourPath[detourPath.length - 1];
        
        // 차단 구역을 피해 우회
        const detourPoint = calculateDetourPoint(
          lastPoint,
          point,
          blockedArea
        );
        
        detourPath.push(detourPoint);
      }
    }
  }

  // 마지막 지점 추가
  if (detourPath.length === 0 || 
      detourPath[detourPath.length - 1] !== originalRoute.path[originalRoute.path.length - 1]) {
    detourPath.push(originalRoute.path[originalRoute.path.length - 1]);
  }

  // 거리 재계산
  let totalDistance = 0;
  for (let i = 0; i < detourPath.length - 1; i++) {
    totalDistance += calculateDistance(
      detourPath[i].lat, detourPath[i].lng,
      detourPath[i + 1].lat, detourPath[i + 1].lng
    );
  }

  // 시간 재계산
  const speed = originalRoute.mode === 'WALK' ? 3.5 : 
                originalRoute.mode === 'TAXI' ? 20 : 15;
  const newDuration = Math.ceil((totalDistance / speed) * 60);

  return {
    ...originalRoute,
    path: detourPath,
    distanceKm: parseFloat(totalDistance.toFixed(2)),
    durationMin: newDuration,
    details: `${originalRoute.details} (우회 경로)`
  };
}

// 우회 지점 계산
function calculateDetourPoint(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  blockedArea: { lat: number; lng: number; radius: number }
): { lat: number; lng: number } {
  // 차단 구역의 수직 방향으로 우회
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  
  // 차단 구역 중심에서 중간 지점으로의 벡터
  const vecLat = midLat - blockedArea.lat;
  const vecLng = midLng - blockedArea.lng;
  
  // 벡터 정규화
  const length = Math.sqrt(vecLat * vecLat + vecLng * vecLng);
  const normLat = vecLat / length;
  const normLng = vecLng / length;
  
  // 차단 구역 반경 + 여유 거리만큼 이동
  const detourDistance = blockedArea.radius + 0.3; // 300m 여유
  
  return {
    lat: blockedArea.lat + normLat * detourDistance / 111, // 대략적인 위도 변환
    lng: blockedArea.lng + normLng * detourDistance / (111 * Math.cos(blockedArea.lat * Math.PI / 180))
  };
}

// 거리 계산 (Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
