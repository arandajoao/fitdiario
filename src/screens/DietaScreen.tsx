import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, card, Chip, Grid, Icon, IconBtn, TextField, Txt } from '../components/ui';
import { ST, STATUS_KEYS } from '../constants';
import { add, longLabel, pd, short, WD } from '../format';
import { streakInfo } from '../logic';
import { dietOf, useDiary } from '../store';
import { C, R } from '../theme';

export function DietaScreen({
  dietDate,
  setDietDate,
  openStreak,
  openMeals,
  openExport,
}: {
  dietDate: string;
  setDietDate: (d: string) => void;
  openStreak: (celebrate: boolean) => void;
  openMeals: () => void;
  openExport: () => void;
}) {
  const { data, today, actions, toast } = useDiary();
  const dl = dietOf(data, dietDate);
  const si = streakInfo(data.diet, today);
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => setDraft(null), [dietDate]);

  const noteClean = draft == null || draft === (dl.note || '');
  const noteStatus = !noteClean ? 'Alterações não salvas' : dl.note ? 'Salvo' : '';

  return (
    <View style={{ gap: 16 }}>
      <View style={{ paddingTop: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flexShrink: 1 }}>
          <Txt v="headlineMedium">Dieta</Txt>
          <Txt v="bodyMedium" color={C.onSurfaceVariant}>
            {dietDate === today ? 'Hoje, ' + short(today) : longLabel(dietDate)}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sequência de dieta"
            onPress={() => openStreak(false)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              height: 36,
              paddingLeft: 8,
              paddingRight: 12,
              borderRadius: R.full,
              backgroundColor: si.todayDone ? C.flameBg : C.surfaceContainerHigh,
            }}
          >
            <Icon name="local-fire-department" color={si.todayDone ? C.flame : si.count ? C.flameDim : C.outline} />
            <Txt v="titleMedium" color={si.todayDone ? C.flameFg : C.onSurfaceVariant}>
              {String(si.count)}
            </Txt>
          </Pressable>
          <IconBtn icon="ios-share" label="Exportar diário de dieta" onPress={openExport} />
          <IconBtn icon="edit-note" label="Editar refeições" onPress={openMeals} />
        </View>
      </View>

      <Grid cols={7} gap={4}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = add(today, i - 6);
          const sel = d === dietDate;
          const st = dietOf(data, d).day;
          return (
            <Pressable
              key={d}
              onPress={() => setDietDate(d)}
              style={{ alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: R.md, backgroundColor: sel ? C.primary : 'transparent' }}
            >
              <Txt v="labelSmall" color={sel ? C.onPrimary : C.onSurface}>
                {WD[pd(d).getDay()]}
              </Txt>
              <Txt v="titleMedium" color={sel ? C.onPrimary : C.onSurface}>
                {String(pd(d).getDate())}
              </Txt>
              <View style={{ width: 6, height: 6, borderRadius: R.full, backgroundColor: st ? (sel ? C.onPrimary : ST[st].color) : 'transparent' }} />
            </Pressable>
          );
        })}
      </Grid>

      <View style={{ gap: 8 }}>
        {data.meals.map((m) => (
          <View key={m} style={[card, { paddingVertical: 12, paddingHorizontal: 14, gap: 10 }]}>
            <Txt v="titleSmall">{m}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_KEYS.map((k) => (
                <Chip
                  key={k}
                  label={ST[k].label}
                  selected={dl.meals[m] === k}
                  onPress={() => actions.setMealStatus(dietDate, m, dl.meals[m] === k ? null : k)}
                />
              ))}
            </View>
          </View>
        ))}
        {data.meals.length === 0 ? (
          <Txt v="bodyMedium" color={C.onSurfaceVariant} style={{ textAlign: 'center', padding: 24 }}>
            Cadastre suas refeições para começar.
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: 10, paddingTop: 4 }}>
        <Txt v="titleMedium">Como foi o dia?</Txt>
        {dietDate === today && !si.todayDone ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: R.md, backgroundColor: C.flameBg }}>
            <Icon name="local-fire-department" size={22} color={C.flame} />
            <Txt v="bodyMedium" color={C.flameFg} style={{ flex: 1 }}>
              {si.count
                ? 'Feche o dia para manter sua sequência de ' + si.count + (si.count === 1 ? ' dia.' : ' dias.')
                : 'Feche o dia para começar uma sequência.'}
            </Txt>
          </View>
        ) : null}
        <Grid cols={3}>
          {STATUS_KEYS.map((k) => {
            const sel = dl.day === k;
            return (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                onPress={() => {
                  const was = !!dl.day;
                  actions.setDayStatus(dietDate, sel ? null : k);
                  if (dietDate === today && !was) openStreak(true);
                }}
                style={{
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  borderRadius: R.md,
                  backgroundColor: sel ? ST[k].bg : 'transparent',
                  borderWidth: 1,
                  borderColor: sel ? ST[k].bg : C.outlineVariant,
                }}
              >
                <Icon name={ST[k].icon} color={sel ? ST[k].fg : C.onSurfaceVariant} />
                <Txt v="labelLarge" color={sel ? ST[k].fg : C.onSurfaceVariant}>
                  {ST[k].label}
                </Txt>
              </Pressable>
            );
          })}
        </Grid>

        <View style={{ gap: 8, paddingTop: 4 }}>
          <Txt v="labelLarge" color={C.onSurfaceVariant}>
            Observação
          </Txt>
          <TextField
            multiline
            minHeight={128}
            placeholder="Como você se sentiu, o que mudou, o que funcionou…"
            value={draft ?? dl.note ?? ''}
            onChangeText={setDraft}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Txt v="bodySmall" color={C.onSurfaceVariant}>
              {noteStatus}
            </Txt>
            <Button
              disabled={noteClean}
              onPress={async () => {
                if (draft == null) return;
                await actions.setDietNote(dietDate, draft);
                setDraft(null);
                toast('Observação salva');
              }}
            >
              SALVAR
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
