import * as SQLite from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system';
import { DEFAULT_MEALS, DEFAULT_MODS } from './constants';
import { Angle, Attachment, Data, DietDay, HealthRecord, MealStatus, Mod, Workout } from './types';

/**
 * Persistência 100% local: SQLite para os dados e a pasta de documentos do app
 * para as fotos (o banco guarda só o nome do arquivo).
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meals (name TEXT PRIMARY KEY NOT NULL, position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS mods (name TEXT PRIMARY KEY NOT NULL, icon TEXT NOT NULL, dist INTEGER NOT NULL, fc INTEGER NOT NULL, position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY NOT NULL, date TEXT NOT NULL, mod TEXT NOT NULL, min REAL NOT NULL, kcal REAL NOT NULL,
  dist REAL, fc REAL, intensity TEXT NOT NULL, obs TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS workouts_date ON workouts(date);
CREATE TABLE IF NOT EXISTS body (date TEXT PRIMARY KEY NOT NULL, w REAL, f REAL);
CREATE TABLE IF NOT EXISTS measures (date TEXT NOT NULL, name TEXT NOT NULL, value REAL NOT NULL, PRIMARY KEY (date, name));
CREATE TABLE IF NOT EXISTS photos (date TEXT NOT NULL, angle TEXT NOT NULL, file TEXT NOT NULL, PRIMARY KEY (date, angle));
CREATE TABLE IF NOT EXISTS diet_days (date TEXT PRIMARY KEY NOT NULL, day TEXT, note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS diet_meals (date TEXT NOT NULL, meal TEXT NOT NULL, status TEXT NOT NULL, PRIMARY KEY (date, meal));
`;

/** v2: registros de saúde (consultas, exames, laudos) com anexo opcional. */
const SCHEMA_V2 = `
CREATE TABLE IF NOT EXISTS health (
  id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, cat TEXT NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL,
  who TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
  file TEXT, file_name TEXT, file_kind TEXT, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS health_date ON health(date);
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

async function openDb() {
  const db = await SQLite.openDatabaseAsync('diario-fitness.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA);
      for (let i = 0; i < DEFAULT_MEALS.length; i++) {
        await db.runAsync('INSERT OR IGNORE INTO meals (name, position) VALUES (?, ?)', [DEFAULT_MEALS[i], i]);
      }
      for (let i = 0; i < DEFAULT_MODS.length; i++) {
        const m = DEFAULT_MODS[i];
        await db.runAsync('INSERT OR IGNORE INTO mods (name, icon, dist, fc, position) VALUES (?, ?, ?, ?, ?)', [
          m.name, m.icon, m.dist ? 1 : 0, m.fc ? 1 : 0, i,
        ]);
      }
    });
    await db.execAsync('PRAGMA user_version = 1');
  }
  if ((row?.user_version ?? 0) < 2) {
    await db.execAsync(SCHEMA_V2);
    await db.execAsync('PRAGMA user_version = 2');
  }
  return db;
}

/* ---------------- Fotos ---------------- */

function photosDir() {
  const d = new Directory(Paths.document, 'photos');
  if (!d.exists) d.create();
  return d;
}
export const photoUri = (file: string) => new File(Paths.document, 'photos', file).uri;

function storePhotoFile(tmpUri: string, date: string, angle: Angle) {
  const name = `${date}_${angle}_${Date.now()}.jpg`;
  new File(tmpUri).copy(new File(photosDir(), name));
  return name;
}
function deletePhotoFile(name: string) {
  try {
    const f = new File(Paths.document, 'photos', name);
    if (f.exists) f.delete();
  } catch {
    // arquivo já removido
  }
}

/* ---------------- Anexos de saúde ---------------- */

function healthDir() {
  const d = new Directory(Paths.document, 'health');
  if (!d.exists) d.create();
  return d;
}
const healthUri = (file: string) => new File(Paths.document, 'health', file).uri;

/* ---------------- Leitura ---------------- */

export async function loadAll(): Promise<Data> {
  const db = await getDb();
  const meals = (await db.getAllAsync<{ name: string }>('SELECT name FROM meals ORDER BY position')).map((r) => r.name);
  const mods: Mod[] = (
    await db.getAllAsync<{ name: string; icon: string; dist: number; fc: number }>('SELECT name, icon, dist, fc FROM mods ORDER BY position')
  ).map((r) => ({ name: r.name, icon: r.icon, dist: !!r.dist, fc: !!r.fc }));

  const workouts: Workout[] = (
    await db.getAllAsync<{
      id: string; date: string; mod: string; min: number; kcal: number; dist: number | null; fc: number | null;
      intensity: string; obs: string; created_at: number;
    }>('SELECT * FROM workouts ORDER BY date DESC, created_at DESC')
  ).map((r) => ({
    id: r.id, date: r.date, mod: r.mod, min: r.min, kcal: r.kcal, dist: r.dist, fc: r.fc,
    int: r.intensity as Workout['int'], obs: r.obs, createdAt: r.created_at,
  }));

  const body = await db.getAllAsync<{ date: string; w: number | null; f: number | null }>('SELECT date, w, f FROM body ORDER BY date');

  const measures: Data['measures'] = [];
  for (const r of await db.getAllAsync<{ date: string; name: string; value: number }>('SELECT date, name, value FROM measures ORDER BY date')) {
    let e = measures[measures.length - 1];
    if (!e || e.date !== r.date) measures.push((e = { date: r.date, vals: {} }));
    e.vals[r.name] = r.value;
  }

  const photoSets: Data['photoSets'] = [];
  for (const r of await db.getAllAsync<{ date: string; angle: Angle; file: string }>('SELECT date, angle, file FROM photos ORDER BY date')) {
    let e = photoSets[photoSets.length - 1];
    if (!e || e.date !== r.date) photoSets.push((e = { date: r.date, shots: {} }));
    e.shots[r.angle] = photoUri(r.file);
  }

  const diet: Record<string, DietDay> = {};
  for (const r of await db.getAllAsync<{ date: string; day: MealStatus | null; note: string }>('SELECT date, day, note FROM diet_days')) {
    diet[r.date] = { meals: {}, day: r.day, note: r.note };
  }
  for (const r of await db.getAllAsync<{ date: string; meal: string; status: MealStatus }>('SELECT date, meal, status FROM diet_meals')) {
    (diet[r.date] ??= { meals: {}, day: null, note: '' }).meals[r.meal] = r.status;
  }

  const health: HealthRecord[] = (
    await db.getAllAsync<{
      id: string; type: HealthRecord['type']; cat: string; title: string; date: string; who: string; notes: string;
      file: string | null; file_name: string | null; file_kind: Attachment['kind'] | null; created_at: number;
    }>('SELECT * FROM health ORDER BY date DESC, created_at DESC')
  ).map((r) => ({
    id: r.id, type: r.type, cat: r.cat, title: r.title, date: r.date, who: r.who, notes: r.notes, createdAt: r.created_at,
    file: r.file ? { name: r.file_name ?? r.file, kind: r.file_kind ?? 'pdf', uri: healthUri(r.file) } : null,
  }));

  return { meals, mods, workouts, body, measures, photoSets, diet, health };
}

/* ---------------- Escrita ---------------- */

export async function insertWorkout(w: Workout) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO workouts (id, date, mod, min, kcal, dist, fc, intensity, obs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [w.id, w.date, w.mod, w.min, w.kcal, w.dist, w.fc, w.int, w.obs, w.createdAt],
  );
}
export async function deleteWorkout(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
}

export async function insertMod(m: Mod) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO mods (name, icon, dist, fc, position) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM mods))',
    [m.name, m.icon, m.dist ? 1 : 0, m.fc ? 1 : 0],
  );
}

export async function upsertBody(date: string, w: number | null, f: number | null) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO body (date, w, f) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET w = COALESCE(excluded.w, body.w), f = COALESCE(excluded.f, body.f)`,
    [date, w, f],
  );
}

