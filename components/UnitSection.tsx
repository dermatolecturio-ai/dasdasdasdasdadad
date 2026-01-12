
import React, { useState } from 'react';
import { Unit, UserProgress } from '../types';
import TutorialView from './TutorialView';

interface UnitSectionProps {
  unit: Unit;
  progress: UserProgress;
  onSelectLesson: (lessonId: string) => void;
}

// Configurações de Tema por Unidade
const THEMES: Record<string, any> = {
  'unit-1': {
    type: 'FOREST',
    bgGradient: 'from-[#84cc16] via-[#a3e635] to-[#bef264]',
    pathColor: '#5a3e1b', // Terra
    pathStyle: 'dashed',
    nodeColor: 'bg-[#fcd34d]',
    decorations: ['fa-tree', 'fa-cloud', 'fa-leaf'],
    decoColor: 'text-[#3f6212]',
    titleColor: 'text-[#14532d]',
    description: 'O Vale dos Ritmos'
  },
  'unit-2': {
    type: 'MAGMA',
    bgGradient: 'from-[#7f1d1d] via-[#991b1b] to-[#b91c1c]',
    pathColor: '#450a0a', // Rocha escura
    pathStyle: 'solid',
    nodeColor: 'bg-[#fbbf24]',
    decorations: ['fa-volcano', 'fa-fire', 'fa-skull'],
    decoColor: 'text-[#ef4444]',
    titleColor: 'text-[#fecaca]',
    description: 'Pico da Arritmia'
  },
  'unit-3': {
    type: 'ICE',
    bgGradient: 'from-[#0e7490] via-[#06b6d4] to-[#67e8f9]',
    pathColor: '#cffafe', // Gelo
    pathStyle: 'glow',
    nodeColor: 'bg-[#e0f2fe]',
    decorations: ['fa-snowflake', 'fa-icicles', 'fa-wind'],
    decoColor: 'text-[#ecfeff]',
    titleColor: 'text-[#164e63]',
    description: 'Caverna dos Bloqueios'
  },
  'unit-4': {
    type: 'CYBER',
    bgGradient: 'from-[#2e1065] via-[#4c1d95] to-[#7c3aed]',
    pathColor: '#d8b4fe', // Neon
    pathStyle: 'circuit',
    nodeColor: 'bg-[#f3e8ff]',
    decorations: ['fa-microchip', 'fa-satellite-dish', 'fa-network-wired'],
    decoColor: 'text-[#a855f7]',
    titleColor: 'text-[#ede9fe]',
    description: 'Metrópole Isquêmica'
  }
};

