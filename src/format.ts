export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MONTHS_L = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const WDL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const pd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const iso = (x: Date) =>
  x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
export const todayISO = () => iso(new Date());
export const add = (s: string, n: number) => {
  const x = pd(s);
  x.setDate(x.getDate() + n);
  return iso(x);
};
export const short = (s: string) => {
  const x = pd(s);
  return x.getDate() + ' ' + MONTHS[x.getMonth()];
};
export const longLabel = (s: string) => {
  const x = pd(s);
  return WDL[x.getDay()] + ', ' + x.getDate() + ' de ' + MONTHS_L[x.getMonth()];
};
export const daysBetween = (a: string, b: string) => Math.round((pd(b).getTime() - pd(a).getTime()) / 864e5);
export const relLabel = (d: string, today: string) =>
  d === today ? 'Hoje' : d === add(today, -1) ? 'Ontem' : longLabel(d);

const groupThousands = (intPart: string) => intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Número em pt-BR. Com d=1 sempre mostra 1 casa (como no design). */
export const nf = (v: number | null | undefined, d = 1) => {
  if (v == null || isNaN(v)) return '—';
  const minD = d === 1 ? 1 : 0;
  let s = Math.abs(v).toFixed(d);
  if (d > minD) s = s.replace(/0+$/, '').replace(/\.$/, '');
  const [i, f] = s.split('.');
  return (v < 0 ? '-' : '') + groupThousands(i) + (f ? ',' + f : '');
};
export const intf = (v: number) => groupThousands(String(Math.round(v)));
export const signed = (v: number, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d);
export const hm = (min: number) => {
  const m = Math.round(min);
  return Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0');
};

/** Converte texto digitado (aceita vírgula) para número > 0, ou null. */
export const parseNum = (v: string | undefined | null) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isNaN(n) || n <= 0 ? null : n;
};

/** "Hoje", "Há 3 dias", "Há 4 meses", "Há 1 ano e 2 meses". */
export const relAgo = (d: string, today: string) => {
  const n = daysBetween(d, today);
  if (n <= 0) return 'Hoje';
  if (n < 30) return n === 1 ? 'Há 1 dia' : 'Há ' + n + ' dias';
  const m = Math.floor(n / 30.44);
  if (m < 12) return m === 1 ? 'Há 1 mês' : 'Há ' + m + ' meses';
  const y = Math.floor(m / 12);
  const rm = m % 12;
  return 'Há ' + y + (y === 1 ? ' ano' : ' anos') + (rm ? ' e ' + rm + (rm === 1 ? ' mês' : ' meses') : '');
};

/** dd/mm/aaaa */
export const dmy = (s: string) => {
  const x = pd(s);
  return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear();
};
