import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB, Icon, Sheet, Snackbar, Txt } from './src/components/ui';
import { DEFAULT_EXPORT, DEFAULT_FILTER, HFilter, HFILTER_TYPE } from './src/constants';
import { ChartPeriod, Metric } from './src/logic';
import { CompareState, CorpoScreen } from './src/screens/CorpoScreen';
import { DietaScreen } from './src/screens/DietaScreen';
import { HojeScreen } from './src/screens/HojeScreen';
import { SaudeScreen } from './src/screens/SaudeScreen';
import { TreinosScreen } from './src/screens/TreinosScreen';
import { CompareSheet } from './src/sheets/CompareSheet';
import { ExportSheet } from './src/sheets/ExportSheet';
import { FiltrosSheet } from './src/sheets/FiltrosSheet';
import { MealsSheet } from './src/sheets/MealsSheet';
import { RegKind, RegistroSheet } from './src/sheets/RegistroSheet';
import { SaudeDetailSheet } from './src/sheets/SaudeDetailSheet';
import { SaudeSheet } from './src/sheets/SaudeSheet';
import { ShareSheet } from './src/sheets/ShareSheet';
import { StreakSheet } from './src/sheets/StreakSheet';
import { TreinoSheet } from './src/sheets/TreinoSheet';
import { DiaryProvider, useDiary } from './src/store';
import { C, R } from './src/theme';
import { ExportOptions, Filter, HealthType, Tab } from './src/types';

type SheetState =
  | { type: 'treino'; id?: string }
  | { type: 'share'; id?: string }
  | { type: 'registro'; kind: RegKind }
  | { type: 'meals' }
  | { type: 'filtros' }
  | { type: 'streak'; celebrate: boolean }
  | { type: 'compare' }
  | { type: 'export' }
  | { type: 'saude'; hType: HealthType }
  | { type: 'hdetail'; id: string };

const NAV: [Tab, string][] = [
  ['Hoje', 'today'],
  ['Treinos', 'fitness-center'],
  ['Corpo', 'insights'],
  ['Dieta', 'restaurant'],
  ['Saúde', 'health-and-safety'],
];

