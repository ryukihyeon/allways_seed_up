import React, { useEffect, useRef, useCallback } from 'react';
import { Station, Report, RoadBlock } from '../types';
import type { ElevatorInfo } from '../services/daeguElevatorApi';

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapProps {
  stations: Station[];
  reports: Report[];
  roadBlocks: RoadBlock[];
  elevators: ElevatorInfo[];
  showStations: boolean;
  showReports: boolean;
  batteryRange: number | null;
  onMapClick: (lat: number, lng: number) => void;
  onStationClick: (station: Station) => void;
  onSaveLocation: (name: string, lat: number, lng: number) => void;
  center: { lat: number, lng: number };
  userLocation: { lat: number, lng: number } | null;
  isFollowingUser: boolean;
  onDragStart: () => void;
  selectedRoute: any | null;
  routeDestination: { lat: number, lng: number } | null;
  showElevators: boolean;
  visibleSeverities: Set<string>;
}

export const KakaoMapComponent: React.FC<MapProps> = ({
  stations,
  reports,
  roadBlocks,
  elevators,
  showStations,
  showReports,
  batteryRange,
  onMapClick,
  onStationClick,
  onSaveLocation,
  center,
  userLocation,
  isFollowingUser,
  onDragStart,
  selectedRoute,
  routeDestination,
  showElevators,
  visibleSeverities
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const stationMarkersMap = useRef<Map<string, any>>(new Map());
  const reportMarkersMap = useRef<Map<string, any>>(new Map());
  const roadBlockMarkersMap = useRef<Map<string, any>>(new Map());
  const elevatorMarkersMap = useRef<Map<string, any>>(new Map());
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentBoundsRef = useRef<any>(null);

  // 좌표 유효성 검사 헬퍼 (더 엄격하게)
  const isValidCoordinate = (lat: any, lng: any) => {
    const validLat = typeof lat === 'number' ? lat : parseFloat(lat);
    const validLng = typeof lng === 'number' ? lng : parseFloat(lng);

    return Number.isFinite(validLat) && Number.isFinite(validLng) &&
      !isNaN(validLat) && !isNaN(validLng) &&
      validLat !== 0 && validLng !== 0 &&
      Math.abs(validLat) <= 90 && Math.abs(validLng) <= 180; // 위경도 범위 체크
  };

  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // 이미 초기화됨

    const initMap = () => {
      // 카카오맵 API가 로드되었는지 확인 - window.kakao가 있고 maps도 있어야 함
      if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
        // 아직 로드되지 않았다면 조금 더 대기 (최대 10초)
        const retryCount = (window as any).kakaoMapRetryCount || 0;
        if (retryCount < 50) {
          (window as any).kakaoMapRetryCount = retryCount + 1;
          initTimeoutRef.current = setTimeout(initMap, 200);
        } else {
          console.error('❌ 카카오맵 API 로드 시간 초과');
        }
        return;
      }

      // v3 스크립트가 로드된 후 maps 라이브러리 초기화 대기
      window.kakao.maps.load(() => {
        console.log('🗺️ 카카오맵 초기화 시작');

        const container = mapContainerRef.current;
        if (!container) return;

        // 중심 좌표 유효성 검사
        if (!isValidCoordinate(center.lat, center.lng)) {
          console.error('❌ 잘못된 중심 좌표:', center);
          return;
        }

        const options = {
          center: new window.kakao.maps.LatLng(Number(center.lat), Number(center.lng)),
          level: 3
        };

        try {
          mapRef.current = new window.kakao.maps.Map(container, options);

          // 지도 클릭 이벤트
          window.kakao.maps.event.addListener(mapRef.current, 'click', (mouseEvent: any) => {
            const latlng = mouseEvent.latLng;
            onMapClick(latlng.getLat(), latlng.getLng());
          });

          // 드래그 시작 이벤트
          window.kakao.maps.event.addListener(mapRef.current, 'dragstart', () => {
            onDragStart();
          });

          // 확대/축소 및 이동 이벤트 디바운싱
          const handleBoundsChanged = () => {
            if (zoomTimeoutRef.current) {
              clearTimeout(zoomTimeoutRef.current);
            }
            zoomTimeoutRef.current = setTimeout(() => {
              if (mapRef.current) {
                currentBoundsRef.current = mapRef.current.getBounds();
              }
            }, 150);
          };

          window.kakao.maps.event.addListener(mapRef.current, 'zoom_changed', handleBoundsChanged);
          window.kakao.maps.event.addListener(mapRef.current, 'dragend', handleBoundsChanged);

          // 초기 바운드 설정
          currentBoundsRef.current = mapRef.current.getBounds();

          console.log('✅ 카카오맵 초기화 완료');
        } catch (error) {
          console.error('❌ 카카오맵 초기화 실패:', error);
        }
      });
    };

    initMap();

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [center]); // center가 변경되면 지도를 다시 그릴 수도 있으나, 여기서는 초기화에만 집중

  // 사용자 위치 마커
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // 기존 마커 제거
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    const validLat = Number(userLocation.lat);
    const validLng = Number(userLocation.lng);

    if (!isValidCoordinate(validLat, validLng)) return;

    const position = new window.kakao.maps.LatLng(validLat, validLng);

    // 커스텀 오버레이로 사용자 위치 표시
    const content = `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      "></div>
    `;

    userMarkerRef.current = new window.kakao.maps.CustomOverlay({
      position: position,
      content: content,
      zIndex: 3
    });

    userMarkerRef.current.setMap(mapRef.current);

    // 사용자 위치 추적
    if (isFollowingUser) {
      mapRef.current.setCenter(position);
    }
  }, [userLocation, isFollowingUser]);

  // 뷰포트 내 마커 필터링 헬퍼
  const isInViewport = useCallback((lat: number, lng: number): boolean => {
    if (!mapRef.current || !currentBoundsRef.current) return true;
    return currentBoundsRef.current.contain(new window.kakao.maps.LatLng(lat, lng));
  }, []);

  // 충전소 마커 (최적화된 버전)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!showStations) {
      // 모든 마커 제거
      stationMarkersMap.current.forEach(marker => marker.setMap(null));
      stationMarkersMap.current.clear();
      return;
    }

    // 현재 뷰포트 가져오기
    if (mapRef.current) {
      currentBoundsRef.current = mapRef.current.getBounds();
    }

    // 뷰포트 내의 충전소만 필터링
    const visibleStations = stations.filter(station =>
      !currentBoundsRef.current || isInViewport(station.lat, station.lng)
    );

    // 제거된 마커 삭제
    stationMarkersMap.current.forEach((marker, key) => {
      if (!stations.find(s => s.id === key)) {
        marker.setMap(null);
        stationMarkersMap.current.delete(key);
      }
    });

    visibleStations.forEach(station => {
      const key = station.id;

      // 이미 존재하는 마커는 건너뛰기
      if (stationMarkersMap.current.has(key)) return;

      const validLat = Number(station.lat);
      const validLng = Number(station.lng);

      if (!isValidCoordinate(validLat, validLng)) return;

      const position = new window.kakao.maps.LatLng(validLat, validLng);

      // 지하철 충전소와 일반 충전소 구분
      const isSubway = station.type === 'SUBWAY';
      const icon = isSubway ? '🚇' : '⚡';
      const bgColor = isSubway
        ? (station.isAvailable ? '#10b981' : '#6b7280') // 초록색 (지하철)
        : (station.isAvailable ? '#10b981' : '#6b7280'); // 초록색 (일반)

      // DOM 요소 생성
      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        cursor: pointer;
        white-space: nowrap;
        z-index: 1000;
        position: relative;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        ${isSubway ? 'border: 2px solid #059669;' : ''}
      `;
      markerDiv.innerHTML = `${icon} ${station.name}${isSubway && station.lineName ? ` (${station.lineName})` : ''}`;

      // 클릭 이벤트 추가 - 더 강력한 방식
      const handleMarkerClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        onStationClick(station);
      };

      markerDiv.addEventListener('click', handleMarkerClick);
      markerDiv.addEventListener('mousedown', handleMarkerClick);
      markerDiv.addEventListener('touchstart', handleMarkerClick);

      const marker = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerDiv,
        yAnchor: 1,
        zIndex: isSubway ? 10 : 5
      });

      marker.setMap(mapRef.current);
      stationMarkersMap.current.set(key, marker);
    });
  }, [stations, showStations, onStationClick, isInViewport]);

  // 도로 차단 마커 (최적화된 버전)
  useEffect(() => {
    if (!mapRef.current) return;

    // 현재 뷰포트 가져오기
    if (mapRef.current) {
      currentBoundsRef.current = mapRef.current.getBounds();
    }

    // 뷰포트 내의 도로 차단만 필터링
    const visibleBlocks = roadBlocks.filter(block =>
      !currentBoundsRef.current || isInViewport(block.lat, block.lng)
    );

    // 제거된 마커 삭제
    roadBlockMarkersMap.current.forEach((marker, key) => {
      if (!roadBlocks.find(b => `${b.lat}-${b.lng}` === key)) {
        marker.setMap(null);
        roadBlockMarkersMap.current.delete(key);
      }
    });

    visibleBlocks.forEach(block => {
      const key = `${block.lat}-${block.lng}`;

      // 이미 존재하는 마커는 건너뛰기
      if (roadBlockMarkersMap.current.has(key)) return;

      const validLat = Number(block.lat);
      const validLng = Number(block.lng);

      if (!isValidCoordinate(validLat, validLng)) return;

      const position = new window.kakao.maps.LatLng(validLat, validLng);

      const severityColors: any = {
        high: '#dc2626',
        medium: '#f97316',
        low: '#eab308'
      };

      const blockTypeIcons: any = {
        construction: '🚧',
        repair: '🔧',
        event: '🎪',
        accident: '⚠️'
      };

      // DOM 요소 생성
      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        width: 48px;
        height: 48px;
        background: ${severityColors[block.severity]};
        color: white;
        border: 4px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      markerDiv.innerHTML = blockTypeIcons[block.blockType];

      // 클릭 이벤트로 상세 정보 표시
      markerDiv.addEventListener('click', () => {
        const severityText: any = {
          high: '⛔ 전면 통제',
          medium: '⚠️ 부분 통제',
          low: '⚡ 일시 통제'
        };

        const blockTypeText: any = {
          construction: '공사',
          repair: '보수',
          event: '행사',
          accident: '사고'
        };

        const infoContent = `
          <div style="padding: 15px; min-width: 250px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 24px;">${blockTypeIcons[block.blockType]}</span>
              <div>
                <h3 style="font-weight: bold; font-size: 16px; margin: 0;">${block.title}</h3>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                  <span style="padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; background: ${severityColors[block.severity]}; color: white;">${severityText[block.severity]}</span>
                  <span style="padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; background: #e5e7eb; color: #374151;">${blockTypeText[block.blockType]}</span>
                </div>
              </div>
            </div>
            <p style="font-size: 12px; color: #4b5563; margin: 8px 0;">${block.description}</p>
            <p style="font-size: 11px; color: #6b7280; margin: 4px 0;">📍 ${block.location}</p>
            <p style="font-size: 11px; color: #6b7280; margin: 4px 0;">📅 ${new Date(block.startDate).toLocaleDateString()} ~ ${new Date(block.endDate).toLocaleDateString()}</p>
            ${block.detour ? `<div style="margin-top: 8px; padding: 8px; background: #dbeafe; border-radius: 8px;"><p style="font-size: 11px; color: #1e40af; margin: 0;"><strong>🔄 우회 정보:</strong> ${block.detour}</p></div>` : ''}
          </div>
        `;

        const infowindow = new window.kakao.maps.InfoWindow({
          content: infoContent,
          position: position
        });

        infowindow.open(mapRef.current);
      });

      const marker = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerDiv,
        yAnchor: 1
      });

      marker.setMap(mapRef.current);
      roadBlockMarkersMap.current.set(key, marker);
    });
  }, [roadBlocks, isInViewport]);

  // 제보 마커 (최적화된 버전)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!showReports) {
      // 모든 마커 제거
      reportMarkersMap.current.forEach(marker => marker.setMap(null));
      reportMarkersMap.current.clear();
      return;
    }

    // 현재 뷰포트 가져오기
    if (mapRef.current) {
      currentBoundsRef.current = mapRef.current.getBounds();
    }

    // 뷰포트 내의 제보만 필터링하고, 허용된 위험 단계만 표시
    const visibleReports = reports.filter(report =>
      (!currentBoundsRef.current || isInViewport(report.lat, report.lng)) &&
      visibleSeverities.has(report.severity)
    );

    // 제거된 마커 삭제
    reportMarkersMap.current.forEach((marker, key) => {
      if (!reports.find(r => r.id === key)) {
        marker.setMap(null);
        reportMarkersMap.current.delete(key);
      }
    });

    visibleReports.forEach(report => {
      const key = report.id;

      // 이미 존재하는 마커는 건너뛰기
      if (reportMarkersMap.current.has(key)) return;

      const validLat = Number(report.lat);
      const validLng = Number(report.lng);

      if (!isValidCoordinate(validLat, validLng)) return;

      const position = new window.kakao.maps.LatLng(validLat, validLng);

      const colors: any = {
        CAUTION: '#eab308',
        WARNING: '#f97316',
        DANGER: '#ef4444'
      };

      const icons: any = {
        OBSTACLE: '🚧',
        BROKEN_LIFT: '🛗',
        SLOPE: '⛰️',
        CONSTRUCTION: '🏗️'
      };

      const content = `
        <div style="
          background: ${colors[report.severity]};
          color: white;
          padding: 6px 10px;
          border-radius: 15px;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
        ">
          ${icons[report.type]} ${report.description.substring(0, 10)}...
        </div>
      `;

      const marker = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
      });

      marker.setMap(mapRef.current);
      reportMarkersMap.current.set(key, marker);
    });
  }, [reports, showReports, visibleSeverities, isInViewport]);

  // 승강기 마커 (sieun 브랜치 기능 추가)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!showElevators || !elevators || elevators.length === 0) {
      // 모든 마커 제거
      elevatorMarkersMap.current.forEach(marker => marker.setMap(null));
      elevatorMarkersMap.current.clear();
      return;
    }

    // 현재 뷰포트 가져오기
    if (mapRef.current) {
      currentBoundsRef.current = mapRef.current.getBounds();
    }

    // 뷰포트 내의 승강기만 필터링
    const visibleElevators = elevators.filter(elevator =>
      !currentBoundsRef.current || isInViewport(elevator.lat, elevator.lng)
    );

    // 제거된 마커 삭제
    elevatorMarkersMap.current.forEach((marker, key) => {
      if (!elevators.find(e => `${e.stationName}-${e.lat}-${e.lng}` === key)) {
        marker.setMap(null);
        elevatorMarkersMap.current.delete(key);
      }
    });

    visibleElevators.forEach(elevatorInfo => {
      const key = `${elevatorInfo.stationName}-${elevatorInfo.lat}-${elevatorInfo.lng}`;

      // 이미 존재하는 마커는 건너뛰기
      if (elevatorMarkersMap.current.has(key)) return;

      const validLat = Number(elevatorInfo.lat);
      const validLng = Number(elevatorInfo.lng);

      if (!isValidCoordinate(validLat, validLng)) return;

      const position = new window.kakao.maps.LatLng(validLat, validLng);

      // 엘리베이터 개수 및 상태 계산 (에스컬레이터 제외)
      const elevators = elevatorInfo.elevators.filter(e => e.type === 'ELEVATOR');

      const elevatorCount = elevators.length;

      // 고장난 엘리베이터 확인
      const brokenElevators = elevators.filter(e => e.status === 'BROKEN').length;

      // 전체 상태 판단 (운행 중 / 고장)
      let bgColor = '#22c55e'; // 기본: 초록색 (운행 중)
      let icon = '🛗';

      if (brokenElevators > 0) {
        bgColor = '#ef4444'; // 고장 있음: 빨간색
        icon = '❌';
      }

      // 간단한 정보 생성
      const elevatorList = elevators.map((elev) => {
        const typeText = '🛗 엘리베이터'; // 항상 엘리베이터
        const directionText = elev.direction ? ` (${elev.direction})` : '';
        const statusText = elev.status === 'BROKEN' ? '❌ 고장' : '✅ 운행 중';
        const statusColor = elev.status === 'BROKEN' ? '#dc2626' : '#16a34a';

        return `<div style="padding: 6px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="font-size: 13px;">${typeText}${directionText}</strong>
          <span style="margin-left: 8px; color: ${statusColor}; font-weight: bold; font-size: 12px;">${statusText}</span>
        </div>`;
      }).join('');

      const infoContent = `
        <div style="padding: 16px; min-width: 320px;">
          <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 12px;">🛗 ${elevatorInfo.stationName}역</h3>
          <div style="margin-bottom: 10px; font-size: 13px; color: #666;">
            엘리베이터 ${elevatorCount}개
          </div>
          <div style="margin-top: 10px;">
            ${elevatorList}
          </div>
        </div>
      `;

      // 마커 ID 생성
      const markerId = `elevator-${elevatorInfo.stationName.replace(/\s/g, '-')}-${Date.now()}`;

      const content = `
        <div id="${markerId}" style="position: relative; cursor: pointer; width: 32px; height: 32px;">
          <div style="width: 100%; height: 100%; background: ${bgColor}; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            <span style="font-size: 16px; pointer-events: none;">${icon}</span>
          </div>
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        zIndex: 3
      });

      overlay.setMap(mapRef.current);
      elevatorMarkersMap.current.set(key, overlay);

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
        removable: true,
        position: position
      });

      // DOM 요소에 클릭 이벤트 추가 (setTimeout으로 DOM 로드 대기)
      setTimeout(() => {
        const markerElement = document.getElementById(markerId);
        if (markerElement) {
          markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            infowindow.open(mapRef.current);
          });
        }
      }, 100);
    });
  }, [elevators, showElevators, isInViewport]);

  // 배터리 범위 원
  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 원 제거
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (!userLocation || !batteryRange) return;

    const validLat = Number(userLocation.lat);
    const validLng = Number(userLocation.lng);

    if (!isValidCoordinate(validLat, validLng)) return;

    const position = new window.kakao.maps.LatLng(validLat, validLng);

    circleRef.current = new window.kakao.maps.Circle({
      center: position,
      radius: batteryRange,
      strokeWeight: 2,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeStyle: 'dashed',
      fillColor: '#3b82f6',
      fillOpacity: 0.1
    });

    circleRef.current.setMap(mapRef.current);
  }, [userLocation, batteryRange]);

  // 경로 그리기
  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 경로 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }

    if (!selectedRoute || !selectedRoute.path || selectedRoute.path.length === 0) return;

    // 경로 라인 그리기
    const linePath = selectedRoute.path
      .filter((point: any) => isValidCoordinate(Number(point.lat), Number(point.lng)))
      .map((point: any) =>
        new window.kakao.maps.LatLng(Number(point.lat), Number(point.lng))
      );

    if (linePath.length === 0) return;

    const colors: any = {
      WALK: '#10b981',
      TAXI: '#eab308',
      BUS: '#3b82f6',
      SUBWAY: '#f97316'
    };

    polylineRef.current = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: colors[selectedRoute.mode] || '#3b82f6',
      strokeOpacity: 0.8,
      strokeStyle: 'solid'
    });

    polylineRef.current.setMap(mapRef.current);

    // 목적지 마커
    const destLat = Number(routeDestination.lat);
    const destLng = Number(routeDestination.lng);

    if (routeDestination && isValidCoordinate(destLat, destLng)) {
      const position = new window.kakao.maps.LatLng(destLat, destLng);

      const content = `
        <div style="
          background: #ef4444;
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          📍 목적지
        </div>
      `;

      destMarkerRef.current = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
      });

      destMarkerRef.current.setMap(mapRef.current);
    }
  }, [selectedRoute, routeDestination]);

  // 전역 함수 등록 (sieun 브랜치 기능)
  useEffect(() => {
    (window as any).handleRoute = (lat: number, lng: number) => {
      onMapClick(lat, lng);
    };

    (window as any).handleSave = (name: string, lat: number, lng: number) => {
      onSaveLocation(name, lat, lng);
    };

    return () => {
      delete (window as any).handleRoute;
      delete (window as any).handleSave;
    };
  }, [onMapClick, onSaveLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
