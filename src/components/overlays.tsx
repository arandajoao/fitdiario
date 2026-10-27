import React from 'react';
import { Text, TextStyle, View } from 'react-native';
import { APP_NAME } from '../constants';
import { add, hm, intf, nf, pd, short, WD } from '../format';
import { F } from '../theme';
import { Workout } from '../types';
import { Icon } from './ui';

/**
 * Overlays de compartilhamento: só texto e ícones sobre fundo transparente,
 * para o usuário colar por cima da própria foto nos stories.
 */

export type Stat = { label: string; value: string; unit: string };

/** O que um overlay mostra — um treino ou o resumo da semana. */
export type ShareData = {
  title: string;
  sub: string;
  icon: string;
  stats: Stat[];
  days?: { label: string; on: boolean }[];
};

const pace = (minPerUnit: number) => {
  const s = Math.round(minPerUnit * 60);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

const timeStat = (min: number): Stat =>
  min < 60 ? { label: 'Tempo', value: String(Math.round(min)), unit: 'min' } : { label: 'Tempo', value: hm(min), unit: '' };

/** Números do treino na ordem de destaque: distância, tempo, ritmo, calorias, FC. */
export function workoutShare(w: Workout, icon: string): ShareData {
  const stats: Stat[] = [];
  if (w.dist) stats.push({ label: 'Distância', value: w.unit === 'm' ? intf(w.dist * 1000) : nf(w.dist, 2), unit: w.unit });
  stats.push(timeStat(w.min));
  if (w.dist && w.min) {
    // Em metros (natação, pista) o ritmo usual é por 100 m
    stats.push(w.unit === 'm' ? { label: 'Ritmo', value: pace(w.min / (w.dist * 10)), unit: '/100m' } : { label: 'Ritmo', value: pace(w.min / w.dist), unit: '/km' });
  }
  if (w.kcal) stats.push({ label: 'Calorias', value: intf(w.kcal), unit: 'kcal' });
  if (w.fc) stats.push({ label: 'FC média', value: String(Math.round(w.fc)), unit: 'bpm' });
  return { title: w.mod, sub: short(w.date), icon, stats };
}

/** Resumo dos últimos 7 dias (o mesmo recorte do card "Esta semana"). */
export function weekShare(workouts: Workout[], today: string): ShareData {
  const from = add(today, -6);
  const week = workouts.filter((w) => w.date >= from && w.date <= today);
  const trained = new Set(week.map((w) => w.date));
  const sum = (k: 'min' | 'kcal' | 'dist') => week.reduce((a, w) => a + (w[k] || 0), 0);
  const stats: Stat[] = [{ label: 'Treinos', value: String(week.length), unit: week.length === 1 ? 'treino' : 'treinos' }, timeStat(sum('min'))];
  if (sum('dist')) stats.push({ label: 'Distância', value: nf(sum('dist'), 2), unit: 'km' });
  if (sum('kcal')) stats.push({ label: 'Calorias', value: intf(sum('kcal')), unit: 'kcal' });
  return {
    title: 'Minha semana',
    sub: short(from) + ' – ' + short(today),
    icon: 'calendar-month',
    stats,
    days: Array.from({ length: 7 }, (_, i) => {
      const d = add(today, i - 6);
      return { label: WD[pd(d).getDay()], on: trained.has(d) };
    }),
  };
}

export const INKS = [
  { name: 'Branco', color: '#ffffff' },
  { name: 'Preto', color: '#111111' },
  { name: 'Verde', color: '#dde3c1' },
  { name: 'Laranja', color: '#f37513' },
];

/** Cor escura? (decide o vidro do cartão e o xadrez da prévia) */
export const isDarkInk = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 128;
};

type P = { s: ShareData; ink: string; brand: boolean };

const t = (fontFamily: string, fontSize: number, color: string, extra?: TextStyle): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight: Math.round(fontSize * 1.2),
  color,
  ...extra,
});
const label = (ink: string) => t(F.bold, 11, ink, { letterSpacing: 1.5, opacity: 0.8 });
const inline = (s: Stat) => s.value + (s.unit ? ' ' + s.unit : '');

function Brand({ ink, style }: { ink: string; style?: TextStyle }) {
  return <Text style={[t(F.bold, 11, ink, { letterSpacing: 2, opacity: 0.75 }), style]}>{APP_NAME.toUpperCase()}</Text>;
}

function Value({ s, size, ink }: { s: Stat; size: number; ink: string }) {
  return (
    <Text style={t(F.bold, size, ink)}>
      {s.value}
      {s.unit ? <Text style={t(F.medium, Math.round(size * 0.5), ink)}> {s.unit}</Text> : null}
    </Text>
  );
}

