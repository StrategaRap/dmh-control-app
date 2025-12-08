import React from 'react';
import { CODELCO_LOGO_URL, DRILLCO_LOGO_URL } from '../constants';
import { Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isOnline }) => {
  return (
    <div className="bg-white shadow-md border-b border-slate-200 sticky top-0 z-40">
      {/* Top Status Bar */}
      <div className={`w-full px-4 py-1.5 text-xs font-bold text-white flex justify-center transition-colors duration-300 ${isOnline ? 'bg-brand-secondary' : 'bg-red-600'}`}>
         {isOnline ? (
            <span className="flex items-center tracking-wide">
                <Wifi className="w-3.5 h-3.5 mr-1.5" /> ONLINE - SINCRONIZACIÓN DISPONIBLE
            </span>
        ) : (
            <span className="flex items-center tracking-wide">
                <WifiOff className="w-3.5 h-3.5 mr-1.5" /> OFFLINE - GUARDANDO LOCALMENTE
            </span>
        )}
      </div>

      {/* Main Header Content */}
      <div className="px-4 py-3 md:py-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          
          {/* Left: Drillco Logo */}
          <div className="flex-shrink-0 w-24 md:w-32">
             <img 
               src={DRILLCO_LOGO_URL} 
               alt="Drillco SA" 
               className="h-12 md:h-16 object-contain object-left" 
             />
          </div>

          {/* Center: Title */}
          <div className="flex-grow mx-2 text-center">
             <h1 className="text-lg md:text-2xl font-black text-brand-primary uppercase tracking-tight leading-tight">
               Reporte Diario
             </h1>
             <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
               Ministro Hales
             </p>
          </div>

          {/* Right: Codelco Logo */}
          <div className="flex-shrink-0 w-24 md:w-32 flex justify-end">
             <img 
               src={CODELCO_LOGO_URL} 
               alt="Codelco MH" 
               className="h-12 md:h-16 object-contain object-right"
             />
          </div>

        </div>
      </div>
    </div>
  );
};