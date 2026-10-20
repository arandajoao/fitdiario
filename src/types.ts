export type Intensity = 'Leve' | 'Moderada' | 'Intensa';

export type Mod = { name: string; icon: string; dist: boolean; fc: boolean };

export type Workout = {
  id: string;
  date: string; // AAAA-MM-DD
  mod: string;
  min: number;
  kcal: number;
  dist: number | null;
  fc: number | null;
  int: Intensity;
  obs: string;
  createdAt: number;
};

export type BodyEntry = { date: string; w: number | null; f: number | null };

export type MeasureEntry = { date: string; vals: Record<string, number> };

export type Angle = 'Frente' | 'Lado' | 'Costas';

/** Um conjunto de fotos por dia. `shots` guarda a URI local de cada ângulo. */
export type PhotoSet = { date: string; shots: Partial<Record<Angle, string>> };

export type MealStatus = 'segui' | 'adaptei' | 'sai';

export type DietDay = {
  meals: Record<string, MealStatus>;
  day: MealStatus | null;
  note: string;
};

export type Data = {
  meals: string[];
  mods: Mod[];
  workouts: Workout[];
  body: BodyEntry[];
  measures: MeasureEntry[];
  photoSets: PhotoSet[];
  diet: Record<string, DietDay>;
  health: HealthRecord[];
};

export type Period = '7d' | '30d' | '90d' | 'all' | 'custom';
export type Duration = 'curto' | 'medio' | 'longo';

export type Filter = {
  per: Period;
  from: string;
  to: string;
  mods: string[];
  dur: Duration | null;
  ints: Intensity[];
};

export type Tab = 'Hoje' | 'Treinos' | 'Corpo' | 'Dieta' | 'Saúde';

export type HealthType = 'consulta' | 'exame' | 'laudo';

export type Attachment = { name: string; kind: 'img' | 'pdf'; uri: string };

export type HealthRecord = {
  id: string;
  type: HealthType;
  cat: string;
  title: string;
  date: string;
  who: string;
  notes: string;
  file: Attachment | null;
  createdAt: number;
};

export type ExportFormat = 'pdf' | 'csv' | 'texto';
export type ExportOptions = { per: '7d' | '30d' | '90d' | 'custom'; from: string; to: string; fmt: ExportFormat; notes: boolean };
