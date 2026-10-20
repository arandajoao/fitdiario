import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { WorkoutCard } from '../components/parts';
import { Button, Grid, Icon, Txt } from '../components/ui';
import { DEFAULT_FILTER, DUR, PER } from '../constants';
import { hm, intf, relLabel, short } from '../format';
import { applyFilter } from '../logic';
import { useDiary, useModIcon } from '../store';
import { C, R } from '../theme';
import { Filter, Workout } from '../types';
import { confirmDeleteWorkout } from './HojeScreen';

export const periodLabel = (fl: Filter) =>
  fl.per === 'custom' ? (fl.from ? short(fl.from) : 'início') + ' – ' + (fl.to ? short(fl.to) : 'hoje') : PER[fl.per];

export function TreinosScreen({ flt, setFlt, openFilters }: { flt: Filter; setFlt: (f: Filter) => void; openFilters: () => void }) {
  const { data, today, actions, toast } = useDiary();
  const icon = useModIcon();
  const filtered = applyFilter(data.workouts, flt, today);
  const fMin = filtered.reduce((a, w) => a + w.min, 0);

  const chips: { label: string; remove: () => void }[] = [];
  if (flt.per !== '7d') chips.push({ label: periodLabel(flt), remove: () => setFlt({ ...flt, per: '7d', from: '', to: '' }) });
  flt.mods.forEach((m) => chips.push({ label: m, remove: () => setFlt({ ...flt, mods: flt.mods.filter((x) => x !== m) }) }));
  if (flt.dur) chips.push({ label: DUR[flt.dur], remove: () => setFlt({ ...flt, dur: null }) });
  flt.ints.forEach((m) => chips.push({ label: m, remove: () => setFlt({ ...flt, ints: flt.ints.filter((x) => x !== m) }) }));

  const groups: { date: string; items: Workout[] }[] = [];
  filtered
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .forEach((w) => {
      const g = groups[groups.length - 1];
      if (g && g.date === w.date) g.items.push(w);
      else groups.push({ date: w.date, items: [w] });
    });

  return (
    <View style={{ gap: 16 }}>
      <View style={{ paddingTop: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Txt v="headlineMedium">Treinos</Txt>
          <Txt v="bodyMedium" color={C.onSurfaceVariant}>
            {periodLabel(flt)}
          </Txt>
        </View>
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar treinos"
            onPress={openFilters}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: R.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: chips.length || pressed ? C.secondaryContainer : 'transparent',
            })}
          >
            <Icon name="filter-list" color={chips.length ? C.onSecondaryContainer : C.onSurfaceVariant} />
          </Pressable>
          {chips.length ? (
            <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: R.full, backgroundColor: C.error, alignItems: 'center', justifyContent: 'center' }}>
              <Txt v="labelSmall" color={C.onError} style={{ lineHeight: 14 }}>
                {chips.length}
              </Txt>
            </View>
          ) : null}
        </View>
      </View>

      {chips.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
          {chips.map((c) => (
            <Pressable
              key={c.label}
              onPress={c.remove}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingLeft: 12, paddingRight: 8, borderRadius: R.sm, backgroundColor: C.secondaryContainer }}
            >
              <Txt v="labelLarge" color={C.onSecondaryContainer}>
                {c.label}
              </Txt>
              <Icon name="close" size={18} color={C.onSecondaryContainer} />
            </Pressable>
          ))}
          <Pressable onPress={() => setFlt(DEFAULT_FILTER)} style={{ height: 32, paddingHorizontal: 8, justifyContent: 'center' }}>
            <Txt v="labelLarge" color={C.primary}>
              LIMPAR
            </Txt>
          </Pressable>
        </ScrollView>
      ) : null}

      <Grid cols={3}>
        <View style={{ backgroundColor: C.primaryContainer, borderRadius: R.md, padding: 12 }}>
          <Txt v="titleLarge" color={C.onPrimaryContainer}>{String(filtered.length)}</Txt>
          <Txt v="labelMedium" color={C.onPrimaryContainer}>treinos</Txt>
        </View>
        <View style={{ backgroundColor: C.surfaceContainerHigh, borderRadius: R.md, padding: 12 }}>
          <Txt v="titleLarge">{hm(fMin)}</Txt>
          <Txt v="labelMedium" color={C.onSurfaceVariant}>tempo total</Txt>
        </View>
        <View style={{ backgroundColor: C.surfaceContainerHigh, borderRadius: R.md, padding: 12 }}>
          <Txt v="titleLarge" numberOfLines={1} adjustsFontSizeToFit>{intf(filtered.reduce((a, w) => a + (w.kcal || 0), 0))}</Txt>
          <Txt v="labelMedium" color={C.onSurfaceVariant}>kcal</Txt>
        </View>
      </Grid>

      {filtered.length === 0 ? (
        <View style={{ paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', gap: 12 }}>
          <Icon name="search-off" size={40} color={C.outline} />
          <Txt v="bodyMedium" color={C.onSurfaceVariant} style={{ textAlign: 'center' }}>
            {data.workouts.length ? 'Nenhum treino com esses filtros.' : 'Nenhum treino registrado ainda. Toque em + para começar.'}
          </Txt>
          {chips.length ? (
            <Button variant="outlined" size="small" onPress={() => setFlt(DEFAULT_FILTER)}>
              LIMPAR FILTROS
            </Button>
          ) : null}
        </View>
      ) : null}

      {groups.map((g) => (
        <View key={g.date} style={{ gap: 8 }}>
          <Txt v="labelLarge" color={C.onSurfaceVariant} style={{ paddingTop: 4, paddingHorizontal: 4 }}>
            {relLabel(g.date, today)}
          </Txt>
          {g.items.map((w) => (
            <WorkoutCard
              key={w.id}
              w={w}
              icon={icon(w.mod)}
              showObs
              onLongPress={() =>
                confirmDeleteWorkout(w, async () => {
                  await actions.deleteWorkout(w.id);
                  toast('Treino excluído');
                })
              }
            />
          ))}
        </View>
      ))}
      {filtered.length ? (
        <Txt v="bodySmall" color={C.outline} style={{ textAlign: 'center' }}>
          Toque e segure um treino para excluir.
        </Txt>
      ) : null}
    </View>
  );
}
