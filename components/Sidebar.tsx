import React from 'react';

interface SidebarProps {
    showElevators: boolean;
    setShowElevators: (show: boolean) => void;
    showStations: boolean;
    setShowStations: (show: boolean) => void;
    visibleSeverities: Set<string>;
    toggleSeverity: (severity: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    showElevators,
    setShowElevators,
    showStations,
    setShowStations,
    visibleSeverities,
    toggleSeverity
}) => {
    return (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
            {/* 엘리베이터 필터 버튼 */}
            <button
                onClick={() => setShowElevators(!showElevators)}
                className={`
          relative w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-200
          ${showElevators
                        ? 'bg-green-500 border-white scale-110'
                        : 'bg-gray-100 border-gray-300 opacity-60 grayscale hover:opacity-80'
                    }
        `}
                title="엘리베이터 보기"
            >
                <span className="text-2xl" role="img" aria-label="elevator">🛗</span>
                {showElevators && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-green-500 rotate-45 border-r border-b border-white"></div>
                )}
            </button>

            {/* 충전소 필터 버튼 */}
            <button
                onClick={() => setShowStations(!showStations)}
                className={`
          relative w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-200
          ${showStations
                        ? 'bg-blue-500 border-white scale-110'
                        : 'bg-gray-100 border-gray-300 opacity-60 grayscale hover:opacity-80'
                    }
        `}
                title="충전소 보기"
            >
                <span className="text-2xl" role="img" aria-label="charging-station">⚡</span>
                {showStations && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-blue-500 rotate-45 border-r border-b border-white"></div>
                )}
            </button>

            <div className="h-px bg-gray-300 my-1 w-8 mx-auto opacity-50"></div>

            {/* 위험 단계 - 주의 (노랑) */}
            <button
                onClick={() => toggleSeverity('CAUTION')}
                className={`
          relative w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-200
          ${visibleSeverities.has('CAUTION')
                        ? 'bg-yellow-400 border-white scale-110'
                        : 'bg-gray-100 border-gray-300 opacity-60 grayscale hover:opacity-80'
                    }
        `}
                title="주의 구간 보기"
            >
                <span className="text-xl" role="img" aria-label="caution">🚧</span>
                {visibleSeverities.has('CAUTION') && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-yellow-400 rotate-45 border-r border-b border-white"></div>
                )}
            </button>

            {/* 위험 단계 - 경고 (주황) */}
            <button
                onClick={() => toggleSeverity('WARNING')}
                className={`
          relative w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-200
          ${visibleSeverities.has('WARNING')
                        ? 'bg-orange-500 border-white scale-110'
                        : 'bg-gray-100 border-gray-300 opacity-60 grayscale hover:opacity-80'
                    }
        `}
                title="경고 구간 보기"
            >
                <span className="text-xl" role="img" aria-label="warning">⚠️</span>
                {visibleSeverities.has('WARNING') && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-orange-500 rotate-45 border-r border-b border-white"></div>
                )}
            </button>

            {/* 위험 단계 - 위험 (빨강) */}
            <button
                onClick={() => toggleSeverity('DANGER')}
                className={`
          relative w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-200
          ${visibleSeverities.has('DANGER')
                        ? 'bg-red-500 border-white scale-110'
                        : 'bg-gray-100 border-gray-300 opacity-60 grayscale hover:opacity-80'
                    }
        `}
                title="위험 구간 보기"
            >
                <span className="text-xl" role="img" aria-label="danger">⛔</span>
                {visibleSeverities.has('DANGER') && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-red-500 rotate-45 border-r border-b border-white"></div>
                )}
            </button>
        </div>
    );
};
