import React, { useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { INKS, isDarkInk, TEMPLATES, weekShare, workoutShare } from '../components/overlays';
import { Button, Chip, Label, Txt } from '../components/ui';
import { shareFile } from '../media';
import { useDiary, useModIcon } from '../store';
import { C, R } from '../theme';

type Fmt = 'sticker' | 'stories';

// Lembra a última escolha enquanto o app está aberto
let last = { tpl: 0, ink: 0, fmt: 'sticker' as Fmt, brand: true };

/** Xadrez atrás da prévia, para deixar claro que o fundo é transparente. */
function Checker({ dark, width, height }: { dark: boolean; width: number; height: number }) {
  const [a, b] = dark ? ['#3b3e36', '#30332c'] : ['#f4f4ef', '#e4e5dc'];
  // Tamanho explícito: com absoluteFill o SVG não acompanha a prévia quando ela cresce
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <Pattern id="ck" width={20} height={20} patternUnits="userSpaceOnUse">
          <Rect width={20} height={20} fill={a} />
          <Rect width={10} height={10} fill={b} />
          <Rect x={10} y={10} width={10} height={10} fill={b} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#ck)" />
    </Svg>
  );
}

/** Com `id` compartilha um treino; sem, o resumo da semana. */
export function ShareSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const { data, today, toast } = useDiary();
  const icon = useModIcon();
  const [o, setO] = useState(last);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const boxW = box.w;
  const [busy, setBusy] = useState(false);
  const shot = useRef<View>(null);
  const set = (p: Partial<typeof o>) => setO((s) => (last = { ...s, ...p }));

  const w = id ? data.workouts.find((x) => x.id === id) : undefined;
  if (id && !w) return null;
  const s = w ? workoutShare(w, icon(w.mod)) : weekShare(data.workouts, today);

  const ink = INKS[o.ink].color;
  const Tpl = TEMPLATES[o.tpl].C;
  const overlay = <Tpl s={s} ink={ink} brand={o.brand} />;
  // Stories: quadro 9:16 transparente, capturado na escala da tela (~1080 px de largura)
  const frameW = Math.min(boxW, 360);

  const run = async (fn: () => Promise<void>, fail: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert(fail, String(e));
    } finally {
      setBusy(false);
    }
  };
  const copy = () =>
    run(async () => {
      const b64 = await captureRef(shot, { format: 'png', result: 'base64' });
      await Clipboard.setImageAsync(b64);
      // O snackbar fica atrás do modal: fecha antes de avisar
      onClose();
      toast('Imagem copiada para a área de transferência');
    }, 'Não foi possível copiar');
  const share = () =>
    run(async () => {
      const uri = await captureRef(shot, { format: 'png', result: 'tmpfile' });
      // O iOS não informa se o usuário concluiu ou cancelou o envio
      if (await shareFile(uri, 'image/png', w ? 'Compartilhar treino' : 'Compartilhar semana')) {
        onClose();
        toast('Compartilhamento finalizado');
      }
    }, 'Não foi possível compartilhar');

  return (
    <View style={{ gap: 16 }}>
      <Txt v="headlineSmall">{w ? 'Compartilhar treino' : 'Compartilhar semana'}</Txt>

      <View
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={{ borderRadius: R.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}
      >
        <Checker dark={!isDarkInk(ink)} width={box.w} height={box.h} />
        {boxW > 0 ? (
          o.fmt === 'stories' ? (
            <View ref={shot} collapsable={false} style={{ width: frameW, height: (frameW * 16) / 9, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: frameW * 0.3 }}>
              <View style={{ transform: [{ scale: frameW / 380 }] }}>{overlay}</View>
            </View>
          ) : (
            <View style={{ paddingVertical: 28 }}>
              <View ref={shot} collapsable={false} style={{ padding: 12 }}>
                {overlay}
              </View>
            </View>
          )
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Label>Modelo</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
          {TEMPLATES.map((t, i) => (
            <Chip key={t.name} label={t.name} selected={o.tpl === i} onPress={() => set({ tpl: i })} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 8 }}>
        <Label>Cor</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {INKS.map((k, i) => (
            <Chip key={k.name} label={k.name} selected={o.ink === i} onPress={() => set({ ink: i })} />
          ))}
          <Chip label="Mostrar marca" selected={o.brand} onPress={() => set({ brand: !o.brand })} />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Label>Formato</Label>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Chip label="Adesivo" selected={o.fmt === 'sticker'} onPress={() => set({ fmt: 'sticker' })} />
          <Chip label="Stories 9:16" selected={o.fmt === 'stories'} onPress={() => set({ fmt: 'stories' })} />
        </View>
        <Txt v="bodySmall" color={C.onSurfaceVariant}>
          {o.fmt === 'sticker'
            ? 'Só os dados, em PNG transparente. Nos stories, cole como figurinha por cima da sua foto.'
            : 'Tela inteira transparente, com os dados já posicionados na parte de baixo.'}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Button variant="text" onPress={onClose}>
          FECHAR
        </Button>
        <View style={{ flex: 1 }} />
        <Button variant="outlined" onPress={share} disabled={busy}>
          ENVIAR
        </Button>
        <Button onPress={copy} disabled={busy}>
          COPIAR
        </Button>
      </View>
    </View>
  );
}
