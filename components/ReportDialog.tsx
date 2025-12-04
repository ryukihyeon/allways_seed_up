import React, { useState, useRef } from 'react';
import { REPORT_TYPES, SEVERITY_LEVELS } from '../constants';
import { X, Check, Camera, Image as ImageIcon } from 'lucide-react';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string, desc: string, severity: 'CAUTION' | 'WARNING' | 'DANGER', image?: string) => void;
  lat: number;
  lng: number;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({ isOpen, onClose, onSubmit, lat, lng }) => {
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].value);
  const [desc, setDesc] = useState('');
  const [severity, setSeverity] = useState<'CAUTION' | 'WARNING' | 'DANGER'>('CAUTION');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    onSubmit(selectedType, desc, severity, previewImage || undefined);
    // Reset form
    setDesc('');
    setSeverity('CAUTION');
    setPreviewImage(null);
    onClose();
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPreviewImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">🚨 위험 구간 제보</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
          </div>
          
          <form onSubmit={handleSubmit}>
              
              {/* Photo Area */}
              <div className="mb-6">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageCapture}
                  />
                  {previewImage ? (
                      <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden mb-2 group">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                          >
                              <X size={16} />
                          </button>
                      </div>
                  ) : (
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-400 transition-colors"
                      >
                          <Camera size={32} className="mb-2" />
                          <span className="text-sm font-semibold">사진 촬영 / 업로드</span>
                      </button>
                  )}
              </div>

              {/* Type Selection */}
              <label className="block text-sm font-medium text-gray-700 mb-2">위험 유형</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                  {REPORT_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setSelectedType(type.value)}
                        className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                            selectedType === type.value 
                            ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700 ring-2 ring-${type.color}-200` 
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                          {type.label}
                      </button>
                  ))}
              </div>

              {/* Severity Selection */}
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">심각도</label>
                  <div className="flex gap-2">
                      {SEVERITY_LEVELS.map((level) => (
                          <button
                              key={level.value}
                              type="button"
                              onClick={() => setSeverity(level.value as any)}
                              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                                  severity === level.value
                                  ? `${level.bg} text-white ${level.border} shadow-md transform scale-105`
                                  : `bg-white text-gray-500 border-gray-200 hover:bg-gray-50`
                              }`}
                          >
                              {level.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                  <textarea 
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="예: 보도블럭이 파손되어 휠체어 진입이 어렵습니다."
                    className="w-full border border-gray-300 rounded-xl p-3 h-20 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    required
                  />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-6 text-xs text-gray-500 flex items-center justify-between">
                  <span className="font-mono">📍 위치: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
              </div>

              <button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                  <Check size={20} />
                  제보 등록하기
              </button>
          </form>
       </div>
    </div>
  );
};