export default function App() {
  const [fontsLoaded] = useFonts({
    'Satoshi-Regular': require('./assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Medium': require('./assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Bold': require('./assets/fonts/Satoshi-Bold.ttf'),
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <DiaryProvider>{fontsLoaded ? <Main /> : <Loading />}</DiaryProvider>
    </SafeAreaProvider>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: C.surface }}>
      <Image source={require('./assets/images/logo.png')} style={{ width: 180, height: 180 }} accessibilityLabel="Fit · Registro diário" />
      <ActivityIndicator color={C.primary} />
    </View>
  );
}

function Main() {
  const { ready, today, snack } = useDiary();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('Hoje');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const sheetKey = useRef(0);
  const lastSheet = useRef<SheetState | null>(null);
  const [sheetScroll, setSheetScroll] = useState(true);

  const [showBody, setShowBody] = useState(false);
  const [flt, setFlt] = useState<Filter>(DEFAULT_FILTER);
  const [metric, setMetric] = useState<Metric>('Peso');
  const [period, setPeriod] = useState<ChartPeriod>('90d');
  const [compare, setCompare] = useState<CompareState>({ mode: false, sel: [] });
  const [hFilter, setHFilter] = useState<HFilter>('Todos');
  const [exportOpts, setExportOpts] = useState<ExportOptions>(DEFAULT_EXPORT);
  const [dietDateSel, setDietDate] = useState<string | null>(null);
  const dietDate = dietDateSel && dietDateSel <= today ? dietDateSel : today;

  if (!ready) return <Loading />;

  const open = (s: SheetState) => {
    sheetKey.current += 1;
    lastSheet.current = s;
    setSheetScroll(true);
    setSheet(s);
  };
  const close = () => setSheet(null);
  const editWorkout = (id: string) => open({ type: 'treino', id });
  const go = (t: Tab) => {
    setTab(t);
    setCompare({ mode: false, sel: [] });
  };

  const navBottom = Math.max(insets.bottom, 12);
  const navHeight = 10 + 32 + 4 + 16 + navBottom;
  const shown = sheet ?? lastSheet.current;

  return (
    <View style={{ flex: 1, backgroundColor: C.surface, paddingTop: insets.top }}>
      <ScrollView
        key={tab}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: navHeight + 88 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {tab === 'Hoje' ? <HojeScreen go={go} showBody={showBody} toggleBody={() => setShowBody(!showBody)} editWorkout={editWorkout} shareWeek={() => open({ type: 'share' })} /> : null}
        {tab === 'Treinos' ? <TreinosScreen flt={flt} setFlt={setFlt} openFilters={() => open({ type: 'filtros' })} editWorkout={editWorkout} /> : null}
        {tab === 'Corpo' ? (
          <CorpoScreen
            metric={metric}
            setMetric={setMetric}
            period={period}
            setPeriod={setPeriod}
            compare={compare}
            setCompare={setCompare}
            openRegistro={(kind) => open({ type: 'registro', kind })}
            openCompare={() => open({ type: 'compare' })}
          />
        ) : null}
        {tab === 'Dieta' ? (
          <DietaScreen
            dietDate={dietDate}
            setDietDate={setDietDate}
            openStreak={(celebrate) => open({ type: 'streak', celebrate })}
            openMeals={() => open({ type: 'meals' })}
            openExport={() => open({ type: 'export' })}
          />
        ) : null}
        {tab === 'Saúde' ? <SaudeScreen filter={hFilter} setFilter={setHFilter} openItem={(id) => open({ type: 'hdetail', id })} /> : null}
      </ScrollView>

      {tab !== 'Dieta' ? (
        <FAB
          bottom={navHeight + 12}
          extended={tab === 'Corpo'}
          label={tab === 'Corpo' ? 'Novo registro' : tab === 'Saúde' ? 'Novo registro de saúde' : 'Novo treino'}
          onPress={() =>
            open(
              tab === 'Corpo'
                ? { type: 'registro', kind: 'Peso' }
                : tab === 'Saúde'
                  ? { type: 'saude', hType: HFILTER_TYPE[hFilter] ?? 'consulta' }
                  : { type: 'treino' },
            )
          }
        />
      ) : null}

      <View style={[styles.nav, { paddingBottom: navBottom }]}>
        {NAV.map(([label, icon]) => {
          const active = tab === label;
          return (
            <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => go(label)} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: 56, height: 32, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? C.secondaryContainer : 'transparent' }}>
                <Icon name={icon} color={active ? C.onSecondaryContainer : C.onSurfaceVariant} />
              </View>
              <Txt v="labelMedium" color={active ? C.onSurface : C.onSurfaceVariant}>
                {label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <Snackbar text={snack} bottom={navHeight + 12} />

      <Sheet visible={!!sheet} onClose={close} scrollEnabled={sheetScroll}>
        {shown ? (
          <React.Fragment key={sheetKey.current}>
            {shown.type === 'treino' ? <TreinoSheet id={shown.id} onClose={close} onShare={(id) => open({ type: 'share', id })} /> : null}
            {shown.type === 'share' ? <ShareSheet id={shown.id} onClose={close} /> : null}
            {shown.type === 'registro' ? <RegistroSheet initialKind={shown.kind} onClose={close} /> : null}
            {shown.type === 'meals' ? <MealsSheet onClose={close} onDragging={(d) => setSheetScroll(!d)} /> : null}
            {shown.type === 'filtros' ? <FiltrosSheet initial={flt} onApply={setFlt} onClose={close} /> : null}
            {shown.type === 'streak' ? <StreakSheet celebrate={shown.celebrate} onClose={close} /> : null}
            {shown.type === 'compare' ? <CompareSheet dates={compare.sel} onClose={close} /> : null}
            {shown.type === 'export' ? <ExportSheet initial={exportOpts} onChange={setExportOpts} onClose={close} /> : null}
            {shown.type === 'saude' ? <SaudeSheet initialType={shown.hType} onClose={close} /> : null}
            {shown.type === 'hdetail' ? <SaudeDetailSheet id={shown.id} onClose={close} /> : null}
          </React.Fragment>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.surfaceContainer,
    paddingTop: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
});
