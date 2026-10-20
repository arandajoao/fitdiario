import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { BodyChart, EmptyBox, PhotoTile, Spark } from '../components/parts';
import { Button, card, Chip, Grid, IconBtn, Tabs, Txt } from '../components/ui';
import { ANGLES, GROW_IS_GOOD, MEASURE_GROUPS, SHORT, UNIT } from '../constants';
import { longLabel, nf, pd, short, signed } from '../format';
import { buildChart, ChartPeriod, Metric, sparkPoints } from '../logic';
import { useDiary } from '../store';
import { C, R } from '../theme';

export type CompareState = { mode: boolean; sel: string[] };

export function CorpoScreen({
  metric,
  setMetric,
  period,
  setPeriod,
  compare,
  setCompare,
  openRegistro,
  openCompare,
}: {
  metric: Metric;
  setMetric: (m: Metric) => void;
  period: ChartPeriod;
  setPeriod: (p: ChartPeriod) => void;
  compare: CompareState;
  setCompare: (c: CompareState) => void;
  openRegistro: (kind: 'Peso' | 'Medidas' | 'Fotos') => void;
  openCompare: () => void;
}) {
  const { data, today, actions, toast } = useDiary();
  const chart = buildChart(data.body, metric, period, today);
  const sets = data.photoSets.slice().sort((a, b) => b.date.localeCompare(a.date));
  const ms = data.measures;

  const measMeta = (d: string) => {
    const b = data.body.find((x) => x.date === d);
    if (!b) return '';
    return [b.w != null ? nf(b.w) + ' kg' : null, b.f != null ? nf(b.f) + '%' : null].filter(Boolean).join(' · ');
  };

  const tapSet = (date: string) => {
    if (!compare.mode) return;
    const has = compare.sel.includes(date);
    let sel = has ? compare.sel.filter((x) => x !== date) : [...compare.sel, date];
    if (sel.length > 2) sel = sel.slice(-2);
    setCompare({ ...compare, sel });
  };
  const longPressSet = (date: string) => {
    if (compare.mode) return;
    Alert.alert('Excluir fotos?', 'As fotos de ' + short(date) + ' serão apagadas do aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await actions.deletePhotoSet(date);
          toast('Fotos excluídas');
        },
      },
    ]);
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ paddingTop: 12 }}>
        <Txt v="headlineMedium">Evolução</Txt>
      </View>
      <Tabs tabs={['Peso', '% Gordura'] as const} value={metric} onChange={setMetric} />

      {chart ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flexShrink: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Txt v="displaySmall">{chart.current}</Txt>
                <Txt v="titleMedium" color={C.onSurfaceVariant}>
                  {chart.unit}
                </Txt>
              </View>
              <Txt v="labelLarge" color={chart.good ? C.primary : C.error}>
                {chart.delta} no período
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['30d', '90d', '1 ano'] as ChartPeriod[]).map((p) => (
                <Chip key={p} label={p} selected={period === p} onPress={() => setPeriod(p)} />
              ))}
            </View>
          </View>
          <BodyChart chart={chart} />
        </>
      ) : (
        <View style={{ gap: 12 }}>
          <EmptyBox dashed={false}>{metric === 'Peso' ? 'Registre seu peso para ver a evolução.' : 'Registre seu % de gordura para ver a evolução.'}</EmptyBox>
          <Button variant="tonal" onPress={() => openRegistro('Peso')}>
            REGISTRAR AGORA
          </Button>
        </View>
      )}

      {/* Medidas */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt v="titleMedium">Medidas</Txt>
          <Txt v="bodySmall" color={C.onSurfaceVariant}>
            {ms.length ? 'Último registro ' + short(ms[ms.length - 1].date) + ' · variação desde ' + short(ms[0].date) : 'Circunferências em cm, dobras em mm'}
          </Txt>
        </View>
        <IconBtn icon="add" label="Registrar medidas" onPress={() => openRegistro('Medidas')} />
      </View>
      {ms.length ? (
        MEASURE_GROUPS.map(([title, list]) => (
          <View key={title} style={{ gap: 6 }}>
            <Txt v="labelLarge" color={C.onSurfaceVariant} style={{ paddingHorizontal: 4 }}>
              {title}
            </Txt>
            <View style={[card, { paddingVertical: 4, paddingHorizontal: 14 }]}>
              {list.map((m, i) => {
                const u = UNIT(m);
                const vs = ms.filter((x) => x.vals[m] != null).map((x) => x.vals[m]);
                const dl = vs.length ? vs[vs.length - 1] - vs[0] : 0;
                const good = GROW_IS_GOOD.has(m) ? dl >= 0 : dl <= 0;
                return (
                  <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderTopWidth: i ? 1 : 0, borderTopColor: C.outlineVariant }}>
                    <Txt v="bodyMedium" style={{ flex: 1, minWidth: 0 }}>
                      {SHORT(m)}
                    </Txt>
                    <View style={{ width: 56, opacity: vs.length > 1 ? 1 : 0 }}>{vs.length > 1 ? <Spark points={sparkPoints(vs, 56, 20)} /> : null}</View>
                    <View style={{ width: 80, alignItems: 'flex-end' }}>
                      <Txt v="titleMedium">{vs.length ? nf(vs[vs.length - 1]) + ' ' + u : '—'}</Txt>
                      {vs.length ? (
                        <Txt v="labelSmall" color={vs.length > 1 && dl !== 0 ? (good ? C.primary : C.error) : C.onSurfaceVariant}>
                          {vs.length > 1 ? signed(dl) + ' ' + u : '1º registro'}
                        </Txt>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))
      ) : (
        <EmptyBox dashed={false}>Nenhuma medida registrada.</EmptyBox>
      )}

      {/* Fotos */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt v="titleMedium">Fotos</Txt>
          <Txt v="bodySmall" color={C.onSurfaceVariant}>
            {compare.mode ? 'Escolha 2 dias para comparar' : sets.length + (sets.length === 1 ? ' dia com fotos' : ' dias com fotos')}
          </Txt>
        </View>
        {!compare.mode ? <IconBtn icon="add-a-photo" label="Adicionar fotos" onPress={() => openRegistro('Fotos')} /> : null}
        {sets.length >= 2 || compare.mode ? (
          <IconBtn
            icon={compare.mode ? 'close' : 'compare'}
            label={compare.mode ? 'Cancelar comparação' : 'Comparar fotos'}
            color={compare.mode ? C.onSecondaryContainer : C.primary}
            bg={compare.mode ? C.secondaryContainer : 'transparent'}
            onPress={() => setCompare({ mode: !compare.mode, sel: [] })}
          />
        ) : null}
      </View>
      <View style={{ gap: 10 }}>
        {sets.map((p) => {
          const i = compare.sel.indexOf(p.date);
          return (
            <Pressable
              key={p.date}
              onPress={() => tapSet(p.date)}
              onLongPress={() => longPressSet(p.date)}
              style={[card, { gap: 8, padding: 10, borderWidth: 2, borderColor: i >= 0 ? C.primary : 'transparent' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt v="titleSmall" style={{ flex: 1 }}>
                  {longLabel(p.date) + ' ' + pd(p.date).getFullYear()}
                </Txt>
                <Txt v="labelMedium" color={C.onSurfaceVariant}>
                  {measMeta(p.date)}
                </Txt>
                {i >= 0 ? (
                  <View style={{ width: 22, height: 22, borderRadius: R.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Txt v="labelSmall" color={C.onPrimary}>
                      {String(i + 1)}
                    </Txt>
                  </View>
                ) : null}
              </View>
              <Grid cols={3} gap={6}>
                {ANGLES.map((a) => (
                  <PhotoTile key={a} uri={p.shots[a]} angle={a} />
                ))}
              </Grid>
            </Pressable>
          );
        })}
        {sets.length === 0 ? <EmptyBox>Nenhuma foto ainda.</EmptyBox> : null}
      </View>
      {compare.mode && compare.sel.length === 2 ? <Button onPress={openCompare}>VER ANTES E DEPOIS</Button> : null}
    </View>
  );
}
