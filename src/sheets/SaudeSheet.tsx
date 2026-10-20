import React, { useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { Button, Chip, DateInput, Grid, Icon, Label, Tabs, TextField, Txt } from '../components/ui';
import { HTYPES, HTYPE_KEYS } from '../constants';
import { pickAttachment } from '../media';
import { useDiary } from '../store';
import { C, R } from '../theme';
import { Attachment, HealthType } from '../types';

export function SaudeSheet({ initialType, onClose }: { initialType: HealthType; onClose: () => void }) {
  const { today, actions, toast } = useDiary();
  const [type, setType] = useState<HealthType>(initialType);
  const [cat, setCat] = useState(HTYPES[initialType].cats[0]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [who, setWho] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<Attachment | null>(null);
  const [err, setErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const t = HTYPES[type];

  const save = async () => {
    const tt = title.trim();
    if (!tt) return setErr(true);
    setSaving(true);
    try {
      await actions.addHealth({
        id: 'h' + Date.now() + Math.random().toString(36).slice(2, 6),
        type,
        cat,
        title: tt,
        date,
        who: who.trim(),
        notes: notes.trim(),
        file,
        createdAt: Date.now(),
      });
      onClose();
      toast('Registro salvo');
    } catch (e) {
      Alert.alert('Não foi possível salvar', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <Txt v="headlineSmall">Novo registro de saúde</Txt>
      <Tabs
        tabs={HTYPE_KEYS.map((k) => HTYPES[k].label)}
        value={t.label}
        onChange={(label) => {
          const k = HTYPE_KEYS.find((x) => HTYPES[x].label === label)!;
          setType(k);
          setCat(HTYPES[k].cats[0]);
          setErr(false);
        }}
      />

      <View style={{ gap: 8 }}>
        <Label>{t.catLabel}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {t.cats.map((c) => (
            <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />
          ))}
        </View>
      </View>

      <TextField
        label={t.titleLabel}
        placeholder={t.titlePh}
        value={title}
        onChangeText={(v) => {
          setTitle(v);
          setErr(false);
        }}
        error={err}
        supportingText={err ? 'Preencha este campo' : undefined}
      />

      <Grid cols={2} gap={12}>
        <DateInput label="Data" value={date} fallback={today} onChange={setDate} />
        <TextField label={t.whoLabel} placeholder="Opcional" value={who} onChangeText={setWho} />
      </Grid>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Anexar arquivo"
        onPress={async () => {
          const a = await pickAttachment();
          if (a) setFile(a);
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.md, borderWidth: 1, borderStyle: 'dashed', borderColor: C.outline }}
      >
        <View style={{ width: 44, height: 44, borderRadius: R.sm, overflow: 'hidden', backgroundColor: C.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          {file?.kind === 'img' ? (
            <Image source={{ uri: file.uri }} style={{ width: 44, height: 44 }} resizeMode="cover" />
          ) : (
            <Icon name={file ? 'picture-as-pdf' : 'attach-file'} size={22} color={C.onSurfaceVariant} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt v="titleSmall" numberOfLines={1}>
            {file ? file.name : 'Anexar arquivo'}
          </Txt>
          <Txt v="bodySmall" color={C.onSurfaceVariant}>
            Opcional. Foto ou PDF.
          </Txt>
        </View>
        {file ? (
          <Pressable accessibilityLabel="Remover anexo" hitSlop={8} onPress={() => setFile(null)}>
            <Icon name="close" size={20} color={C.onSurfaceVariant} />
          </Pressable>
        ) : null}
      </Pressable>

      <View style={{ gap: 8 }}>
        <Label>Observações</Label>
        <TextField multiline minHeight={104} placeholder="Resultados, orientações, próximos passos… (opcional)" value={notes} onChangeText={setNotes} />
      </View>

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
