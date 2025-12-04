import React from 'react';
import { Battery, Layers, AlertTriangle, Crosshair, Camera } from 'lucide-react';

interface ControlPanelProps {
  showStations: boolean;
  setShowStations: (v: boolean) => void;
  showReports: boolean;
  setShowReports: (v: boolean) => void;
  onOpenBattery: () => void;
  currentRange: number | null;
  weatherTemp: number;
  onCenterLocation: () => void;
  isFollowingUser: boolean;
  onReportCurrentLocation: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  showStations,
  setShowStations,
  showReports,
  setShowReports,
  onOpenBattery,
  currentRange,
  weatherTemp,
  onCenterLocation,
  isFollowingUser,
  onReportCurrentLocation
}) => {
  // Toggle for showing/hiding all layers (Stations + Reports)
  const toggleLayers = () => {
    const newState = !showStations;
    setShowStations(newState);
    setShowReports(newState);
  };

  return (
    <>
      {/* Top Info Bar is REMOVED to make room for SearchPanel */}
      {/* Battery Range Pill - Positioned below SearchPanel approximately */}
      {currentRange && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-blue-600/90 backdrop-blur text-white px-4 py-1.5 rounded-full shadow-lg text-sm font-semibold pointer-events-auto flex items-center gap-2 animate-fade-in">
               <span>주행 가능:</span>
               <span className="text-lg font-bold">{(currentRange / 1000).toFixed(1)}</span>
               <span>km</span>
            </div>
          </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-4 right-4 z-[1000] flex flex-col gap-4 pointer-events-none">
        
        <div className="flex justify-between items-end">
           {/* Left Side: Map Controls */}
          <div className="flex flex-col gap-3 pointer-events-auto">
             <button
                onClick={toggleLayers}
                className={`p-3.5 rounded-full shadow-lg transition-all ${
                  showStations ? 'bg-white text-gray-700' : 'bg-gray-100 text-gray-400'
                }`}
                aria-label="지도 레이어"
             >
               <Layers size={22} />
             </button>

             <button
                onClick={onCenterLocation}
                className={`p-3.5 rounded-full shadow-lg transition-all ${
                  isFollowingUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
                aria-label="내 위치 보기"
             >
               <Crosshair size={22} />
             </button>
          </div>

          {/* Right Side: Main Actions */}
          <div className="flex gap-3 pointer-events-auto">
            {/* Merged Report Button */}
            <button
                onClick={onReportCurrentLocation}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-2xl shadow-xl transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 w-20 h-20"
                aria-label="위험 제보"
            >
               <AlertTriangle size={26} fill="currentColor" className="text-white" />
               <span className="text-[10px] font-bold">위험신고</span>
            </button>

            {/* Battery Button */}
            <button
               onClick={onOpenBattery}
               className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-100 p-4 rounded-2xl shadow-xl transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 w-20 h-20"
            >
              <Battery size={26} />
              <span className="text-[10px] font-bold">배터리</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};