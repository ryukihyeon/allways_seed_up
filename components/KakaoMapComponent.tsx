import React, { useEffect, useRef } from 'react';
import { Station, Report, RoadBlock } from '../types';

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapProps {
  stations: Station[];
  reports: Report[];
  roadBlocks: RoadBlock[];
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
}

export const KakaoMapComponent: React.FC<MapProps> = ({ 
  stations, 
  reports,
  roadBlocks,
  showStations, 
  showReports, 
  batteryRange,
  onMapClick,
  onStationClick,
  center,
  userLocation,
  isFollowingUser,
  onDragStart,
  selectedRoute,
  routeDestination
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // 이미 초기화됨

    // 카카오맵 API 로드 대기
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        console.log('⏳ 카카오맵 API 로딩 중...');
        setTimeout(initMap, 200);
        return;
      }

      console.log('🗺️ 카카오맵 초기화 시작');

      const container = mapContainerRef.current;
      if (!container) return;

      const options = {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
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

        console.log('✅ 카카오맵 초기화 완료');
      } catch (error) {
        console.error('❌ 카카오맵 초기화 실패:', error);
      }
    };

    // 약간의 지연 후 초기화 시도
    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, []);

  // 사용자 위치 마커
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // 기존 마커 제거
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    const position = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
    
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

  // 충전소 마커
  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (!showStations) return;

    stations.forEach(station => {
      const position = new window.kakao.maps.LatLng(station.lat, station.lng);
      
      // DOM 요소 생성
      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        background: ${station.isAvailable ? '#10b981' : '#6b7280'};
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        cursor: pointer;
        white-space: nowrap;
      `;
      markerDiv.innerHTML = `⚡ ${station.name}`;
      
      // 클릭 이벤트 추가
      markerDiv.addEventListener('click', () => {
        onStationClick(station);
      });

      const marker = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerDiv,
        yAnchor: 1
      });

      marker.setMap(mapRef.current);
      markersRef.current.push(marker);
    });
  }, [stations, showStations, onStationClick]);

  // 도로 차단 마커
  useEffect(() => {
    if (!mapRef.current) return;

    roadBlocks.forEach(block => {
      const position = new window.kakao.maps.LatLng(block.lat, block.lng);
      
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
          content: infoContent
        });

        infowindow.open(mapRef.current, marker);
      });

      const marker = new window.kakao.maps.CustomOverlay({
        position: position,
        content: markerDiv,
        yAnchor: 1
      });

      marker.setMap(mapRef.current);
      markersRef.current.push(marker);
    });
  }, [roadBlocks]);

  // 제보 마커
  useEffect(() => {
    if (!mapRef.current || !showReports) return;

    reports.forEach(report => {
      const position = new window.kakao.maps.LatLng(report.lat, report.lng);
      
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
      markersRef.current.push(marker);
    });
  }, [reports, showReports]);

  // 배터리 범위 원
  useEffect(() => {
    if (!mapRef.current || !userLocation || !batteryRange) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    const position = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);

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
    const linePath = selectedRoute.path.map((point: any) => 
      new window.kakao.maps.LatLng(point.lat, point.lng)
    );

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
    if (routeDestination) {
      const position = new window.kakao.maps.LatLng(routeDestination.lat, routeDestination.lng);
      
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

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
};
