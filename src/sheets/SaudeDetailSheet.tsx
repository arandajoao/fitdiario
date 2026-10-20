import React from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { Button, Icon, IconBtn, Txt } from '../components/ui';
import { HTYPES } from '../constants';
import { longLabel } from '../format';
import { shareFile } from '../media';
import { useDiary } from '../store';
import { C, R } from '../theme';

export function SaudeDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, actions, toast } = useDiary();
  const x = data.health.find((h) => h.id === id);
  if (!x) return null;
  const t = HTYPES[x.type];

  const remove = () =>
    Alert.alert('Excluir registro?', x.title + (x.file ? '\nO anexo também será apagado do aparelho.' : ''), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await actions.deleteHealth(x.id);
          onClose();
          toast('Registro excluído');
        },
      },
    ]);

  const openFile = () => {
    if (!x.file) return;
    shareFile(x.file.uri, x.file.kind === 'pdf' ? 'application/pdf' : 'image/jpeg', x.file.name).catch((e) => Alert.alert('Não foi possível abrir', String(e)));
  };

  const row = (label: string, value: string, first: boolean) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: C.outlineVariant }}>
      <Txt v="bodyMedium" color={C.onSurfaceVariant}>
        {label}
      </Txt>
      <Txt v="bodyMedium" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Txt>
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 48, height: 48, borderRadius: R.full, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={t.icon} color={t.fg} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt v="labelMedium" color={C.onSurfaceVariant}>
            {t.label + ' · ' + x.cat}
          </Txt>
          <Txt v="headlineSmall">{x.title}</Txt>
        </View>
        <IconBtn icon="delete" iconSize={22} color={C.onSurfaceVariant} label="Excluir registro" onPress={remove} />
      </View>

      <View style={{ borderRadius: R.md, backgroundColor: C.surfaceContainer, paddingVertical: 4, paddingHorizontal: 14 }}>
        {row('Data', longLabel(x.date) + ' de ' + x.date.slice(0, 4), true)}
        {x.who ? row(t.whoLabel, x.who, false) : null}
      </View>

      {x.file ? (
        <View style={{ gap: 8 }}>
          <Txt v="labelLarge" color={C.onSurfaceVariant}>
            Anexo
          </Txt>
          {x.file.kind === 'img' ? (
            <Pressable onPress={openFile} accessibilityLabel="Abrir imagem">
              <Image source={{ uri: x.file.uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: R.md, backgroundColor: C.surfaceContainerHigh }} resizeMode="contain" />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={openFile}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: R.md,
              borderWidth: 1,
              borderColor: C.outlineVariant,
              backgroundColor: pressed ? C.surfaceContainer : 'transparent',
            })}
          >
            <Icon name={x.file.kind === 'img' ? 'image' : 'picture-as-pdf'} size={22} color={C.primary} />
            <Txt v="bodyMedium" style={{ flex: 1, minWidth: 0 }} numberOfLines={1}>
              {x.file.name}
            </Txt>
            <Icon name="ios-share" size={20} color={C.onSurfaceVariant} />
          </Pressable>
        </View>
      ) : null}

      {x.notes ? (
        <View style={{ gap: 8 }}>
          <Txt v="labelLarge" color={C.onSurfaceVariant}>
            Observações
          </Txt>
          <Txt v="bodyLarge">{x.notes}</Txt>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button onPress={onClose}>FECHAR</Button>
      </View>
    </View>
  );
}
