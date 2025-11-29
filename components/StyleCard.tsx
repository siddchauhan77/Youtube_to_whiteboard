import React from 'react';
import { Check } from 'lucide-react';
import { VisualStyle } from '../types';

interface StyleCardProps {
  style: VisualStyle;
  selected: boolean;
  onSelect: (style: VisualStyle) => void;
  icon: React.ReactNode;
  description: string;
}

export const StyleCard: React.FC<StyleCardProps> = ({ style, selected, onSelect, icon, description }) => {
  return (
    <div 
      onClick={() => onSelect(style)}
      className={`
        relative cursor-pointer p-5 rounded-3xl transition-all duration-300
        flex flex-col items-center text-center gap-3 border
        ${selected 
          ? 'border-indigo-400 bg-indigo-50/80 shadow-lg shadow-indigo-100/50 scale-[1.02]' 
          : 'border-white/40 hover:border-indigo-200 hover:bg-white/60 bg-white/40 shadow-sm hover:shadow-md'
        }
      `}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-indigo-500 bg-white rounded-full p-1 shadow-sm">
          <Check className="w-4 h-4" />
        </div>
      )}
      
      <div className={`p-4 rounded-2xl transition-colors ${selected ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/80 text-gray-500'}`}>
        {icon}
      </div>
      
      <div>
        <h3 className="font-bold text-gray-800">{style}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-snug">{description}</p>
      </div>
    </div>
  );
};