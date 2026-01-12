import React, { useState, useEffect, useRef, useMemo } from 'react';

interface TutorialViewProps {
  unitId: string;
  onClose: () => void;
}

// === DIAGNOSTIC ENGINE ===
const getDiagnosis = (bpm: number, pr: number, qrs: number, st: number, noise: number) => {
    const diagnoses = [];

    // Rhythm
    if (noise > 5) diagnoses.push("Fibrilação/Artefato");
    else if (bpm < 60) diagnoses.push("Bradicardia Sinusal");
    else if (bpm > 100) diagnoses.push("Taquicardia Sinusal");
    else diagnoses.push("Ritmo Sinusal Normal");

    // Conduction
    if (pr > 200) diagnoses.push("Bloqueio AV de 1º Grau");
    if (qrs > 120) diagnoses.push("Bloqueio de Ramo (QRS Alargado)");

    // Ischemia
    if (st < -1) diagnoses.push("Isquemia Subendocárdica (Infra ST)");
    if (st > 1) diagnoses.push("IAM com Supra de ST (STEMI)");

    return diagnoses.join(" + ");
};

const TutorialView: React.FC<TutorialViewProps> = ({ unitId, onClose }) => {
  // === ESTADOS FISIOLÓGICOS (PARÂMETROS) ===
  const [bpm, setBpm] = useState(60);
  const [prInterval, setPrInterval] = useState(160); // ms
  const [qrsWidth, setQrsWidth] = useState(80); // ms
  const [stDeviation, setStDeviation] = useState(0); // mm (0.1mV)
  const [noiseLevel, setNoiseLevel] = useState(0); // Interferência
  const [activeTab, setActiveTab] = useState<'rhythm' | 'cond' | 'morph'>('rhythm');

  // === ESTADOS DE SIMULAÇÃO ===
  const [beatPhase, setBeatPhase] = useState<'none' | 'p' | 'pr' | 'qrs' | 'st' | 't'>('none');
  const [history, setHistory] = useState<{y: number}[]>(Array(400).fill({y: 100})); // Buffer do gráfico
  
  // Refs para o loop de animação
  const reqRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const phaseTimeRef = useRef<number>(0); // Tempo dentro da fase atual
  const cycleStateRef = useRef({
      phase: 'p' as 'p'|'pr'|'qrs'|'st'|'t'|'iso',
      lastBeatTime: 0
  });

  // Diagnóstico em tempo real
  const diagnosis = useMemo(() => getDiagnosis(bpm, prInterval, qrsWidth, stDeviation, noiseLevel), 
    [bpm, prInterval, qrsWidth, stDeviation, noiseLevel]);

  // === MOTOR DE FÍSICA E DESENHO (LOOP PRINCIPAL) ===
  useEffect(() => {
    const animate = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Atualizar Lógica do Ciclo Cardíaco
        updateCardiacCycle(deltaTime);

        reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [bpm, prInterval, qrsWidth, stDeviation, noiseLevel]); // Recria o loop se params mudarem (para capturar state novo)

  const updateCardiacCycle = (dt: number) => {
      // 1. Calcular Duração do Batimento baseado no BPM
      const beatDurationMs = (60 / bpm) * 1000;
      
      // 2. Gerar Voltagem (Y) baseado na fase atual
      let voltage = 0; // Baseline (0 offset)
      
      // State Machine Simples para o Ciclo
      const s = cycleStateRef.current;
      phaseTimeRef.current += dt;

      // Definição das durações de fase (dinâmicas baseadas nos sliders)
      const pDur = 100;
      const prSegDur = Math.max(0, prInterval - pDur); // O intervalo PR inclui a P. O segmento PR é o resto.
      const qrsDur = qrsWidth;
      const stDur = 100; // Fixo por enquanto, poderia ser variável QT
      const tDur = 180;
      
      // Lógica de Troca de Fase e Geração de Onda
      // Y = 100 é baseline. Menor que 100 é cima (SVG coords), Maior é baixo.
      let currentY = 100; 

      switch(s.phase) {
          case 'p':
              setBeatPhase('p');
              // Onda P: Senóide simples
              const pProg = phaseTimeRef.current / pDur;
              if (pProg >= 1) { nextPhase('pr'); }
              else {
                  currentY = 100 - (Math.sin(pProg * Math.PI) * 10); // Amplitude 10
              }
              break;
          
          case 'pr':
              setBeatPhase('pr');
              // Segmento PR: Isoelétrico
              if (phaseTimeRef.current >= prSegDur) { nextPhase('qrs'); }
              break;

          case 'qrs':
              setBeatPhase('qrs');
              // Complexo QRS: Agudo
              const qrsProg = phaseTimeRef.current / qrsDur;
              if (qrsProg >= 1) { nextPhase('st'); }
              else {
                  // Q (pequeno dip) - R (pico alto) - S (dip fundo)
                  if (qrsProg < 0.1) currentY = 100 + 5; // Q
                  else if (qrsProg < 0.5) currentY = 100 - 60; // R (Amplitude alta)
                  else if (qrsProg < 0.8) currentY = 100 + 15; // S
                  else currentY = 100; // Volta
              }
              break;

          case 'st':
              setBeatPhase('st');
              // Segmento ST: Pode ter elevação/depressão
              // Interpolação suave para a onda T
              if (phaseTimeRef.current >= stDur) { nextPhase('t'); }
              else {
                  // Aplica o stDeviation (em pixels, ex: 1mm = 10px)
                  currentY = 100 - (stDeviation * 5); 
              }
              break;

          case 't':
              setBeatPhase('t');
              // Onda T: Assimétrica
              const tProg = phaseTimeRef.current / tDur;
              if (tProg >= 1) { nextPhase('iso'); }
              else {
                  // Começa na altura do ST
                  const baseSt = 100 - (stDeviation * 5);
                  // Adiciona a onda T sobre o desvio do ST
                  const tWave = Math.sin(tProg * Math.PI) * 15;
                  currentY = baseSt - tWave;
              }
              break;

          case 'iso':
              setBeatPhase('none');
              // Linha Isoelétrica (Espera até o próximo batimento)
              // Verifica se já passou o tempo total do batimento desde o início da P
              // Tempo total acumulado = pDur + prSegDur + qrsDur + stDur + tDur + isoTime
              // Simplificação: Checar se beatTime total passou
              const totalCycleTime = pDur + prSegDur + qrsDur + stDur + tDur;
              const timeSinceBeatStart = totalCycleTime + phaseTimeRef.current; // phaseTimeRef aqui é o tempo DENTRO do iso
              
              // Se o tempo desde o início do ciclo anterior exceder beatDurationMs
              // (Na verdade, precisamos rastrear o tempo global do ciclo)
              
              // Hack simples: Fase ISO dura o que sobra
              const remaining = beatDurationMs - totalCycleTime;
              if (phaseTimeRef.current >= remaining) {
                  cycleStateRef.current.phase = 'p';
                  phaseTimeRef.current = 0;
              }
              break;
      }

      // Adicionar Ruído/Artefato
      if (noiseLevel > 0) {
          currentY += (Math.random() - 0.5) * noiseLevel * 5;
      }

      // 3. Atualizar Histórico do Gráfico (Shift Register)
      setHistory(prev => {
          const newH = [...prev.slice(1), { y: currentY }];
          return newH;
      });
  };

  const nextPhase = (next: 'p'|'pr'|'qrs'|'st'|'t'|'iso') => {
      cycleStateRef.current.phase = next;
      phaseTimeRef.current = 0;
  };

  // SVG Path Generator from History
  const polylinePoints = history.map((pt, i) => `${i * 2},${pt.y}`).join(' ');

  return (
    <div className="fixed inset-0 z-[500] bg-[#0f172a] text-white flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* === TOP BAR === */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#020617] flex-shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1cb0f6] to-[#1877f2] flex items-center justify-center shadow-lg shadow-blue-500/20">
                <i className="fa-solid fa-flask text-white text-lg"></i>
            </div>
            <div>
                <h2 className="font-black text-lg text-white tracking-tight leading-none">BIO-LAB <span className="text-[#1cb0f6]">PRO</span></h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Simulador Eletrofisiológico v2.0</p>
            </div>
         </div>
         
         <div className="hidden md:flex items-center gap-6 bg-white/5 px-6 py-2 rounded-full border border-white/10">
            <div className="flex flex-col items-center w-24 border-r border-white/10">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Ritmo</span>
                <span className={`font-mono font-bold ${bpm > 100 || bpm < 60 ? 'text-red-400 animate-pulse' : 'text-[#58cc02]'}`}>{bpm} <span className="text-[10px]">BPM</span></span>
            </div>
            <div className="flex flex-col items-center w-24 border-r border-white/10">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Intervalo PR</span>
                <span className={`font-mono font-bold ${prInterval > 200 ? 'text-yellow-400' : 'text-white'}`}>{prInterval} <span className="text-[10px]">ms</span></span>
            </div>
            <div className="flex flex-col items-center w-24">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">QRS</span>
                <span className={`font-mono font-bold ${qrsWidth > 100 ? 'text-yellow-400' : 'text-white'}`}>{qrsWidth} <span className="text-[10px]">ms</span></span>
            </div>
         </div>

         <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:rotate-90">
            <i className="fa-solid fa-xmark text-lg"></i>
         </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
         
         {/* === LEFT: VISUALIZATION AREA === */}
         <div className="flex-1 relative flex flex-col bg-[#020617]">
            
            {/* 1. ANATOMICAL HEART & VECTORS */}
            <div className="flex-1 relative flex items-center justify-center p-8 bg-grid-pattern overflow-hidden">
                
                {/* Background Glows */}
                <div className={`absolute w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl transition-opacity duration-500 ${beatPhase !== 'none' ? 'opacity-100' : 'opacity-50'}`}></div>

                {/* HEART CONTAINER */}
                <div className="relative w-72 h-96 z-10">
                   <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-2xl">
                      {/* Coração Base (Silhueta Escura) */}
                      <path d="M 100,280 C 40,250 20,160 20,120 C 20,70 60,30 90,50 C 100,60 100,60 110,50 C 140,30 180,70 180,120 C 180,160 160,250 100,280 Z" 
                            fill="#0f172a" stroke="#334155" strokeWidth="2" />
                      
                      {/* ÁTRIOS (Acendem na fase P) */}
                      <path d="M 30,110 Q 50,60 90,60 T 150,110" 
                            fill={beatPhase === 'p' ? 'url(#gradAtria)' : 'transparent'} 
                            stroke={beatPhase === 'p' ? '#fbbf24' : 'transparent'} 
                            strokeWidth="1"
                            className="transition-all duration-100" />
                      
                      {/* VENTRÍCULOS (Acendem na fase QRS/ST) */}
                      <path d="M 30,130 Q 100,280 170,130" 
                            fill={beatPhase === 'qrs' ? 'url(#gradVent)' : (beatPhase === 'st' ? 'rgba(239, 68, 68, 0.2)' : 'transparent')} 
                            stroke={beatPhase === 'qrs' ? '#22d3ee' : 'transparent'}
                            strokeWidth="1"
                            className="transition-all duration-50" />

                      {/* DEFS GRADIENTES */}
                      <defs>
                          <radialGradient id="gradAtria" cx="0.5" cy="0.5" r="0.5">
                              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.4)" />
                              <stop offset="100%" stopColor="transparent" />
                          </radialGradient>
                          <radialGradient id="gradVent" cx="0.5" cy="0.5" r="0.5">
                              <stop offset="0%" stopColor="rgba(34, 211, 238, 0.4)" />
                              <stop offset="100%" stopColor="transparent" />
                          </radialGradient>
                      </defs>

                      {/* === SISTEMA DE CONDUÇÃO === */}
                      
                      {/* SA Node (O marcapasso) */}
                      <circle cx="60" cy="80" r="6" className={`transition-all duration-200 ${beatPhase === 'p' ? 'fill-[#fbbf24] shadow-glow-yellow' : 'fill-[#78350f]'}`} />
                      <text x="45" y="75" className="text-[8px] fill-gray-500 font-mono opacity-50">SA</text>

                      {/* Vias Internodais */}
                      <path d="M 60,80 Q 80,90 100,120" fill="none" stroke={beatPhase === 'p' ? '#fcd34d' : '#451a03'} strokeWidth="2" strokeDasharray="2 2" />

                      {/* AV Node (O porteiro) */}
                      <circle cx="100" cy="120" r="7" className={`transition-all duration-200 ${beatPhase === 'pr' ? 'fill-[#f97316] shadow-glow-orange scale-125' : (beatPhase === 'p' ? 'fill-[#9a3412]' : 'fill-[#431407]')}`} />
                      <text x="115" y="125" className="text-[8px] fill-gray-500 font-mono opacity-50">AV</text>

                      {/* Feixe de His e Ramos */}
                      <path d="M 100,120 L 100,150 L 60,210 M 100,150 L 140,210" 
                            fill="none" 
                            stroke={beatPhase === 'qrs' ? '#22d3ee' : '#164e63'} 
                            strokeWidth={beatPhase === 'qrs' ? '4' : '2'}
                            className={`transition-all ${beatPhase === 'qrs' ? 'drop-shadow-[0_0_8px_cyan]' : ''}`} />

                      {/* ISQUEMIA VISUALIZER (Parede Anterior) */}
                      {stDeviation > 1 && (
                          <circle cx="120" cy="200" r="20" fill="url(#ischemiaGlow)" className="animate-pulse" />
                      )}
                      <defs>
                        <radialGradient id="ischemiaGlow">
                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                      </defs>
                   </svg>
                   
                   {/* Context Labels Overlay */}
                   <div className="absolute top-0 right-0 p-4 space-y-2 pointer-events-none">
                        <div className={`flex items-center gap-2 transition-opacity ${beatPhase === 'p' ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <span className="text-xs font-mono text-yellow-400">Atrial Depol.</span>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity ${beatPhase === 'pr' ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-xs font-mono text-orange-500">AV Delay</span>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity ${beatPhase === 'qrs' ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                            <span className="text-xs font-mono text-cyan-400">Ventricular Depol.</span>
                        </div>
                        <div className={`flex items-center gap-2 transition-opacity ${beatPhase === 't' || beatPhase === 'st' ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <span className="text-xs font-mono text-red-400">Repolarization</span>
                        </div>
                   </div>
                </div>
            </div>

            {/* 2. REAL-TIME MONITOR STRIP */}
            <div className="h-48 bg-black border-t border-gray-800 relative overflow-hidden flex flex-col">
                 
                 {/* Monitor Header */}
                 <div className="h-8 bg-[#111] border-b border-gray-800 flex justify-between items-center px-4">
                     <span className="text-[#58cc02] text-xs font-mono tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#58cc02] rounded-full animate-pulse"></span>
                        LIVE LEAD II
                     </span>
                     <span className="text-gray-500 text-[10px] font-mono">25mm/s • 10mm/mV</span>
                 </div>

                 {/* The Dynamic Graph */}
                 <div className="flex-1 relative">
                    {/* Grid Background */}
                    <div className="absolute inset-0 z-0" style={{ 
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                    }}></div>
                    <div className="absolute inset-0 z-0" style={{ 
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: '4px 4px'
                    }}></div>

                    {/* SVG Polyline */}
                    <svg className="w-full h-full relative z-10" viewBox="0 0 800 200" preserveAspectRatio="none">
                         <polyline 
                            points={polylinePoints} 
                            fill="none" 
                            stroke="#58cc02" 
                            strokeWidth="2" 
                            vectorEffect="non-scaling-stroke"
                            strokeLinejoin="round"
                         />
                    </svg>
                    
                    {/* Scanline Effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black via-transparent to-transparent z-20"></div>
                 </div>
            </div>
         </div>

         {/* === RIGHT: ADVANCED CONTROLS === */}
         <div className="w-full lg:w-[450px] bg-[#0f172a] border-l border-white/10 flex flex-col max-h-[50vh] lg:max-h-full overflow-hidden">
            
            {/* 3. DIAGNOSIS AI BOX */}
            <div className="p-6 bg-[#1e293b] border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                    <i className="fa-solid fa-robot text-[#1cb0f6]"></i>
                    <span className="text-xs font-bold text-[#1cb0f6] uppercase tracking-widest">Diagnóstico Automático (IA)</span>
                </div>
                <div className="bg-black/40 rounded-lg p-4 border-l-4 border-[#1cb0f6]">
                    <p className={`font-mono text-sm leading-relaxed ${diagnosis.includes("Normal") ? 'text-white' : 'text-yellow-400 font-bold'}`}>
                        {diagnosis.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-2 font-mono">
                        CONFIDENCE: 98.4% • LEAD II ANALYSIS
                    </p>
                </div>
            </div>

            {/* 4. TABBED CONTROLS */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('rhythm')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'rhythm' ? 'bg-[#1cb0f6]/10 text-[#1cb0f6] border-b-2 border-[#1cb0f6]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    Ritmo
                </button>
                <button 
                    onClick={() => setActiveTab('cond')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'cond' ? 'bg-[#ff9600]/10 text-[#ff9600] border-b-2 border-[#ff9600]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    Condução
                </button>
                <button 
                    onClick={() => setActiveTab('morph')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'morph' ? 'bg-[#ff4b4b]/10 text-[#ff4b4b] border-b-2 border-[#ff4b4b]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    Morfologia
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* RHYTHM CONTROLS */}
                {activeTab === 'rhythm' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="control-group">
                            <label className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                                Frequência Cardíaca
                                <span className="text-white">{bpm} BPM</span>
                            </label>
                            <input type="range" min="30" max="200" value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg accent-[#1cb0f6] cursor-pointer" />
                            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                <span>30</span><span>Normal (60-100)</span><span>200</span>
                            </div>
                        </div>

                        <div className="control-group">
                            <label className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                                Artefato / Ruído
                                <span className="text-white">{noiseLevel > 0 ? 'Ligado' : 'Desligado'}</span>
                            </label>
                            <input type="range" min="0" max="10" value={noiseLevel} onChange={e => setNoiseLevel(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg accent-gray-400 cursor-pointer" />
                            <p className="text-[10px] text-gray-500 mt-2">
                                Simula tremor muscular ou má conexão dos eletrodos. Dificulta a leitura da onda P.
                            </p>
                        </div>
                    </div>
                )}

                {/* CONDUCTION CONTROLS */}
                {activeTab === 'cond' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="control-group">
                            <label className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                                Atraso Nó AV (Intervalo PR)
                                <span className="text-white">{prInterval} ms</span>
                            </label>
                            <input type="range" min="120" max="400" step="10" value={prInterval} onChange={e => setPrInterval(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg accent-[#ff9600] cursor-pointer" />
                            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded mt-3">
                                <p className="text-[10px] text-orange-200 leading-tight">
                                    <strong>Fisiologia:</strong> Determina quanto tempo o Nó AV "segura" o impulso antes de liberar para os ventrículos. >200ms indica Bloqueio de 1º Grau.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MORPHOLOGY CONTROLS */}
                {activeTab === 'morph' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                         <div className="control-group">
                            <label className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                                Largura do QRS
                                <span className="text-white">{qrsWidth} ms</span>
                            </label>
                            <input type="range" min="60" max="160" step="10" value={qrsWidth} onChange={e => setQrsWidth(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg accent-[#ff4b4b] cursor-pointer" />
                            <p className="text-[10px] text-gray-500 mt-1">Acima de 120ms sugere bloqueio de ramo.</p>
                        </div>

                        <div className="control-group">
                            <label className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                                Segmento ST (Isquemia)
                                <span className={`text-white ${stDeviation !== 0 ? 'text-red-400 font-black' : ''}`}>{stDeviation > 0 ? `+${stDeviation}` : stDeviation} mm</span>
                            </label>
                            <input type="range" min="-5" max="5" step="0.5" value={stDeviation} onChange={e => setStDeviation(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg accent-red-500 cursor-pointer" />
                            
                            <div className="flex items-center gap-2 mt-2 justify-center">
                                <span className="text-[10px] text-gray-500">INFRA</span>
                                <div className="w-full h-1 bg-gray-800 rounded relative">
                                    <div className="absolute left-1/2 -translate-x-1/2 w-1 h-2 bg-white top-[-2px]"></div>
                                </div>
                                <span className="text-[10px] text-gray-500">SUPRA</span>
                            </div>
                            
                            {Math.abs(stDeviation) > 1 && (
                                <div className="mt-2 p-2 bg-red-500/20 rounded border border-red-500/50 flex items-center gap-2 animate-pulse">
                                    <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                                    <span className="text-[10px] text-red-200 font-bold">ALERTA DE INFARTO (IAM)</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
            
            <div className="p-6 border-t border-white/10 bg-[#020617]">
                 <button onClick={onClose} className="w-full py-3 bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-lg active:scale-95 transition-transform">
                    Encerrar Simulação
                 </button>
            </div>

         </div>

      </div>

      <style>{`
        .bg-grid-pattern {
            background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }
        .shadow-glow-yellow { filter: drop-shadow(0 0 5px #fbbf24); }
        .shadow-glow-orange { filter: drop-shadow(0 0 8px #f97316); }
      `}</style>
    </div>
  );
};

export default TutorialView;