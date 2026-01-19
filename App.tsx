
import React, { useState, useRef, useEffect } from 'react';
import { AppState, Language, ElfStyle, GroupType, UpscaleLevel } from './types';
import { DICTIONARY } from './constants';
import Snowfall from './components/Snowfall';
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const t = DICTIONARY[lang];

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

  const toggleMusic = () => {
    if (!bgMusicRef.current) return;
    if (bgMusicPlaying) {
      bgMusicRef.current.pause();
    } else {
      bgMusicRef.current.play().catch(() => {});
    }
    setBgMusicPlaying(!bgMusicPlaying);
  };

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
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
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

  const startCamera = async () => {
    setState('camera');
    if (!bgMusicPlaying && bgMusicRef.current) {
      toggleMusic();
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setErrorMsg("Kameraa ei voitu avata. Tarkista luvat laitteen asetuksista.");
      setState('error');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      triggerVibrate();
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        playSound('capture');
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setState('styleSelect');
      }
    }
  };

  const startMagic = async () => {
    if (!capturedImage) return;
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
      if (err?.message?.includes('Requested entity was not found')) {
        setErrorMsg("API-avain täytyy valita uudelleen.");
        setState('keyGate');
      } else if (err?.message?.includes('PERMISSION_DENIED')) {
        setErrorMsg("API-avaimella ei ole oikeuksia. Valitse maksullinen projekti.");
        setState('keyGate');
      } else {
        setErrorMsg("Taika kohtasi odottamattoman esteen. Yritä uudelleen.");
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
      setErrorMsg("Terävöitys epäonnistui. Kokeile myöhemmin uudelleen.");
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
    setState('hero');
    setCurrentResolution('1K');
  };

  const handleDownloadImage = () => {
    if (!resultImage) return;
    triggerVibrate();
    playSound('click');
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `Tonttu_Kuva_${firstName || '2024'}_${currentResolution}.png`;
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
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#fdf9f0',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('certificate-parchment');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`Tonttudiplomi_${firstName || 'Tonttu'}.pdf`);
      playSound('magic');
    } catch (err) {
      console.error('PDF generation failed:', err);
      setErrorMsg("PDF-tiedoston luominen epäonnistui.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (state === 'certificate' && resultImage) {
    return (
      <div className="bg-[#020617] min-h-[100dvh] flex flex-col overflow-x-hidden print:bg-white print:min-h-0 print:overflow-visible">
        <div className="fixed top-4 left-4 right-4 z-50 flex flex-wrap gap-2 justify-between print:hidden">
          <button 
            onClick={() => { triggerVibrate(); playSound('click'); setState('result'); }}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full border border-white/20 backdrop-blur-md transition-all active:scale-95 text-sm font-bold shadow-xl flex items-center gap-2"
          >
            <span>←</span> {lang === 'FI' ? 'Takaisin' : 'Back'}
          </button>
          
          <div className="flex gap-2">
            <button 
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className={`bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-6 py-2.5 rounded-full font-bold shadow-xl transition-all active:scale-95 text-sm flex items-center gap-2 ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
            >
              <span>{isDownloading ? '⏳' : '💾'}</span> {isDownloading ? (lang === 'FI' ? 'Luodaan...' : 'Creating...') : (lang === 'FI' ? 'Lataa PDF' : 'Download PDF')}
            </button>
            <button 
              onClick={() => { triggerVibrate(); playSound('click'); window.print(); }}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-95 text-sm flex items-center gap-2"
            >
               <span>🖨️</span> {t.btnPrint}
            </button>
          </div>
        </div>
        <div className="pt-24 pb-12 flex-1 flex items-start justify-center overflow-x-hidden no-scrollbar print:p-0 print:m-0 print:block">
          <Certificate name={firstName} imageUrl={resultImage} date={new Date().toLocaleDateString(lang === 'FI' ? 'fi-FI' : 'en-US')} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center text-white select-none overflow-x-hidden no-scrollbar">
      <div className="absolute inset-0 z-0 bg-slate-950">
         <img 
            src="https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20"
            alt="Lapland Background"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/90" />
         <Snowfall />
      </div>

      <button 
        onClick={toggleMusic}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 print:hidden"
      >
        {bgMusicPlaying ? '🔊' : '🔇'}
      </button>

      <div className="relative z-20 w-full max-w-4xl px-4 py-8 flex flex-col items-center text-center space-y-6 md:space-y-12 min-h-[100dvh] justify-between">
        <div className={`mt-4 transition-all duration-1000 ${state === 'hero' ? 'translate-y-0 scale-100' : '-translate-y-4 scale-90'}`}>
          <h1 className={`font-christmas text-red-100 drop-shadow-[0_8px_20px_rgba(255,255,255,0.3)] transition-all ${state === 'hero' ? 'text-7xl md:text-9xl' : 'text-5xl md:text-6xl'}`}>
            {t.title}
          </h1>
          {state === 'hero' && (
            <p className="mt-4 text-xl md:text-3xl text-blue-100 opacity-90 animate-pulse font-light tracking-wide">
              {t.subtitle}
            </p>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-center">
          {state === 'hero' && (
            <button onClick={checkApiKeyAndStart} className="group relative focus:outline-none">
              <div className="absolute -inset-10 bg-red-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-full border-4 border-white/20 shadow-[0_0_80px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-90 flex items-center justify-center w-56 h-56 md:w-72 md:h-72 overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-3xl md:text-4xl font-christmas leading-tight px-8 drop-shadow-md">{t.buttonBegin}</span>
              </div>
            </button>
          )}

          {state === 'keyGate' && (
            <div className="bg-slate-900/80 backdrop-blur-3xl p-10 md:p-14 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-500">
              <h2 className="text-4xl font-christmas text-red-100 mb-6">{t.keyGateTitle}</h2>
              <p className="text-blue-100/80 mb-10 leading-relaxed text-lg">
                {errorMsg && <span className="block text-red-400 font-bold mb-4 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{errorMsg}</span>}
                {t.keyGateDesc}
              </p>
              <div className="flex flex-col gap-5">
                <button 
                  onClick={handleOpenKeyPicker} 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-950 py-5 rounded-full font-bold text-2xl font-christmas shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {t.keyGateButton}
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/50 text-sm underline hover:text-white/80 transition-colors"
                >
                  {t.keyGateBillingLink}
                </a>
                <button onClick={reset} className="text-white/40 mt-4 text-sm hover:text-white/70 transition-colors">Takaisin</button>
              </div>
            </div>
          )}

          {state === 'groupSelect' && (
            <div className="bg-slate-900/60 backdrop-blur-3xl p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-2xl w-full max-w-2xl animate-in zoom-in-95">
               <h2 className="text-3xl md:text-5xl font-christmas text-red-100 mb-8">{t.groupSelectTitle}</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
                  <button
                    onClick={() => { triggerVibrate(); playSound('click'); setGroupType('single'); startCamera(); }}
                    className="group relative overflow-hidden rounded-2xl border-2 border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-red-500 hover:scale-[1.02]"
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                    <h3 className="text-2xl font-christmas text-white mb-2">{t.groupSelectSingle}</h3>
                    <p className="text-white/60 text-sm">{t.groupSelectSingleDesc}</p>
                  </button>
                  <button
                    onClick={() => { triggerVibrate(); playSound('click'); setGroupType('group'); startCamera(); }}
                    className="group relative overflow-hidden rounded-2xl border-2 border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-red-500 hover:scale-[1.02]"
                  >
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👥</div>
                    <h3 className="text-2xl font-christmas text-white mb-2">{t.groupSelectGroup}</h3>
                    <p className="text-white/60 text-sm">{t.groupSelectGroupDesc}</p>
                  </button>
               </div>
               <button onClick={reset} className="text-white/40 text-sm underline">Peruuta</button>
            </div>
          )}

          {state === 'camera' && (
            <div className="relative w-full max-w-md md:max-w-2xl aspect-[3/4] md:aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden border-8 border-white/20 shadow-2xl animate-in slide-in-from-bottom-12 duration-700">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute inset-0 pointer-events-none border-[16px] border-white/5"></div>
              <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                <button 
                  onClick={capturePhoto} 
                  className="bg-white text-slate-900 rounded-full p-6 md:p-8 shadow-[0_0_50px_rgba(255,255,255,0.6)] transform transition hover:scale-110 active:scale-75 relative"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 border-[6px] border-red-600 rounded-full"></div>
                  <div className="absolute -inset-2 rounded-full border border-white/40 animate-ping opacity-20"></div>
                </button>
              </div>
              <div className="absolute top-10 left-0 right-0 text-white font-christmas text-2xl tracking-[0.2em] drop-shadow-xl animate-pulse">
                {t.smileText}
              </div>
            </div>
          )}

          {state === 'styleSelect' && capturedImage && (
            <div className="bg-slate-900/60 backdrop-blur-3xl p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-2xl w-full max-w-2xl animate-in zoom-in-95">
               <h2 className="text-3xl md:text-5xl font-christmas text-red-100 mb-8">{t.selectStyleTitle}</h2>
               <div className="grid grid-cols-2 gap-4 md:gap-6 mb-10">
                  {(['classic', 'frost', 'forest', 'royal'] as ElfStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => { triggerVibrate(); playSound('click'); setSelectedStyle(style); }}
                      className={`relative overflow-hidden rounded-2xl border-4 transition-all duration-300 p-4 md:p-6 flex flex-col items-center justify-center gap-2 group ${selectedStyle === style ? 'border-yellow-400 bg-white/20 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
                    >
                      <span className="text-3xl md:text-4xl">
                        {style === 'classic' && '🎅'}
                        {style === 'frost' && '❄️'}
                        {style === 'forest' && '🌲'}
                        {style === 'royal' && '👑'}
                      </span>
                      <span className="font-christmas text-xl md:text-2xl tracking-wide">{t[`style${style.charAt(0).toUpperCase() + style.slice(1)}` as keyof typeof t]}</span>
                      {selectedStyle === style && <div className="absolute top-2 right-2 text-yellow-400">✨</div>}
                    </button>
                  ))}
               </div>
               <button 
                 onClick={startMagic} 
                 className="bg-gradient-to-r from-red-600 to-red-800 text-white w-full py-5 rounded-full font-bold text-2xl md:text-3xl font-christmas shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 <span>✨</span> {t.btnStartMagic}
               </button>
               <button onClick={reset} className="text-white/40 mt-6 text-sm underline">Takaisin alkuun</button>
            </div>
          )}

          {(state === 'magic' || isUpscaling) && (
            <div className="flex flex-col items-center space-y-10 px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 blur-[80px] opacity-40 animate-pulse"></div>
                <div className="relative w-40 h-40 flex items-center justify-center">
                   <div className="absolute inset-0 border-4 border-dashed border-white/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                   <div className="absolute inset-4 border-4 border-dashed border-yellow-400/40 rounded-full animate-[spin_4s_linear_infinite_reverse]"></div>
                   <div className="text-8xl md:text-9xl animate-[spin_6s_linear_infinite] drop-shadow-2xl">❄️</div>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-christmas text-red-200 drop-shadow-lg">
                  {isUpscaling ? t.upscalingText : t.processing}
                </h2>
                <p className="italic text-blue-100/70 text-lg md:text-xl animate-pulse font-light max-w-md">
                   {t.processingSub}
                </p>
              </div>
            </div>
          )}

          {state === 'result' && resultImage && !isUpscaling && (
            <div className="flex flex-col items-center space-y-8 w-full max-w-md md:max-w-2xl animate-in zoom-in-95 duration-1000 px-2">
              {!showNameInput ? (
                <>
                  <div className="relative group">
                    <div className="absolute -inset-8 bg-yellow-500/20 blur-[100px] rounded-full animate-pulse"></div>
                    <div className="relative p-2 bg-gradient-to-br from-red-600 via-yellow-400 to-red-800 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.7)] magic-aura overflow-hidden">
                      <img 
                        src={resultImage} 
                        alt="Elf Result" 
                        className="rounded-[2rem] md:rounded-[3rem] w-full h-auto max-h-[60vh] object-contain mx-auto transition-transform group-hover:scale-[1.01] duration-700" 
                      />
                      <div className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold text-yellow-400 shadow-xl">
                        {currentResolution}
                      </div>
                    </div>
                  </div>

                  {/* Upscale Options */}
                  {currentResolution !== '4K' && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 w-full max-w-lg flex flex-col items-center gap-4">
                       <h4 className="text-yellow-400 font-christmas text-2xl">✨ {t.btnUpscale}</h4>
                       <div className="flex gap-4 w-full">
                          {(['2K', '4K'] as UpscaleLevel[]).map(res => (
                            (res === '2K' && currentResolution === '1K') || (res === '4K') ? (
                              <button 
                                key={res}
                                onClick={() => handleUpscale(res)}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold border border-white/20 transition-all active:scale-95"
                              >
                                {res}
                              </button>
                            ) : null
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 w-full px-8">
                    <button 
                      onClick={() => { triggerVibrate(); playSound('click'); setShowNameInput(true); }} 
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-950 w-full py-5 rounded-full font-bold text-2xl md:text-3xl font-christmas shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <span>📜</span> {t.btnCreateCert}
                    </button>
                    <button 
                      onClick={handleDownloadImage}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 w-full py-5 rounded-full font-bold text-xl font-christmas hover:bg-white/20 active:scale-95 transition-all text-white/90 flex items-center justify-center gap-3"
                    >
                      <span>💾</span> {t.btnDownloadImage}
                    </button>
                    <button 
                      onClick={reset} 
                      className="bg-white/5 w-full py-4 rounded-full font-bold text-lg font-christmas hover:bg-white/10 active:scale-95 transition-all text-white/40"
                    >
                      {t.backHome}
                    </button>
                  </div>
                </>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); if(firstName.trim()) { triggerVibrate(); playSound('click'); setState('certificate'); } }} 
                  className="bg-slate-900/80 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] border border-white/20 shadow-2xl w-full max-w-md mx-auto animate-in slide-in-from-bottom-12 duration-500"
                >
                  <h3 className="text-4xl md:text-5xl font-christmas text-red-100 mb-10 leading-tight">{t.btnCreateCert}</h3>
                  <div className="relative mb-10">
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      placeholder={groupType === 'single' ? t.inputNamePlaceholder : t.inputGroupNamePlaceholder} 
                      className="w-full bg-white/5 border-2 border-white/20 rounded-2xl px-8 py-5 text-2xl text-center focus:border-yellow-400 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 text-white font-christmas tracking-widest" 
                      autoFocus 
                    />
                  </div>
                  <div className="flex gap-5">
                    <button 
                      type="submit" 
                      disabled={!firstName.trim()} 
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-800 disabled:opacity-30 text-white py-5 rounded-full font-bold text-2xl active:scale-95 shadow-xl font-christmas tracking-widest"
                    >
                      {lang === 'FI' ? 'Jatka' : 'Continue'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { triggerVibrate(); playSound('click'); setShowNameInput(false); }} 
                      className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl hover:bg-white/20 transition-all active:scale-90"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {state === 'error' && (
            <div className="text-center space-y-10 px-8 animate-in zoom-in-95 duration-500">
              <div className="text-8xl md:text-9xl drop-shadow-2xl">❄️</div>
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-christmas text-red-200 leading-relaxed">{errorMsg || t.errorTitle}</h2>
                <button 
                  onClick={reset} 
                  className="bg-white/10 backdrop-blur-md border border-white/20 px-12 py-5 rounded-full font-bold text-2xl active:scale-95 transition-all hover:bg-white/20 font-christmas"
                >
                  {t.errorAction}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-8 pb-10">
          <div className="flex gap-6">
            {['FI', 'EN'].map(l => (
              <button 
                key={l} 
                onClick={() => { triggerVibrate(); playSound('click'); setLang(l as Language); }} 
                className={`w-14 h-14 rounded-full border-2 transition-all flex items-center justify-center font-bold text-lg shadow-xl ${lang === l ? 'bg-red-600 border-red-400 scale-110' : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-xs md:text-sm opacity-50 tracking-[0.4em] font-medium uppercase px-4 text-center max-w-xs md:max-w-none">
            {t.footerText}
          </p>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
