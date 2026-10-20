import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Label, TextField, Txt } from '../components/ui';
import { INTENSITIES } from '../constants';
import { parseNum } from '../format';
import { useDiary } from '../store';
import { C, R } from '../theme';
import { Intensity } from '../types';

export function TreinoSheet({ onClose }: { onClose: () => void }) {
  const { data, today, actions, toast } = useDiary();
  const [f, setF] = useState({ mod: data.mods[0]?.name ?? 'Musculação', min: '', kcal: '', dist: '', fc: '', int: 'Moderada' as Intensity, obs: '' });
  const [errMin, setErrMin] = useState(false);
  const [nmOpen, setNmOpen] = useState(false);
  const [nm, setNm] = useState({ name: '', dist: false, fc: false });
  const [nmErr, setNmErr] = useState('');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const cur = data.mods.find((m) => m.name === f.mod) ?? { dist: true, fc: true };

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
    await actions.addWorkout({
      id: 'w' + Date.now() + Math.random().toString(36).slice(2, 6),
      date: today,
      mod: f.mod,
      min: Math.round(min),
      kcal: parseNum(f.kcal) ?? 0,
      dist: cur.dist ? parseNum(f.dist) : null,
      fc: cur.fc ? parseNum(f.fc) : null,
      int: f.int,
      obs: f.obs.trim(),
      createdAt: Date.now(),
    });
    onClose();
    toast('Treino registrado');
  };

  const half = { flexBasis: '45%' as const, flexGrow: 1, minWidth: 0 };

  return (
    <View style={{ gap: 16 }}>
      <Txt v="headlineSmall">Novo treino</Txt>
      <View style={{ gap: 8 }}>
        <Label>Modalidade</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {data.mods.map((m) => (
            <Chip key={m.name} label={m.name} selected={f.mod === m.name} onPress={() => set('mod', m.name)} />
          ))}
          <Chip label={nmOpen ? 'Fechar' : '+ Nova atividade'} onPress={toggleNm} />
        </View>
        {nmOpen ? (
          <View style={{ gap: 12, padding: 14, borderRadius: R.md, backgroundColor: C.surfaceContainerHigh }}>
            <TextField
              label="Nome da atividade"
              placeholder="Ex.: Crossfit, Tênis, Pilates"
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
        {cur.dist ? <TextField style={half} label="Distância (km)" keyboardType="decimal-pad" value={f.dist} onChangeText={(v) => set('dist', v)} /> : null}
        {cur.fc ? <TextField style={half} label="FC média (opcional)" keyboardType="number-pad" value={f.fc} onChangeText={(v) => set('fc', v)} /> : null}
      </View>

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

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="text" onPress={onClose}>
          CANCELAR
        </Button>
        <Button onPress={save}>SALVAR</Button>
      </View>
    </View>
  );
}
