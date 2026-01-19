
import React, { useEffect, useState, useRef } from 'react';
import { Language } from '../types';
import { DICTIONARY } from '../constants';

interface CertificateProps {
  name?: string;
  imageUrl?: string;
  date?: string;
  lang: Language;
}

const Certificate: React.FC<CertificateProps> = ({ 
  name = "[NAME]", 
  imageUrl = "https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=1000&auto=format&fit=crop", 
  date = new Date().toLocaleDateString('fi-FI'),
  lang
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const t = DICTIONARY[lang];

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        // Calculate scale to fit A4 (210mm) into current container width
        const a4WidthPx = 210 * 3.78; 
        const containerWidth = window.innerWidth - 32;
        const newScale = Math.min(1, containerWidth / a4WidthPx);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-start print:block print:w-[210mm] print:h-[297mm] overflow-visible">
      <div 
        className="origin-top transition-transform duration-500 print:scale-100 print:transform-none print:m-0"
        style={{ transform: `scale(${scale})` }}
      >
        <div 
          id="certificate-parchment"
          className="relative flex flex-col items-center bg-[#020617] print:bg-[#020617] overflow-hidden shadow-2xl print:shadow-none"
          style={{
            width: '210mm',
            height: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Inner Parchment Area */}
          <div className="absolute inset-[10mm] parchment-bg flex flex-col items-center overflow-hidden border-[1px] border-[#b8860b]">
            
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>

            {/* Decorative Gold Border Frame */}
            <div className="absolute inset-[8mm] border-[1px] border-[#d4af37] opacity-40 pointer-events-none"></div>
            <div className="absolute inset-[12mm] border-[4px] border-[#d4af37] border-double pointer-events-none"></div>
            
            {/* Corners */}
            {[
              "top-0 left-0",
              "top-0 right-0 rotate-90",
              "bottom-0 left-0 -rotate-90",
              "bottom-0 right-0 rotate-180"
            ].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-20 h-20 p-6 opacity-40 text-[#d4af37]`}>
                <svg viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0,0 L30,0 L30,5 L5,5 L5,30 L0,30 Z" />
                </svg>
              </div>
            ))}

            {/* Header Area */}
            <div className="mt-16 text-center z-10 w-full px-12">
               <div className="text-[10pt] tracking-[0.6em] uppercase font-bold text-[#b8860b]/60 mb-2">Lapland Heritage Series</div>
               <h1 className="font-christmas text-[72pt] leading-none text-[#800000] drop-shadow-sm whitespace-nowrap overflow-hidden">
                 {t.certTitle}
               </h1>
               <div className="w-16 h-[1px] bg-[#d4af37] mx-auto mt-2"></div>
            </div>

            {/* Portrait Image Frame */}
            <div className="mt-8 mb-4 flex-[1.4] w-full px-20 flex flex-col items-center justify-center relative z-10">
              <div className="relative w-full h-full max-h-[145mm] p-4 bg-white/40 backdrop-blur-sm rounded-[2rem] shadow-lg border border-white/50">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-[4px] border-[#fdf9f0] shadow-2xl bg-slate-200">
                   <img 
                     src={imageUrl} 
                     alt="Tonttu Portrait"
                     className="w-full h-full object-cover"
                     loading="eager"
                   />
                </div>
                <div className="absolute -bottom-6 left-0 right-0 text-center">
                   <span className="bg-[#fdf9f0] px-6 py-1 text-[#800000]/70 italic text-sm tracking-[0.3em] uppercase font-bold border border-[#d4af37]/30 rounded-full shadow-sm">
                     Tonttu Kuvaus – Lapland
                   </span>
                </div>
              </div>
            </div>

            {/* Text Section */}
            <div className="text-center px-24 pb-12 z-10 w-full flex-1 flex flex-col justify-center">
              <p className="text-[#475569] italic text-2xl font-serif">{t.certProof}</p>
              
              <div className="my-4">
                <h2 className="text-[48pt] leading-tight font-christmas text-[#800000] break-words px-4">
                  {name}
                </h2>
                <div className="h-[2px] w-32 bg-[#d4af37]/40 mx-auto"></div>
              </div>

              <div className="space-y-4">
                <p className="font-bold text-[18pt] text-slate-900 uppercase tracking-[0.3em] leading-tight">
                  {t.certOfficial}
                </p>
                <p className="text-lg leading-relaxed text-[#475569]/80 italic font-serif max-w-lg mx-auto">
                  {t.certExperience}
                </p>
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="w-full px-20 pb-12 z-10 flex justify-between items-end">
              <div className="text-left">
                <p className="text-slate-900 font-bold font-serif text-lg">{date}</p>
                <p className="text-[9pt] uppercase tracking-widest text-slate-400">{t.certPlaceDate}</p>
              </div>

              <div className="text-center">
                <p className="font-christmas text-2xl text-[#8b4513] mb-1">{t.certMagicCert}</p>
                <p className="text-[8pt] text-slate-400 font-sans tracking-[0.4em] uppercase opacity-50">
                  Serial No: {Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}
                </p>
              </div>
            </div>

            {/* Official Certification Seal */}
            <div className="absolute bottom-12 right-12 w-48 h-48 z-50 transform rotate-[-5deg]">
               {/* Ribbons */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                  <div className="w-10 h-24 bg-[#800000] shadow-lg origin-top rotate-12 clip-ribbon"></div>
                  <div className="w-10 h-24 bg-[#800000] shadow-lg origin-top -rotate-12 clip-ribbon"></div>
               </div>
               {/* Wax/Gold Seal */}
               <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#8b4513] shadow-2xl border-[3px] border-[#8b4513]/20 flex flex-col items-center justify-center p-4">
                  <div className="absolute inset-2 border border-white/20 rounded-full"></div>
                  <div className="text-[7pt] font-bold text-[#451a03] tracking-[0.15em] uppercase mb-1 leading-none text-center">Lapland AI Lab</div>
                  
                  <div className="w-14 h-14 my-1 opacity-90">
                    <svg viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M50 20V130M50 75L15 40M50 75L85 40M50 75L15 110M50 75L85 110M20 75L80 75" stroke="#451a03" strokeWidth="12" strokeLinecap="round" opacity="0.3"/>
                      <path d="M50 20V130M50 75L15 40M50 75L85 40M50 75L15 110M50 75L85 110M20 75L80 75" stroke="#451a03" strokeWidth="12" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="text-[7pt] font-christmas text-[#451a03] mt-1">OFFICIAL SEAL</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
