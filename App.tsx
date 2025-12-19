import React, { useState, useEffect } from 'react';
import { KakaoMapComponent } from './components/KakaoMapComponent';
import { ControlPanel } from './components/ControlPanel';
import { StationModal } from './components/StationModal';
import { BatteryDrawer } from './components/BatteryDrawer';
import { ReportDialog } from './components/ReportDialog';
import { SearchPanel } from './components/SearchPanel';
import { LocationActionSheet } from './components/LocationActionSheet';
import { SubwayStationDetailsPanel } from './components/SubwayStationDetailsPanel';
import { api } from './services/mockApi';
import { Station, Report, UserProfile, EnvironmentData, LocationInfo, RouteOption, WeatherData, RoadBlock } from './types';
import { INITIAL_CENTER, WHEELCHAIR_MODELS } from './constants';
import { fetchRoadBlockInfo, filterActiveBlocks, filterRoadBlocksByLocation } from './services/roadBlockApi';

const App: React.FC = () => {
  // --- State ---
  const [stations, setStations] = useState<Station[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [roadBlocks, setRoadBlocks] = useState<RoadBlock[]>([]);
  
  // UI Toggles
  const [showStations, setShowStations] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  
  // 지하철 충전소 관련 상태 (기존 코드와 독립적)
  const [selectedSubwayStation, setSelectedSubwayStation] = useState<Station | null>(null);
  
  // Location & Following Logic
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);

  // Battery & Range Logic
  const [isBatteryDrawerOpen, setBatteryDrawerOpen] = useState(false);
  
  const [batteryLevel, setBatteryLevel] = useState<number>(80);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    modelName: '모토메드 파워체어 P200',
    batteryCapacityAh: 35,
    batteryVoltage: 24,
    wheelchairWeight: 55,
    userWeight: 70,
    weightTotal: 125,
    productId: 'wc_002'
  });
  const [environment, setEnvironment] = useState<EnvironmentData>({
    temp: 20,
    slopeAvg: 0,
    windSpeed: 0
  });
  const [weather, setWeather] = useState<WeatherData>({ temp: 20, condition: 'Sunny', windSpeed: 0 });
  const [predictedRange, setPredictedRange] = useState<number | null>(null);

  // Reporting Logic
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [newReportCoords, setNewReportCoords] = useState<{lat: number, lng: number} | null>(null);

  // Search & Routing Logic
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [searchResults, setSearchResults] = useState<RouteOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [routeDestination, setRouteDestination] = useState<{lat: number, lng: number} | null>(null);

  // --- Effects ---
  useEffect(() => {
    const initData = async () => {
      const [stationData, reportData, weatherData, roadBlockData] = await Promise.all([
        api.getStations(),
        api.getReports(),
        api.getWeather(),
        fetchRoadBlockInfo()
      ]);
      setStations(stationData);
      setReports(reportData);
      setWeather(weatherData);
      
      // 현재 진행 중인 도로 차단만 필터링
      const activeBlocks = filterActiveBlocks(roadBlockData);
      setRoadBlocks(activeBlocks);
      
      setEnvironment(prev => ({ 
        ...prev, 
        temp: weatherData.temp,
        windSpeed: weatherData.windSpeed 
      }));

      console.log('📊 데이터 로드 완료:', {
        충전소: stationData.length,
        제보: reportData.length,
        도로차단: activeBlocks.length
      });
    };
    initData();
  }, []);

  // Weather Auto-Refresh (every 5 minutes)
  useEffect(() => {
    const intervalId = setInterval(async () => {
        const newWeather = await api.getWeather();
        setWeather(newWeather);
        setEnvironment(prev => ({ 
            ...prev, 
            temp: newWeather.temp,
            windSpeed: newWeather.windSpeed 
        }));
    }, 5 * 60 * 1000); // 5 min
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const initLocation = async () => {
      console.log('📍 위치 초기화 시작...');
      
      // 먼저 기본 위치를 설정 (대구 중앙로역)
      const defaultLocation = { lat: 35.8694, lng: 128.6061 };
      setUserLocation(defaultLocation);
      console.log('📍 기본 위치 설정 완료 (대구 중앙로역)');
      
      try {
        // GPS 위치 조회 시도 (비동기)
        if (navigator.geolocation) {
          console.log('🛰️ GPS 위치 조회 시도...');
          
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              console.log(`✅ GPS 위치 조회 성공: ${latitude}, ${longitude}`);
              setUserLocation({ lat: latitude, lng: longitude });

              // 경사도 데이터 가져오기
              try {
                const slope = await api.getSlopeByLocation(latitude, longitude);
                setEnvironment(prev => ({ ...prev, slopeAvg: slope }));
              } catch (e) {
                console.error("경사도 데이터 조회 실패:", e);
              }
            },
            (error) => {
              console.warn('❌ GPS 위치 조회 실패:', error.message);
              
              // IP 기반 위치 시도
              fetch('https://ipapi.co/json/')
                .then(response => response.json())
                .then(data => {
                  if (data.latitude && data.longitude) {
                    const ipLocation = {
                      lat: parseFloat(data.latitude),
                      lng: parseFloat(data.longitude)
                    };
                    console.log(`✅ IP 기반 위치 조회 성공: ${data.city}, ${data.country}`);
                    setUserLocation(ipLocation);
                  }
                })
                .catch(ipError => {
                  console.warn('❌ IP 기반 위치 조회도 실패:', ipError);
                  console.log('📍 기본 위치 유지');
                });
            },
            { 
              enableHighAccuracy: false, // 정확도보다 속도 우선
              timeout: 5000, // 5초 타임아웃
              maximumAge: 600000 // 10분간 캐시 사용
            }
          );

          // GPS 위치 감시 시작 (선택적)
          const watchId = navigator.geolocation.watchPosition(
            async (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords;
              setUserLocation({ lat, lng });
              try {
                const slope = await api.getSlopeByLocation(lat, lng);
                setEnvironment(prev => ({ ...prev, slopeAvg: slope }));
              } catch (e) {
                console.error("경사도 데이터 조회 실패:", e);
              }
            },
            (error) => {
              console.warn("GPS 위치 감시 오류:", error.message);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );

          return () => navigator.geolocation.clearWatch(watchId);
        } else {
          console.warn('❌ Geolocation이 지원되지 않는 브라우저입니다');
        }
      } catch (error) {
        console.error('❌ 위치 초기화 오류:', error);
      }
    };

    initLocation();
  }, []);

  useEffect(() => {
    const updateRange = async () => {
      const range = await api.predictRange(batteryLevel, userProfile, environment);
      setPredictedRange(range);
    };
    updateRange();
  }, [batteryLevel, userProfile, environment]);

  // 배터리 부족 시 충전소 추천 기능
  useEffect(() => {
    if (!userLocation || !stations.length) return;

    // 배터리가 20% 이하일 때 가까운 충전소 찾기
    if (batteryLevel <= 20) {
      const availableStations = stations
        .filter(station => station.isAvailable)
        .map(station => {
          const distance = Math.sqrt(
            Math.pow(station.lat - userLocation.lat, 2) + 
            Math.pow(station.lng - userLocation.lng, 2)
          ) * 111000; // 미터 변환
          return { ...station, distance };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3); // 가장 가까운 3개

      if (availableStations.length > 0) {
        const nearest = availableStations[0];
        if (nearest.distance < 2000) { // 2km 이내
          console.log(`🔋 배터리 부족 경고! 가장 가까운 충전소: ${nearest.name} (${Math.round(nearest.distance)}m)`);
          
          // 10% 이하일 때는 자동으로 길찾기 제안
          if (batteryLevel <= 10) {
            const shouldNavigate = window.confirm(
              `⚠️ 배터리가 ${batteryLevel}%입니다!\n\n` +
              `가장 가까운 충전소로 안내할까요?\n` +
              `📍 ${nearest.name}\n` +
              `📏 거리: ${Math.round(nearest.distance)}m\n\n` +
              `확인을 누르면 길찾기를 시작합니다.`
            );
            
            if (shouldNavigate) {
              // 가까운 충전소로 길찾기 시작
              setSelectedRoute(null);
              setRouteDestination({ lat: nearest.lat, lng: nearest.lng });
              
              api.calculateRoutes(userLocation, { lat: nearest.lat, lng: nearest.lng })
                .then(routes => {
                  setSearchResults(routes);
                  // 도보 경로를 자동 선택
                  const walkRoute = routes.find(r => r.mode === 'WALK') || routes[0];
                  if (walkRoute) {
                    setSelectedRoute(walkRoute);
                  }
                });
            }
          }
        }
      }
    }
  }, [userLocation, stations, batteryLevel]);

  // --- Handlers ---

  const handleMapClick = async (lat: number, lng: number) => {
    // Hide other modals
    setSelectedStation(null);
    setSelectedSubwayStation(null);
    
    // 사용자 위치가 있으면 바로 길찾기 시작
    if (userLocation) {
      setSelectedRoute(null);
      setRouteDestination({ lat, lng });
      
      // 역지오코딩으로 주소 가져오기
      const location = await api.reverseGeocode(lat, lng);
      
      // 경로 계산
      const routes = await api.calculateRoutes(userLocation, { lat, lng });
      setSearchResults(routes);
      
      // 첫 번째 경로를 자동 선택 (도보 우선)
      const walkRoute = routes.find(r => r.mode === 'WALK') || routes[0];
      if (walkRoute) {
        setSelectedRoute(walkRoute);
      }
    } else {
      // 사용자 위치가 없으면 기존 방식대로
      setSearchResults([]);
      const location = await api.reverseGeocode(lat, lng);
      setSelectedLocation(location);
    }
  };

  // 충전소 클릭 핸들러 (지하철 충전소와 일반 충전소 구분)
  const handleStationClick = async (station: Station) => {
    console.log('🚇 App.tsx - 충전소 클릭됨:', station);
    console.log('🔍 App.tsx - station.type:', station.type);
    
    // 다른 패널들 닫기
    setSelectedLocation(null);
    
    if (station.type === 'SUBWAY') {
      console.log('✅ App.tsx - 지하철 충전소 클릭, 실시간 충전기 정보 조회 시작:', station.name);
      
      // 실시간으로 충전기 정보 조회
      try {
        const { fetchChargingInfoByStation } = await import('./services/subwayChargingApi');
        const chargingInfo = await fetchChargingInfoByStation(station.name, station.lineCode || '1');
        
        // 충전기 정보를 station 객체에 추가
        const updatedStation = {
          ...station,
          chargingLocation: chargingInfo?.chargingLocation || '정보 없음',
          fastChargerCount: chargingInfo?.fastChargerCount || 0,
          normalChargerCount: chargingInfo?.normalChargerCount || 0,
          hasCharger: chargingInfo?.hasCharger || false
        };
        
        console.log('✅ App.tsx - 충전기 정보 조회 완료:', chargingInfo);
        setSelectedSubwayStation(updatedStation);
        setSelectedStation(null);
        
      } catch (error) {
        console.error('❌ App.tsx - 충전기 정보 조회 실패:', error);
        // 에러 시에도 기본 정보로 패널 표시
        setSelectedSubwayStation(station);
        setSelectedStation(null);
      }
    } else {
      console.log('✅ App.tsx - 일반 충전소 모달 표시:', station.name);
      // 일반 충전소는 기존 모달 표시
      setSelectedStation(station);
      setSelectedSubwayStation(null);
    }
  };

  // 위치 새로고침 함수
  const refreshUserLocation = async () => {
    console.log('🔄 사용자 위치 새로고침 시작...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`✅ 위치 새로고침 성공: ${latitude}, ${longitude}`);
          setUserLocation({ lat: latitude, lng: longitude });
          
          // 경사도 데이터도 업데이트
          try {
            const slope = await api.getSlopeByLocation(latitude, longitude);
            setEnvironment(prev => ({ ...prev, slopeAvg: slope }));
          } catch (e) {
            console.error("경사도 데이터 조회 실패:", e);
          }
        },
        (error) => {
          console.warn('❌ 위치 새로고침 실패:', error.message);
          alert('위치 정보를 가져올 수 없습니다. GPS가 켜져 있는지 확인해주세요.');
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 // 캐시 사용 안함
        }
      );
    } else {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    }
  };

  const handleStationNavigate = async (lat: number, lng: number) => {
    if (!userLocation) {
      alert('현재 위치를 확인할 수 없습니다.');
      return;
    }

    console.log('🧭 충전소로 길찾기:', { from: userLocation, to: { lat, lng } });
    
    setSelectedRoute(null);
    setRouteDestination({ lat, lng });
    
    // 경로 계산
    const routes = await api.calculateRoutes(userLocation, { lat, lng });
    setSearchResults(routes);
    
    // 첫 번째 경로를 자동 선택 (도보 우선)
    const walkRoute = routes.find(r => r.mode === 'WALK') || routes[0];
    if (walkRoute) {
      setSelectedRoute(walkRoute);
    }
  };

  const handleReportCurrentLocation = () => {
      if (userLocation) {
          setNewReportCoords({ lat: userLocation.lat, lng: userLocation.lng });
          setReportDialogOpen(true);
      } else {
          alert("현재 위치를 찾을 수 없습니다. GPS 권한을 확인해주세요.");
      }
  };

  const handleDragStart = () => {
    setIsFollowingUser(false);
  };

  const handleCenterLocation = () => {
    if (userLocation) {
      setIsFollowingUser(true);
    } else {
        alert("위치 정보를 가져오는 중입니다...");
    }
  };

  const handleSubmitReport = async (type: string, desc: string, severity: 'CAUTION' | 'WARNING' | 'DANGER', image: string | undefined) => {
    if (!newReportCoords) return;
    const reportType = type as Report['type'];
    const newReport = await api.postReport({
      lat: newReportCoords.lat,
      lng: newReportCoords.lng,
      type: reportType,
      description: desc,
      severity,
      imageUrl: image
    });
    setReports(prev => [...prev, newReport]);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSelectedRoute(null);
    // 검색 결과 첫 번째 항목으로 경로 계산
    const locations = await api.searchLocations(query);
    if (locations.length > 0 && userLocation) {
        // Just showing the first match route for MVP
        const dest = locations[0];
        setRouteDestination({ lat: dest.lat, lng: dest.lng });
        const routes = await api.calculateRoutes(userLocation, { lat: dest.lat, lng: dest.lng });
        setSearchResults(routes);
    }
    setIsSearching(false);
  };

  const handleActionSheetRoute = async () => {
      if (selectedLocation && userLocation) {
          setSelectedLocation(null);
          setSelectedRoute(null);
          setRouteDestination({ lat: selectedLocation.lat, lng: selectedLocation.lng });
          const routes = await api.calculateRoutes(userLocation, { lat: selectedLocation.lat, lng: selectedLocation.lng });
          setSearchResults(routes);
      } else {
          alert("내 위치가 확인되지 않아 경로를 찾을 수 없습니다.");
      }
  };

  const handleSaveLocation = (name: string, lat: number, lng: number) => {
      const savedItem = { name, lat, lng, savedAt: new Date().toISOString() };
      // Save to localStorage for MVP
      const savedList = JSON.parse(localStorage.getItem('wheely_saved_places') || '[]');
      savedList.push(savedItem);
      localStorage.setItem('wheely_saved_places', JSON.stringify(savedList));
      alert(`[저장됨] ${name}\n위치 목록에 추가되었습니다.`);
      console.log('Saved Location:', savedItem);
  };

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden font-sans">
      
      <KakaoMapComponent
        center={INITIAL_CENTER}
        stations={stations}
        reports={reports}
        roadBlocks={roadBlocks}
        showStations={showStations}
        showReports={showReports}
        batteryRange={predictedRange}
        onMapClick={handleMapClick}
        onStationClick={handleStationClick}
        userLocation={userLocation}
        isFollowingUser={isFollowingUser}
        onDragStart={handleDragStart}
        onSaveLocation={handleSaveLocation}
        selectedRoute={selectedRoute}
        routeDestination={routeDestination}
      />

      <SearchPanel 
          onSearch={handleSearch}
          searchResults={searchResults}
          isSearching={isSearching}
          onClear={() => {
            setSearchResults([]);
            setSelectedRoute(null);
            setRouteDestination(null);
          }}
          weather={weather}
          onSelectRoute={setSelectedRoute}
          selectedRoute={selectedRoute}
      />

      <ControlPanel
        showStations={showStations}
        setShowStations={setShowStations}
        showReports={showReports}
        setShowReports={setShowReports}
        onOpenBattery={() => setBatteryDrawerOpen(true)}
        currentRange={predictedRange}
        weatherTemp={environment.temp}
        onCenterLocation={handleCenterLocation}
        isFollowingUser={isFollowingUser}
        onReportCurrentLocation={handleReportCurrentLocation}
        onRefreshLocation={refreshUserLocation}
      />

      <StationModal
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
        onNavigate={handleStationNavigate}
      />

      <SubwayStationDetailsPanel
        station={selectedSubwayStation}
        onClose={() => setSelectedSubwayStation(null)}
        onNavigate={handleStationNavigate}
      />

      <LocationActionSheet 
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onRoute={handleActionSheetRoute}
        onReport={() => {
            if (selectedLocation) {
                setNewReportCoords({ lat: selectedLocation.lat, lng: selectedLocation.lng });
                setReportDialogOpen(true);
                setSelectedLocation(null);
            }
        }}
      />

      <BatteryDrawer
        isOpen={isBatteryDrawerOpen}
        onClose={() => setBatteryDrawerOpen(false)}
        currentLevel={batteryLevel}
        setCurrentLevel={setBatteryLevel}
        profile={userProfile}
        setProfile={setUserProfile}
        environment={environment}
      />

      {newReportCoords && (
        <ReportDialog
            isOpen={isReportDialogOpen}
            onClose={() => { setReportDialogOpen(false); setNewReportCoords(null); }}
            onSubmit={handleSubmitReport}
            lat={newReportCoords.lat}
            lng={newReportCoords.lng}
        />
      )}
    </div>
  );
};

export default App;