# Fit Diário

App React Native (Expo + TypeScript) implementado a partir do design `fitness/Diario Fitness.dc.html`.
Tudo fica salvo **no aparelho** — sem servidor, sem conta.

## Rodar

```bash
cd app
npm install
npx expo install --fix   # alinha as versões das libs nativas com o SDK do Expo instalado
npx expo start           # abra no Expo Go (iOS/Android) ou pressione i / a
```

> O projeto foi escrito para o **Expo SDK 54**. O `expo install --fix` corrige qualquer
> diferença de patch. Para usar um SDK mais novo: `npx expo install expo@latest && npx expo install --fix`.

Para gerar um app instalável: `npx expo run:ios` / `npx expo run:android`.

## Builds e lojas (EAS)

Identificador: `click.digitalspark.fitdiario`. Lançamento inicial **só no iOS**; a configuração
de Android continua no `app.json` para quando for publicar no Google Play.

```bash
npm run build:preview   # build iOS interno para instalar em iPhones cadastrados
npm run build:prod      # build da App Store (número de build incrementado automaticamente)
npm run submit:prod     # envia para o TestFlight
```

Textos das lojas, respostas dos formulários de privacidade, política de privacidade e checklist
estão em `../lojas/`.

## Onde os dados ficam

| O quê | Como |
| --- | --- |
| Treinos, modalidades, peso/gordura, medidas, dieta, refeições | SQLite (`expo-sqlite`), arquivo `diario-fitness.db` |
| Fotos de evolução | Arquivos JPEG em `Documents/photos/` do app (o banco guarda só o nome) |
| Registros de saúde | SQLite (tabela `health`); anexos (foto/PDF) em `Documents/health/` |

A exportação da dieta gera o arquivo no cache do app e abre a folha de compartilhamento do
sistema (salvar em Arquivos, WhatsApp, e-mail…). Nada sai do aparelho sem você escolher.

O esquema é criado na primeira abertura, com as refeições e modalidades padrão. As
migrações usam `PRAGMA user_version`.

## Estrutura

```
App.tsx                 navegação inferior, FAB, snackbar e bottom sheets
src/theme.ts            tokens Digital Spark (paleta oliva do design) + escala tipográfica Satoshi
src/db.ts               SQLite + arquivos de foto
src/store.tsx           estado em memória + ações que gravam no banco
src/logic.ts            filtros, sequência da dieta, gráfico
src/media.ts            câmera/galeria/PDF e compartilhamento de arquivos
src/exportDiet.ts       exportação da dieta (PDF via expo-print, CSV, texto)
src/screens/            Hoje · Treinos · Corpo · Dieta · Saúde
src/sheets/             Novo treino · Novo registro (peso/medidas/fotos) · Refeições ·
                        Filtros · Sequência · Antes e depois · Exportar dieta ·
                        Novo registro de saúde · Detalhe de saúde
assets/fonts/           Satoshi (convertida de woff2 para ttf)
```

## Diferenças em relação ao protótipo

- O protótipo usa "hoje" fixo (19/10/2026) e dados de exemplo; o app usa a data real e começa vazio.
- Ícones: Material Icons (`@expo/vector-icons`) no lugar de Material Symbols Rounded.
- Extras: tocar e segurar um treino ou um dia de fotos pede confirmação para excluir;
  as fotos podem vir da câmera ou da galeria (recortadas em 3:4 e reduzidas a 1080 px).
