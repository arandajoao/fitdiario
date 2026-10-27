import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as db from './db';
import { todayISO } from './format';
import { Angle, Data, DietDay, HealthRecord, MealStatus, Mod, Workout } from './types';

const EMPTY: Data = { meals: [], mods: [], workouts: [], body: [], measures: [], photoSets: [], diet: {}, health: [] };
const emptyDay = (): DietDay => ({ meals: {}, day: null, note: '' });
const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);

function useToday() {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const tick = () => setToday(todayISO());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    const id = setInterval(tick, 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);
  return today;
}

function useActions(setData: React.Dispatch<React.SetStateAction<Data>>) {
  return useMemo(() => {
    const patchDiet = (date: string, fn: (d: DietDay) => DietDay) =>
      setData((s) => {
        const cur = s.diet[date] ?? emptyDay();
        return { ...s, diet: { ...s.diet, [date]: fn({ ...cur, meals: { ...cur.meals } }) } };
      });

    return {
      async addWorkout(w: Workout) {
        await db.insertWorkout(w);
        setData((s) => ({ ...s, workouts: [w, ...s.workouts] }));
      },
      async updateWorkout(w: Workout) {
        await db.updateWorkout(w);
        setData((s) => ({ ...s, workouts: s.workouts.map((x) => (x.id === w.id ? w : x)) }));
      },
      async deleteWorkout(id: string) {
        await db.deleteWorkout(id);
        setData((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }));
      },
      async addMod(m: Mod) {
        await db.insertMod(m);
        setData((s) => ({ ...s, mods: [...s.mods, m] }));
      },
      async saveBody(date: string, w: number | null, f: number | null) {
        await db.upsertBody(date, w, f);
        setData((s) => {
          const ex = s.body.find((b) => b.date === date);
          const e = { date, w: w ?? ex?.w ?? null, f: f ?? ex?.f ?? null };
          return { ...s, body: [...s.body.filter((b) => b.date !== date), e].sort(byDate) };
        });
      },
      async saveMeasures(date: string, vals: Record<string, number>) {
        await db.upsertMeasures(date, vals);
        setData((s) => {
          const ex = s.measures.find((m) => m.date === date);
          const e = { date, vals: { ...(ex?.vals ?? {}), ...vals } };
          return { ...s, measures: [...s.measures.filter((m) => m.date !== date), e].sort(byDate) };
        });
      },
      async savePhotos(date: string, shots: Partial<Record<Angle, string>>) {
        const saved = await db.savePhotos(date, shots);
        setData((s) => {
          const ex = s.photoSets.find((p) => p.date === date);
          const e = { date, shots: { ...(ex?.shots ?? {}), ...saved } };
          return { ...s, photoSets: [...s.photoSets.filter((p) => p.date !== date), e].sort(byDate) };
        });
      },
      async deletePhotoSet(date: string) {
        await db.deletePhotoSet(date);
        setData((s) => ({ ...s, photoSets: s.photoSets.filter((p) => p.date !== date) }));
      },
      async setMealStatus(date: string, meal: string, status: MealStatus | null) {
        patchDiet(date, (d) => {
          if (status) d.meals[meal] = status;
          else delete d.meals[meal];
          return d;
        });
        await db.setMealStatus(date, meal, status);
      },
      async setDayStatus(date: string, day: MealStatus | null) {
        patchDiet(date, (d) => ({ ...d, day }));
        await db.setDayStatus(date, day);
      },
      async setDietNote(date: string, note: string) {
        patchDiet(date, (d) => ({ ...d, note }));
        await db.setDietNote(date, note);
      },
      async addHealth(h: HealthRecord) {
        const saved = await db.insertHealth(h);
        setData((s) => ({ ...s, health: [saved, ...s.health] }));
      },
      async deleteHealth(id: string) {
        await db.deleteHealth(id);
        setData((s) => ({ ...s, health: s.health.filter((x) => x.id !== id) }));
      },
      async setMeals(names: string[]) {
        setData((s) => ({ ...s, meals: names }));
        await db.saveMealList(names);
      },
    };
  }, [setData]);
}

type Ctx = {
  ready: boolean;
  data: Data;
  today: string;
  snack: string;
  toast: (msg: string) => void;
  actions: ReturnType<typeof useActions>;
};

const DiaryContext = createContext<Ctx | null>(null);

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const [snack, setSnack] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const today = useToday();
  const actions = useActions(setData);

  useEffect(() => {
    db.loadAll()
      .then(setData)
      .catch((e) => console.warn('Falha ao carregar dados', e))
      .finally(() => setReady(true));
  }, []);

  const toast = useCallback((msg: string) => {
    setSnack(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSnack(''), 2200);
  }, []);

  const value = useMemo(() => ({ ready, data, today, snack, toast, actions }), [ready, data, today, snack, toast, actions]);
  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary fora do DiaryProvider');
  return ctx;
}

export function useModIcon() {
  const { data } = useDiary();
  return useCallback((name: string) => data.mods.find((m) => m.name === name)?.icon ?? 'bolt', [data.mods]);
}

export const dietOf = (data: Data, date: string): DietDay => data.diet[date] ?? emptyDay();
