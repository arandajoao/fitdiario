import React from 'react';
import { Alert, Linking, Pressable, useWindowDimensions, View } from 'react-native';
import { EmptyBox, SectionHeader, WorkoutCard } from '../components/parts';
import { card, Grid, Icon, IconBtn, Txt } from '../components/ui';
import { APP_NAME, PRIVACY_URL, ST } from '../constants';
import { add, hm, intf, longLabel, nf, pd, relLabel, WD } from '../format';
import { streakInfo } from '../logic';
import { dietOf, useDiary, useModIcon } from '../store';
import { C, R } from '../theme';
import { Tab, Workout } from '../types';
import appConfig from '../../app.json';

export function confirmDeleteWorkout(w: Workout, onConfirm: () => void) {
  Alert.alert('Excluir treino?', `${w.mod} · ${w.min} min`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: onConfirm },
  ]);
}

export function HojeScreen({ go, showBody, toggleBody }: { go: (t: Tab) => void; showBody: boolean; toggleBody: () => void }) {
  const { data, today, actions, toast } = useDiary();
  const icon = useModIcon();
  // Círculo do check: quadrado exato (36px, ou menor em telas estreitas)
  const { width: screenW } = useWindowDimensions();
  const dot = Math.min(36, Math.floor((screenW - 40 - 40 - 6 * 6) / 7));

  const todayW = data.workouts.filter((w) => w.date === today);
  const week = data.workouts.filter((w) => w.date > add(today, -7));
  const trained = new Set(data.workouts.map((w) => w.date));
  const recent = data.workouts
    .filter((w) => w.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 3);
  const lastW = [...data.body].reverse().find((b) => b.w != null)?.w ?? null;
  const lastF = [...data.body].reverse().find((b) => b.f != null)?.f ?? null;
  const td = dietOf(data, today);
  const si = streakInfo(data.diet, today);
  const sum = (l: Workout[], k: 'min' | 'kcal' | 'dist') => l.reduce((a, w) => a + (w[k] || 0), 0);

  const del = (w: Workout) =>
    confirmDeleteWorkout(w, async () => {
      await actions.deleteWorkout(w.id);
      toast('Treino excluído');
    });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ paddingTop: 12, paddingBottom: 4 }}>
        <Txt v="labelLarge" color={C.onSurfaceVariant}>
          {longLabel(today)}
        </Txt>
        <Txt v="headlineMedium" style={{ marginTop: 2 }}>
          Seus treinos
        </Txt>
      </View>

      {/* Semana */}
      <View style={{ borderRadius: R.lg, backgroundColor: C.primary, padding: 20, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Txt v="titleSmall" color={C.onPrimary}>
            Esta semana
          </Txt>
          <Txt v="labelMedium" color={C.primary90}>
            {week.length} {week.length === 1 ? 'treino' : 'treinos'}
          </Txt>
        </View>
        <Grid cols={3}>
          {[
            [hm(sum(week, 'min')), 'tempo total'],
            [intf(sum(week, 'kcal')), 'kcal'],
            [nf(sum(week, 'dist')), 'km'],
          ].map(([v, l]) => (
            <View key={l}>
              <Txt v="headlineMedium" color={C.onPrimary} numberOfLines={1} adjustsFontSizeToFit>
                {v}
              </Txt>
              <Txt v="labelMedium" color={C.primary90}>
                {l}
              </Txt>
            </View>
          ))}
        </Grid>
        <Grid cols={7} gap={6}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = add(today, i - 6);
            const on = trained.has(d);
            const isT = d === today;
            return (
              <View key={d} style={{ alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: dot,
                    height: dot,
                    borderRadius: dot / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? C.primary90 : 'transparent',
                    borderWidth: 1.5,
                    borderColor: on ? C.primary90 : isT ? C.neutral100 : C.primary50,
                  }}
                >
                  {on ? <Icon name="check" size={18} color={C.primary10} /> : null}
                </View>
                <Txt v="labelSmall" color={isT ? C.neutral100 : C.primary90}>
                  {WD[pd(d).getDay()]}
                </Txt>
              </View>
            );
          })}
        </Grid>
      </View>

      {/* Hoje */}
      <SectionHeader
        title="Hoje"
        right={
          <Txt v="labelMedium" color={C.onSurfaceVariant}>
            {Math.round(sum(todayW, 'min'))} min · {intf(sum(todayW, 'kcal'))} kcal
          </Txt>
        }
      />
      {todayW.map((w) => (
        <WorkoutCard key={w.id} w={w} icon={icon(w.mod)} onLongPress={() => del(w)} />
      ))}
      {todayW.length === 0 ? <EmptyBox>Nenhum treino hoje. Toque em + para registrar.</EmptyBox> : null}

      {/* Recentes */}
      <SectionHeader
        title="Recentes"
        right={
          <Pressable onPress={() => go('Treinos')} hitSlop={8}>
            <Txt v="labelLarge" color={C.primary}>
              VER TODOS
            </Txt>
          </Pressable>
        }
      />
      <View style={[card, { paddingVertical: 4, paddingHorizontal: 14 }]}>
        {recent.length === 0 ? (
          <Txt v="bodyMedium" color={C.onSurfaceVariant} style={{ paddingVertical: 10 }}>
            Seus treinos anteriores aparecem aqui.
          </Txt>
        ) : null}
        {recent.map((w, i) => (
          <View
            key={w.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.outlineVariant }}
          >
            <Icon name={icon(w.mod)} size={22} color={C.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt v="titleSmall">{w.mod}</Txt>
              <Txt v="bodySmall" color={C.onSurfaceVariant}>
                {relLabel(w.date, today)}
              </Txt>
            </View>
            <Txt v="labelMedium" color={C.onSurfaceVariant}>
              {w.min} min · {Math.round(w.kcal)} kcal
            </Txt>
          </View>
        ))}
      </View>

      {/* Corpo + Dieta */}
      <Grid cols={2} style={{ paddingTop: 4 }}>
        <View style={[card, { paddingVertical: 12, paddingLeft: 14, paddingRight: 8, gap: 6 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
            <Pressable onPress={() => go('Corpo')} hitSlop={8}>
              <Txt v="labelLarge" color={C.onSurfaceVariant}>
                Corpo
              </Txt>
            </Pressable>
            <IconBtn
              icon={showBody ? 'visibility-off' : 'visibility'}
              iconSize={22}
              color={C.onSurfaceVariant}
              label={showBody ? 'Ocultar peso' : 'Mostrar peso'}
              onPress={toggleBody}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Txt v="headlineSmallStrong">{showBody ? nf(lastW) : '••,•'}</Txt>
            <Txt v="bodySmall" color={C.onSurfaceVariant}>
              kg
            </Txt>
          </View>
          <Txt v="labelMedium" color={C.onSurfaceVariant}>
            {showBody ? nf(lastF) : '••'}% gordura
          </Txt>
        </View>

        <Pressable onPress={() => go('Dieta')} style={[card, { paddingVertical: 12, paddingHorizontal: 14, gap: 6 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
            <Txt v="labelLarge" color={C.onSurfaceVariant}>
              Dieta hoje
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <Icon name="local-fire-department" size={20} color={si.todayDone ? C.flame : si.count ? C.flameDim : C.outline} />
              <Txt v="titleSmall" color={si.todayDone ? C.flameFg : C.onSurfaceVariant}>
                {si.count}
              </Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Txt v="headlineSmallStrong">{data.meals.filter((m) => td.meals[m]).length}</Txt>
            <Txt v="bodySmall" color={C.onSurfaceVariant}>
              de {data.meals.length}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, minHeight: 16, alignItems: 'center' }}>
            {data.meals.map((m) => {
              const st = td.meals[m];
              return <View key={m} style={{ flex: 1, height: 6, borderRadius: R.full, backgroundColor: st ? ST[st].color : C.outlineVariant }} />;
            })}
          </View>
        </Pressable>
      </Grid>

      {/* Rodapé: versão e política de privacidade (exigida pelas lojas dentro do app) */}
      <View style={{ alignItems: 'center', gap: 2, paddingTop: 16 }}>
        <Txt v="bodySmall" color={C.outline}>
          {APP_NAME + ' ' + appConfig.expo.version + ' · seus dados ficam só neste aparelho'}
        </Txt>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Txt v="labelMedium" color={C.primary}>
            Política de privacidade
          </Txt>
        </Pressable>
      </View>
    </View>
  );
}
