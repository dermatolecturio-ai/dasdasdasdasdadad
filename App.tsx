
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import UnitSection from './components/UnitSection';
import LessonView from './components/LessonView';
import { UNITS } from './constants';
import { UserProgress, Lesson } from './types';

// === COMPONENTE DE INTRODUÇÃO ===
const IntroScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 500); // Start Loading
    const t2 = setTimeout(() => setStage(2), 3500); // Finish Loading, Flash Text
    const t3 = setTimeout(() => onComplete(), 4200); // Exit

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] intro-overlay flex flex-col items-center justify-center overflow-hidden cursor-pointer" onClick={onComplete}>
      <div className="scanline"></div>
      
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(28,176,246,0.1),transparent_60%)]"></div>

      {/* Main Content Container */}
      <div className="relative z-20 flex flex-col items-center">
        
        {/* Animated Icon */}
        <div className={`mb-8 relative transition-all duration-1000 ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
           <div className="w-24 h-24 bg-[#1cb0f6] rounded-[24px] flex items-center justify-center shadow-[0_0_50px_rgba(28,176,246,0.6)] animate-pulse">
              <i className="fa-solid fa-brain text-white text-5xl"></i>
           </div>
           <div className="absolute -inset-4 border-2 border-[#1cb0f6] rounded-[32px] opacity-30 animate-ping"></div>
        </div>

        {/* Text Logo */}
        <div className={`text-center transition-all duration-700 ${stage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-2 glitch-text" data-text="MEDCORTEX">
                MEDCORTEX
            </h1>
            <h2 className="text-3xl md:text-4xl font-black text-[#ff4b4b] tracking-[0.5em] uppercase mb-8 glitch-text" data-text="ONE">
                ONE
            </h2>
        </div>

        {/* ECG Animation Container */}
        <div className="w-[300px] md:w-[500px] h-24 relative overflow-hidden mb-8 border-x border-white/10">
            <svg viewBox="0 0 500 100" className="w-full h-full">
                <path 
                    d="M 0,50 L 20,50 L 30,40 L 40,50 L 80,50 L 90,30 L 100,50 L 110,50 L 120,10 L 130,90 L 140,40 L 160,50 L 200,50 L 220,20 L 240,50 L 300,50 L 320,50 L 330,40 L 340,50 L 380,50 L 390,30 L 400,50 L 410,50 L 420,10 L 430,90 L 440,40 L 460,50 L 500,50"
                    fill="none"
                    stroke="#58cc02"
                    strokeWidth="3"
                    className="intro-ecg"
                    style={{ filter: 'drop-shadow(0 0 8px #58cc02)' }}
                />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617]"></div>
        </div>

        {/* Loading Bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden relative border border-white/10">
            <div className="h-full bg-[#1cb0f6] shadow-[0_0_15px_#1cb0f6] loading-bar-fill"></div>
        </div>
        
        <p className="mt-4 text-[#1cb0f6] font-mono text-xs tracking-widest animate-pulse">
            INITIALIZING NEURAL LINK...
        </p>

      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-10 text-white/20 text-[10px] tracking-[0.3em] uppercase">
          Batalha do ECG v1.0
      </div>
    </div>
  );
};

// === APP PRINCIPAL ===
const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState('learn');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  
  // Lazy Initialization: Garante que o localStorage é lido ANTES da renderização inicial.
  // Isso previne que o valor padrão sobrescreva os dados salvos quando o useEffect de salvamento rodar.
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem('medcortex-one-v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    }
    
    // Estado inicial padrão se nada for encontrado
    return {
      completedLessons: [],
      currentUnit: 'unit-1',
      xp: 0,
      gems: 500, // Começa com 500 Gems
      streak: 3,
      hearts: 5,
    };
  });

  // Salva no localStorage sempre que o progresso mudar
  useEffect(() => {
    localStorage.setItem('medcortex-one-v1', JSON.stringify(progress));
  }, [progress]);

  const handleIntroComplete = () => {
      setShowIntro(false);
      sessionStorage.setItem('hasSeenIntro', 'true');
  };

  const handleSelectLesson = (lessonId: string) => {
    // Check hearts
    if (progress.hearts <= 0) {
        alert("Você precisa recuperar suas vidas! Use suas Gems.");
        return;
    }
    const lesson = UNITS.flatMap(u => u.lessons).find(l => l.id === lessonId);
    if (lesson) setActiveLesson(lesson);
  };

  const handleUpdateProgress = (newHearts: number, gemsSpent: number) => {
      setProgress(prev => ({
          ...prev,
          hearts: newHearts,
          gems: prev.gems - gemsSpent
      }));
  }

  const handleLessonFinish = (earnedXp: number, finalHearts: number) => {
    if (!activeLesson) return;
    
    // Bônus de Gems por completar
    const gemsBonus = 50; 

    setProgress(prev => ({
      ...prev,
      xp: prev.xp + earnedXp,
      gems: prev.gems + gemsBonus,
      hearts: finalHearts, // Persiste os corações que sobraram
      completedLessons: prev.completedLessons.includes(activeLesson.id) 
        ? prev.completedLessons 
        : [...prev.completedLessons, activeLesson.id]
    }));
    setActiveLesson(null);
  };

  // Render Intro Overlay
  if (showIntro) {
      return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row animate-in fade-in duration-1000">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full pb-32 md:pb-12">
        {/* Floating Top Stats Bar */}
        <div className="flex justify-between items-center mb-16 bg-white/70 backdrop-blur-md p-6 rounded-[32px] border-2 border-white shadow-sm sticky top-6 z-40">
           <div className="flex gap-4 md:gap-8 items-center">
               <div className="hidden md:flex items-center gap-2 text-[#ff9600] font-black group cursor-pointer hover:scale-105 transition-transform">
                  <i className="fa-solid fa-fire text-xl animate-pulse"></i>
                  <span className="text-xl">{progress.streak}</span>
               </div>
               
               <div className="flex items-center gap-2 px-4 py-2 bg-[#ffdbdb] rounded-xl border-2 border-[#ffc1c1] text-[#ff4b4b] font-black group cursor-pointer hover:scale-105 transition-transform">
                  <i className="fa-solid fa-heart text-xl group-hover:scale-125 transition-transform"></i>
                  <span className="text-xl">{progress.hearts}</span>
               </div>

               <div className="flex items-center gap-2 px-4 py-2 bg-[#ddf4ff] rounded-xl border-2 border-[#84d8ff] text-[#1cb0f6] font-black group cursor-pointer hover:scale-105 transition-transform">
                  <i className="fa-solid fa-gem text-xl group-hover:rotate-12 transition-transform"></i>
                  <span className="text-xl">{progress.gems}</span>
               </div>
           </div>
           
           <div className="flex items-center gap-3 text-[#58cc02] font-black bg-[#d7ffb8] px-6 py-3 rounded-2xl border-2 border-[#b8f28b] shadow-sm">
              <i className="fa-solid fa-dna text-xl"></i>
              <span className="text-xl">{progress.xp} XP</span>
           </div>
        </div>

        {activeTab === 'learn' && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {UNITS.map(unit => (
              <UnitSection 
                key={unit.id} 
                unit={unit} 
                progress={progress} 
                onSelectLesson={handleSelectLesson} 
              />
            ))}
          </div>
        )}

        {/* ... (Leaderboard logic remains same) ... */}
        {activeTab === 'leaderboard' && (
             <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-12 duration-700">
                <div className="bg-gradient-to-br from-[#1cb0f6] to-[#0d9488] rounded-[48px] p-12 text-white mb-12 shadow-[0_15px_0_0_#0e7490] text-center relative overflow-hidden">
                    <h2 className="text-5xl font-black mb-3 tracking-tighter">Liga dos Especialistas</h2>
                    <p className="font-bold opacity-90 text-xl">Top 1% dos Cardiologistas One</p>
                    <i className="fa-solid fa-ranking-star absolute -right-8 -top-8 text-white/10 text-[200px] rotate-12"></i>
                </div>
                <div className="border-4 border-white rounded-[48px] overflow-hidden bg-white/80 backdrop-blur-sm shadow-xl">
                    {[
                        { name: 'Dr. Gregory House', xp: 8250, avatar: '👨‍⚕️', color: 'bg-blue-100' },
                        { name: 'Você', xp: progress.xp + 200, avatar: '🩺', color: 'bg-indigo-100', active: true },
                        { name: 'Meredith Grey', xp: 5800, avatar: '👩‍⚕️', color: 'bg-pink-100' },
                        { name: 'Cristina Yang', xp: 5750, avatar: '🔬', color: 'bg-gray-100' },
                    ].sort((a,b) => b.xp - a.xp).map((user, i) => (
                        <div key={i} className={`flex items-center gap-8 p-8 ${user.active ? 'bg-[#ddf4ff]' : 'bg-transparent'} border-b-2 border-gray-100 last:border-0 hover:bg-white transition-colors cursor-pointer group`}>
                            <span className={`font-black text-3xl w-10 ${i === 0 ? 'text-[#ffc800]' : 'text-gray-300'}`}>{i + 1}</span>
                            <div className={`w-16 h-16 rounded-[24px] ${user.color} flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform`}>{user.avatar}</div>
                            <span className={`flex-1 font-black text-2xl ${user.active ? 'text-[#1cb0f6]' : 'text-gray-700'}`}>{user.name}</span>
                            <span className="font-black text-gray-400 text-sm tracking-widest">{user.xp} XP</span>
                        </div>
                    ))}
                </div>
             </div>
        )}

      </main>

      {activeLesson && (
        <LessonView 
          lesson={activeLesson} 
          currentGems={progress.gems}
          currentHearts={progress.hearts}
          onUpdateProgress={handleUpdateProgress}
          onClose={() => setActiveLesson(null)} 
          onFinish={handleLessonFinish}
        />
      )}
    </div>
  );
};

export default App;
