
import { Question, LessonType } from '../types';

// === CONFIGURAÇÕES GERAIS ===
const VIEWPORT_WIDTH = 800;
const BASELINE_Y = 100;

// === CLÍNICA: PERFIS E SINTOMAS ===
const PATIENT_PROFILES = [
  { text: 'Homem, 24 anos, atleta', risk: 'Baixo' },
  { text: 'Mulher, 67 anos, hipertensa', risk: 'Alto' },
  { text: 'Homem, 55 anos, tabagista', risk: 'Médio' },
  { text: 'Mulher, 32 anos, gestante', risk: 'Baixo' },
  { text: 'Idoso, 82 anos, síncope', risk: 'Alto' },
  { text: 'Jovem, 19 anos, ansiedade', risk: 'Baixo' }
];

// === DIAGNÓSTICOS E PARÂMETROS DE ONDA ===
// Defines how to draw specific segments relative to current (x, y)

interface WaveParams {
  p?: string; // P wave shape
  pr?: number; // PR interval width
  qrs: string; // QRS complex shape
  st?: string; // ST segment shape/elevation
  t?: string; // T wave shape
  rr?: number; // R-R interval (isoelectric line after T)
  description: string;
}

const CONDITIONS = {
  NSR: {
    name: 'Ritmo Sinusal Normal',
    type: 'Normal',
    minLevel: 1,
    renderer: (x: number) => normalBeat(x)
  },
  SINUS_BRADY: {
    name: 'Bradicardia Sinusal',
    type: 'Lento',
    minLevel: 1,
    renderer: (x: number) => normalBeat(x, 1.8) // Mais espaço entre batimentos
  },
  SINUS_TACHY: {
    name: 'Taquicardia Sinusal',
    type: 'Rápido',
    minLevel: 1,
    renderer: (x: number) => normalBeat(x, 0.6) // Menos espaço
  },
  AFLUTTER: {
    name: 'Flutter Atrial',
    type: 'Arritmia',
    minLevel: 5,
    renderer: (x: number) => flutterBeat(x)
  },
  AFIB: {
    name: 'Fibrilação Atrial',
    type: 'Arritmia',
    minLevel: 8,
    renderer: (x: number) => afibBeat(x)
  },
  STEMI: {
    name: 'IAM com Supra (Parede Anterior)',
    type: 'Infarto',
    minLevel: 12,
    renderer: (x: number) => stemiBeat(x)
  },
  PVC: {
    name: 'Extrassístole Ventricular',
    type: 'Ectópico',
    minLevel: 10,
    renderer: (x: number) => pvcBeat(x)
  },
  AVB_1: {
    name: 'Bloqueio AV de 1º Grau',
    type: 'Bloqueio',
    minLevel: 15,
    renderer: (x: number) => firstDegreeBlock(x)
  },
  VT: {
    name: 'Taquicardia Ventricular',
    type: 'Emergência',
    minLevel: 20,
    renderer: (x: number) => vtBeat(x)
  }
};

// === FUNÇÕES DE DESENHO VETORIAL (SVG PATH BUILDER) ===
// Cada função retorna { pathFragment: string, newX: number }

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper para curvas suaves
const curve = (dx: number, dy: number) => `c ${dx/3},0 ${dx/2},${dy} ${dx},${dy} `;
const line = (dx: number, dy: number) => `l ${dx},${dy} `;

function normalBeat(startX: number, rrMult: number = 1) {
  let d = "";
  let x = startX;
  
  // Isoelétrica Inicial
  const preIso = 10;
  d += `L ${x + preIso},${BASELINE_Y} `;
  x += preIso;

  // Onda P (Suave, arredondada)
  const pW = 15;
  const pH = -8;
  d += `c ${pW/2},${pH*2} ${pW/2},${pH*2} ${pW},0 `; 
  x += pW;

  // Segmento PR
  const prW = 10;
  d += `h ${prW} `;
  x += prW;

  // QRS (Agudo)
  const qW = 5, qH = 5;
  const rW = 10, rH = -70; // R alto
  const sW = 5, sH = 15;
  
  d += line(qW, qH); // Q
  d += line(rW/2, rH); // R up
  d += line(rW/2, -rH + 10); // R down (deep S)
  d += line(sW, -10 - qH); // Back to baseline
  x += (qW + rW + sW);

  // Segmento ST (Isoelétrico no normal)
  const stW = 15;
  d += `h ${stW} `;
  x += stW;

  // Onda T (Assimétrica)
  const tW = 25;
  const tH = -15;
  d += `c ${tW/3},${tH*1.5} ${tW/2},${tH} ${tW},0 `;
  x += tW;

  // Intervalo pós-T
  const postIso = 40 * rrMult * rand(0.9, 1.1);
  d += `h ${postIso} `;
  x += postIso;

  return { d, x };
}

