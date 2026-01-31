
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
      <style>{`
        @keyframes aurora-subtle {
          0% { background-position: 0% 50%; opacity: 0.3; }
          50% { background-position: 100% 50%; opacity: 0.6; }
          100% { background-position: 0% 50%; opacity: 0.3; }
        }
        .aurora-bg {
          background: linear-gradient(-45deg, #020617, #0f172a, #1e1b4b, #0c0a09, #0f172a);
          background-size: 400% 400%;
          animation: aurora-subtle 20s ease infinite;
        }
        .cert-aurora-glow {
          background: linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.08), rgba(56, 189, 248, 0.08), transparent);
          background-size: 200% 100%;
          animation: aurora-subtle 12s ease-in-out infinite;
        }
        .snowflake-float {
          animation: float 10s ease-in-out infinite;
        }
        .engraved-text {
          text-shadow: -0.5px -0.5px 1px rgba(255, 255, 255, 0.3), 0.5px 0.5px 1px rgba(0, 0, 0, 0.5);
        }
        .raised-seal {
          box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.6), 0 10px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 175, 55, 0.3);
        }
      `}</style>
      <div 
        className="origin-top transition-transform duration-500 print:scale-100 print:transform-none print:m-0"
        style={{ transform: `scale(${scale})` }}
      >
        <div 
          id="certificate-parchment"
          className="relative flex flex-col items-center aurora-bg print:bg-[#020617] overflow-hidden shadow-2xl print:shadow-none"
          style={{
            width: '210mm',
            height: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Subtle Northern Lights Glow Overlay */}
          <div className="absolute inset-0 cert-aurora-glow pointer-events-none"></div>

          {/* Scattered Snow Crystals */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
             <div className="absolute top-10 left-[20%] text-white text-2xl snowflake-float">❄</div>
             <div className="absolute top-40 right-[15%] text-white text-xl snowflake-float" style={{animationDelay: '-2s'}}>❄</div>
             <div className="absolute bottom-60 left-[10%] text-white text-3xl snowflake-float" style={{animationDelay: '-5s'}}>❄</div>
             <div className="absolute bottom-20 right-[25%] text-white text-lg snowflake-float" style={{animationDelay: '-7s'}}>❄</div>
          </div>

          {/* Inner Content Area - Balanced Margins for A4 */}
          <div className="absolute inset-[15mm] parchment-bg flex flex-col items-center overflow-hidden border-[1px] border-[#b8860b]/30">
            
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>

            {/* Elegant Pine Branch Decorations in Corners */}
            {[
              "top-2 left-2",
              "top-2 right-2 rotate-90",
              "bottom-2 left-2 -rotate-90",
              "bottom-2 right-2 rotate-180"
            ].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-40 h-40 p-2 opacity-30 text-[#064e3b]`}>
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10,10 C30,15 45,35 50,60" />
                  <path d="M10,10 C15,30 35,45 60,50" />
                  <path d="M15,15 L25,35 M15,15 L35,25 M20,20 L45,45" />
                  <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                </svg>
              </div>
            ))}

            {/* Double Gold Border */}
            <div className="absolute inset-[6mm] border-[1px] border-[#d4af37] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-[10mm] border-[3px] border-[#d4af37] border-double pointer-events-none opacity-80"></div>
            
            {/* Main Content */}
            <div className="mt-16 text-center z-10 w-full px-12">
               <div className="text-[11pt] tracking-[0.5em] uppercase font-bold text-[#b8860b]/70 mb-2">Heritage of the North Pole</div>
               <h1 className="font-christmas text-[68pt] leading-tight text-[#800000] drop-shadow-sm">
                 {t.certTitle}
               </h1>
               <div className="flex items-center justify-center gap-6 mt-1">
                 <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]"></div>
                 <span className="text-[#b8860b] text-2xl">❆</span>
                 <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]"></div>
               </div>
            </div>

            {/* Portrait Image with Decorative Frame */}
            <div className="mt-6 mb-4 flex-[1.6] w-full px-24 flex flex-col items-center justify-center relative z-10">
              <div className="relative w-full h-full max-h-[140mm] p-5 bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/60">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#fdf9f0] px-4 text-[#d4af37] text-xl">✨</div>
                
                <div className="w-full h-full rounded-[2rem] overflow-hidden border-[6px] border-[#fdf9f0] shadow-inner bg-slate-200">
                   <img 
                     src={imageUrl} 
                     alt="Tonttu Portrait"
                     className="w-full h-full object-cover"
                     loading="eager"
                   />
                </div>
                
                <div className="absolute -bottom-7 left-0 right-0 text-center">
                   <span className="bg-[#800000] px-8 py-2 text-white italic text-xs tracking-[0.4em] uppercase font-bold border-2 border-[#d4af37] rounded-full shadow-lg">
                     {lang === 'FI' ? 'KORVATUNTURI' : 'NORTH POLE'} • {new Date().getFullYear()}
                   </span>
                </div>
              </div>
            </div>

            {/* Certification Text */}
            <div className="text-center px-28 pb-10 z-10 w-full flex-1 flex flex-col justify-center">
              <p className="text-[#475569] italic text-2xl font-serif mb-2 opacity-90">{t.certProof}</p>
              
              <div className="mb-4">
                <h2 className="text-[54pt] leading-none font-christmas text-[#800000] break-words">
                  {name}
                </h2>
                <div className="h-[2px] w-64 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-2"></div>
              </div>

              <div className="space-y-4">
                <p className="font-bold text-[18pt] text-[#0f172a] uppercase tracking-[0.25em] leading-tight">
                  {t.certOfficial}
                </p>
                <p className="text-base leading-relaxed text-slate-600 italic font-serif max-w-lg mx-auto">
                  {t.certExperience}
                </p>
              </div>
            </div>

            {/* Footer with Date and Place */}
            <div className="w-full px-24 pb-14 z-10 flex justify-between items-end">
              <div className="text-left border-l-2 border-[#d4af37] pl-4">
                <p className="text-slate-900 font-bold font-serif text-xl">{date}</p>
                <p className="text-[9pt] uppercase tracking-widest text-slate-500">{t.certPlaceDate}</p>
              </div>

              <div className="text-center bg-[#fdf9f0] px-6 py-2 border border-[#d4af37]/20 rounded-xl">
                <p className="font-christmas text-3xl text-[#8b4513]">{t.certMagicCert}</p>
                <p className="text-[7pt] text-slate-400 font-sans tracking-[0.5em] uppercase opacity-60">
                  ID: ARC-{Math.floor(Math.random() * 900000 + 100000)}
                </p>
              </div>
            </div>

            {/* Official Seal with Ribbons & Premium Engraved Look */}
            <div className="absolute bottom-12 right-12 w-52 h-52 z-50 transform rotate-[-4deg]">
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-3">
                  <div className="w-11 h-28 bg-[#800000] shadow-xl origin-top rotate-[15deg] border-r border-black/10" style={{clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 88%, 0% 100%)'}}></div>
                  <div className="w-11 h-28 bg-[#800000] shadow-xl origin-top -rotate-[15deg] border-l border-black/10" style={{clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 88%, 0% 100%)'}}></div>
               </div>
               <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#92400e] raised-seal border-[4px] border-[#78350f]/30 flex flex-col items-center justify-center p-5">
                  <div className="absolute inset-1 border-[1.5px] border-white/20 rounded-full"></div>
                  <div className="absolute inset-3 border border-[#451a03]/10 rounded-full"></div>
                  
                  <div className="text-[7.5pt] font-extrabold text-[#451a03] tracking-[0.1em] uppercase mb-1 leading-tight text-center engraved-text">Arctic Circle AI Laboratory</div>
                  
                  <div className="w-16 h-16 my-1 opacity-90 text-[#451a03]/80 drop-shadow-md">
                    <svg viewBox="0 0 100 100" fill="currentColor">
                       <path d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z" />
                       <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    </svg>
                  </div>
                  <div className="text-[8pt] font-christmas text-[#451a03] engraved-text font-bold">OFFICIAL SEAL</div>
                  
                  {/* Subtle Metallic Engraving Effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-black/10 pointer-events-none"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
