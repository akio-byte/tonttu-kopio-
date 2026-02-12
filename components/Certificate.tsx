
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Language } from '../types';
import { DICTIONARY } from '../constants';

interface CertificateProps {
  name?: string;
  imageUrl?: string;
  date?: string;
  lang: Language;
}

const Certificate: React.FC<CertificateProps> = ({ 
  name = "", 
  imageUrl = "", 
  date = "",
  lang
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const t = DICTIONARY[lang];
  
  const certificateId = useMemo(() => `ARC-${Math.floor(Math.random() * 900000 + 100000)}`, []);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
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

  const displayName = name || (lang === 'FI' ? "[LISÄÄ NIMI]" : "[ADD NAME]");

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-start print:block print:w-[210mm] print:h-[297mm]">
      <style>{`
        @keyframes aurora-slow {
          0% { background-position: 0% 50%; opacity: 0.4; }
          50% { background-position: 100% 50%; opacity: 0.6; }
          100% { background-position: 0% 50%; opacity: 0.4; }
        }
        .aurora-bg {
          background: linear-gradient(-45deg, #020617, #0f172a, #1e1b4b, #020617);
          background-size: 400% 400%;
          animation: aurora-slow 15s ease infinite;
        }
        .raised-seal {
          box-shadow: 
            inset 0 1px 2px rgba(255, 255, 255, 0.4),
            0 4px 12px rgba(0, 0, 0, 0.5),
            0 0 10px rgba(212, 175, 55, 0.2);
        }
        .engraved {
          text-shadow: 
            -0.5px -0.5px 0.5px rgba(255, 255, 255, 0.2),
            0.5px 0.5px 0.5px rgba(0, 0, 0, 0.4);
        }
      `}</style>
      
      <div 
        className="origin-top transition-transform duration-500 print:scale-100 print:transform-none"
        style={{ transform: `scale(${scale})` }}
      >
        <div 
          id="certificate-parchment"
          className="relative flex flex-col items-center aurora-bg print:bg-[#020617] overflow-hidden"
          style={{
            width: '210mm',
            height: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Subtle Aurora Glow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 via-transparent to-blue-500/5 mix-blend-screen pointer-events-none"></div>

          {/* Inner Content Area - Hardened A4 Layout */}
          <div className="absolute inset-[18mm] parchment-bg flex flex-col items-center overflow-hidden border-[1px] border-[#b8860b]/30">
            
            {/* Paper Fiber Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>

            {/* Corner Pine Branches */}
            {[
              "top-4 left-4",
              "top-4 right-4 rotate-90",
              "bottom-4 left-4 -rotate-90",
              "bottom-4 right-4 rotate-180"
            ].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-44 h-44 opacity-20 text-[#064e3b]`}>
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M10,10 C40,15 60,35 70,60" />
                  <path d="M15,10 L30,40 M20,10 L40,30 M10,15 L40,30" />
                  <circle cx="10" cy="10" r="1" fill="currentColor" />
                </svg>
              </div>
            ))}

            {/* Frame Borders */}
            <div className="absolute inset-[8mm] border border-[#d4af37]/40 pointer-events-none"></div>
            <div className="absolute inset-[11mm] border-[2px] border-[#d4af37]/80 border-double pointer-events-none"></div>
            
            {/* Header */}
            <div className="mt-16 text-center z-10 px-12">
               <div className="text-[10pt] tracking-[0.5em] uppercase font-bold text-[#b8860b]/60 mb-2">Arctic Circle Heritage</div>
               <h1 className="font-christmas text-[64pt] leading-tight text-[#800000] drop-shadow-sm">
                 {t.certTitle}
               </h1>
               <div className="flex items-center justify-center gap-6 mt-1">
                 <div className="w-20 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]/50"></div>
                 <span className="text-[#b8860b] text-xl">❆</span>
                 <div className="w-20 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]/50"></div>
               </div>
            </div>

            {/* Portrait Frame */}
            <div className="mt-8 mb-6 flex-[1.6] w-full px-28 flex flex-col items-center justify-center relative z-10">
              <div className="relative w-full h-full max-h-[135mm] p-6 bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/60">
                <div className="w-full h-full rounded-[2rem] overflow-hidden border-[6px] border-[#fdf9f0] bg-slate-200">
                   {imageUrl ? (
                     <img 
                       src={imageUrl} 
                       alt="Elf"
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-400">
                        [MAGIC PENDING]
                     </div>
                   )}
                </div>
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                   <span className="bg-[#800000] px-10 py-2.5 text-white text-[9pt] tracking-[0.4em] uppercase font-bold border-2 border-[#d4af37] rounded-full shadow-2xl">
                     {lang === 'FI' ? 'TONTTU' : 'ELF'} • {new Date().getFullYear()}
                   </span>
                </div>
              </div>
            </div>

            {/* Body Text */}
            <div className="text-center px-32 pb-12 z-10 w-full flex-1 flex flex-col justify-center">
              <p className="text-[#475569] italic text-2xl font-serif mb-2">{t.certProof}</p>
              
              <div className="mb-4">
                <h2 className="text-[52pt] leading-none font-christmas text-[#800000] drop-shadow-sm min-h-[60pt]">
                  {displayName}
                </h2>
                <div className="h-[2px] w-72 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-2 opacity-50"></div>
              </div>

              <div className="space-y-4">
                <p className="font-bold text-[17pt] text-[#0f172a] uppercase tracking-[0.2em] leading-tight">
                  {t.certOfficial}
                </p>
                <p className="text-sm leading-relaxed text-slate-500 italic font-serif max-w-md mx-auto">
                  {t.certExperience}
                </p>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="w-full px-28 pb-16 z-10 flex justify-between items-end">
              <div className="text-left border-l-2 border-[#d4af37]/30 pl-5">
                <p className="text-slate-900 font-bold font-serif text-xl">{date || "01.12.2024"}</p>
                <p className="text-[8pt] uppercase tracking-widest text-slate-400">{t.certPlaceDate}</p>
              </div>

              <div className="text-center bg-white/30 px-6 py-2 rounded-xl border border-white/50">
                <p className="font-christmas text-3xl text-[#8b4513]">{t.certMagicCert}</p>
                <p className="text-[6pt] text-slate-400 font-sans tracking-[0.4em] uppercase opacity-60">
                  {certificateId}
                </p>
              </div>
            </div>

            {/* Premium Seal */}
            <div className="absolute bottom-16 right-16 w-48 h-48 z-50 transform rotate-[-4deg]">
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                  <div className="w-10 h-24 bg-[#800000] shadow-xl origin-top rotate-[12deg]" style={{clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 90%, 0% 100%)'}}></div>
                  <div className="w-10 h-24 bg-[#800000] shadow-xl origin-top -rotate-[12deg]" style={{clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 90%, 0% 100%)'}}></div>
               </div>
               <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#92400e] raised-seal border-[4px] border-[#78350f]/20 flex flex-col items-center justify-center p-6">
                  <div className="absolute inset-1 border-[1.5px] border-white/20 rounded-full"></div>
                  <div className="text-[6pt] font-extrabold text-[#451a03] tracking-wider uppercase mb-1 leading-tight text-center engraved">Arctic Circle AI Lab</div>
                  <div className="w-14 h-14 my-1 opacity-80 text-[#451a03]">
                    <svg viewBox="0 0 100 100" fill="currentColor">
                       <path d="M50,5 L62,38 L95,38 L68,58 L78,90 L50,70 L22,90 L32,58 L5,38 L38,38 Z" />
                    </svg>
                  </div>
                  <div className="text-[7pt] font-christmas text-[#451a03] font-bold engraved">OFFICIAL SEAL</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
