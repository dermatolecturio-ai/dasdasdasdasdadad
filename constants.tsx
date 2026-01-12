
import { Unit } from './types';
import { generateUnit } from './utils/ecgEngine';

// Geramos as primeiras unidades proceduralmente.
// O sistema pode chamar generateUnit infinitamente se quisermos paginação futura.

export const UNITS: Unit[] = [
  {
    id: 'unit-1',
    title: 'Fundamentos Clínicos',
    color: '#1cb0f6',
    lessons: generateUnit(1, 8) // Gera 8 lições para a unidade 1
  },
  {
    id: 'unit-2',
    title: 'Arritmias Letais',
    color: '#ff4b4b',
    lessons: generateUnit(2, 10) // Gera 10 lições para a unidade 2
  },
  {
    id: 'unit-3',
    title: 'Bloqueios e Condução',
    color: '#58cc02',
    lessons: generateUnit(3, 10)
  },
  {
    id: 'unit-4',
    title: 'Isquemia Avançada',
    color: '#ffc800',
    lessons: generateUnit(4, 12)
  }
];
