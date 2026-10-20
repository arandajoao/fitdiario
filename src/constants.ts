import { C } from './theme';
import { Angle, Duration, ExportOptions, Filter, HealthType, Intensity, MealStatus, Mod, Period } from './types';

export const DEFAULT_MODS: Mod[] = [
  { name: 'Musculação', icon: 'fitness-center', dist: false, fc: true },
  { name: 'Corrida', icon: 'directions-run', dist: true, fc: true },
  { name: 'Ciclismo', icon: 'directions-bike', dist: true, fc: true },
  { name: 'Natação', icon: 'pool', dist: true, fc: true },
  { name: 'Caminhada', icon: 'directions-walk', dist: true, fc: true },
  { name: 'Yoga', icon: 'self-improvement', dist: false, fc: false },
  { name: 'Funcional', icon: 'sports-gymnastics', dist: false, fc: true },
];

export const DEFAULT_MEALS = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Café da tarde', 'Jantar'];

export const ST: Record<MealStatus, { label: string; icon: string; color: string; bg: string; fg: string }> = {
  segui: { label: 'Segui', icon: 'check-circle', color: C.primary40, bg: C.primary90, fg: C.primary10 },
  adaptei: { label: 'Adaptei', icon: 'swap-horiz', color: C.secondary40, bg: C.secondary90, fg: C.secondary10 },
  sai: { label: 'Saí', icon: 'cancel', color: C.error40, bg: C.error90, fg: C.error10 },
};
export const STATUS_KEYS = Object.keys(ST) as MealStatus[];

export const DOBRAS = [
  'Dobra Tricipital',
  'Dobra Bicipital',
  'Dobra Abdominal',
  'Dobra Subescapular',
  'Dobra Axilar Média',
  'Dobra da Coxa',
  'Dobra Torácica',
  'Dobra Suprailíaca',
];
export const CIRCS = [
  'Circunferência da Cintura',
  'Circunferência do Quadril',
  'Circunferência do Abdomen',
  'Circunf. do Braço Relaxado',
  'Circunf. Medial da Coxa',
];
export const MEASURE_GROUPS: [string, string[]][] = [
  ['Circunferências', CIRCS],
  ['Dobras cutâneas', DOBRAS],
];
/** Medidas em que aumentar é bom. */
export const GROW_IS_GOOD = new Set(['Circunf. do Braço Relaxado']);

export const SHORT = (m: string) => {
  const t = m.replace(/^(Dobra|Circunferência|Circunf\.)\s+(d[aoe]\s+)?/, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const UNIT = (m: string) => (DOBRAS.includes(m) ? 'mm' : 'cm');

export const ANGLES: Angle[] = ['Frente', 'Lado', 'Costas'];
export const INTENSITIES: Intensity[] = ['Leve', 'Moderada', 'Intensa'];

export const PER: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o período',
  custom: 'Personalizado',
};
export const DUR: Record<Duration, string> = {
  curto: 'Até 30 min',
  medio: '30 a 60 min',
  longo: 'Mais de 60 min',
};

export const DEFAULT_FILTER: Filter = { per: '7d', from: '', to: '', mods: [], dur: null, ints: [] };

/* ---------- Saúde ---------- */

export const HTYPES: Record<
  HealthType,
  { label: string; icon: string; catLabel: string; cats: string[]; titleLabel: string; titlePh: string; whoLabel: string; bg: string; fg: string }
> = {
  consulta: {
    label: 'Consulta',
    icon: 'mc:stethoscope',
    catLabel: 'Especialidade',
    cats: ['Clínico geral', 'Cardiologista', 'Endocrinologista', 'Nutricionista', 'Ortopedista', 'Dermatologista', 'Dentista', 'Outra'],
    titleLabel: 'Motivo',
    titlePh: 'Ex.: Check-up anual',
    whoLabel: 'Médico(a)',
    bg: C.primary90,
    fg: C.primary10,
  },
  exame: {
    label: 'Exame',
    icon: 'biotech',
    catLabel: 'Tipo de exame',
    cats: ['Exame de sangue', 'Urina', 'Imagem', 'Cardiológico', 'Outro'],
    titleLabel: 'Nome do exame',
    titlePh: 'Ex.: Hemograma completo',
    whoLabel: 'Laboratório',
    bg: C.secondary90,
    fg: C.secondary10,
  },
  laudo: {
    label: 'Laudo',
    icon: 'description',
    catLabel: 'Tipo de laudo',
    cats: ['Imagem', 'Cardiológico', 'Bioimpedância', 'Atestado', 'Outro'],
    titleLabel: 'Título',
    titlePh: 'Ex.: Ressonância do joelho',
    whoLabel: 'Médico(a)',
    bg: C.tertiary95,
    fg: C.tertiary30,
  },
};
export const HTYPE_KEYS = Object.keys(HTYPES) as HealthType[];

export const HFILTERS = ['Todos', 'Consultas', 'Exames', 'Laudos'] as const;
export type HFilter = (typeof HFILTERS)[number];
export const HFILTER_TYPE: Record<HFilter, HealthType | null> = { Todos: null, Consultas: 'consulta', Exames: 'exame', Laudos: 'laudo' };

/* ---------- Exportação da dieta ---------- */

export const DEFAULT_EXPORT: ExportOptions = { per: '30d', from: '', to: '', fmt: 'pdf', notes: true };

/* ---------- App ---------- */

export const APP_NAME = 'Fit Diário';
/** Página pública da política de privacidade (obrigatória nas duas lojas). */
export const PRIVACY_URL = 'https://fitdiario.digitalspark.click/privacidade';
export const SUPPORT_EMAIL = 'contato@digitalspark.click';
