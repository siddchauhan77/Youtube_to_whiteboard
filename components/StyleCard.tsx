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
        relative cursor-pointer p-6 rounded-xl border-2 transition-all duration-200
        flex flex-col items-center text-center gap-3
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' 
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 bg-white'
        }
      `}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-blue-500">
          <Check className="w-5 h-5" />
        </div>
      )}
      
      <div className={`p-3 rounded-full ${selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
        {icon}
      </div>
      
      <div>
        <h3 className="font-bold text-gray-900">{style}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-snug">{description}</p>
      </div>
    </div>
  );
};