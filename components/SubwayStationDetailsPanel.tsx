/**
 * 지하철역 충전소 상세 정보 패널
 * 
 * 주의: 이 컴포넌트는 기존 StationModal과 완전히 독립적입니다.
 * 기존 UI 스타일을 그대로 사용하되, 지하철 충전소 전용 정보를 표시합니다.
 */

import React from 'react';
import { Station } from '../types';

interface SubwayStationDetailsPanelProps {
  station: Station | null;
  onClose: () => void;
  onNavigate: (lat: number, lng: number) => void;
}

export const SubwayStationDetailsPanel: React.FC<SubwayStationDetailsPanelProps> = ({
  station,
  onClose,
  onNavigate
}) => {
  console.log('🔍 SubwayStationDetailsPanel 렌더링:', station);
  
  if (!station || station.type !== 'SUBWAY') {
    console.log('❌ 지하철역 패널 조건 불만족:', { hasStation: !!station, type: station?.type });
    return null;
  }
  
  console.log('✅ 지하철역 패널 표시:', station.name);

  const getLineColor = (lineName?: string) => {
    if (!lineName) return '#6b7280';
    // 대구도시철도 노선별 색상
    const colors: { [key: string]: string } = {
      '1호선': '#e11d48', // 빨간색
      '2호선': '#16a34a', // 초록색
      '3호선': '#f97316', // 주황색
    };
    
    return colors[lineName] || '#6b7280';
  };

  const handleNavigateClick = () => {
    onNavigate(station.lat, station.lng);
    onClose();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚇</span>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{station.name}</h3>
              {station.lineName && (
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="px-2 py-1 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: getLineColor(station.lineName) }}
                  >
                    {station.lineName}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    station.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {station.isAvailable ? '✅ 이용가능' : '❌ 이용불가'}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>

        {/* Station Details */}
        <div className="space-y-3 mb-4">
          {/* 충전소 위치 */}
          {station.chargingLocation && (
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm mt-1">🔌</span>
              <div>
                <p className="text-sm font-medium text-gray-900">충전소 위치</p>
                <p className="text-sm text-gray-600">{station.chargingLocation}</p>
              </div>
            </div>
          )}

          {/* 역 주소 */}
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm mt-1">🏠</span>
            <div>
              <p className="text-sm font-medium text-gray-900">역 주소</p>
              <p className="text-sm text-gray-600">{station.address}</p>
            </div>
          </div>

          {/* 운영시간 */}
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm mt-1">🕐</span>
            <div>
              <p className="text-sm font-medium text-gray-900">운영시간</p>
              <p className="text-sm text-gray-600">05:30 - 24:00 (지하철 운영시간)</p>
            </div>
          </div>

          {/* 충전기 정보 */}
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm mt-1">⚡</span>
            <div>
              <p className="text-sm font-medium text-gray-900">충전기 현황</p>
              <div className="flex flex-col gap-1 mt-1">
                {station.hasCharger ? (
                  <>
                    {station.fastChargerCount && station.fastChargerCount > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        급속 충전기 {station.fastChargerCount}대
                      </span>
                    )}
                    {station.normalChargerCount && station.normalChargerCount > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        일반 충전기 {station.normalChargerCount}대
                      </span>
                    )}
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      220V 표준 • 무료 이용
                    </span>
                  </>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    충전기 정보 없음
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 접근성 정보 */}
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm mt-1">♿</span>
            <div>
              <p className="text-sm font-medium text-gray-900">접근성</p>
              <p className="text-sm text-gray-600">휠체어 접근 가능 • 엘리베이터 이용</p>
            </div>
          </div>

          {/* 좌표 정보 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">🌐</span>
            <p className="text-xs text-gray-500 font-mono">
              {station.lat.toFixed(6)}, {station.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleNavigateClick}
          disabled={!station.isAvailable}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            station.isAvailable
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>🧭</span>
          {station.isAvailable ? '충전소로 길찾기' : '현재 이용불가'}
        </button>

        {/* Additional Info */}
        {!station.isAvailable && (
          <p className="text-xs text-gray-500 text-center mt-2">
            충전소 점검 중이거나 일시적으로 이용할 수 없습니다
          </p>
        )}
      </div>
    </div>
  );
};