
import React, { useState, useEffect } from 'react';
import { Lesson, Question, LessonType } from '../types';

interface LessonViewProps {
  lesson: Lesson;
  currentGems: number;
  currentHearts: number;
  onUpdateProgress: (hearts: number, gemsSpent: number) => void;
  onClose: () => void;
  onFinish: (xp: number, remainingHearts: number) => void;
}

// === COMPONENTE DE TRANSIÇÃO (SCAN) ===
const LessonIntro = ({ prompt, onComplete }: { prompt: string, onComplete: () => void }) => {
    const [phase, setPhase] = useState<'scan' | 'found' | 'exit'>('scan');
    
    // Tenta extrair informações do paciente do prompt da questão
    // Ex: "Paciente: Homem, 24 anos. Queixa..." -> "HOMEM, 24 ANOS"
    const patientInfo = prompt.split('.')[0].replace('Paciente:', '').trim().toUpperCase() || "PACIENTE DESCONHECIDO";

    useEffect(() => {
        // Sequência de animação
        const t1 = setTimeout(() => setPhase('found'), 1800); // 1.8s Escaneando
        const t2 = setTimeout(() => setPhase('exit'), 2800);  // +1.0s Exibindo dados
        const t3 = setTimeout(onComplete, 3300);              // +0.5s Fade out

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onComplete]);

    if (phase === 'exit') {
        return (
            <div className="fixed inset-0 z-[300] bg-[#020617] zoom-out-fade flex items-center justify-center pointer-events-none">
                 <div className="text-[#58cc02] font-mono font-black text-2xl tracking-[0.5em] border-2 border-[#58cc02] px-8 py-4 bg-[#58cc02]/10">
                    CONEXÃO ESTABELECIDA
                 </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[300] bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-mono cursor-wait">
            {/* Background Grid em movimento */}
            <div className="absolute inset-0 opacity-20 animate-grid-scroll" 
                style={{ 
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(88, 204, 2, .3) 25%, rgba(88, 204, 2, .3) 26%, transparent 27%, transparent 74%, rgba(88, 204, 2, .3) 75%, rgba(88, 204, 2, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(88, 204, 2, .3) 25%, rgba(88, 204, 2, .3) 26%, transparent 27%, transparent 74%, rgba(88, 204, 2, .3) 75%, rgba(88, 204, 2, .3) 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px'
                }}>
            </div>
            
            {/* Feixe de Scan */}
            <div className="scan-beam"></div>

            {/* Container Central */}
            <div className="relative z-10 w-full max-w-lg p-8 border-x-2 border-[#58cc02]/30 bg-[#020617]/80 backdrop-blur-sm text-center">
                
                <div className="flex justify-between text-[#58cc02]/60 text-xs mb-8 tracking-widest">
                    <span>SYS.MONITOR.V2</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                </div>

                <div className="mb-8 relative h-32 border border-[#58cc02]/20 rounded-lg overflow-hidden bg-black/40">
                    {/* ECG Line falsa animada */}
                    <svg viewBox="0 0 400 100" className="w-full h-full opacity-80">
                         <path 
                            d="M0,50 L20,50 L30,20 L40,80 L50,50 L350,50 L360,20 L370,80 L380,50 L400,50" 
                            fill="none" stroke="#58cc02" strokeWidth="2"
                            className="ecg-path"
                            style={{ animationDuration: '1s' }}
                         />
                    </svg>
                    <div className="absolute top-2 right-2 text-[#58cc02] text-xs blink">LIVE</div>
                </div>

                <div className="space-y-2">
                    <p className="text-[#1cb0f6] text-sm tracking-widest animate-pulse">
                        {phase === 'scan' ? 'BUSCANDO SINAL...' : 'SINAL LOCALIZADO'}
                    </p>
                    
                    <h2 className={`text-3xl font-black text-white transition-all duration-500 ${phase === 'found' ? 'opacity-100 scale-100' : 'opacity-50 blur-sm scale-95'}`}>
                        {phase === 'found' ? patientInfo : 'ANALISANDO DADOS...'}
                    </h2>
                    
                    {phase === 'found' && (
                        <div className="flex justify-center gap-4 mt-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
                             <span className="px-2 py-1 bg-[#58cc02]/20 text-[#58cc02] text-xs rounded border border-[#58cc02]/40">LEADS: OK</span>
                             <span className="px-2 py-1 bg-[#58cc02]/20 text-[#58cc02] text-xs rounded border border-[#58cc02]/40">ARTIFACTS: NONE</span>
                        </div>
                    )}
                </div>

            </div>

            <div className="absolute bottom-10 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-[#58cc02] shadow-[0_0_10px_#58cc02]" style={{ width: phase === 'scan' ? '40%' : '100%', transition: 'width 1s ease-out' }}></div>
            </div>

        </div>
    );
};


const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  currentGems, 
  currentHearts, 
  onUpdateProgress,
  onClose, 
  onFinish 
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(currentHearts);
  const [gems, setGems] = useState(currentGems);
  const [combo, setCombo] = useState(0); // Combo Counter
  
  // Power-up States
  const [excludedOptions, setExcludedOptions] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);

  const [shake, setShake] = useState(false);
  const [victoryState, setVictoryState] = useState<'none' | 'seal' | 'transition'>('none');
  
  // Reset state when lesson changes or question advances
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setExcludedOptions([]);
    setShowHint(false);
  }, [currentIndex, lesson]);

  const currentQuestion = lesson.questions[currentIndex];
  const progress = ((currentIndex) / lesson.questions.length) * 100;
  const isVisualChoice = currentQuestion.type === LessonType.VISUAL_CHOICE;

  // Power-up Logic
  const COST_5050 = 100;
  const COST_HINT = 50;

  const buy5050 = () => {
    if (gems < COST_5050 || excludedOptions.length > 0) return;
    
    // Find wrong options
    let wrongs: string[] = [];
    if (isVisualChoice && currentQuestion.visualOptions) {
        wrongs = currentQuestion.visualOptions.filter(o => o !== currentQuestion.correctAnswer);
    } else if (currentQuestion.options) {
        wrongs = currentQuestion.options.filter(o => o !== currentQuestion.correctAnswer);
    }

    // Shuffle and pick half
    wrongs.sort(() => 0.5 - Math.random());
    const toExclude = wrongs.slice(0, Math.ceil(wrongs.length / 2));
    
    setExcludedOptions(toExclude);
    setGems(prev => prev - COST_5050);
    onUpdateProgress(hearts, COST_5050); // Sync global immediately
  };

  const buyHint = () => {
      if (gems < COST_HINT || showHint) return;
      setShowHint(true);
      setGems(prev => prev - COST_HINT);
      onUpdateProgress(hearts, COST_HINT);
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    
    let correct = false;
    if (Array.isArray(currentQuestion.correctAnswer)) {
        correct = currentQuestion.correctAnswer.includes(selectedOption);
    } else {
        correct = currentQuestion.correctAnswer === selectedOption;
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      // COMBO LOGIC
      const newCombo = combo + 1;
      setCombo(newCombo);
      
      // Heart Restoration on 3-streak
      if (newCombo % 3 === 0 && hearts < 5) {
          setHearts(h => h + 1);
          // Pequena notificação visual pode ser adicionada aqui
      }
      onUpdateProgress(hearts < 5 && newCombo % 3 === 0 ? hearts + 1 : hearts, 0);

    } else {
      setCombo(0); // Break streak
      const newHearts = Math.max(0, hearts - 1);
      setHearts(newHearts);
      onUpdateProgress(newHearts, 0);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (newHearts === 0) {
          alert("GAME OVER! (Lógica de game over simplificada)");
          onClose(); // Ou redirecionar para tela de compra de vidas
          return;
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < lesson.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setVictoryState('seal');
      // @ts-ignore
      if (typeof confetti !== 'undefined') {
        // @ts-ignore
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#1cb0f6', '#58cc02', '#ffc800', '#ff4b4b']
        });
      }

      setTimeout(() => {
        setVictoryState('transition');
      }, 2500);

      setTimeout(() => {
        onFinish(100, hearts);
      }, 4000);
    }
  };

  // === RENDER INTRO OVERLAY ===
  if (showIntro) {
      return <LessonIntro prompt={lesson.questions[0].prompt} onComplete={() => setShowIntro(false)} />;
  }

  if (victoryState === 'seal') {
    return (
      <div className="fixed inset-0 bg-white z-[300] flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#ddf4ff_0%,transparent_70%)] animate-pulse"></div>
        <div className="text-center victory-seal-impact relative z-10">
          <div className="w-72 h-72 md:w-96 md:h-96 bg-white rounded-[60px] shadow-[0_30px_100px_rgba(28,176,246,0.3)] flex flex-col items-center justify-center border-b-[16px] border-[#e5e5e5] mb-10 relative shine-effect overflow-hidden">
             <div className="w-32 h-32 bg-[#1cb0f6] rounded-[36px] flex items-center justify-center text-white text-7xl shadow-[0_12px_0_0_#1899d6] mb-8">
                <i className="fa-solid fa-brain"></i>
             </div>
             <h2 className="text-4xl font-black text-[#1cb0f6] mb-1 tracking-tighter">MEDCORTEX</h2>
             <h3 className="text-2xl font-black text-[#ff4b4b] tracking-[0.4em] uppercase">ONE</h3>
             <div className="mt-8 bg-[#58cc02] text-white px-10 py-3 rounded-full font-black text-sm tracking-widest shadow-lg">
                BATALHA VENCIDA
             </div>
          </div>
          <p className="text-[#3c3c3c] text-4xl font-black uppercase tracking-tighter drop-shadow-sm">Módulo Concluído!</p>
        </div>
      </div>
    );
  }

  // ... (Transition code remains same) ...
    if (victoryState === 'transition') {
    return (
      <div className="fixed inset-0 bg-[#1cb0f6] z-[400] flex items-center justify-center overflow-hidden">
         <div className="logo-transition-active">
            <div className="w-48 h-48 bg-white rounded-[40px] flex flex-col items-center justify-center shadow-2xl">
                <i className="fa-solid fa-brain text-[#1cb0f6] text-7xl mb-2"></i>
                <div className="text-[#1cb0f6] font-black text-xs tracking-widest uppercase">MEDCORTEX</div>
            </div>
         </div>
         <div className="absolute bottom-20 text-white font-black text-xl tracking-widest animate-pulse">
            PREPARANDO PRÓXIMA FASE...
         </div>
      </div>
    );
  }

  // Componente de Grid Médico para reutilizar
  const ECGGrid = () => (
    <defs>
        <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,50,50,0.15)" strokeWidth="0.5"/>
        </pattern>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#smallGrid)"/>
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,50,50,0.3)" strokeWidth="1"/>
        </pattern>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
  );

  const ecgPathD = currentQuestion.ecgPathData || "";

  return (
    <div className={`fixed inset-0 bg-white z-[200] flex flex-col ${shake ? 'animate-shake' : ''}`}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-15px); }
          40% { transform: translateX(15px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>

      {/* Header */}
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 flex items-center gap-4 md:gap-6 flex-shrink-0 relative">
        <button onClick={onClose} className="text-[#afafaf] hover:text-[#4b4b4b] transition-colors p-2">
          <i className="fa-solid fa-xmark text-3xl font-black"></i>
        </button>
        <div className="flex-1 h-6 bg-[#e5e5e5] rounded-full overflow-hidden border-2 border-gray-100 relative shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[#58cc02] to-[#73eb12] transition-all duration-700 rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-[shine_2s_infinite]"></div>
          </div>
        </div>
        
        {/* Gems Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl border border-gray-200">
           <i className="fa-solid fa-gem text-[#1cb0f6]"></i>
           <span className="font-black text-[#1cb0f6]">{gems}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 px-4 py-2 bg-[#ffeded] rounded-full border-2 border-[#ffdbdb] shadow-sm relative overflow-hidden transition-all duration-300">
          <i className={`fa-solid fa-heart text-[#ff4b4b] text-lg md:text-xl ${hearts <= 1 ? 'animate-pulse' : ''}`}></i>
          <span className="text-[#ff4b4b] font-black text-lg md:text-xl">{hearts}</span>
          
          {/* Combo Indicator */}
          {combo > 1 && (
              <div className="absolute -top-1 -right-1 bg-[#ffc800] text-white text-[10px] font-black px-1.5 rounded-full animate-bounce">
                  x{combo}
              </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 flex flex-col items-center overflow-y-auto overflow-x-hidden relative">
          
          {/* POWER UPS BAR (Acima do monitor) */}
          {!isAnswered && (
             <div className="w-full flex justify-end gap-3 mb-2 px-2">
                <button 
                  onClick={buy5050}
                  disabled={gems < COST_5050 || excludedOptions.length > 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all
                    ${gems >= COST_5050 && excludedOptions.length === 0 
                      ? 'bg-[#1cb0f6] text-white shadow-[0_4px_0_0_#1899d6] active:translate-y-1 active:shadow-none' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                >
                    <i className="fa-solid fa-bolt"></i> 50/50 <span className="text-[10px] opacity-80">({COST_5050})</span>
                </button>
                <button 
                  onClick={buyHint}
                  disabled={gems < COST_HINT || showHint}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all
                    ${gems >= COST_HINT && !showHint 
                      ? 'bg-[#58cc02] text-white shadow-[0_4px_0_0_#46a302] active:translate-y-1 active:shadow-none' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                >
                    <i className="fa-solid fa-user-doctor"></i> Dica <span className="text-[10px] opacity-80">({COST_HINT})</span>
                </button>
             </div>
          )}

          {/* Hint Display */}
          {showHint && (
             <div className="w-full mb-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-[#ddf4ff] border-2 border-[#84d8ff] text-[#1cb0f6] p-4 rounded-2xl flex items-start gap-4">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-user-doctor text-xl"></i>
                   </div>
                   <div>
                      <p className="font-black text-xs uppercase tracking-widest opacity-60">Consultoria Especializada</p>
                      <p className="font-bold text-lg leading-tight">{currentQuestion.hint}</p>
                   </div>
                </div>
             </div>
          )}

          {/* MONITOR PRINCIPAL (Se não for visual choice) */}
          {!isVisualChoice && (
            <div className="mb-6 p-1 bg-[#fff0f0] rounded-[24px] md:rounded-[32px] relative h-48 md:h-64 w-full flex-shrink-0 flex items-center justify-center shadow-inner overflow-hidden border-[4px] border-[#ffcccc]">
               <svg viewBox="0 0 800 200" className="w-full h-full relative z-10 overflow-hidden bg-white">
                  <ECGGrid />
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <path d={ecgPathD} stroke="#000" strokeWidth="1.5" fill="none" opacity="0.2" />
                  <path className="ecg-path" d={ecgPathD} stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
               <div className="absolute top-4 left-4 px-3 py-1 bg-black/5 rounded text-black/40 text-[10px] font-mono">
                  25mm/s 10mm/mV
               </div>
            </div>
          )}

          {/* Prompt Area */}
          <div className={`w-full text-center md:text-left mb-6 ${isVisualChoice ? 'mt-8 mb-12' : ''}`}>
             <p className="text-[#3c3c3c] font-[900] text-xl md:text-3xl tracking-tight mb-2 leading-tight">
                 {currentQuestion.prompt.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
             </p>
          </div>

          {/* Options Grid */}
          <div className={`grid ${isVisualChoice ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 gap-4'} w-full max-w-4xl pb-24`}>
            {isVisualChoice ? (
              // RENDER VISUAL OPTIONS (Mini Monitors)
              currentQuestion.visualOptions?.map((optPath, idx) => {
                if (excludedOptions.includes(optPath)) {
                    return <div key={idx} className="h-40 rounded-[24px] bg-gray-100 border-2 border-gray-200 flex items-center justify-center opacity-50 cursor-not-allowed"><i className="fa-solid fa-ban text-gray-300 text-4xl"></i></div>;
                }
                return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => setSelectedOption(optPath)}
                  className={`
                    relative h-40 bg-white rounded-[24px] border-[3px] transition-all overflow-hidden group/viz
                    ${selectedOption === optPath 
                        ? 'border-[#1cb0f6] shadow-[0_0_0_4px_rgba(28,176,246,0.2)] transform scale-[1.02]' 
                        : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="absolute top-2 left-3 text-gray-400 font-black text-xs z-20 bg-white/80 px-2 rounded">Opção {idx + 1}</div>
                  
                  {/* Mini ECG Grid */}
                  <svg viewBox="0 0 800 200" className="w-full h-full bg-[#fffcfc]">
                     <ECGGrid />
                     <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>
                     <path d={optPath} stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>

                  {isAnswered && selectedOption === optPath && (
                     <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-30">
                        <i className={`fa-solid ${isCorrect ? 'fa-circle-check text-[#58cc02]' : 'fa-circle-xmark text-[#ff4b4b]'} text-5xl shadow-lg`}></i>
                     </div>
                  )}
                </button>
              )})
            ) : (
              // RENDER TEXT OPTIONS
              currentQuestion.options?.map((option, idx) => {
                if (excludedOptions.includes(option)) {
                     return <div key={option} className="w-full p-6 bg-gray-100 rounded-[28px] border-2 border-gray-200 text-center opacity-40 font-bold text-gray-400">Opção Eliminada</div>;
                }
                return (
                <button
                  key={option}
                  disabled={isAnswered}
                  onClick={() => setSelectedOption(option)}
                  className={`
                    w-full p-2 bg-[#e5e5e5] rounded-[28px] md:rounded-[36px] transition-all group/opt relative border-b-[6px] md:border-b-8 border-transparent
                    ${selectedOption === option ? 'bg-[#1cb0f6] border-[#1899d6] -translate-y-1' : 'hover:bg-[#f3f3f3]'}
                  `}
                >
                  <div className={`flex items-center bg-white rounded-[20px] md:rounded-[28px] p-4 md:p-5 border-b-[3px] md:border-b-4 ${selectedOption === option ? 'border-[#84d8ff]' : 'border-gray-200'} transition-colors`}>
                      <span className={`flex items-center justify-center w-10 h-10 md:w-14 md:h-12 rounded-xl md:rounded-2xl border-r-2 border-gray-100 font-black text-xl md:text-2xl mr-4 md:mr-6 ${selectedOption === option ? 'text-[#1cb0f6]' : 'text-gray-300'}`}>
                        {idx + 1}
                      </span>
                      <span className={`text-lg md:text-2xl font-black text-left flex-1 ${selectedOption === option ? 'text-[#1cb0f6]' : 'text-[#3c3c3c]'}`}>
                        {option}
                      </span>
                      {isAnswered && selectedOption === option && (
                         <i className={`fa-solid ${isCorrect ? 'fa-circle-check text-[#58cc02]' : 'fa-circle-xmark text-[#ff4b4b]'} text-2xl md:text-4xl`}></i>
                      )}
                  </div>
                </button>
              )})
            )}
          </div>
      </div>

      {/* Control Footer */}
      <div className={`p-6 md:p-10 border-t-4 transition-all duration-500 flex-shrink-0 ${isAnswered ? (isCorrect ? 'bg-[#d7ffb8] border-[#b8f28b]' : 'bg-[#ffdbdb] border-[#ffc1c1]') : 'bg-white border-gray-100'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
          
          {isAnswered && (
            <div className="flex items-center gap-6 md:gap-10 flex-1 animate-in slide-in-from-bottom-8 w-full md:w-auto">
              <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[36px] flex items-center justify-center text-4xl md:text-6xl shadow-xl transform rotate-3 bg-white ${isCorrect ? 'text-[#58cc02]' : 'text-[#ff4b4b]'}`}>
                <i className={`fa-solid ${isCorrect ? 'fa-medal' : 'fa-skull-crossbones'}`}></i>
              </div>
              <div className="flex-1">
                <h3 className={`text-2xl md:text-4xl font-black mb-2 tracking-tight ${isCorrect ? 'text-[#58a700]' : 'text-[#ea2b2b]'}`}>
                  {isCorrect ? (combo > 1 ? `SEQUÊNCIA DE ${combo}!` : 'EXCELENTE!') : 'DANO CRÍTICO'}
                </h3>
                <p className={`font-bold text-sm md:text-xl leading-tight ${isCorrect ? 'text-[#58a700]' : 'text-[#ea2b2b]'}`}>
                  {currentQuestion.explanation}
                </p>
                {/* Visual Feedback for Heart Restore */}
                {isCorrect && combo % 3 === 0 && hearts < 5 && (
                    <div className="mt-2 text-[#ff4b4b] font-black text-sm uppercase tracking-widest animate-bounce">
                        <i className="fa-solid fa-heart-pulse mr-2"></i> Vida Recuperada!
                    </div>
                )}
              </div>
            </div>
          )}
          
          <div className={`relative flex items-center w-full md:w-auto ${!isAnswered ? 'ml-auto' : ''}`}>
              {!isAnswered && <div className="hidden md:block w-8 h-2 bg-gray-200 rounded-full mr-6"></div>}
              
              <button
                onClick={isAnswered ? handleNext : handleCheck}
                disabled={!selectedOption && !isAnswered}
                className={`
                  w-full md:w-96 h-20 md:h-28 rounded-[36px] md:rounded-[48px] bg-[#d1d5db] flex items-center justify-center transition-all p-2
                  ${(selectedOption || isAnswered) ? (isAnswered ? (isCorrect ? 'bg-[#58cc02]' : 'bg-[#ff4b4b]') : 'bg-[#58cc02]') : ''}
                `}
              >
                <div className={`
                    w-full h-full rounded-[28px] md:rounded-[40px] flex items-center justify-center border-t-2 border-white/20 shadow-inner
                    ${(selectedOption || isAnswered) ? 'bg-black/10' : 'bg-black/5'}
                `}>
                    <span className={`text-xl md:text-3xl font-black tracking-[0.2em] transition-colors ${ (selectedOption || isAnswered) ? 'text-white' : 'text-gray-400'}`}>
                        {isAnswered ? 'CONTINUAR' : 'VERIFICAR'}
                    </span>
                </div>
              </button>
              
              {!isAnswered && <div className="hidden md:block w-8 h-2 bg-gray-200 rounded-full ml-6"></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
