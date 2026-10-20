import React, { useState } from 'react';
import { View } from 'react-native';
import { PhotoTile } from '../components/parts';
import { Button, Grid, Tabs, Txt } from '../components/ui';
import { ANGLES } from '../constants';
import { daysBetween, nf, pd, short, signed } from '../format';
import { nearest } from '../logic';
import { useDiary } from '../store';
import { C, R } from '../theme';
import { Angle } from '../types';

export function CompareSheet({ dates, onClose }: { dates: string[]; onClose: () => void }) {
  const { data } = useDiary();
  const pair = dates
    .map((d) => data.photoSets.find((p) => p.date === d))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => a.date.localeCompare(b.date));
  const [angle, setAngle] = useState<Angle>(ANGLES.find((a) => pair.every((p) => p.shots[a])) ?? 'Frente');

  if (pair.length < 2) return null;
  const [a, b] = pair;
  const w0 = nearest(data.body, a.date, 'w');
  const w1 = nearest(data.body, b.date, 'w');
  const f0 = nearest(data.body, a.date, 'f');
  const f1 = nearest(data.body, b.date, 'f');

  return (
    <View style={{ gap: 16 }}>
      <Txt v="headlineSmall">Antes e depois</Txt>
      <Tabs tabs={ANGLES} value={angle} onChange={setAngle} />
      <Grid cols={2}>
        {pair.map((p) => {
          const src = p.shots[angle];
          const w = nearest(data.body, p.date, 'w');
          const f = nearest(data.body, p.date, 'f');
          return (
            <View key={p.date} style={{ gap: 8 }}>
              {src ? (
                <PhotoTile uri={src} big />
              ) : (
                <View style={{ aspectRatio: 3 / 4, borderRadius: R.md, backgroundColor: C.surfaceContainer, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                  <Txt v="bodySmall" color={C.onSurfaceVariant} style={{ textAlign: 'center' }}>
                    Sem foto deste ângulo
                  </Txt>
                </View>
              )}
              <View>
                <Txt v="titleSmall">{short(p.date) + ' ' + pd(p.date).getFullYear()}</Txt>
                <Txt v="bodySmall" color={C.onSurfaceVariant}>
                  {[w != null ? nf(w) + ' kg' : null, f != null ? nf(f) + '%' : null].filter(Boolean).join(' · ') || 'Sem medidas'}
                </Txt>
              </View>
            </View>
          );
        })}
      </Grid>
      <Grid cols={3} style={{ padding: 12, borderRadius: R.md, backgroundColor: C.primaryContainer }}>
        {[
          [w0 != null && w1 != null ? signed(w1 - w0) + ' kg' : '—', 'peso'],
          [f0 != null && f1 != null ? signed(f1 - f0) + ' pp' : '—', 'gordura'],
          [String(daysBetween(a.date, b.date)), 'dias'],
        ].map(([v, l]) => (
          <View key={l}>
            <Txt v="titleMedium" color={C.onPrimaryContainer}>
              {v}
            </Txt>
            <Txt v="labelSmall" color={C.onPrimaryContainer}>
              {l}
            </Txt>
          </View>
        ))}
      </Grid>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button onPress={onClose}>FECHAR</Button>
      </View>
    </View>
  );
}