/** Os 7 dias: bolinha cheia nos dias com treino. */
function Days({ days, ink, size = 22 }: { days: NonNullable<ShareData['days']>; ink: string; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {days.map((d, i) => (
        <View key={i} style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: ink, backgroundColor: d.on ? ink : 'transparent' }} />
          <Text style={t(F.bold, 10, ink, { opacity: 0.8 })}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Pilha centralizada: um número grande por linha. */
function Coluna({ s, ink, brand }: P) {
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Text style={t(F.bold, 17, ink)}>{s.title}</Text>
      {s.stats.slice(0, 3).map((x) => (
        <View key={x.label} style={{ alignItems: 'center' }}>
          <Text style={label(ink)}>{x.label.toUpperCase()}</Text>
          <Value s={x} size={38} ink={ink} />
        </View>
      ))}
      {s.days ? <Days days={s.days} ink={ink} /> : null}
      {brand ? <Brand ink={ink} /> : null}
    </View>
  );
}

/** Cabeçalho com data, filete e três números lado a lado. */
function Linha({ s, ink, brand }: P) {
  return (
    <View style={{ width: 300, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Text style={[t(F.bold, 20, ink), { flexShrink: 1 }]} numberOfLines={1}>
          {s.title}
        </Text>
        <Text style={t(F.medium, 13, ink, { opacity: 0.8 })}>{s.sub}</Text>
      </View>
      <View style={{ height: 2, borderRadius: 1, backgroundColor: ink }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {s.stats.slice(0, 3).map((x) => (
          <View key={x.label}>
            <Text style={label(ink)}>{x.label.toUpperCase()}</Text>
            <Value s={x} size={24} ink={ink} />
          </View>
        ))}
      </View>
      {s.days ? <Days days={s.days} ink={ink} size={18} /> : null}
      {brand ? <Brand ink={ink} style={{ textAlign: 'right' }} /> : null}
    </View>
  );
}

/** Um número gigante e o resto em uma linha. */
function Destaque({ s, ink, brand }: P) {
  const [main, ...rest] = s.stats;
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Text style={t(F.bold, 15, ink, { letterSpacing: 1, opacity: 0.85 })}>{(s.title + ' · ' + s.sub).toUpperCase()}</Text>
      <Text style={t(F.bold, 92, ink, { lineHeight: 100, letterSpacing: -3 })}>
        {main.value}
        {main.unit ? <Text style={t(F.bold, 30, ink, { letterSpacing: 0 })}> {main.unit}</Text> : null}
      </Text>
      {rest.length ? <Text style={t(F.medium, 16, ink)}>{rest.slice(0, 3).map(inline).join('   ')}</Text> : null}
      {s.days ? (
        <View style={{ marginTop: 12 }}>
          <Days days={s.days} ink={ink} size={18} />
        </View>
      ) : null}
      {brand ? <Brand ink={ink} style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

/** Ícone num círculo, como um selo. */
function Selo({ s, ink, brand }: P) {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: ink, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={s.icon} size={40} color={ink} />
      </View>
      <Text style={t(F.bold, 22, ink)}>{s.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {s.stats.slice(0, 2).map((x, i) => (
          <React.Fragment key={x.label}>
            {i ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ink }} /> : null}
            <Value s={x} size={22} ink={ink} />
          </React.Fragment>
        ))}
      </View>
      {brand ? <Brand ink={ink} /> : null}
    </View>
  );
}

/** Cartão com fundo translúcido; legível em qualquer foto. */
function Cartao({ s, ink, brand }: P) {
  const dark = isDarkInk(ink);
  return (
    <View style={{ width: 300, padding: 18, gap: 16, borderRadius: 22, backgroundColor: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.38)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)' }}>
          <Icon name={s.icon} size={24} color={ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={t(F.bold, 18, ink)} numberOfLines={1}>
            {s.title}
          </Text>
          <Text style={t(F.medium, 12, ink, { opacity: 0.8 })}>{s.sub}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
        {s.stats.slice(0, 4).map((x) => (
          <View key={x.label} style={{ width: '50%' }}>
            <Text style={label(ink)}>{x.label.toUpperCase()}</Text>
            <Value s={x} size={24} ink={ink} />
          </View>
        ))}
      </View>
      {s.days ? <Days days={s.days} ink={ink} size={26} /> : null}
      {brand ? <Brand ink={ink} /> : null}
    </View>
  );
}

/** Uma linha só, discreta. */
function Minimo({ s, ink, brand }: P) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={s.icon} size={22} color={ink} />
        <Text style={t(F.bold, 18, ink)}>{[s.title, ...s.stats.slice(0, 2).map(inline)].join('  ·  ')}</Text>
      </View>
      {brand ? <Brand ink={ink} /> : null}
    </View>
  );
}

export const TEMPLATES: { name: string; C: (p: P) => React.JSX.Element }[] = [
  { name: 'Coluna', C: Coluna },
  { name: 'Destaque', C: Destaque },
  { name: 'Linha', C: Linha },
  { name: 'Cartão', C: Cartao },
  { name: 'Selo', C: Selo },
  { name: 'Mínimo', C: Minimo },
];
