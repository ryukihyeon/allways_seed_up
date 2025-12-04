import React, { useState, useEffect } from 'react';
import { X, BatteryCharging, Settings, User, Scale, Activity, Thermometer, Mountain } from 'lucide-react';
import { UserProfile, EnvironmentData } from '../types';
import { WHEELCHAIR_MODELS } from '../constants';

interface BatteryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  setCurrentLevel: (val: number) => void;
  profile: UserProfile;
  setProfile: (val: UserProfile) => void;
  environment: EnvironmentData;
}

export const BatteryDrawer: React.FC<BatteryDrawerProps> = ({ 
  isOpen, 
  onClose, 
  currentLevel, 
  setCurrentLevel,
  profile,
  setProfile,
  environment
}) => {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'SETTINGS'>('STATUS');
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(1); // Default to Standard Heavy

  const handleModelChange = (idx: number) => {
    setSelectedModelIdx(idx);
    const model = WHEELCHAIR_MODELS[idx];
    setProfile({
        modelName: model.name,
        batteryCapacityAh: model.capacity,
        weightTotal: model.weight
    });
  };

  const handleProfileChange = (key: keyof UserProfile, value: any) => {
    // When custom editing, switch dropdown to "Custom" (last index)
    if (selectedModelIdx !== WHEELCHAIR_MODELS.length - 1) {
        setSelectedModelIdx(WHEELCHAIR_MODELS.length - 1);
    }
    setProfile({ ...profile, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-left flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                <BatteryCharging className="text-blue-600" />
                배터리 매니저
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button 
                onClick={() => setActiveTab('STATUS')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'STATUS' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
                현재 상태
            </button>
            <button 
                onClick={() => setActiveTab('SETTINGS')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'SETTINGS' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
                정보 설정
            </button>
        </div>

        {/* Content */}
        <div className="flex-1">
            {activeTab === 'STATUS' && (
                <div className="space-y-6">
                    {/* Current Level Slider */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <div className="flex justify-between mb-2">
                            <label className="font-bold text-gray-700">현재 배터리 잔량</label>
                            <span className="text-2xl font-black text-blue-600">{currentLevel}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" 
                            value={currentLevel}
                            onChange={(e) => setCurrentLevel(parseInt(e.target.value))}
                            className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                            <span>방전</span>
                            <span>절반</span>
                            <span>만충</span>
                        </div>
                    </div>

                    {/* Detected Environment Info */}
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">자동 감지된 환경 정보</h3>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Thermometer size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">현재 기온</p>
                                    <p className="text-xs text-gray-400">기상청 API 연동</p>
                                </div>
                            </div>
                            <span className="text-lg font-bold text-gray-800">{environment.temp}°C</span>
                        </div>

                        <div className="w-full h-px bg-gray-200"></div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Mountain size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">주변 경사도</p>
                                    <p className="text-xs text-gray-400">지형 데이터 분석</p>
                                </div>
                            </div>
                            <span className="text-lg font-bold text-gray-800">{environment.slopeAvg}°</span>
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 p-2 text-center">
                        * 기온과 경사도는 배터리 효율에 자동으로 반영됩니다.
                    </div>
                </div>
            )}

            {activeTab === 'SETTINGS' && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <User size={14} className="inline mr-1"/>
                        정확한 주행 가능 거리를 계산하기 위해<br/>사용자 및 기기 정보를 입력해주세요.
                    </p>

                    {/* Preset Model Select */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">휠체어 모델 선택</label>
                        <select 
                            value={selectedModelIdx}
                            onChange={(e) => handleModelChange(parseInt(e.target.value))}
                            className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {WHEELCHAIR_MODELS.map((m, idx) => (
                                <option key={idx} value={idx}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Manual Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">배터리 용량 (Ah)</label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={profile.batteryCapacityAh}
                                    onChange={(e) => handleProfileChange('batteryCapacityAh', Number(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                                <span className="absolute right-3 top-3 text-xs text-gray-400 font-bold">Ah</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">총 무게 (kg)</label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={profile.weightTotal}
                                    onChange={(e) => handleProfileChange('weightTotal', Number(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                                <span className="absolute right-3 top-3 text-xs text-gray-400 font-bold">kg</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">* 총 무게 = 사용자 체중 + 휠체어 무게</p>
                </div>
            )}
        </div>

        <button 
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg active:bg-blue-700 flex items-center justify-center gap-2"
        >
            <Activity size={20} />
            {activeTab === 'SETTINGS' ? '설정 저장하고 닫기' : '지도에서 확인하기'}
        </button>
      </div>
    </div>
  );
};
