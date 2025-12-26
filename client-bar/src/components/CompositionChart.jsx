import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

// Generate distinct, saturated colors
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 60%)`;
};

const getIngredientColor = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('lemon') || lower.includes('juice')) return '#FACC15'; 
  if (lower.includes('lime')) return '#A3E635'; 
  if (lower.includes('water') || lower.includes('soda') || lower.includes('tonic')) return '#38BDF8'; 
  if (lower.includes('whiskey') || lower.includes('bourbon')) return '#D97706'; 
  if (lower.includes('rum')) return '#B45309'; 
  if (lower.includes('vodka') || lower.includes('gin') || lower.includes('tequila')) return '#94A3B8'; 
  if (lower.includes('coke') || lower.includes('cola')) return '#451a03'; 
  if (lower.includes('milk') || lower.includes('cream')) return '#F1F5F9'; 
  if (lower.includes('coffee') || lower.includes('kahlua')) return '#3F2C22'; 
  if (lower.includes('blue') || lower.includes('curacao')) return '#2563EB'; 
  if (lower.includes('grenadine') || lower.includes('syrup')) return '#DC2626'; 
  if (lower.includes('mint')) return '#22C55E'; 
  
  return stringToColor(name);
};

export default function CompositionChart({ items, totalVolume, height = 200, isCompact = false }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!items || items.length === 0 || totalVolume === 0) {
    return (
      <div className={`w-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium`} style={{ height }}>
        빈 잔
      </div>
    );
  }

  // 1. Calculate stacking positions
  let currentBottom = 0;
  const stacks = items.map(item => {
    const percent = (item.volume / totalVolume) * 100;
    const start = currentBottom;
    const center = currentBottom + (percent / 2);
    currentBottom += percent;
    
    return {
      ...item,
      percent,
      start,
      center,
      color: getIngredientColor(item.name)
    };
  });

  return (
    <div className="relative w-full flex justify-start pl-2" style={{ height }}>
      
      {/* 툴팁 오버레이 - 화면 우측 상단 고정 */}
      {hoveredItem && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none animate-in fade-in slide-in-from-right-2 duration-200">
          <div className="bg-gray-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex gap-4 items-center min-w-[240px] border border-white/10 ring-1 ring-black/5">
            {hoveredItem.image ? (
              <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-white/20">
                <img src={hoveredItem.image} className="w-full h-full object-cover" alt="재료 이미지" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-white/20 flex items-center justify-center">
                <ImageIcon size={24} className="text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-base truncate">{hoveredItem.name}</p>
              <div className="flex items-center gap-3 text-sm mt-0.5">
                <span className="text-yellow-400 font-bold">{hoveredItem.abv}% ABV</span>
                <span className="text-gray-400">|</span>
                <span className="text-indigo-300 font-mono font-bold">{hoveredItem.volume}ml</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 컵 (시각적 레이어) */}
      <div className="relative w-20 h-full rounded-b-xl rounded-t-sm overflow-hidden border-2 border-gray-400 border-t-0 bg-white shadow-inner flex-shrink-0 z-10">
        {/* 액체 층 */}
        {stacks.map((stack, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredItem(stack)}
            onMouseLeave={() => setHoveredItem(null)}
            className="absolute left-0 right-0 w-full transition-all duration-500 border-t border-black/5 hover:brightness-110 cursor-help"
            style={{ 
              bottom: `${stack.start}%`,
              height: `${stack.percent}%`, 
              backgroundColor: stack.color 
            }}
            title={`${stack.name}: ${stack.volume}ml`} // Native tooltip for accessibility
          />
        ))}
        {/* 유리 반사 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-black/5 pointer-events-none"></div>
      </div>

      {/* 지시선 및 라벨 레이어 */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {stacks.map((stack, idx) => (
          <div 
            key={idx}
            className="absolute left-20 w-[160px] flex items-center pointer-events-auto"
            style={{ 
              bottom: `${stack.center}%`,
              transform: 'translateY(50%)' 
            }}
            onMouseEnter={() => setHoveredItem(stack)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {/* 선 */}
            <div className={`w-4 border-t-2 transition-colors duration-200 ${hoveredItem === stack ? 'border-indigo-500' : 'border-gray-300'}`} />
            
            {/* 점 */}
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 -ml-1 ${hoveredItem === stack ? 'bg-indigo-500 scale-125' : 'bg-gray-300'}`} />

            {/* 텍스트 */}
            <div className={`ml-1 text-xs leading-tight flex flex-col items-start px-2 py-1 rounded-lg shadow-sm transition-all duration-200 cursor-help ${hoveredItem === stack ? 'bg-indigo-600 text-white scale-105' : 'bg-white/80 text-gray-800'}`}>
              <span className="font-bold whitespace-nowrap">{stack.name}</span>
              <span className={`font-mono text-[10px] ${hoveredItem === stack ? 'text-indigo-200' : 'text-gray-500'}`}>{stack.volume}ml</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}