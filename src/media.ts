import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { Attachment } from './types';

/** Reduz fotos grandes para no máximo `maxW` px de largura (JPEG). */
async function shrink(asset: ImagePicker.ImagePickerAsset, maxW: number) {
  if (!asset.width || asset.width <= maxW) return asset.uri;
  const ctx = ImageManipulator.manipulate(asset.uri);
  ctx.resize({ width: maxW });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return out.uri;
}

export async function takeImage(source: 'camera' | 'library', opts: { crop34?: boolean; maxW?: number } = {}) {
  const o: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: !!opts.crop34, aspect: opts.crop34 ? [3, 4] : undefined, quality: 0.9 };
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Sem acesso à câmera', 'Permita o acesso à câmera nos ajustes do aparelho.');
      return null;
    }
  }
  const r = source === 'camera' ? await ImagePicker.launchCameraAsync(o) : await ImagePicker.launchImageLibraryAsync(o);
  if (r.canceled || !r.assets?.length) return null;
  return shrink(r.assets[0], opts.maxW ?? 1080);
}

/** No iOS o seletor precisa esperar o alerta terminar de fechar. */
const afterAlert = (fn: () => void) => setTimeout(fn, Platform.OS === 'ios' ? 400 : 0);

type Choice<T> = { text: string; run: () => Promise<T | null> };

function choose<T>(title: string, choices: Choice<T>[]): Promise<T | null> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      undefined,
      [
        ...choices.map((c) => ({ text: c.text, onPress: () => afterAlert(() => c.run().then(resolve, () => resolve(null))) })),
        { text: 'Cancelar', style: 'cancel' as const, onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

/** Foto de evolução (recorte 3:4). Devolve URI temporária. */
export const pickProgressPhoto = () =>
  choose<string>('Adicionar foto', [
    { text: 'Tirar foto', run: () => takeImage('camera', { crop34: true }) },
    { text: 'Escolher da galeria', run: () => takeImage('library', { crop34: true }) },
  ]);

const stamp = () => new Date().toISOString().slice(0, 10);

/** Anexo de saúde: foto (câmera/galeria) ou PDF. Devolve URI temporária + nome. */
export const pickAttachment = () =>
  choose<Attachment>('Anexar arquivo', [
    {
      text: 'Tirar foto',
      run: async () => {
        const uri = await takeImage('camera', { maxW: 1600 });
        return uri ? { uri, kind: 'img', name: `foto-${stamp()}.jpg` } : null;
      },
    },
    {
      text: 'Escolher foto',
      run: async () => {
        const uri = await takeImage('library', { maxW: 1600 });
        return uri ? { uri, kind: 'img', name: `foto-${stamp()}.jpg` } : null;
      },
    },
    {
      text: 'Escolher PDF',
      run: async () => {
        const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
        if (r.canceled || !r.assets?.length) return null;
        const a = r.assets[0];
        return { uri: a.uri, kind: 'pdf', name: a.name || 'documento.pdf' };
      },
    },
  ]);

/** Abre a folha de compartilhamento do sistema (também permite visualizar/salvar o arquivo). */
export async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert('Compartilhamento indisponível', 'Este aparelho não permite compartilhar arquivos.');
    return false;
  }
  const UTI = mimeType === 'application/pdf' ? 'com.adobe.pdf' : mimeType === 'text/csv' ? 'public.comma-separated-values-text' : mimeType === 'image/png' ? 'public.png' : mimeType.startsWith('image/') ? 'public.jpeg' : undefined;
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle });
  return true;
}
