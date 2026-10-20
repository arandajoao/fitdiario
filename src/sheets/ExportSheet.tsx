import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Chip, DateInput, Grid, Label, OptionCard, Switch, Txt } from '../components/ui';
import { DEFAULT_EXPORT, ST } from '../constants';
import { exportDays, runExport } from '../exportDiet';
import { useDiary } from '../store';
import { C, R } from '../theme';
import { ExportFormat, ExportOptions } from '../types';

const PERIODS: [ExportOptions['per'], string][] = [
  ['7d', '7 dias'],
  ['30d', '30 dias'],
  ['90d', '90 dias'],
  ['custom', 'Personalizado'],
];
const FORMATS: [ExportFormat, string, string, string][] = [
  ['pdf', 'PDF', 'picture-as-pdf', 'Relatório pronto para imprimir ou enviar'],
  ['csv', 'Planilha (CSV)', 'table-view', 'Abre no Excel ou Google Planilhas'],
  ['texto', 'Texto', 'chat', 'Para colar no WhatsApp ou e-mail'],
];

export function ExportSheet({ initial, onChange, onClose }: { initial: ExportOptions; onChange: (ex: ExportOptions) => void; onClose: () => void }) {
  const { data, today, toast } = useDiary();
  const [ex, setEx] = useState<ExportOptions>(initial ?? DEFAULT_EXPORT);
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<ExportOptions>) => {
    const n = { ...ex, ...p };
    setEx(n);
    onChange(n); // lembra as escolhas na próxima abertura
  };

  const { rows } = exportDays(data.diet, ex, today);
  const cnt = (k: keyof typeof ST) => rows.filter(([, e]) => e.day === k).length;
  const firstDay = Object.keys(data.diet).sort()[0] || today;

  const run = async () => {
    setBusy(true);
    try {
      const ok = await runExport(data.diet, data.meals, ex, today);
      if (ok) {
        onClose();
        toast(ex.fmt === 'texto' ? 'Texto compartilhado' : ex.fmt === 'csv' ? 'Planilha exportada' : 'PDF gerado');
      }
    } catch (e) {
      Alert.alert('Não foi possível exportar', String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 18 }}>
      <View>
        <Txt v="headlineSmall">Exportar diário de dieta</Txt>
        <Txt v="bodyMedium" color={C.onSurfaceVariant}>
          Para enviar à nutricionista ou guardar.
        </Txt>
      </View>

      <View style={{ gap: 8 }}>
        <Label>Período</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {PERIODS.map(([k, l]) => (
            <Chip key={k} label={l} selected={ex.per === k} onPress={() => patch({ per: k })} />
          ))}
        </View>
        {ex.per === 'custom' ? (
          <Grid cols={2} gap={12} style={{ paddingTop: 4 }}>
            <DateInput label="De" value={ex.from} fallback={firstDay} maximumDate={today} onChange={(v) => patch({ from: v })} />
            <DateInput label="Até" value={ex.to} fallback={today} maximumDate={today} onChange={(v) => patch({ to: v })} />
          </Grid>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Label>Formato</Label>
        <View style={{ gap: 6 }}>
          {FORMATS.map(([k, l, ic, sub]) => (
            <OptionCard key={k} icon={ic} label={l} sub={sub} selected={ex.fmt === k} onPress={() => patch({ fmt: k })} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt v="titleSmall">Incluir observações</Txt>
          <Txt v="bodySmall" color={C.onSurfaceVariant}>
            Suas anotações pessoais de cada dia
          </Txt>
        </View>
        <Switch label="Incluir observações" value={ex.notes} onValueChange={(v) => patch({ notes: v })} />
      </View>

      <Grid cols={4} gap={4} style={{ padding: 12, borderRadius: R.md, backgroundColor: C.surfaceContainer }}>
        {[
          [String(rows.length), 'dias', C.onSurface],
          [String(cnt('segui')), 'Segui', ST.segui.color],
          [String(cnt('adaptei')), 'Adaptei', ST.adaptei.color],
          [String(cnt('sai')), 'Saí', ST.sai.color],
        ].map(([v, l, color]) => (
          <View key={l}>
            <Txt v="titleMedium" color={color}>
              {v}
            </Txt>
            <Txt v="labelSmall" color={C.onSurfaceVariant}>
              {l}
            </Txt>
          </View>
        ))}
      </Grid>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="text" onPress={onClose}>
          CANCELAR
        </Button>
        <Button disabled={rows.length === 0 || busy} onPress={run}>
          {ex.fmt === 'texto' ? 'COMPARTILHAR' : 'EXPORTAR'}
        </Button>
      </View>
    </View>
  );
}
