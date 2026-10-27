import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, DateInput, IconBtn, Label, TextField, Txt } from '../components/ui';
import { INTENSITIES } from '../constants';
import { parseNum } from '../format';
import { confirmDeleteWorkout } from '../screens/HojeScreen';
import { useDiary } from '../store';
import { C, R } from '../theme';
import { DistUnit, Intensity, Workout } from '../types';

/** Distância (em km) como texto editável na unidade escolhida. */
const distText = (km: number | null, unit: DistUnit) =>
  km == null ? '' : String(unit === 'm' ? Math.round(km * 1000) : Math.round(km * 1000) / 1000).replace('.', ',');

/** Sem `id` cria um treino novo; com `id` edita o existente. */
export function TreinoSheet({ id, onClose, onShare }: { id?: string; onClose: () => void; onShare: (id: string) => void }) {
  const { data, today, actions, toast } = useDiary();
  const editing = id ? data.workouts.find((w) => w.id === id) : undefined;
  // Novo treino: usa a unidade do último treino da mesma modalidade
  const lastUnit = (mod: string) => data.workouts.find((w) => w.mod === mod && w.dist != null)?.unit ?? 'km';
  const [f, setF] = useState(() => {
    if (editing) {
      return {
        date: editing.date,
        mod: editing.mod,
        min: String(editing.min),
        kcal: editing.kcal ? String(Math.round(editing.kcal)) : '',
        dist: distText(editing.dist, editing.unit),
        unit: editing.unit,
        fc: editing.fc ? String(Math.round(editing.fc)) : '',
        int: editing.int,
        obs: editing.obs,
      };
    }
    const mod = data.mods[0]?.name ?? 'Musculação';
    return { date: today, mod, min: '', kcal: '', dist: '', unit: lastUnit(mod), fc: '', int: 'Moderada' as Intensity, obs: '' };
  });
  const [errMin, setErrMin] = useState(false);
  const [nmOpen, setNmOpen] = useState(false);
  const [nm, setNm] = useState({ name: '', dist: false, fc: false });
  const [nmErr, setNmErr] = useState('');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const cur = data.mods.find((m) => m.name === f.mod) ?? { dist: true, fc: true };

  const pickMod = (mod: string) => setF((s) => ({ ...s, mod, unit: editing || s.dist ? s.unit : lastUnit(mod) }));

  const toggleNm = () => {
    setNmOpen(!nmOpen);
    setNm({ name: '', dist: false, fc: false });
    setNmErr('');
  };
  const addMod = async () => {
    const n = nm.name.trim();
    if (!n) return setNmErr('Informe um nome');
    if (data.mods.some((m) => m.name.toLowerCase() === n.toLowerCase())) return setNmErr('Essa atividade já existe');
    await actions.addMod({ name: n, icon: nm.dist ? 'directions-run' : 'bolt', dist: nm.dist, fc: nm.fc });
    setNmOpen(false);
    set('mod', n);
    toast('Atividade adicionada');
  };

  const save = async () => {
    const min = parseNum(f.min);
    if (min == null) return setErrMin(true);
    const dist = cur.dist ? parseNum(f.dist) : null;
    const w: Workout = {
      id: editing?.id ?? 'w' + Date.now() + Math.random().toString(36).slice(2, 6),
      date: f.date,
      mod: f.mod,
      min: Math.round(min),
      kcal: parseNum(f.kcal) ?? 0,
      dist: dist == null ? null : f.unit === 'm' ? dist / 1000 : dist,
      unit: f.unit,
      fc: cur.fc ? parseNum(f.fc) : null,
      int: f.int,
      obs: f.obs.trim(),
      createdAt: editing?.createdAt ?? Date.now(),
    };
    if (editing) await actions.updateWorkout(w);
    else await actions.addWorkout(w);
    onClose();
    toast(editing ? 'Treino atualizado' : 'Treino registrado');
  };

  const remove = () =>
    editing &&
    confirmDeleteWorkout(editing, async () => {
      await actions.deleteWorkout(editing.id);
      onClose();
      toast('Treino excluído');
    });

  const half = { flexBasis: '45%' as const, flexGrow: 1, minWidth: 0 };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Txt v="headlineSmall">{editing ? 'Editar treino' : 'Novo treino'}</Txt>
        {editing ? <IconBtn icon="ios-share" label="Compartilhar treino" onPress={() => onShare(editing.id)} /> : null}
      </View>
      <View style={{ gap: 8 }}>
        <Label>Modalidade</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {data.mods.map((m) => (
            <Chip key={m.name} label={m.name} selected={f.mod === m.name} onPress={() => pickMod(m.name)} />
          ))}
          <Chip label={nmOpen ? 'Fechar' : '+ Nova atividade'} onPress={toggleNm} />
        </View>
        {nmOpen ? (
          <View style={{ gap: 12, padding: 14, borderRadius: R.md, backgroundColor: C.surfaceContainerHigh }}>
            <TextField
              label="Nome da atividade"
              placeholder="Ex.: Beach tennis, Handebol, Surfe"
              value={nm.name}
              onChangeText={(v) => {
                setNm({ ...nm, name: v });
                setNmErr('');
              }}
              error={!!nmErr}
              supportingText={nmErr}
            />
            <View style={{ gap: 8 }}>
              <Txt v="labelMedium" color={C.onSurfaceVariant}>
                Campos que essa atividade usa (tempo e calorias sempre aparecem)
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip label="Distância" selected={nm.dist} onPress={() => setNm({ ...nm, dist: !nm.dist })} />
                <Chip label="Frequência cardíaca" selected={nm.fc} onPress={() => setNm({ ...nm, fc: !nm.fc })} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="text" size="small" onPress={toggleNm}>
                CANCELAR
              </Button>
              <Button variant="tonal" size="small" onPress={addMod}>
                ADICIONAR
              </Button>
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <View style={half}>
          <DateInput label="Data" value={f.date} fallback={today} maximumDate={today} onChange={(v) => set('date', v)} />
        </View>
        <TextField
          style={half}
          label="Tempo (min)"
          keyboardType="number-pad"
          value={f.min}
          onChangeText={(v) => {
            set('min', v);
            setErrMin(false);
          }}
          error={errMin}
          supportingText={errMin ? 'Informe o tempo' : undefined}
        />
        <TextField style={half} label="Calorias (kcal)" keyboardType="number-pad" value={f.kcal} onChangeText={(v) => set('kcal', v)} />
        {cur.fc ? <TextField style={half} label="FC média (opcional)" keyboardType="number-pad" value={f.fc} onChangeText={(v) => set('fc', v)} /> : null}
      </View>

      {cur.dist ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
          <TextField
            style={{ flex: 1, minWidth: 0 }}
            label={`Distância (${f.unit})`}
            keyboardType={f.unit === 'm' ? 'number-pad' : 'decimal-pad'}
            value={f.dist}
            onChangeText={(v) => set('dist', v)}
          />
          <View style={{ height: 46, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {(['km', 'm'] as DistUnit[]).map((u) => (
              <Chip
                key={u}
                label={u}
                selected={f.unit === u}
                onPress={() => {
                  if (u === f.unit) return;
                  // Converte o valor já digitado para a nova unidade
                  const v = parseNum(f.dist);
                  setF((s) => ({ ...s, unit: u, dist: v == null ? s.dist : distText(s.unit === 'm' ? v / 1000 : v, u) }));
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Label>Intensidade</Label>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {INTENSITIES.map((m) => (
            <Chip key={m} label={m} selected={f.int === m} onPress={() => set('int', m)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Label>Observação</Label>
        <TextField multiline minHeight={104} placeholder="Como foi o treino, cargas, sensações… (opcional)" value={f.obs} onChangeText={(v) => set('obs', v)} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {editing ? (
          <Button variant="text" onPress={remove}>
            EXCLUIR
          </Button>
        ) : null}
        <View style={{ flex: 1 }} />
        <Button variant="text" onPress={onClose}>
          CANCELAR
        </Button>
        <Button onPress={save}>SALVAR</Button>
      </View>
    </View>
  );
}
