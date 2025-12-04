import React, { useState, useEffect } from 'react';
import { Search, Train, Bus, Activity, Car, X, Thermometer } from 'lucide-react';
import { RouteOption, LocationInfo, WeatherData } from '../types';
import { api } from '../services/mockApi';

interface SearchPanelProps {
  onSearch: (query: string) => void;
  searchResults: RouteOption[];
  isSearching: boolean;
  onClear: () => void;
  weather: WeatherData;
  onSelectRoute: (route: RouteOption) => void;
  selectedRoute: RouteOption | null;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, searchResults, isSearching, onClear, weather, onSelectRoute, selectedRoute }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 0) {
        const results = await api.searchLocations(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    // Debounce slightly
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: LocationInfo) => {
    setQuery(suggestion.name || '');
    setShowSuggestions(false);
    onSearch(suggestion.name || '');
    // Alert for MVP demo
    console.log("Selected:", suggestion);
  };

  const handleClear = () => {
      setQuery('');
      setSuggestions([]);
      onClear();
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
      
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="flex-1 bg-white rounded-xl shadow-lg pointer-events-auto flex items-center p-1 border border-gray-100 relative">
            <form onSubmit={handleSubmit} className="flex-1 flex items-center">
                <div className="p-3 text-gray-400">
                    <Search size={20} />
                </div>
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="장소 검색 (예: 복지관)"
                    className="flex-1 h-12 outline-none text-gray-800 font-medium placeholder-gray-400 bg-transparent"
                />
            </form>
            {query && (
                <button onClick={handleClear} className="p-3 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            )}
        </div>

        {/* Real-time Weather Badge */}
        <div className="bg-white rounded-xl shadow-lg pointer-events-auto flex items-center justify-center px-4 border border-gray-100 min-w-[80px]">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-orange-500">
                    <Thermometer size={14} />
                    <span className="text-xs font-bold">현재</span>
                </div>
                <span className="text-lg font-black text-gray-800">{weather.temp}°C</span>
            </div>
        </div>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl pointer-events-auto overflow-hidden animate-slide-up border border-gray-100 mt-1">
              <ul>
                  {suggestions.map((place, idx) => (
                      <li 
                        key={idx} 
                        onClick={() => handleSuggestionClick(place)}
                        className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer flex flex-col"
                      >
                          <span className="font-bold text-gray-800">{place.name}</span>
                          <span className="text-xs text-gray-400">{place.address}</span>
                      </li>
                  ))}
              </ul>
          </div>
      )}

      {/* Route Results (Existing) */}
      {searchResults.length > 0 && !showSuggestions && (
        <div className="bg-white rounded-xl shadow-xl pointer-events-auto overflow-hidden animate-slide-up border border-gray-100 mt-2">
            <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">추천 경로</span>
                <div className="flex items-center gap-2">
                    {selectedRoute && (
                        <button 
                            onClick={() => {
                                const mode = selectedRoute.mode === 'SUBWAY' ? '지하철' : 
                                           selectedRoute.mode === 'BUS' ? '버스' : 
                                           selectedRoute.mode === 'TAXI' ? '택시' : '도보';
                                const message = `🧭 ${mode} 길 안내를 시작합니다!\n\n` +
                                              `📍 예상 소요시간: ${selectedRoute.durationMin}분\n` +
                                              `💰 예상 비용: ${selectedRoute.cost > 0 ? selectedRoute.cost.toLocaleString() + '원' : '무료'}\n` +
                                              `📏 거리: ${selectedRoute.distanceKm}km\n\n` +
                                              `${selectedRoute.details}\n\n` +
                                              `⚠️ 실제 음성 안내 기능은 추후 지원 예정입니다.`;
                                alert(message);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors animate-pulse"
                        >
                            🧭 길 안내 시작
                        </button>
                    )}
                    <span className="text-xs text-blue-600 font-medium">최적순</span>
                </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map((route, idx) => {
                    const isSelected = selectedRoute?.mode === route.mode && selectedRoute?.durationMin === route.durationMin;
                    return (
                        <div 
                            key={idx} 
                            onClick={() => onSelectRoute(route)}
                            className={`p-4 border-b border-gray-50 last:border-0 cursor-pointer transition-all ${
                                isSelected 
                                    ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    {route.mode === 'SUBWAY' && <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Train size={16}/></div>}
                                    {route.mode === 'BUS' && <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Bus size={16}/></div>}
                                    {route.mode === 'WALK' && <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><Activity size={16}/></div>}
                                    {route.mode === 'TAXI' && <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg"><Car size={16}/></div>}
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {route.mode === 'SUBWAY' ? '지하철' : route.mode === 'BUS' ? '버스' : route.mode === 'TAXI' ? '택시' : '🚶‍♂️ 도보'}
                                        </span>
                                        {route.mode === 'WALK' && (
                                            <span className="text-xs text-green-600 font-medium">휠체어 최적화</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-lg font-black ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {route.durationMin}분
                                    </span>
                                    <div className="text-xs text-gray-500">
                                        {route.distanceKm}km
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 pl-9">
                                <span className="whitespace-pre-line">{route.details}</span>
                                <span className="font-medium">{route.cost > 0 ? `${route.cost.toLocaleString()}원` : '무료'}</span>
                            </div>
                            {isSelected && (
                                <div className="mt-2 pl-9 text-xs text-blue-600 font-medium">
                                    ✓ 선택된 경로 (지도에 표시됨)
                                </div>
                            )}
                            {route.details.includes('⚠️') && (
                                <div className="mt-2 pl-9 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                    <p className="text-xs text-yellow-800 font-medium whitespace-pre-line">
                                        {route.details.split('\n').filter(line => line.includes('⚠️') || line.includes('🚫')).join('\n')}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};