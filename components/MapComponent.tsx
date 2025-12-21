import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Station, Report, RoadBlock } from '../types';
import { REPORT_TYPES, SEVERITY_LEVELS } from '../constants';

// Fix Leaflet's default icon path issues by pointing to CDN resources
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  stations: Station[];
  reports: Report[];
  roadBlocks: RoadBlock[];
  showStations: boolean;
  showReports: boolean;
  batteryRange: number | null; // meters
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

export const MapComponent: React.FC<MapProps> = ({ 
  stations, 
  reports,
  roadBlocks,
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
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const rangeCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const stationMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const reportMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const roadBlockMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentBoundsRef = useRef<L.LatLngBounds | null>(null);

  // Global Event Listener for Popup Buttons
  useEffect(() => {
    const handlePopupClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Handle "Route" Button
        if (target.closest('.btn-route')) {
            const btn = target.closest('.btn-route') as HTMLElement;
            const lat = parseFloat(btn.dataset.lat || "0");
            const lng = parseFloat(btn.dataset.lng || "0");
            const name = btn.dataset.name || "목적지";
            
            // 길찾기 실행
            onMapClick(lat, lng);
        }

        // Handle "Save" Button
        if (target.closest('.btn-save')) {
            const btn = target.closest('.btn-save') as HTMLElement;
            const name = btn.dataset.name || "Unknown";
            const lat = parseFloat(btn.dataset.lat || "0");
            const lng = parseFloat(btn.dataset.lng || "0");
            onSaveLocation(name, lat, lng);
        }
    };

    document.addEventListener('click', handlePopupClick);
    return () => {
        document.removeEventListener('click', handlePopupClick);
    };
  }, [onSaveLocation, onMapClick]);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          preferCanvas: true, // 성능 향상: Canvas 렌더링 사용
          zoomAnimation: true,
          zoomAnimationThreshold: 4
      }).setView([center.lat, center.lng], 15);

      // OpenStreetMap 타일 (안정적)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        updateWhenZooming: false, // 확대/축소 중 타일 업데이트 비활성화로 성능 향상
        updateWhenIdle: true // 유휴 상태에서만 업데이트
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);

      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current.on('dragstart', () => {
        onDragStart();
      });

      // 확대/축소 이벤트 디바운싱
      const handleZoomEnd = () => {
        if (zoomTimeoutRef.current) {
          clearTimeout(zoomTimeoutRef.current);
        }
        zoomTimeoutRef.current = setTimeout(() => {
          if (mapRef.current) {
            currentBoundsRef.current = mapRef.current.getBounds();
            // 마커 업데이트는 별도 useEffect에서 처리
          }
        }, 150);
      };

      mapRef.current.on('zoomend', handleZoomEnd);
      mapRef.current.on('moveend', handleZoomEnd);
    }

    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []); 

  // Handle User Location Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (userLocation) {
        if (!userMarkerRef.current) {
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="user-location-pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current);
        } else {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        }
    }
  }, [userLocation]);

  // Handle "Follow User" Logic
  useEffect(() => {
      if (!mapRef.current || !userLocation) return;
      
      if (isFollowingUser) {
          mapRef.current.flyTo([userLocation.lat, userLocation.lng], mapRef.current.getZoom(), {
              animate: true,
              duration: 1.0
          });
      }
  }, [userLocation, isFollowingUser]);

  // 뷰포트 내 마커만 필터링하는 헬퍼 함수
  const isMarkerInViewport = useCallback((lat: number, lng: number): boolean => {
    if (!mapRef.current || !currentBoundsRef.current) return true;
    return currentBoundsRef.current.contains([lat, lng]);
  }, []);

  // 뷰포트 업데이트
  useEffect(() => {
    if (mapRef.current) {
      currentBoundsRef.current = mapRef.current.getBounds();
    }
  }, [center]);

  // 마커 업데이트 (최적화된 버전)
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    const bounds = mapRef.current.getBounds();
    currentBoundsRef.current = bounds;

    // Road Blocks 마커 업데이트
    if (roadBlocks && roadBlocks.length > 0) {
      const visibleBlocks = roadBlocks.filter(block => 
        !currentBoundsRef.current || currentBoundsRef.current.contains([block.lat, block.lng])
      );

      // 기존 마커 중 제거된 것들 삭제
      roadBlockMarkersRef.current.forEach((marker, key) => {
        if (!roadBlocks.find(b => `${b.lat}-${b.lng}` === key)) {
          markersRef.current?.removeLayer(marker);
          roadBlockMarkersRef.current.delete(key);
        }
      });

      visibleBlocks.forEach(block => {
        const key = `${block.lat}-${block.lng}`;
        let marker = roadBlockMarkersRef.current.get(key);

        if (!marker) {
          const severityColor = {
            high: 'bg-red-600',
            medium: 'bg-orange-500',
            low: 'bg-yellow-400'
          }[block.severity];

          const blockTypeIcon = {
            construction: '🚧',
            repair: '🔧',
            event: '🎪',
            accident: '⚠️'
          }[block.blockType];

          const iconHtml = `
            <div class="relative group cursor-pointer">
              <div class="w-12 h-12 rounded-full ${severityColor} border-4 border-white flex items-center justify-center shadow-xl" style="will-change: transform;">
                <span class="text-2xl">${blockTypeIcon}</span>
              </div>
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-div-icon',
            iconSize: [48, 48],
            iconAnchor: [24, 48]
          });

          marker = L.marker([block.lat, block.lng], { icon });

          const severityText = {
            high: '⛔ 전면 통제',
            medium: '⚠️ 부분 통제',
            low: '⚡ 일시 통제'
          }[block.severity];

          const blockTypeText = {
            construction: '공사',
            repair: '보수',
            event: '행사',
            accident: '사고'
          }[block.blockType];

          const popupContent = `
            <div class="p-3 min-w-[250px]">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-3xl">${blockTypeIcon}</span>
                <div>
                  <h3 class="font-bold text-lg text-gray-800">${block.title}</h3>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${severityColor} text-white">${severityText}</span>
                    <span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">${blockTypeText}</span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600 mb-2">${block.description}</p>
              <p class="text-xs text-gray-500 mb-2">📍 ${block.location}</p>
              <p class="text-xs text-gray-500 mb-2">📅 ${new Date(block.startDate).toLocaleDateString()} ~ ${new Date(block.endDate).toLocaleDateString()}</p>
              ${block.detour ? `<div class="mt-2 p-2 bg-blue-50 rounded"><p class="text-xs text-blue-800"><strong>🔄 우회 정보:</strong> ${block.detour}</p></div>` : ''}
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(markersRef.current!);
          roadBlockMarkersRef.current.set(key, marker);
        }
      });
    }

    // Stations 마커 업데이트
    if (showStations) {
      const visibleStations = stations.filter(station => 
        !currentBoundsRef.current || currentBoundsRef.current.contains([station.lat, station.lng])
      );

      // 기존 마커 중 제거된 것들 삭제
      stationMarkersRef.current.forEach((marker, key) => {
        if (!stations.find(s => s.id === key)) {
          markersRef.current?.removeLayer(marker);
          stationMarkersRef.current.delete(key);
        }
      });

      visibleStations.forEach(station => {
        const key = station.id;
        let marker = stationMarkersRef.current.get(key);

        if (!marker) {
          const isAvailable = station.isAvailable;
          const isFast = station.type === 'FAST';
          
          const iconHtml = `
            <div class="relative group cursor-pointer">
              <div class="w-10 h-10 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'} border-3 border-white flex items-center justify-center shadow-xl" style="will-change: transform;">
                <div class="text-white text-lg font-bold">
                  ${isFast ? '⚡' : '🔌'}
                </div>
              </div>
              ${isFast ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center"><span class="text-xs font-bold text-white">F</span></div>' : ''}
            </div>
          `;
          
          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-div-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          });

          marker = L.marker([station.lat, station.lng], { icon });
          
          const statusText = isAvailable ? '이용 가능' : '이용 불가';
          const statusColor = isAvailable ? 'text-green-600' : 'text-red-600';
          const typeText = isFast ? '급속 충전' : '일반 충전';
          
          const popupContent = `
            <div class="p-3 text-center min-w-[200px]">
              <div class="flex items-center justify-center gap-2 mb-2">
                <span class="text-2xl">${isFast ? '⚡' : '🔌'}</span>
                <div>
                  <h3 class="font-bold text-lg text-gray-800">${station.name}</h3>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${statusText}</span>
                    <span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">${typeText}</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-500 mb-3">${station.address}</p>
              <div class="flex gap-2 justify-center">
                <button class="btn-route px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow hover:bg-blue-700 transition-colors" 
                  data-lat="${station.lat}" data-lng="${station.lng}" data-name="${station.name}">
                  🧭 길 안내
                </button>
                <button class="btn-save px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg shadow hover:bg-gray-200 transition-colors" 
                  data-name="${station.name}" data-lat="${station.lat}" data-lng="${station.lng}">
                  ⭐ 저장
                </button>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on('click', () => onStationClick(station));
          marker.addTo(markersRef.current!);
          stationMarkersRef.current.set(key, marker);
        }
      });
    } else {
      // showStations가 false면 모든 마커 제거
      stationMarkersRef.current.forEach(marker => {
        markersRef.current?.removeLayer(marker);
      });
      stationMarkersRef.current.clear();
    }

    // Reports 마커 업데이트
    if (showReports) {
      const visibleReports = reports.filter(report => 
        !currentBoundsRef.current || currentBoundsRef.current.contains([report.lat, report.lng])
      );

      // 기존 마커 중 제거된 것들 삭제
      reportMarkersRef.current.forEach((marker, key) => {
        if (!reports.find(r => r.id === key)) {
          markersRef.current?.removeLayer(marker);
          reportMarkersRef.current.delete(key);
        }
      });

      visibleReports.forEach(report => {
        const key = report.id;
        let marker = reportMarkersRef.current.get(key);

        if (!marker) {
          const reportType = REPORT_TYPES.find(t => t.value === report.type);
          const severityLevel = SEVERITY_LEVELS.find(s => s.value === report.severity) || SEVERITY_LEVELS[0];
          
          const borderColorClass = 
            report.severity === 'DANGER' ? 'border-red-600' : 
            report.severity === 'WARNING' ? 'border-orange-500' : 'border-yellow-400';
          
          const bgColorClass = 
            report.severity === 'DANGER' ? 'bg-red-500' : 
            report.severity === 'WARNING' ? 'bg-orange-400' : 'bg-yellow-400';

          let innerContent = `<span class="text-white text-xs font-bold">!</span>`;
          if (report.imageUrl) {
            innerContent = `<img src="${report.imageUrl}" class="w-full h-full object-cover rounded-full" />`;
          }

          const iconHtml = `
            <div class="relative group cursor-pointer">
              <div class="w-10 h-10 rounded-full bg-white border-4 ${borderColorClass} flex items-center justify-center shadow-md overflow-hidden" style="will-change: transform;">
                ${report.imageUrl ? innerContent : `<div class="w-full h-full ${bgColorClass} flex items-center justify-center text-white font-bold">!</div>`}
              </div>
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-div-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          });

          marker = L.marker([report.lat, report.lng], { icon });
          
          const popupContent = `
            <div class="p-1 min-w-[200px]">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-bold px-2 py-1 rounded text-white ${report.severity === 'DANGER' ? 'bg-red-500' : report.severity === 'WARNING' ? 'bg-orange-500' : 'bg-yellow-500'}">
                  ${severityLevel.label}
                </span>
                <span class="font-bold text-gray-800">${reportType?.label}</span>
              </div>
              ${report.imageUrl ? `<img src="${report.imageUrl}" class="w-full h-24 object-cover rounded-lg mb-2 border border-gray-100" />` : ''}
              <p class="text-sm text-gray-600">${report.description}</p>
              <div class="flex gap-2 mt-3 justify-center">
                <button class="btn-route px-3 py-1 bg-blue-600 text-white text-xs rounded shadow hover:bg-blue-700">길 안내</button>
                <button class="btn-save px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded shadow hover:bg-gray-200"
                  data-name="${reportType?.label}" data-lat="${report.lat}" data-lng="${report.lng}">
                  저장
                </button>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          marker.addTo(markersRef.current!);
          reportMarkersRef.current.set(key, marker);
        }
      });
    } else {
      // showReports가 false면 모든 마커 제거
      reportMarkersRef.current.forEach(marker => {
        markersRef.current?.removeLayer(marker);
      });
      reportMarkersRef.current.clear();
    }
  }, [stations, reports, roadBlocks, showStations, showReports, onStationClick, onSaveLocation]);

  // Update Battery Range Circle
  useEffect(() => {
    if (!mapRef.current) return;

    if (rangeCircleRef.current) {
      mapRef.current.removeLayer(rangeCircleRef.current);
      rangeCircleRef.current = null;
    }

    const origin = userLocation || center;

    if (batteryRange !== null && batteryRange > 0) {
      rangeCircleRef.current = L.circle([origin.lat, origin.lng], {
        color: '#2563eb', // blue-600
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        radius: batteryRange,
        weight: 3,
        dashArray: '10, 10'
      }).addTo(mapRef.current);
    }
  }, [batteryRange, center, userLocation]);

  // Draw Route on Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous route
    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      mapRef.current.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }

    if (selectedRoute && userLocation && routeDestination) {
      // Generate path if not provided
      let path = selectedRoute.path;
      if (!path) {
        // Simple straight line for MVP
        path = [
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: routeDestination.lat, lng: routeDestination.lng }
        ];
      }

      // Draw route line
      const latLngs: [number, number][] = path.map(p => [p.lat, p.lng]);
      
      // Color based on mode
      let color = '#3b82f6'; // blue
      if (selectedRoute.mode === 'SUBWAY') color = '#f97316'; // orange
      if (selectedRoute.mode === 'BUS') color = '#3b82f6'; // blue
      if (selectedRoute.mode === 'WALK') color = '#22c55e'; // green
      if (selectedRoute.mode === 'TAXI') color = '#eab308'; // yellow

      routeLayerRef.current = L.polyline(latLngs, {
        color: color,
        weight: 6,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(mapRef.current);

      // Add destination marker
      const destIcon = L.divIcon({
        html: `
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-red-500 border-4 border-white flex items-center justify-center shadow-lg animate-bounce">
              <span class="text-white text-xl font-bold">📍</span>
            </div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      destinationMarkerRef.current = L.marker([routeDestination.lat, routeDestination.lng], { 
        icon: destIcon,
        zIndexOffset: 500
      }).addTo(mapRef.current);

      // Fit bounds to show entire route
      const bounds = L.latLngBounds(latLngs);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedRoute, userLocation, routeDestination]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};