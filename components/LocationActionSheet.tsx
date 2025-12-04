import React from 'react';
import { Navigation, Bookmark, AlertTriangle, ArrowRight, Share2, Copy } from 'lucide-react';
import { LocationInfo } from '../types';

interface LocationActionSheetProps {
  location: LocationInfo | null;
  onClose: () => void;
  onRoute: () => void;
  onReport: () => void;
}

export const LocationActionSheet: React.FC<LocationActionSheetProps> = ({ location, onClose, onRoute, onReport }) => {
  if (!location) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1100] bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-5 animate-slide-up">
        {/* Handle bar */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{location.name || '선택된 위치'}</h2>
                <p className="text-sm text-gray-500">{location.address}</p>
                {location.roadAddress && <p className="text-xs text-gray-400 mt-0.5">{location.roadAddress}</p>}
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <ArrowRight className="rotate-90" size={20} />
            </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
            <button 
                onClick={onRoute}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
                <Navigation size={24} />
                <span className="text-xs font-bold">길안내</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                <Bookmark size={24} />
                <span className="text-xs font-bold">저장</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                <Share2 size={24} />
                <span className="text-xs font-bold">공유</span>
            </button>
            <button 
                onClick={onReport}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
                <AlertTriangle size={24} />
                <span className="text-xs font-bold">제보</span>
            </button>
        </div>
    </div>
  );
};