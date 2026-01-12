
export enum LessonType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  IDENTIFY_WAVE = 'IDENTIFY_WAVE',
  ORDERING = 'ORDERING',
  INTERPRETATION = 'INTERPRETATION',
  VISUAL_CHOICE = 'VISUAL_CHOICE' // Opções são traçados de ECG
}

export interface Question {
  id: string;
  type: LessonType;
  prompt: string;
  image?: string;
  options?: string[]; // Para texto
  visualOptions?: string[]; // Para caminhos SVG (d attribute)
  ecgPathData?: string; // O traçado principal da questão
  correctAnswer: string | string[]; // Pode ser o texto ou o índice/id do visualOption
  explanation: string;
  hint: string; // Nova dica contextual
  difficulty: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Unit {
  id: string;
  title: string;
  color: string;
  lessons: Lesson[];
  tutorialId?: string; // Link para o conteúdo do Bio-Lab
}

export interface UserProgress {
  completedLessons: string[];
  currentUnit: string;
  xp: number;
  gems: number; // Nova moeda
  streak: number;
  hearts: number;
}