function stemiBeat(startX: number) {
  let d = "";
  let x = startX;

  // P e PR normais
  d += `L ${x+10},${BASELINE_Y} `; x += 10; // iso
  d += `c 7,-15 8,-15 15,0 `; x += 15; // P
  d += `h 10 `; x += 10; // PR

  // QRS Patológico + Supra
  d += `l 5,10 `; x+=5; // Q
  d += `l 5,-60 `; x+=5; // R (menor amplitude no infarto)
  // J-POINT ELEVATION (Não volta pra baseline)
  d += `l 5,40 `; x+=5; // Desce, mas para alto (Supra)
  
  // ST Elevado convexo
  d += `q 15,-15 30,-5 `; x+=30; // ST fundindo com T
  
  // Descida da T
  d += `q 10,20 15,30 `; x+=15; // Volta pra baseline

  d += `h 40 `; x+=40;

  return { d, x };
}

function flutterBeat(startX: number) {
  let d = "";
  let x = startX;

  // Ondas F (Serrilhado) - 3 ou 4 por QRS
  for(let i=0; i<3; i++) {
    d += `l 10,-15 l 10,15 `; // Dente de serra
    x += 20;
  }

  // QRS Normal
  d += `l 5,-60 l 5,65 l 5,-5 `; // QRS simples
  x += 15;

  return { d, x };
}

function afibBeat(startX: number) {
  let d = "";
  let x = startX;

  // Ondas f (Tremor na baseline)
  const noiseW = rand(20, 50);
  const steps = Math.floor(noiseW / 5);
  for(let i=0; i<steps; i++) {
    d += `l 5,${rand(-3, 3)} `;
    x += 5;
  }
  // Forçar volta pro zero antes do QRS
  d += `L ${x},${BASELINE_Y} `;

  // QRS Estreito
  d += `l 5,-70 l 5,75 l 5,-5 `;
  x += 15;

  // T achatada
  d += `c 5,-5 10,-5 15,0 `;
  x += 15;

  return { d, x };
}

function firstDegreeBlock(startX: number) {
  let d = "";
  let x = startX;
  
  d += `h 10 `; x+=10;
  d += `c 7,-15 8,-15 15,0 `; x += 15; // P
  
  // PR ALARGADO (> 200ms visualmente)
  d += `h 35 `; x += 35; // O segredo do bloqueio de 1 grau

  // QRS Normal
  d += `l 5,10 l 5,-70 l 5,80 l 5,-20 `; x+=20;
  d += `h 10 `; x+=10;
  d += `c 10,-15 20,-15 30,0 `; x+=30; // T
  d += `h 40 `; x+=40;

  return { d, x };
}

function vtBeat(startX: number) {
  let d = "";
  let x = startX;
  // Onda larga, sem P, alta amplitude
  d += `q 15,-90 30,0 `; // Subida larga
  x += 30;
  d += `q 15,90 30,0 `; // Descida larga
  x += 30;
  return { d, x };
}

function pvcBeat(startX: number) {
    // Batimento normal seguido de pausa e batimento bizarro
    // Para simplificar no loop, desenhamos só o bizarro aqui e controlamos a lógica no loop principal
    let d = "";
    let x = startX;
    
    // Sem P
    d += `l 10,10 `; // início lento
    d += `l 15,-100 `; // R gigante
    d += `l 15,110 `; // S profunda
    d += `l 10,-20 `; // volta
    // T Invertida e larga (discordante)
    d += `c 10,20 20,20 30,0 `; 
    x += 80;
    
    d += `h 60 `; // Pausa compensatória
    x += 60;
    
    return { d, x };
}

// === GERADOR DE TRAÇADO CONTÍNUO ===

export const generateFullTrace = (conditionKey: string): string => {
  let path = `M 0,${BASELINE_Y} `;
  let currentX = 0;
  let renderer = CONDITIONS.NSR.renderer;
  
  // Selecionar renderer base
  // @ts-ignore
  if (CONDITIONS[conditionKey]) renderer = CONDITIONS[conditionKey].renderer;

  while (currentX < VIEWPORT_WIDTH + 50) { // Gera um pouco a mais para garantir
    // Lógica especial para PVC (ocorre ocasionalmente)
    if (conditionKey === 'PVC' && Math.random() > 0.6) {
        const seg = pvcBeat(currentX);
        path += seg.d;
        currentX = seg.x;
    } else {
        const seg = renderer(currentX);
        path += seg.d;
        currentX = seg.x;
    }
  }

  return path;
};

// === GERADOR DE QUESTÕES (INTERFACE PÚBLICA) ===

