import { add, nf, pd, short, signed } from './format';
import { BodyEntry, DietDay, Filter, Workout } from './types';

export function applyFilter(list: Workout[], fl: Filter, today: string) {
  const days = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number | undefined>)[fl.per];
  return list.filter((w) => {
    if (days && !(w.date > add(today, -days))) return false;
    if (fl.per === 'custom') {
      if (fl.from && w.date < fl.from) return false;
      if (fl.to && w.date > fl.to) return false;
    }
    if (fl.mods.length && !fl.mods.includes(w.mod)) return false;
    if (fl.ints.length && !fl.ints.includes(w.int)) return false;
    if (fl.dur === 'curto' && w.min > 30) return false;
    if (fl.dur === 'medio' && (w.min < 30 || w.min > 60)) return false;
    if (fl.dur === 'longo' && w.min <= 60) return false;
    return true;
  });
}

export function streakInfo(diet: Record<string, DietDay>, today: string) {
  const done = (d: string) => !!(diet[d] && diet[d].day);
  const todayDone = done(today);
  let count = 0;
  let d = todayDone ? today : add(today, -1);
  while (done(d)) {
    count++;
    d = add(d, -1);
  }
  const dates = Object.keys(diet).filter(done).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const x of dates) {
    run = prev && add(prev, 1) === x ? run + 1 : 1;
    best = Math.max(best, run);
    prev = x;
  }
  return { count, todayDone, best: Math.max(best, count), total: dates.length, done };
}

export type ChartPeriod = '30d' | '90d' | '1 ano';
export type Metric = 'Peso' | '% Gordura';

export const CHART = { W: 342, H: 180, X0: 36, X1: 334, Y0: 16, Y1: 144 };

export function buildChart(body: BodyEntry[], metric: Metric, period: ChartPeriod, today: string) {
  const isW = metric === 'Peso';
  const val = (b: BodyEntry) => (isW ? b.w : b.f);
  const days = { '30d': 30, '90d': 90, '1 ano': 365 }[period];
  const start = add(today, -days);
  const series = body.filter((b) => val(b) != null);
  if (!series.length) return null;
  let pts = series.filter((b) => b.date >= start);
  if (pts.length < 2) pts = series.slice(-2);
  if (pts.length === 1) pts = [pts[0], pts[0]];
  const vals = pts.map((b) => val(b) as number);
  let mn = Math.min(...vals);
  let mx = Math.max(...vals);
  const pad = Math.max((mx - mn) * 0.15, 0.5);
  mn -= pad;
  mx += pad;
  const { X0, X1, Y0, Y1 } = CHART;
  const t0 = pd(pts[0].date).getTime();
  const t1 = pd(pts[pts.length - 1].date).getTime();
  const span = t1 - t0 || 1;
  const xy = pts.map((b, i) => [
    t1 === t0 ? (i === 0 ? X0 : X1) : X0 + ((pd(b.date).getTime() - t0) / span) * (X1 - X0),
    Y1 - ((vals[i] - mn) / (mx - mn)) * (Y1 - Y0),
  ]);
  const points = xy.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area =
    'M' + xy[0][0].toFixed(1) + ' ' + Y1 +
    ' L' + xy.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') +
    ' L' + xy[xy.length - 1][0].toFixed(1) + ' ' + Y1 + ' Z';
  const delta = vals[vals.length - 1] - vals[0];
  return {
    points,
    area,
    lastX: xy[xy.length - 1][0],
    lastY: xy[xy.length - 1][1],
    yMax: nf(mx),
    yMid: nf((mx + mn) / 2),
    yMin: nf(mn),
    xStart: short(pts[0].date),
    xEnd: short(pts[pts.length - 1].date),
    current: nf(vals[vals.length - 1]),
    unit: isW ? 'kg' : '%',
    delta: signed(delta) + (isW ? ' kg' : ' pp'),
    good: delta <= 0,
  };
}

/** Pontos de uma sparkline (polyline) de largura w e altura h. */
export function sparkPoints(vs: number[], w: number, h: number, padY = 2) {
  const mn = Math.min(...vs);
  const mx = Math.max(...vs);
  return vs
    .map((v, j) => ((j / Math.max(vs.length - 1, 1)) * w).toFixed(1) + ',' + (padY + (1 - (v - mn) / (mx - mn || 1)) * (h - padY * 2)).toFixed(1))
    .join(' ');
}

/** Valor mais recente (até a data) de peso ou gordura. */
export function nearest(body: BodyEntry[], date: string, k: 'w' | 'f') {
  const c = body.filter((b) => b[k] != null && b.date <= date);
  return c.length ? (c[c.length - 1][k] as number) : null;
}
