
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, Language, ElfStyle, GroupType, UpscaleLevel } from './types';
import { DICTIONARY } from './constants';
import Snowfall from './components/Snowfall';
import Aurora from './components/Aurora';
import Certificate from './components/Certificate';
import { transformToElf, upscalePortrait } from './services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

declare global {
  var aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('hero');
  const [lang, setLang] = useState<Language>('FI');
  const [firstName, setFirstName] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<ElfStyle>('classic');
  const [groupType, setGroupType] = useState<GroupType>('single');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [bgMusicPlaying, setBgMusicPlaying] = useState(false);
  const [currentResolution, setCurrentResolution] = useState<UpscaleLevel>('1K');
  const [certDate, setCertDate] = useState<string>(new Date().toLocaleDateString('fi-FI'));
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const t = DICTIONARY[lang];

  // Lifecycle & Music
  useEffect(() => {
    bgMusicRef.current = new Audio('https://www.soundjay.com/nature/sounds/wind-chime-1.mp3');
    if (bgMusicRef.current) {
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.15;
    }
    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  const toggleMusic = useCallback(() => {
    if (!bgMusicRef.current) return;
    if (bgMusicPlaying) {
      bgMusicRef.current.pause();
    } else {
      bgMusicRef.current.play().catch(() => {});
    }
    setBgMusicPlaying(!bgMusicPlaying);
  }, [bgMusicPlaying]);

  const playSound = (type: 'capture' | 'magic' | 'hohoho' | 'click') => {
    const urls = {
      capture: 'https://www.soundjay.com/mechanical/camera-shutter-click-08.mp3',
      magic: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3',
      hohoho: 'https://www.soundjay.com/human/sounds/laughter-2.mp3',
      click: 'https://www.soundjay.com/buttons/sounds/button-3.mp3'
    };
    try {
      const audio = new Audio(urls[type]);
      audio.volume = type === 'hohoho' ? 0.6 : 0.4;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const triggerVibrate = () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  // State Transitions & Logic
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setErrorMsg('');
    setState('camera');
    if (!bgMusicPlaying && bgMusicRef.current) toggleMusic();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access denied:", err);
      setErrorMsg(lang === 'FI' 
        ? "Kameraa ei voitu avata. Tarkista, että olet antanut selaimelle luvan käyttää kameraa." 
        : "Could not access camera. Please check your browser permissions.");
      setState('error');
    }
  };

  const checkApiKeyAndStart = async () => {
    triggerVibrate();
    playSound('click');
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      setState('keyGate');
    } else {
      setState('groupSelect');
    }
  };

  const handleOpenKeyPicker = async () => {
    await window.aistudio.openSelectKey();
    setState('groupSelect');
  };

  const toggleCamera = () => {
    triggerVibrate();
    playSound('click');
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      triggerVibrate();
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Use video's actual dimensions for best quality
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setCapturedImage(dataUrl);
        playSound('capture');
        stopCamera();
        setState('styleSelect');
      }
    }
  };

  const startMagic = async () => {
    if (!capturedImage) return;
    triggerVibrate();
    playSound('magic');
    setState('magic');
    setIsProcessing(true);
    setCurrentResolution('1K');
    try {
      const transformed = await transformToElf(capturedImage, selectedStyle, groupType);
      setResultImage(transformed);
      playSound('magic');
      setTimeout(() => playSound('hohoho'), 800);
      setState('result');
    } catch (err: any) {
      console.error("Magic generation error:", err);
      if (err?.message?.includes('Requested entity was not found')) {
        setErrorMsg(lang === 'FI' ? "API-avain täytyy valita uudelleen." : "API Key needs to be reselected.");
        setState('keyGate');
      } else {
        setErrorMsg(lang === 'FI' ? "Taika epäonnistui. Yritä uudelleen." : "Magic failed. Please try again.");
        setState('error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpscale = async (level: UpscaleLevel) => {
    if (!resultImage || isUpscaling) return;
    triggerVibrate();
    playSound('magic');
    setIsUpscaling(true);
    try {
      const enhanced = await upscalePortrait(resultImage, selectedStyle, level);
      setResultImage(enhanced);
      setCurrentResolution(level);
      playSound('magic');
    } catch (err: any) {
      console.error("Upscale failed:", err);
      // Don't shift state to error, just notify
      alert(lang === 'FI' ? "Terävöitys epäonnistui." : "Upscaling failed.");
    } finally {
      setIsUpscaling(false);
    }
  };

  const reset = () => {
    triggerVibrate();
    playSound('click');
    setCapturedImage(null);
    setResultImage(null);
    setFirstName('');
    setShowNameInput(false);
    setErrorMsg('');
    setState('hero');
    setCurrentResolution('1K');
    stopCamera();
  };

  // Added handleDownloadImage to fix the reference error on line 506.
  const handleDownloadImage = () => {
    if (!resultImage) return;
    triggerVibrate();
    playSound('click');
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `Tonttu_${firstName || 'Portretti'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('certificate-parchment');
    if (!element) return;
    
    setIsDownloading(true);
    triggerVibrate();
    playSound('click');

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Balanced for quality vs memory
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#020617',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`Tonttudiplomi_${firstName || 'Tonttu'}.pdf`);
      playSound('magic');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(lang === 'FI' ? "PDF-luonti epäonnistui." : "PDF generation failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- RENDERING ---

  if (state === 'certificate' && resultImage) {
    return (
      <div className="relative bg-[#020617] min-h-[100dvh] flex flex-col print:bg-white print:min-h-0 overflow-x-hidden">
        {/* Background Visuals for Certificate State */}
        <div className="fixed inset-0 z-0 overflow-hidden no-print">
           <Aurora />
           <Snowfall />
        </div>

        <div className="relative z-10 fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 p-3 flex flex-col md:flex-row gap-3 justify-between items-center print:hidden">
          <div className="flex gap-3 items-center w-full md:w-auto">
            <button 
              onClick={() => { triggerVibrate(); playSound('click'); setState('result'); }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 transition-all active:scale-95 text-xs font-bold"
            >
              ← {lang === 'FI' ? 'Muokkaa kuvaa' : 'Edit Photo'}
            </button>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              placeholder={t.inputNamePlaceholder} 
              className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-400 focus:bg-white/10 outline-none w-full md:w-48 font-christmas tracking-widest"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className={`flex-1 md:flex-none bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-5 py-2 rounded-full font-bold shadow-xl transition-all active:scale-95 text-xs flex items-center justify-center gap-2 ${isDownloading ? 'opacity-50' : ''}`}
            >
              <span>{isDownloading ? '⏳' : '💾'}</span> {isDownloading ? '...' : (lang === 'FI' ? 'Lataa PDF' : 'Download PDF')}
            </button>
            <button 
              onClick={() => { triggerVibrate(); playSound('click'); window.print(); }}
              className="flex-1 md:flex-none bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full font-bold shadow-xl transition-all active:scale-95 text-xs flex items-center justify-center gap-2"
            >
               <span>🖨️</span> {t.btnPrint}
            </button>
          </div>
        </div>

        <div className="relative z-10 pt-36 md:pt-24 pb-12 flex-1 flex items-start justify-center print:p-0">
          <Certificate name={firstName} imageUrl={resultImage} date={certDate} lang={lang} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center text-white select-none bg-slate-950 overflow-x-hidden">
      {/* Visual Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <img 
            src="https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20"
            alt=""
         />
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />
         <Aurora />
         <Snowfall />
      </div>

      <button 
        onClick={toggleMusic}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
      >
        {bgMusicPlaying ? '🔊' : '🔇'}
      </button>

      <div className="relative z-20 w-full max-w-4xl px-4 py-6 flex flex-col items-center justify-between min-h-[100dvh]">
        {/* Header */}
        <div className={`mt-4 transition-all duration-700 ${state === 'hero' ? 'scale-100' : 'scale-90 opacity-60'}`}>
          <h1 className="font-christmas text-red-100 text-5xl md:text-8xl drop-shadow-2xl">
            {t.title}
          </h1>
          {state === 'hero' && (
            <p className="mt-2 text-lg md:text-2xl text-blue-100 opacity-80 animate-pulse font-light tracking-widest">
              {t.subtitle}
            </p>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center py-8">
          {state === 'hero' && (
            <button onClick={checkApiKeyAndStart} className="group relative">
              <div className="absolute -inset-10 bg-red-600 rounded-full blur-[60px] opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative bg-gradient-to-br from-red-600 to-red-800 text-white font-bold rounded-full border-4 border-white/10 shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center w-52 h-52 md:w-64 md:h-64">
                <span className="text-2xl md:text-3xl font-christmas px-6 text-center">{t.buttonBegin}</span>
              </div>
            </button>
          )}

          {state === 'keyGate' && (
            <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-2xl max-sm w-full text-center">
              <h2 className="text-2xl font-christmas text-red-100 mb-4">{t.keyGateTitle}</h2>
              <p className="text-sm text-blue-100/70 mb-8">{t.keyGateDesc}</p>
              <button 
                onClick={handleOpenKeyPicker} 
                className="w-full bg-yellow-500 text-slate-950 py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t.keyGateButton}
              </button>
              <button onClick={reset} className="mt-4 text-xs text-white/30 hover:underline">Takaisin</button>
            </div>
          )}

          {state === 'groupSelect' && (
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => { setGroupType('single'); setFacingMode('user'); startCamera('user'); }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all text-center group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                <h3 className="text-xl font-christmas mb-1">{t.groupSelectSingle}</h3>
                <p className="text-xs text-white/40">{t.groupSelectSingleDesc}</p>
              </button>
              <button
                onClick={() => { setGroupType('group'); setFacingMode('environment'); startCamera('environment'); }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all text-center group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👥</div>
                <h3 className="text-xl font-christmas mb-1">{t.groupSelectGroup}</h3>
                <p className="text-xs text-white/40">{t.groupSelectGroupDesc}</p>
              </button>
            </div>
          )}

          {state === 'camera' && (
            <div className="relative w-full max-w-2xl aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
              />
              <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5"></div>
              
              <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6">
                <button 
                  onClick={toggleCamera} 
                  className="bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full p-4 hover:bg-white/20 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button 
                  onClick={capturePhoto} 
                  className="bg-white text-slate-900 rounded-full p-1 shadow-2xl hover:scale-105 active:scale-90 transition-all"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-red-600 rounded-full bg-transparent flex items-center justify-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-red-600 rounded-full"></div>
                  </div>
                </button>
                <button onClick={reset} className="bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full p-4 hover:bg-white/20">
                  <span className="text-sm font-bold">✕</span>
                </button>
              </div>
            </div>
          )}

          {state === 'styleSelect' && capturedImage && (
            <div className="w-full max-w-xl flex flex-col items-center">
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                {(['classic', 'frost', 'forest', 'royal'] as ElfStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`relative p-6 rounded-2xl border-2 transition-all text-center ${selectedStyle === style ? 'border-yellow-400 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    <span className="text-3xl block mb-2">
                      {style === 'classic' && '🎅'}
                      {style === 'frost' && '❄️'}
                      {style === 'forest' && '🌲'}
                      {style === 'royal' && '👑'}
                    </span>
                    <span className="font-christmas text-lg">{t[`style${style.charAt(0).toUpperCase() + style.slice(1)}` as keyof typeof t]}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={startMagic} 
                className="w-full bg-red-600 py-5 rounded-full font-bold text-2xl font-christmas shadow-xl hover:bg-red-500 transition-all active:scale-95"
              >
                {t.btnStartMagic} ✨
              </button>
            </div>
          )}

          {(isProcessing || isUpscaling) && (
            <div className="flex flex-col items-center text-center px-4 max-w-sm">
              <div className="w-24 h-24 relative mb-8">
                <div className="absolute inset-0 border-4 border-yellow-400/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">❄️</div>
              </div>
              <h2 className="text-2xl font-christmas text-red-100 mb-2">
                {isUpscaling ? t.upscalingText : t.processing}
              </h2>
              <p className="text-sm text-blue-100/60 italic leading-relaxed">
                {t.processingSub}
              </p>
            </div>
          )}

          {state === 'result' && resultImage && !isProcessing && !isUpscaling && (
            <div className="w-full max-w-xl flex flex-col items-center space-y-6">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-4 border-white/10">
                <img src={resultImage} className="w-full h-auto" alt="Result" />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-white/20">
                  {currentResolution}
                </div>
              </div>
              
              <div className="w-full grid grid-cols-1 gap-3 px-4">
                <button 
                  onClick={() => setState('certificate')}
                  className="bg-yellow-500 text-slate-950 py-4 rounded-full font-bold text-xl font-christmas shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  📜 {t.btnCreateCert}
                </button>
                
                {currentResolution !== '4K' && (
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => handleUpscale('2K')}
                      disabled={currentResolution === '2K'}
                      className="flex-1 bg-white/10 py-3 rounded-full text-xs font-bold border border-white/10 hover:bg-white/20 transition-all"
                    >
                      ✨ {t.btnUpscale} (2K)
                    </button>
                    <button 
                      onClick={() => handleUpscale('4K')}
                      className="flex-1 bg-white/10 py-3 rounded-full text-xs font-bold border border-white/10 hover:bg-white/20 transition-all"
                    >
                      ✨ {t.btnUpscale} (4K)
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={handleDownloadImage}
                  className="text-white/40 text-sm hover:text-white/80 transition-colors"
                >
                  {t.btnDownloadImage}
                </button>
                <button onClick={reset} className="text-white/20 text-xs mt-4">Uusi matka</button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center p-8 bg-red-950/20 rounded-2xl border border-red-500/20 max-w-sm">
              <h2 className="text-xl font-christmas mb-4">{errorMsg || t.errorTitle}</h2>
              <button onClick={reset} className="bg-white/10 px-8 py-3 rounded-full text-sm font-bold hover:bg-white/20 transition-all">
                {t.errorAction}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex gap-4">
            {['FI', 'EN'].map(l => (
              <button 
                key={l} 
                onClick={() => setLang(l as Language)} 
                className={`w-10 h-10 rounded-full border text-xs font-bold transition-all ${lang === l ? 'bg-red-600 border-red-400' : 'bg-white/5 border-white/10 opacity-40'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-[10px] opacity-30 tracking-[0.4em] uppercase">{t.footerText}</p>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