export async function upsertMeasures(date: string, vals: Record<string, number>) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const [name, value] of Object.entries(vals)) {
      await db.runAsync('INSERT OR REPLACE INTO measures (date, name, value) VALUES (?, ?, ?)', [date, name, value]);
    }
  });
}

/** Salva as fotos (URIs temporárias) e devolve as URIs permanentes por ângulo. */
export async function savePhotos(date: string, shots: Partial<Record<Angle, string>>) {
  const db = await getDb();
  const out: Partial<Record<Angle, string>> = {};
  for (const [angle, tmp] of Object.entries(shots) as [Angle, string][]) {
    const old = await db.getFirstAsync<{ file: string }>('SELECT file FROM photos WHERE date = ? AND angle = ?', [date, angle]);
    const file = storePhotoFile(tmp, date, angle);
    await db.runAsync('INSERT OR REPLACE INTO photos (date, angle, file) VALUES (?, ?, ?)', [date, angle, file]);
    if (old) deletePhotoFile(old.file);
    out[angle] = photoUri(file);
  }
  return out;
}

export async function deletePhotoSet(date: string) {
  const db = await getDb();
  const rows = await db.getAllAsync<{ file: string }>('SELECT file FROM photos WHERE date = ?', [date]);
  await db.runAsync('DELETE FROM photos WHERE date = ?', [date]);
  rows.forEach((r) => deletePhotoFile(r.file));
}