const UnitSection: React.FC<UnitSectionProps> = ({ unit, progress, onSelectLesson }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const theme = THEMES[unit.id] || THEMES['unit-1'];
  
  // Calcula posições em ziguezague
  const nodes = unit.lessons.map((lesson, i) => {
    const xOffset = Math.sin(i * 1.5) * 80; // Amplitude do ziguezague
    return { ...lesson, x: xOffset, y: i * 140 }; // Espaçamento vertical
  });

  const totalHeight = nodes.length * 140 + 200;

  // Gera path SVG curvo conectando os nós
  const generatePath = () => {
    let d = `M ${nodes[0].x + 150} ${nodes[0].y + 60}`; // Centro do botão inicial (assumindo largura container 300)
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      const startX = curr.x + 150;
      const startY = curr.y + 60;
      const endX = next.x + 150;
      const endY = next.y + 60;
      
      // Control points para curva Bézier suave
      const cp1x = startX;
      const cp1y = startY + 70;
      const cp2x = endX;
      const cp2y = endY - 70;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    }
    return d;
  };

  if (showTutorial) {
      return <TutorialView unitId={unit.id} onClose={() => setShowTutorial(false)} />;
  }

  return (
    <div className="mb-32 relative flex flex-col items-center">
      
      {/* === HEADER TEMÁTICO DA UNIDADE === */}
      <div className={`
        relative w-full max-w-2xl rounded-[40px] p-8 mb-12 overflow-hidden shadow-2xl border-b-8 border-black/20
        bg-gradient-to-br ${theme.bgGradient}
      `}>
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
                <span className={`inline-block px-3 py-1 rounded-full bg-black/20 text-white text-[10px] font-black tracking-[0.2em] uppercase mb-2`}>
                   {theme.description}
                </span>
                <h2 className={`text-3xl md:text-5xl font-black ${theme.titleColor} drop-shadow-sm leading-none mb-2`}>
                    {unit.title}
                </h2>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-32 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white shadow-[0_0_10px_white]" 
                        style={{ width: `${(unit.lessons.filter(l => progress.completedLessons.includes(l.id)).length / unit.lessons.length) * 100}%` }}
                      ></div>
                   </div>
                   <span className="text-xs font-bold text-white/80">
                     {unit.lessons.filter(l => progress.completedLessons.includes(l.id)).length}/{unit.lessons.length}
                   </span>
                </div>
            </div>
            
            <div className="flex gap-3 self-end md:self-center">
                <button 
                    onClick={() => setShowTutorial(true)}
                    className="w-16 h-16 rounded-[20px] bg-white text-[#1cb0f6] flex flex-col items-center justify-center shadow-lg border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all group hover:bg-[#f0f9ff]"
                >
                    <i className="fa-solid fa-flask text-2xl group-hover:scale-110 transition-transform"></i>
                    <span className="text-[10px] font-black uppercase tracking-wide mt-1">Bio-Lab</span>
                </button>

                <div className={`
                    w-20 h-20 rounded-[24px] bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner
                    ${theme.titleColor}
                `}>
                    <i className={`fa-solid ${theme.decorations[0]}`}></i>
                </div>
            </div>
        </div>
      </div>

      {/* === MAPA DE FASES === */}
      <div className="relative w-[300px] md:w-[400px]" style={{ height: totalHeight }}>
        
        {/* Elementos Decorativos de Fundo (Árvores, Pedras, etc) */}
        {nodes.map((_, i) => (
            <React.Fragment key={`deco-${i}`}>
                {/* Esquerda */}
                <i 
                    className={`absolute fa-solid ${theme.decorations[i % theme.decorations.length]} ${theme.decoColor} opacity-20 text-4xl`}
                    style={{ 
                        left: -40 - Math.random() * 50, 
                        top: i * 140 + Math.random() * 50,
                        transform: `scale(${0.5 + Math.random()}) rotate(${Math.random() * 30 - 15}deg)` 
                    }}
                ></i>
                {/* Direita */}
                <i 
                    className={`absolute fa-solid ${theme.decorations[(i + 1) % theme.decorations.length]} ${theme.decoColor} opacity-20 text-3xl`}
                    style={{ 
                        right: -40 - Math.random() * 50, 
                        top: i * 140 + 60 + Math.random() * 50,
                        transform: `scale(${0.5 + Math.random()}) rotate(${Math.random() * -30}deg)` 
                    }}
                ></i>
            </React.Fragment>
        ))}

        {/* Trilha SVG */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
            {/* Sombra da trilha */}
            <path 
                d={generatePath()} 
                fill="none" 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="24" 
                strokeLinecap="round"
                transform="translate(0, 4)"
            />
            {/* Trilha Principal */}
            <path 
                d={generatePath()} 
                fill="none" 
                stroke={theme.pathColor} 
                strokeWidth="16" 
                strokeLinecap="round"
                strokeDasharray={theme.pathStyle === 'dashed' ? '20, 15' : 'none'}
            />
            {/* Brilho interno para temas Cyber/Ice */}
            {(theme.type === 'ICE' || theme.type === 'CYBER') && (
                 <path 
                    d={generatePath()} 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    opacity="0.4"
                />
            )}
        </svg>

        {/* Nós (Botões) */}
        {nodes.map((lesson, index) => {
          const isCompleted = progress.completedLessons.includes(lesson.id);
          const isUnlocked = index === 0 || progress.completedLessons.includes(unit.lessons[index-1].id);
          const isNext = !isCompleted && isUnlocked;
          const isLocked = !isUnlocked;

          // Cores dinâmicas baseadas no status
          let btnBg = isLocked ? 'bg-[#e5e7eb]' : (isCompleted ? theme.nodeColor : 'bg-white');
          let btnBorder = isLocked ? 'border-[#d1d5db]' : (isCompleted ? 'border-white' : 'border-[#e5e5e5]');
          let iconColor = isLocked ? 'text-[#9ca3af]' : (isCompleted ? theme.decoColor.replace('text-', 'text-') : 'text-[#58cc02]'); // Ajuste de cor
          
          if(isNext) {
             btnBg = 'bg-[#58cc02]';
             btnBorder = 'border-[#46a302]';
             iconColor = 'text-white';
          }

          // Override para temas específicos
          if(theme.type === 'MAGMA' && isCompleted) iconColor = 'text-[#b91c1c]';
          if(theme.type === 'CYBER' && isCompleted) iconColor = 'text-[#6d28d9]';

          return (
            <div 
                key={lesson.id}
                className="absolute left-0 w-full flex justify-center z-10"
                style={{ top: lesson.y, transform: `translateX(${lesson.x}px)` }}
            >
                {/* START BANNER (Flutuando acima do próximo nível) */}
                {isNext && (
                    <div className="absolute -top-16 z-20 animate-bounce">
                        <div className="bg-white text-[#58cc02] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl border-b-4 border-[#e5e5e5]">
                            Começar
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b-4 border-r-4 border-[#e5e5e5]"></div>
                        </div>
                    </div>
                )}

                <div className="relative group">
                    {/* Sombra do botão */}
                    <div className={`absolute inset-0 rounded-[35px] translate-y-3 ${isLocked ? 'bg-gray-300' : 'bg-black/20'}`}></div>
                    
                    {/* Botão Principal */}
                    <button
                        onClick={() => isUnlocked && onSelectLesson(lesson.id)}
                        disabled={isLocked}
                        className={`
                            relative w-24 h-24 rounded-[30px] flex items-center justify-center text-3xl shadow-inner border-b-[6px] transition-all duration-200
                            ${btnBg} ${btnBorder}
                            ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:translate-y-2 active:border-b-0'}
                            ${isNext ? 'pulse-ring' : ''}
                        `}
                    >
                        {isCompleted ? (
                            <i className={`fa-solid fa-star ${iconColor} drop-shadow-sm`}></i>
                        ) : isLocked ? (
                            <i className="fa-solid fa-lock text-[#9ca3af]/50 text-2xl"></i>
                        ) : (
                            <i className="fa-solid fa-play text-white ml-1"></i>
                        )}
                        
                        {/* Estrelas de Rank (se completado) */}
                        {isCompleted && (
                            <div className="absolute -bottom-2 flex gap-1">
                                <i className="fa-solid fa-star text-[#ffc800] text-[10px] drop-shadow-md border border-white/50 rounded-full bg-white p-[2px]"></i>
                                <i className="fa-solid fa-star text-[#ffc800] text-[12px] drop-shadow-md border border-white/50 rounded-full bg-white p-[2px] -mt-1"></i>
                                <i className="fa-solid fa-star text-[#ffc800] text-[10px] drop-shadow-md border border-white/50 rounded-full bg-white p-[2px]"></i>
                            </div>
                        )}
                    </button>
                    
                    {/* Título da Lição (Tooltip estilo jogo) */}
                    <div className={`
                        absolute top-1/2 left-[120%] -translate-y-1/2 w-40 p-3 rounded-2xl bg-white shadow-xl border-2 border-gray-100 text-left transition-all duration-300
                        ${isLocked ? 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100' : 'opacity-100'}
                        md:opacity-100
                    `}>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Nível {index + 1}</p>
                        <p className={`text-sm font-bold leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>
                            {lesson.title}
                        </p>
                    </div>

                </div>
            </div>
          );
        })}

        {/* Personagem Avatar no nível atual */}
        {nodes.map((lesson, index) => {
             const isCompleted = progress.completedLessons.includes(lesson.id);
             const isUnlocked = index === 0 || progress.completedLessons.includes(unit.lessons[index-1].id);
             const isNext = !isCompleted && isUnlocked;
             
             if(!isNext) return null;

             return (
                 <div 
                    key="avatar"
                    className="absolute z-30 pointer-events-none transition-all duration-500"
                    style={{ top: lesson.y - 70, left: '50%', transform: `translateX(${lesson.x - 30}px)` }} // -30 para centralizar (avatar width 60/2)
                 >
                     <div className="w-16 h-16 bg-white border-4 border-white rounded-2xl shadow-2xl flex items-center justify-center animate-bounce">
                        <span className="text-4xl">🩺</span>
                     </div>
                 </div>
             )
        })}

      </div>
    </div>
  );
};

export default UnitSection;
