import React from 'react';
import { Pressable, View } from 'react-native';
import { EmptyBox } from '../components/parts';
import { Chip, Grid, Icon, Txt } from '../components/ui';
import { HFilter, HFILTERS, HFILTER_TYPE, HTYPES } from '../constants';
import { daysBetween, relAgo, short } from '../format';
import { useDiary } from '../store';
import { C, R } from '../theme';
import { HealthRecord } from '../types';

/** Depois de quantos dias o card de resumo sugere repetir. */
const WARN_DAYS = 365;

function SummaryCard({ label, icon, item, detail }: { label: string; icon: string; item?: HealthRecord; detail: (x: HealthRecord) => string }) {
  const { today } = useDiary();
  const old = !!item && daysBetween(item.date, today) > WARN_DAYS;
  return (
    <View style={{ padding: 14, borderRadius: R.md, gap: 8, backgroundColor: old ? C.errorContainer : C.surfaceContainerLow, flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={20} color={!item ? C.onSurfaceVariant : old ? C.error : C.primary} />
        <Txt v="labelLarge" color={C.onSurfaceVariant} style={{ flex: 1, minWidth: 0 }}>
          {label}
        </Txt>
      </View>
      <Txt v="titleLarge" color={!item ? C.onSurfaceVariant : old ? C.onErrorContainer : C.onSurface}>
        {item ? relAgo(item.date, today) : '—'}
      </Txt>
      <Txt v="bodySmall" color={C.onSurfaceVariant}>
        {item ? detail(item) + (old ? ' · hora de repetir?' : '') : 'Nenhum registro'}
      </Txt>
    </View>
  );
}

export function SaudeScreen({ filter, setFilter, openItem }: { filter: HFilter; setFilter: (f: HFilter) => void; openItem: (id: string) => void }) {
  const { data } = useDiary();
  const hs = data.health.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const type = HFILTER_TYPE[filter];
  const list = hs.filter((x) => !type || x.type === type);

  const years: { year: string; items: HealthRecord[] }[] = [];
  list.forEach((x) => {
    const y = x.date.slice(0, 4);
    const g = years[years.length - 1];
    if (g && g.year === y) g.items.push(x);
    else years.push({ year: y, items: [x] });
  });

  return (
    <View style={{ gap: 16 }}>
      <View style={{ paddingTop: 12 }}>
        <Txt v="headlineMedium">Saúde</Txt>
        <Txt v="bodyMedium" color={C.onSurfaceVariant}>
          Consultas, exames e laudos
        </Txt>
      </View>

      <Grid cols={2}>
        <SummaryCard
          label="Último exame de sangue"
          icon="bloodtype"
          item={hs.find((x) => x.type === 'exame' && x.cat === 'Exame de sangue')}
          detail={(x) => short(x.date) + ' ' + x.date.slice(0, 4)}
        />
        <SummaryCard label="Última consulta" icon={HTYPES.consulta.icon} item={hs.find((x) => x.type === 'consulta')} detail={(x) => x.cat} />
      </Grid>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
        {HFILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {years.map((g) => (
        <View key={g.year} style={{ gap: 8 }}>
          <Txt v="labelLarge" color={C.onSurfaceVariant} style={{ paddingTop: 4, paddingHorizontal: 4 }}>
            {g.year}
          </Txt>
          {g.items.map((x) => {
            const t = HTYPES[x.type];
            return (
              <Pressable
                key={x.id}
                accessibilityRole="button"
                onPress={() => openItem(x.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  gap: 14,
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: R.md,
                  backgroundColor: pressed ? C.surfaceContainer : C.surfaceContainerLow,
                })}
              >
                <View style={{ width: 44, height: 44, borderRadius: R.full, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.icon} size={22} color={t.fg} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="titleMedium" numberOfLines={2}>
                    {x.title}
                  </Txt>
                  <Txt v="bodySmall" color={C.onSurfaceVariant}>
                    {short(x.date) + ' · ' + [x.cat, x.who].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
                {x.file ? <Icon name="attach-file" size={20} color={C.onSurfaceVariant} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
      {list.length === 0 ? <EmptyBox>Nenhum registro. Toque em + para adicionar.</EmptyBox> : null}
    </View>
  );
}