async function ensureDietDay(db: SQLite.SQLiteDatabase, date: string) {
  await db.runAsync("INSERT OR IGNORE INTO diet_days (date, day, note) VALUES (?, NULL, '')", [date]);
}
export async function setMealStatus(date: string, meal: string, status: MealStatus | null) {
  const db = await getDb();
  if (status) await db.runAsync('INSERT OR REPLACE INTO diet_meals (date, meal, status) VALUES (?, ?, ?)', [date, meal, status]);
  else await db.runAsync('DELETE FROM diet_meals WHERE date = ? AND meal = ?', [date, meal]);
}
export async function setDayStatus(date: string, day: MealStatus | null) {
  const db = await getDb();
  await ensureDietDay(db, date);
  await db.runAsync('UPDATE diet_days SET day = ? WHERE date = ?', [day, date]);
}
export async function setDietNote(date: string, note: string) {
  const db = await getDb();
  await ensureDietDay(db, date);
  await db.runAsync('UPDATE diet_days SET note = ? WHERE date = ?', [note, date]);
}

export async function saveMealList(names: string[]) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM meals');
    for (let i = 0; i < names.length; i++) {
      await db.runAsync('INSERT INTO meals (name, position) VALUES (?, ?)', [names[i], i]);
    }
  });
}

/** Salva o registro; o anexo (URI temporária) é copiado para a pasta do app. Devolve o registro com a URI final. */
export async function insertHealth(h: HealthRecord): Promise<HealthRecord> {
  const db = await getDb();
  let stored: string | null = null;
  let file = h.file;
  if (h.file) {
    const ext = h.file.kind === 'pdf' ? 'pdf' : 'jpg';
    stored = `${h.id}.${ext}`;
    new File(h.file.uri).copy(new File(healthDir(), stored));
    file = { ...h.file, uri: healthUri(stored) };
  }
  await db.runAsync(
    'INSERT INTO health (id, type, cat, title, date, who, notes, file, file_name, file_kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [h.id, h.type, h.cat, h.title, h.date, h.who, h.notes, stored, h.file?.name ?? null, h.file?.kind ?? null, h.createdAt],
  );
  return { ...h, file };
}

export async function deleteHealth(id: string) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ file: string | null }>('SELECT file FROM health WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM health WHERE id = ?', [id]);
  if (row?.file) {
    try {
      const f = new File(Paths.document, 'health', row.file);
      if (f.exists) f.delete();
    } catch {
      // já removido
    }
  }
}
