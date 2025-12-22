import React, { useEffect, useRef } from 'react';
import { Station, Report, RoadBlock } from '../types';
import { REPORT_TYPES, SEVERITY_LEVELS } from '../constants';
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
  routeDestination
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const rangeCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);

  // 카카오맵 초기화
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = () => {
      console.log('🔍 카카오맵 초기화 시도...');
      
      if (!window.kakao || !window.kakao.maps) {
        console.error('❌ window.kakao.maps가 없습니다.');
        return false;
      }

      try {
        const container = mapContainerRef.current;
        if (!container) {
          console.error('❌ 지도 컨테이너가 없습니다.');
          return false;
        }

        const options = {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: 5
        };

        console.log('🗺️ 지도 생성 중...', options);
        mapRef.current = new window.kakao.maps.Map(container, options);

        // 지도 클릭 이벤트
        window.kakao.maps.event.addListener(mapRef.current, 'click', (mouseEvent: any) => {
          const latlng = mouseEvent.latLng;
          onMapClick(latlng.getLat(), latlng.getLng());
        });

        // 지도 드래그 시작 이벤트
        window.kakao.maps.event.addListener(mapRef.current, 'dragstart', () => {
          onDragStart();
        });

        console.log('✅ 카카오맵 초기화 완료');
        return true;
      } catch (error) {
        console.error('❌ 카카오맵 초기화 실패:', error);
        return false;
      }
    };

    // SDK 로드 대기
    if (window.kakao && window.kakao.maps) {
      console.log('✅ 카카오 SDK 이미 로드됨');
      initMap();
    } else {
      // SDK 스크립트가 아직 로드 중인 경우 대기
      let attempts = 0;
      const maxAttempts = 50; // 5초
      
      const checkKakao = setInterval(() => {
        attempts++;
        
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakao);
          console.log(`✅ 카카오 SDK 로드됨 (${attempts * 100}ms 소요)`);
          initMap();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkKakao);
          console.error('❌ 카카오맵 SDK 로드 타임아웃 (5초 초과)');
          console.log('💡 해결 방법:');
          console.log('1. 네트워크 탭에서 SDK 스크립트 로드 확인');
          console.log('2. index.html의 카카오 JavaScript 키 확인');
          console.log('3. 페이지 새로고침 (Ctrl+Shift+R)');
        }
      }, 100);

      return () => clearInterval(checkKakao);
    }
  }, []);

  // 사용자 위치 마커
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    if (userLocation) {
      const position = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      
      const content = `
        <div style="width: 24px; height: 24px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
      `;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        zIndex: 1000
      });

      customOverlay.setMap(mapRef.current);
      userMarkerRef.current = customOverlay;
    }
  }, [userLocation]);

  // 사용자 위치 추적
  useEffect(() => {
    if (!mapRef.current || !userLocation || !isFollowingUser) return;

    const position = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
    mapRef.current.panTo(position);
  }, [userLocation, isFollowingUser]);

  // 마커 업데이트
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;

    // 기존 마커 제거
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];

    // 도로 차단 정보
    if (roadBlocks && roadBlocks.length > 0) {
      roadBlocks.forEach((block: RoadBlock) => {
        const position = new window.kakao.maps.LatLng(block.lat, block.lng);
        
        const severityColor = {
          high: '#dc2626',
          medium: '#f97316',
          low: '#facc15'
        }[block.severity];

        const blockTypeIcon = {
          construction: '🚧',
          repair: '🔧',
          event: '🎪',
          accident: '⚠️'
        }[block.blockType];

        const content = `
          <div style="position: relative; cursor: pointer;">
            <div style="width: 36px; height: 36px; background: ${severityColor}; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
              <span style="font-size: 18px;">${blockTypeIcon}</span>
            </div>
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: content
        });

        overlay.setMap(mapRef.current);
        markersRef.current.push(overlay);

        // 인포윈도우
        const severityText = {
          high: '⛔ 전면 통제',
          medium: '⚠️ 부분 통제',
          low: '⚡ 일시 통제'
        }[block.severity];

        const infoContent = `
          <div style="padding: 15px; min-width: 250px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${blockTypeIcon} ${block.title}</h3>
            <div style="margin-bottom: 8px;">
              <span style="background: ${severityColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${severityText}</span>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 8px;">${block.description}</p>
            <p style="font-size: 12px; color: #999;">📍 ${block.location}</p>
            ${block.detour ? `<div style="margin-top: 8px; padding: 8px; background: #eff6ff; border-radius: 8px;"><p style="font-size: 12px; color: #1e40af;"><strong>🔄 우회:</strong> ${block.detour}</p></div>` : ''}
          </div>
        `;

        const infowindow = new window.kakao.maps.InfoWindow({
          content: infoContent
        });

        window.kakao.maps.event.addListener(overlay, 'click', () => {
          infowindow.open(mapRef.current, overlay);
        });
      });
    }

    // 충전소 마커
    if (showStations) {
      stations.forEach((station: Station) => {
        const position = new window.kakao.maps.LatLng(station.lat, station.lng);
        
        const isAvailable = station.isAvailable;
        const isFast = station.type === 'FAST';
        const bgColor = isAvailable ? '#22c55e' : '#9ca3af';
        const icon = isFast ? '⚡' : '🔌';

        const content = `
          <div style="position: relative; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: ${bgColor}; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              <span style="font-size: 16px;">${icon}</span>
            </div>
            ${isFast ? '<div style="position: absolute; top: -3px; right: -3px; width: 14px; height: 14px; background: #facc15; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><span style="font-size: 8px; font-weight: bold; color: white;">F</span></div>' : ''}
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: content
        });

        overlay.setMap(mapRef.current);
        markersRef.current.push(overlay);

        // 클릭 이벤트 - CustomOverlay에 직접 클릭 이벤트 추가
        window.kakao.maps.event.addListener(overlay, 'click', () => {
          onStationClick(station);
          
          const statusText = isAvailable ? '이용 가능' : '이용 불가';
          const typeText = isFast ? '급속 충전' : '일반 충전';
          
          const infoContent = `
            <div style="padding: 15px; min-width: 200px; text-align: center;">
              <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${icon} ${station.name}</h3>
              <div style="margin-bottom: 8px;">
                <span style="background: ${isAvailable ? '#dcfce7' : '#fee2e2'}; color: ${isAvailable ? '#166534' : '#991b1b'}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 4px;">${statusText}</span>
                <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${typeText}</span>
              </div>
              <p style="font-size: 12px; color: #999; margin-bottom: 12px;">${station.address}</p>
              <div style="display: flex; gap: 8px; justify-content: center;">
                <button onclick="window.handleRoute(${station.lat}, ${station.lng})" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer;">🧭 길 안내</button>
                <button onclick="window.handleSave('${station.name.replace(/'/g, "\\'")}', ${station.lat}, ${station.lng})" style="padding: 8px 16px; background: #f3f4f6; color: #374151; border: none; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer;">⭐ 저장</button>
              </div>
            </div>
          `;

          const infowindow = new window.kakao.maps.InfoWindow({
            content: infoContent
          });

          infowindow.open(mapRef.current, overlay);
        });
      });
    }

    // 제보 마커
    if (showReports) {
      reports.forEach((report: Report) => {
        const position = new window.kakao.maps.LatLng(report.lat, report.lng);
        
        const borderColor = 
          report.severity === 'DANGER' ? '#dc2626' : 
          report.severity === 'WARNING' ? '#f97316' : '#facc15';
        
        const bgColor = 
          report.severity === 'DANGER' ? '#ef4444' : 
          report.severity === 'WARNING' ? '#fb923c' : '#fbbf24';

        const content = `
          <div style="position: relative; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: white; border: 3px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); overflow: hidden;">
              ${report.imageUrl ? `<img src="${report.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="width: 100%; height: 100%; background: ${bgColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">!</div>`}
            </div>
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          position: position,
          content: content
        });

        overlay.setMap(mapRef.current);
        markersRef.current.push(overlay);
      });
    }

    // 승강기 마커 (엘리베이터/에스컬레이터)
    if (elevators && elevators.length > 0) {
      elevators.forEach((elevatorInfo: ElevatorInfo) => {
        const position = new window.kakao.maps.LatLng(elevatorInfo.lat, elevatorInfo.lng);
        
        // 엘리베이터와 에스컬레이터 개수 및 상태 계산
        const elevators = elevatorInfo.elevators.filter(e => e.type === 'ELEVATOR');
        const escalators = elevatorInfo.elevators.filter(e => e.type === 'ESCALATOR');
        
        const elevatorCount = elevators.length;
        const escalatorCount = escalators.length;
        
        // 각 타입별 상태 확인
        const brokenElevators = elevators.filter(e => e.status === 'BROKEN').length;
        const brokenEscalators = escalators.filter(e => e.status === 'BROKEN').length;
        const operatingElevators = elevators.filter(e => e.status === 'OPERATING').length;
        const operatingEscalators = escalators.filter(e => e.status === 'OPERATING').length;
        
        // 전체 상태 판단 (운행 중 / 고장)
        let bgColor = '#22c55e'; // 기본: 초록색 (운행 중)
        let icon = '🛗';
        
        const totalBroken = brokenElevators + brokenEscalators;
        
        if (totalBroken > 0) {
          bgColor = '#ef4444'; // 고장 있음: 빨간색
          icon = '❌';
        }
        
        // 간단한 정보 생성
        const elevatorList = elevatorInfo.elevators.map((elev, idx) => {
          const typeText = elev.type === 'ELEVATOR' ? '🛗 엘리베이터' : '🔼 에스컬레이터';
          const directionText = elev.direction ? ` (${elev.direction})` : '';
          const statusText = elev.status === 'BROKEN' ? '❌ 고장' : '✅ 운행 중';
          const statusColor = elev.status === 'BROKEN' ? '#dc2626' : '#16a34a';
          
          return `<div style="padding: 6px 0; border-bottom: 1px solid #e5e7eb;">
            <strong style="font-size: 13px;">${typeText}${directionText}</strong>
            <span style="margin-left: 8px; color: ${statusColor}; font-weight: bold; font-size: 12px;">${statusText}</span>
          </div>`;
        }).join('');
        
        const infoContent = `
          <div style="padding: 12px; min-width: 220px;">
            <h3 style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">🛗 ${elevatorInfo.stationName}역</h3>
            <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
              엘리베이터 ${elevatorCount}개 · 에스컬레이터 ${escalatorCount}개
            </div>
            <div style="margin-top: 8px;">
              ${elevatorList}
            </div>
          </div>
        `;

        // 마커 ID 생성
        const markerId = `elevator-${elevatorInfo.stationName.replace(/\s/g, '-')}`;
        
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
        markersRef.current.push(overlay);

        // 인포윈도우 생성
        const infowindow = new window.kakao.maps.InfoWindow({
          content: infoContent,
          removable: false
        });

        // DOM 요소에 클릭 이벤트 추가 (setTimeout으로 DOM 로드 대기)
        setTimeout(() => {
          const markerElement = document.getElementById(markerId);
          if (markerElement) {
            markerElement.addEventListener('click', (e) => {
              e.stopPropagation();
              infowindow.open(mapRef.current, overlay);
            });
          }
        }, 100);
      });
    }

    // 전역 함수 등록
    (window as any).handleRoute = (lat: number, lng: number) => {
      onMapClick(lat, lng);
    };

    (window as any).handleSave = (name: string, lat: number, lng: number) => {
      onSaveLocation(name, lat, lng);
    };

  }, [stations, reports, roadBlocks, elevators, showStations, showReports, onStationClick, onSaveLocation, onMapClick]);

  // 배터리 범위 원
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;

    if (rangeCircleRef.current) {
      rangeCircleRef.current.setMap(null);
    }

    const origin = userLocation || center;

    if (batteryRange !== null && batteryRange > 0) {
      const circlePosition = new window.kakao.maps.LatLng(origin.lat, origin.lng);
      
      const circle = new window.kakao.maps.Circle({
        center: circlePosition,
        radius: batteryRange,
        strokeWeight: 3,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeStyle: 'dashed',
        fillColor: '#3b82f6',
        fillOpacity: 0.1
      });

      circle.setMap(mapRef.current);
      rangeCircleRef.current = circle;
    }
  }, [batteryRange, center, userLocation]);

  // 경로 그리기
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    if (selectedRoute && userLocation && routeDestination) {
      let path = selectedRoute.path;
      if (!path) {
        path = [
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: routeDestination.lat, lng: routeDestination.lng }
        ];
      }

      const linePath = path.map((p: any) => new window.kakao.maps.LatLng(p.lat, p.lng));

      let color = '#3b82f6';
      if (selectedRoute.mode === 'SUBWAY') color = '#f97316';
      if (selectedRoute.mode === 'BUS') color = '#3b82f6';
      if (selectedRoute.mode === 'WALK') color = '#22c55e';
      if (selectedRoute.mode === 'TAXI') color = '#eab308';

      const polyline = new window.kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 6,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      });

      polyline.setMap(mapRef.current);
      routePolylineRef.current = polyline;

      // 목적지 마커
      const destPosition = new window.kakao.maps.LatLng(routeDestination.lat, routeDestination.lng);
      const destContent = `
        <div style="width: 32px; height: 32px; background: #ef4444; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
          <span style="font-size: 18px;">📍</span>
        </div>
      `;

      const destOverlay = new window.kakao.maps.CustomOverlay({
        position: destPosition,
        content: destContent,
        zIndex: 500
      });

      destOverlay.setMap(mapRef.current);
      destinationMarkerRef.current = destOverlay;

      // 경로 전체가 보이도록 지도 범위 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      linePath.forEach((latlng: any) => bounds.extend(latlng));
      mapRef.current.setBounds(bounds);
    }
  }, [selectedRoute, userLocation, routeDestination]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </>
  );
};
