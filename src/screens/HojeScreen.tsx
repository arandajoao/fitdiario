import React from 'react';
import { Alert, FlatList, Linking, Pressable, useWindowDimensions, View } from 'react-native';
import { distLabel, SectionHeader, ShareBtn } from '../components/parts';
import { card, Grid, Icon, IconBtn, Txt } from '../components/ui';
import { APP_NAME, PRIVACY_URL, ST } from '../constants';
import { add, daysBetween, hm, intf, longLabel, nf, pd, short, WD, weekRange, weekStart } from '../format';
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

export function HojeScreen({
  go,
  showBody,
  toggleBody,
  editWorkout,
  shareWorkout,
  shareWeek,
}: {
  go: (t: Tab) => void;
  showBody: boolean;
  toggleBody: () => void;
  editWorkout: (id: string) => void;
  shareWorkout: (id: string) => void;
  shareWeek: (start: string) => void;
}) {
  const { data, today, actions, toast } = useDiary();
  const icon = useModIcon();

  const todayW = data.workouts.filter((w) => w.date === today).sort((a, b) => b.createdAt - a.createdAt);
  const recent = data.workouts
    .filter((w) => w.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 3);
  const lastW = [...data.body].reverse().find((b) => b.w != null)?.w ?? null;
  const lastF = [...data.body].reverse().find((b) => b.f != null)?.f ?? null;
  const td = dietOf(data, today);
  const si = streakInfo(data.diet, today);
  const listed = [...todayW, ...recent];
  const dayLabel = (d: string) => (d === today ? 'Hoje' : d === add(today, -1) ? 'Ontem' : short(d));

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

      <WeekPager workouts={data.workouts} today={today} onShare={shareWeek} />

      {/* Treinos: os de hoje e os 3 anteriores numa lista só */}
      <SectionHeader
        title="Treinos"
        right={
          <Pressable onPress={() => go('Treinos')} hitSlop={8}>
            <Txt v="labelLarge" color={C.primary}>
              VER TODOS
            </Txt>
          </Pressable>
        }
      />
      <View style={[card, { paddingVertical: 4, paddingHorizontal: 14 }]}>
        {listed.length === 0 ? (
          <Txt v="bodyMedium" color={C.onSurfaceVariant} style={{ paddingVertical: 12 }}>
            Nenhum treino ainda. Toque em + para registrar.
          </Txt>
        ) : null}
        {listed.map((w, i) => (
          <WorkoutRow
            key={w.id}
            w={w}
            icon={icon(w.mod)}
            sub={dayLabel(w.date) + ' · ' + brief(w)}
            first={!i}
            onPress={() => editWorkout(w.id)}
            onLongPress={() => del(w)}
            onShare={() => shareWorkout(w.id)}
          />
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

/** "45 min · 5,2 km · 320 kcal" (kcal só quando houver) */
const brief = (w: Workout) => [w.min + ' min', distLabel(w), w.kcal > 0 ? Math.round(w.kcal) + ' kcal' : null].filter(Boolean).join(' · ');

function WorkoutRow({
  w,
  icon,
  sub,
  first,
  onPress,
  onLongPress,
  onShare,
}: {
  w: Workout;
  icon: string;
  sub: string;
  first: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onShare: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.outlineVariant,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={C.onPrimaryContainer} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="titleSmall" numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 22 }}>
          {w.mod}
        </Txt>
        <Txt v="bodySmall" color={C.onSurfaceVariant} numberOfLines={1} style={{ fontSize: 13.2, lineHeight: 18 }}>
          {sub}
        </Txt>
      </View>
      <ShareBtn onPress={onShare} style={{ marginRight: -8 }} />
    </Pressable>
  );
}

/**
 * Resumo semanal (domingo a sábado). As páginas vão da semana atual para trás:
 * arrastar para a direita mostra semanas anteriores; não há semanas futuras.
 */
function WeekPager({ workouts, today, onShare }: { workouts: Workout[]; today: string; onShare: (start: string) => void }) {
  const { width: screenW } = useWindowDimensions();
  const width = screenW - 40; // padding lateral da tela
  const cur = weekStart(today);
  const first = workouts.reduce((m, x) => (x.date < m ? x.date : m), today);
  const total = Math.min(260, Math.floor(daysBetween(weekStart(first), cur) / 7) + 1);
  const weeks = Array.from({ length: total }, (_, i) => add(cur, -7 * i));
  return (
    <View style={{ borderRadius: R.lg, backgroundColor: C.primary, overflow: 'hidden' }}>
      <FlatList
        data={weeks}
        keyExtractor={(s) => s}
        horizontal
        inverted
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialNumToRender={2}
        windowSize={3}
        extraData={workouts}
        renderItem={({ item, index }) => (
          <WeekPage start={item} hasOlder={index < total - 1} width={width} workouts={workouts} today={today} onShare={onShare} />
        )}
      />
    </View>
  );
}

function WeekPage({
  start,
  hasOlder,
  width,
  workouts,
  today,
  onShare,
}: {
  start: string;
  hasOlder: boolean;
  width: number;
  workouts: Workout[];
  today: string;
  onShare: (start: string) => void;
}) {
  const end = add(start, 6);
  const list = workouts.filter((w) => w.date >= start && w.date <= end);
  const trained = new Set(list.map((w) => w.date));
  const sum = (k: 'min' | 'kcal' | 'dist') => list.reduce((a, w) => a + (w[k] || 0), 0);
  // Círculo do check: quadrado exato (36px, ou menor em telas estreitas)
  const dot = Math.min(36, Math.floor((width - 40 - 6 * 6) / 7));
  const otherYear = pd(end).getFullYear() !== pd(today).getFullYear();

  return (
    <View style={{ width, padding: 20, gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 36 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1 }}>
          {/* Indica que dá para arrastar para semanas anteriores */}
          {hasOlder ? <Icon name="chevron-left" size={20} color={C.primary70} style={{ marginLeft: -6 }} /> : null}
          <View style={{ flexShrink: 1 }}>
            <Txt v="titleSmall" color={C.onPrimary} numberOfLines={1}>
              {weekRange(start, otherYear)}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt v="labelMedium" color={C.primary90}>
            {list.length} {list.length === 1 ? 'treino' : 'treinos'}
          </Txt>
          {list.length ? <ShareBtn onPress={() => onShare(start)} color={C.onPrimary} style={{ marginRight: -8 }} /> : null}
        </View>
      </View>
      <Grid cols={3}>
        {[
          [hm(sum('min')), 'tempo total'],
          [intf(sum('kcal')), 'kcal'],
          [nf(sum('dist')), 'km'],
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
          const d = add(start, i);
          const on = trained.has(d);
          const isT = d === today;
          const future = d > today;
          return (
            <View key={d} style={{ alignItems: 'center', gap: 6, opacity: future ? 0.45 : 1 }}>
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
  );
}
