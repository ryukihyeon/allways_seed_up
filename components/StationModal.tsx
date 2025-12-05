import React from 'react';
import { Station } from '../types';
import { X, Navigation, Phone, AlertCircle } from 'lucide-react';

interface StationModalProps {
  station: Station | null;
  onClose: () => void;
  onNavigate?: (lat: number, lng: number) => void;
}

export const StationModal: React.FC<StationModalProps> = ({ station, onClose, onNavigate }) => {
  if (!station) return null;

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(station.lat, station.lng);
      onClose();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[2000] p-4 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 max-w-md mx-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-full ${station.isAvailable ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className={`w-3 h-3 rounded-full ${station.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{station.name}</h2>
            <p className="text-sm text-gray-500">{station.address}</p>
            <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">
                    {station.type === 'FAST' ? '급속충전' : '일반충전'}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                    station.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {station.isAvailable ? '사용 가능' : '사용 불가'}
                </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={handleNavigate}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium active:bg-blue-700 hover:bg-blue-700 transition-colors"
            >
                <Navigation size={18} />
                길찾기
            </button>
            <button 
              onClick={() => alert('전화 기능은 준비 중입니다.')}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-50 hover:bg-gray-50 transition-colors"
            >
                <Phone size={18} />
                전화하기
            </button>
        </div>
        
        <button className="w-full mt-3 flex items-center justify-center gap-2 text-red-500 text-sm py-2">
            <AlertCircle size={16} />
            고장 신고하기
        </button>
      </div>
    </div>
  );
};
