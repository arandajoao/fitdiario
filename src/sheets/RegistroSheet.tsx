import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Grid, Icon, Tabs, TextField, Txt } from '../components/ui';
import { ANGLES, MEASURE_GROUPS, SHORT, UNIT } from '../constants';
import { nf, parseNum } from '../format';
import { pickProgressPhoto } from '../media';
import { useDiary } from '../store';
import { C, R } from '../theme';
import { Angle } from '../types';

export type RegKind = 'Peso' | 'Medidas' | 'Fotos';

export function RegistroSheet({ initialKind, onClose }: { initialKind: RegKind; onClose: () => void }) {
  const { data, today, actions, toast } = useDiary();
  const [kind, setKind] = useState<RegKind>(initialKind);
  const [w, setW] = useState('');
  const [fat, setFat] = useState('');
  const [ms, setMs] = useState<Record<string, string>>({});
  const [shots, setShots] = useState<Partial<Record<Angle, string>>>({});
  const [err, setErr] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastOf = (m: string) => {
    for (let i = data.measures.length - 1; i >= 0; i--) {
      const v = data.measures[i].vals[m];
      if (v != null) return v;
    }
    return null;
  };

  const save = async () => {
    if (saving) return;
    if (kind === 'Medidas') {
      const vals: Record<string, number> = {};
      Object.entries(ms).forEach(([k, v]) => {
        const n = parseNum(v);
        if (n != null) vals[k] = n;
      });
      if (!Object.keys(vals).length) return setErr(true);
      await actions.saveMeasures(today, vals);
      onClose();
      return toast('Medidas salvas');
    }
    if (kind === 'Fotos') {
      if (!Object.keys(shots).length) return setErr(true);
      setSaving(true);
      try {
        await actions.savePhotos(today, shots);
        onClose();
        toast('Fotos salvas');
      } catch (e) {
        Alert.alert('Não foi possível salvar as fotos', String(e));
      } finally {
        setSaving(false);
      }
      return;
    }
    const wn = parseNum(w);
    const fn = parseNum(fat);
    if (wn == null && fn == null) return setErr(true);
    await actions.saveBody(today, wn, fn);
    onClose();
    toast('Registro salvo');
  };

  const hint = (text: string, errText: string) => (
    <Txt v="bodySmall" color={err ? C.error : C.onSurfaceVariant}>
      {err ? errText : text}
    </Txt>
  );

  return (
    <View style={{ gap: 16 }}>
      <Txt v="headlineSmall">Novo registro</Txt>
      <Tabs
        tabs={['Peso', 'Medidas', 'Fotos'] as const}
        value={kind}
        onChange={(k) => {
          setKind(k);
          setErr(false);
        }}
      />

      {kind === 'Peso' ? (
        <View style={{ gap: 8 }}>
          <Grid cols={2} gap={12}>
            <TextField label="Peso (kg)" keyboardType="decimal-pad" value={w} onChangeText={(v) => (setW(v), setErr(false))} error={err} />
            <TextField label="Gordura (%)" keyboardType="decimal-pad" value={fat} onChangeText={(v) => (setFat(v), setErr(false))} error={err} />
          </Grid>
          {hint('Preencha só o que você mediu hoje.', 'Preencha peso, gordura ou os dois.')}
        </View>
      ) : null}

      {kind === 'Medidas' ? (
        <View style={{ gap: 8 }}>
          {MEASURE_GROUPS.map(([title, list]) => (
            <View key={title} style={{ gap: 10, paddingBottom: 8 }}>
              <Txt v="titleSmall" color={C.primary}>
                {title}
              </Txt>
              <Grid cols={2} gap={12}>
                {list.map((m) => {
                  const prev = lastOf(m);
                  return (
                    <TextField
                      key={m}
                      label={SHORT(m) + ' (' + UNIT(m) + ')'}
                      keyboardType="decimal-pad"
                      placeholder={prev != null ? 'Último: ' + nf(prev) : ''}
                      value={ms[m] ?? ''}
                      onChangeText={(v) => {
                        setMs((s) => ({ ...s, [m]: v }));
                        setErr(false);
                      }}
                    />
                  );
                })}
              </Grid>
            </View>
          ))}
          {hint('Preencha só o que você mediu.', 'Preencha pelo menos uma medida.')}
        </View>
      ) : null}

      {kind === 'Fotos' ? (
        <View style={{ gap: 8 }}>
          <Grid cols={3} gap={8}>
            {ANGLES.map((a) => {
              const src = shots[a];
              return (
                <View key={a} style={{ gap: 6 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={'Foto de ' + a}
                    onPress={async () => {
                      const uri = await pickProgressPhoto();
                      if (uri) {
                        setShots((s) => ({ ...s, [a]: uri }));
                        setErr(false);
                      }
                    }}
                    style={{
                      aspectRatio: 3 / 4,
                      borderRadius: R.sm,
                      overflow: 'hidden',
                      backgroundColor: C.surfaceContainerHigh,
                      borderWidth: src ? 0 : 1,
                      borderStyle: 'dashed',
                      borderColor: C.outline,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {src ? <Image source={{ uri: src }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Icon name="add-a-photo" size={26} color={C.onSurfaceVariant} />}
                  </Pressable>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 }}>
                    <Txt v="labelLarge">{a}</Txt>
                    {src ? (
                      <Pressable
                        accessibilityLabel={'Remover foto de ' + a}
                        hitSlop={8}
                        onPress={() =>
                          setShots((s) => {
                            const n = { ...s };
                            delete n[a];
                            return n;
                          })
                        }
                      >
                        <Icon name="close" size={20} color={C.onSurfaceVariant} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Grid>
          {hint('Adicione os ângulos que quiser. Fica só no seu aparelho.', 'Adicione pelo menos uma foto.')}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="text" onPress={onClose}>
          CANCELAR
        </Button>
        <Button onPress={save} disabled={saving}>
          SALVAR
        </Button>
      </View>
    </View>
  );
}
