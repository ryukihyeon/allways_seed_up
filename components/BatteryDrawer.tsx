import React, { useState, useEffect } from 'react';
import { X, BatteryCharging, Settings, User, Scale, Activity, Thermometer, Mountain } from 'lucide-react';
import { UserProfile, EnvironmentData } from '../types';
import { fetchWheelchairProducts, calculateTotalWeight, type WheelchairProduct } from '../services/wheelchairApi';

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
  const [wheelchairProducts, setWheelchairProducts] = useState<WheelchairProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // 제품 목록 로드
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      const products = await fetchWheelchairProducts();
      setWheelchairProducts(products);
      setIsLoadingProducts(false);
      
      // 첫 번째 제품을 기본 선택
      if (products.length > 0 && !selectedProductId) {
        handleProductChange(products[0]);
      }
    };
    
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const handleProductChange = (product: WheelchairProduct) => {
    setSelectedProductId(product.id);
    const totalWeight = calculateTotalWeight(product.weight, profile.userWeight || 70);
    
    setProfile({
      modelName: `${product.manufacturer} ${product.modelName}`,
      batteryCapacityAh: product.batteryCapacityAh,
      batteryVoltage: product.batteryVoltage,
      wheelchairWeight: product.weight,
      userWeight: profile.userWeight || 70,
      weightTotal: totalWeight,
      productId: product.id
    });
  };

  const handleUserWeightChange = (weight: number) => {
    const totalWeight = calculateTotalWeight(profile.wheelchairWeight, weight);
    setProfile({
      ...profile,
      userWeight: weight,
      weightTotal: totalWeight
    });
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

                    {/* 휠체어 제품 선택 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            전동휠체어 모델 선택
                            {isLoadingProducts && <span className="text-xs text-gray-400 ml-2">(로딩 중...)</span>}
                        </label>
                        <select 
                            value={selectedProductId}
                            onChange={(e) => {
                                const product = wheelchairProducts.find(p => p.id === e.target.value);
                                if (product) handleProductChange(product);
                            }}
                            className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            disabled={isLoadingProducts}
                        >
                            {wheelchairProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.modelName} ({product.batteryCapacityAh}Ah, {product.weight}kg)
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            * 보조공학기기 제품 정보 API 기반
                        </p>
                    </div>

                    {/* 사용자 몸무게 입력 */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            <Scale size={16} className="inline mr-1"/>
                            사용자 몸무게
                        </label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={profile.userWeight || 70}
                                onChange={(e) => handleUserWeightChange(Number(e.target.value))}
                                min="30"
                                max="150"
                                className="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg font-bold"
                            />
                            <span className="absolute right-3 top-3 text-sm text-gray-500 font-bold">kg</span>
                        </div>
                        <div className="mt-3 p-3 bg-white rounded-lg">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>휠체어 무게</span>
                                <span className="font-bold">{profile.wheelchairWeight}kg</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>사용자 몸무게</span>
                                <span className="font-bold">{profile.userWeight || 70}kg</span>
                            </div>
                            <div className="w-full h-px bg-gray-200 my-2"></div>
                            <div className="flex justify-between text-sm font-bold text-blue-600">
                                <span>총 무게</span>
                                <span>{profile.weightTotal}kg</span>
                            </div>
                        </div>
                    </div>

                    {/* 제품 상세 정보 */}
                    {selectedProductId && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">제품 상세 정보</h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500">배터리 용량</p>
                                    <p className="font-bold text-gray-800">{profile.batteryCapacityAh}Ah × {profile.batteryVoltage}V</p>
                                    <p className="text-gray-400">= {profile.batteryCapacityAh * profile.batteryVoltage}Wh</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">휠체어 무게</p>
                                    <p className="font-bold text-gray-800">{profile.wheelchairWeight}kg</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-gray-400 p-2 text-center bg-yellow-50 rounded-lg border border-yellow-200">
                        ⚠️ 무게가 증가하면 배터리 소모가 많아져 주행 거리가 감소합니다.
                    </div>
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