export const generateQuestion = (level: number): Question => {
  // 1. Filtrar condições disponíveis para o nível
  const availableConditions = Object.entries(CONDITIONS)
    .filter(([_, data]) => data.minLevel <= level)
    .map(([key, data]) => ({ key, ...data }));
  
  // Fallback se algo der errado
  if (availableConditions.length === 0) availableConditions.push({ key: 'NSR', ...CONDITIONS.NSR });

  // 2. Escolher a Condição Correta (pesando para as novas do nível)
  // Tendência a pegar as de nível mais alto disponíveis
  availableConditions.sort((a, b) => b.minLevel - a.minLevel);
  const targetIndex = Math.floor(Math.random() * Math.min(3, availableConditions.length));
  const target = availableConditions[targetIndex];

  // 3. Gerar Distratores (outras condições)
  const others = Object.values(CONDITIONS).filter(c => c.name !== target.name);
  const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 3);

  // 4. Gerar Cenário
  const patient = PATIENT_PROFILES[Math.floor(Math.random() * PATIENT_PROFILES.length)];
  const isVisual = Math.random() > 0.6; // 40% chance visual

  const qId = `q-${Date.now()}-${Math.random()}`;

  if (isVisual) {
    // "Qual destes é X?"
    const correctTrace = generateFullTrace(target.key);
    const wrongTraces = distractors.slice(0, 3).map(d => {
        // Encontrar a chave do distrator reverso
        const key = Object.keys(CONDITIONS).find(k => CONDITIONS[k as keyof typeof CONDITIONS].name === d.name);
        return generateFullTrace(key || 'NSR');
    });

    const visualOptions = [correctTrace, ...wrongTraces].sort(() => 0.5 - Math.random());
    
    return {
      id: qId,
      type: LessonType.VISUAL_CHOICE,
      prompt: `Paciente: ${patient.text}. Monitore o ECG.\nQual traçado representa: ${target.name}?`,
      visualOptions: visualOptions,
      correctAnswer: correctTrace, // Match string
      explanation: `O padrão observado é característico de ${target.name}.`,
      hint: getHint(target.key),
      difficulty: level,
      ecgPathData: "" // Sem monitor principal
    };
  } else {
    // "O que é este traçado?"
    const trace = generateFullTrace(target.key);
    const options = [target.name, ...distractors.map(d => d.name)].sort(() => 0.5 - Math.random());

    return {
      id: qId,
      type: LessonType.MULTIPLE_CHOICE,
      prompt: `${patient.text}. Queixa de mal-estar.\nAnalise o traçado acima. Qual o laudo?`,
      ecgPathData: trace,
      options: options,
      correctAnswer: target.name,
      explanation: getExplanation(target.key),
      hint: getHint(target.key),
      difficulty: level
    };
  }
};

function getHint(key: string): string {
    const hints: Record<string, string> = {
        NSR: "Verifique se a frequência está entre 60 e 100 bpm.",
        SINUS_BRADY: "Conte os quadradões entre os R-R. Parecem muitos?",
        SINUS_TACHY: "O coração está batendo muito rápido (>100 bpm).",
        AFLUTTER: "Olhe para a linha de base. Parece uma serra?",
        AFIB: "O ritmo é regular? Procure por ondas P antes dos QRS.",
        STEMI: "Foque no segmento ST logo após o QRS.",
        AVB_1: "Meça o intervalo PR (do início do P ao QRS).",
        VT: "Os complexos QRS parecem largos e muito rápidos?"
    };
    return hints[key] || "Analise a morfologia da onda P e do complexo QRS.";
}

function getExplanation(key: string): string {
    const explanations: Record<string, string> = {
        NSR: "Ritmo regular, onda P antes de cada QRS, frequência normal.",
        SINUS_BRADY: "Ritmo sinusal normal, porém com frequência cardíaca < 60 bpm.",
        SINUS_TACHY: "Ritmo sinusal normal, com frequência > 100 bpm.",
        AFLUTTER: "Ondas F em 'dente de serra' na linha de base, típicas do Flutter.",
        AFIB: "Ritmo irregularmente irregular e ausência de ondas P organizadas.",
        STEMI: "Supra-desnivelamento do segmento ST indicando lesão aguda.",
        AVB_1: "Intervalo PR prolongado (> 200ms) fixo, sem falhas no QRS.",
        VT: "Complexos QRS largos e bizarros, taquicardia, sem ondas P visíveis."
    };
    return explanations[key] || "Padrão clínico compatível.";
}

export const generateUnit = (unitNumber: number, lessonCount: number) => {
    const lessons = [];
    for(let i=1; i<=lessonCount; i++) {
        const level = (unitNumber - 1) * 10 + i;
        const qs = [];
        for(let j=0; j<3; j++) qs.push(generateQuestion(level));
        
        lessons.push({
            id: `u${unitNumber}-l${i}`,
            title: `Caso Clínico ${level}`,
            description: 'Identificação de Ritmo',
            questions: qs
        });
    }
    return lessons;
};
