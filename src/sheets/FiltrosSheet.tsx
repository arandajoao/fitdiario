import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, DateInput, Grid, Label, Txt } from '../components/ui';
import { DEFAULT_FILTER, DUR, INTENSITIES, PER } from '../constants';
import { applyFilter } from '../logic';
import { useDiary } from '../store';
import { Duration, Filter, Period } from '../types';

export function FiltrosSheet({ initial, onApply, onClose }: { initial: Filter; onApply: (f: Filter) => void; onClose: () => void }) {
  const { data, today } = useDiary();
  const [fd, setFd] = useState<Filter>(initial);
  const patch = (p: Partial<Filter>) => setFd((s) => ({ ...s, ...p }));
  const tog = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const count = applyFilter(data.workouts, fd, today).length;

  return (
    <View style={{ gap: 20 }}>
      <Txt v="headlineSmall">Filtrar treinos</Txt>

      <View style={{ gap: 8 }}>
        <Label>Período</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(PER) as Period[]).map((k) => (
            <Chip key={k} label={PER[k].replace('Últimos ', '')} selected={fd.per === k} onPress={() => patch({ per: k })} />
          ))}
        </View>
        {fd.per === 'custom' ? (
          <Grid cols={2} gap={12} style={{ paddingTop: 4 }}>
            <DateInput label="De" value={fd.from} fallback={today} maximumDate={today} onChange={(v) => patch({ from: v })} />
            <DateInput label="Até" value={fd.to} fallback={today} maximumDate={today} onChange={(v) => patch({ to: v })} />
          </Grid>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Label>Tipo de treino</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {data.mods.map((m) => (
            <Chip key={m.name} label={m.name} selected={fd.mods.includes(m.name)} onPress={() => patch({ mods: tog(fd.mods, m.name) })} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Label>Duração</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(DUR) as Duration[]).map((k) => (
            <Chip key={k} label={DUR[k]} selected={fd.dur === k} onPress={() => patch({ dur: fd.dur === k ? null : k })} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Label>Intensidade</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {INTENSITIES.map((k) => (
            <Chip key={k} label={k} selected={fd.ints.includes(k)} onPress={() => patch({ ints: tog(fd.ints, k) })} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Button variant="text" onPress={() => setFd(DEFAULT_FILTER)}>
          LIMPAR
        </Button>
        <Button
          onPress={() => {
            onApply(fd);
            onClose();
          }}
        >
          {'VER ' + count + (count === 1 ? ' TREINO' : ' TREINOS')}
        </Button>
      </View>
    </View>
  );
}
