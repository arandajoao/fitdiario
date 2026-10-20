import { Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { ST } from './constants';
import { add, dmy } from './format';
import { shareFile } from './media';
import { DietDay, ExportOptions, MealStatus } from './types';

export type ExportRow = [string, DietDay];

/** Dias do período que têm algum registro (mais recente primeiro). */
export function exportDays(diet: Record<string, DietDay>, ex: ExportOptions, today: string) {
  const days = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number | undefined>)[ex.per];
  let from: string;
  let to = today;
  if (days) from = add(today, -(days - 1));
  else {
    from = ex.from || Object.keys(diet).sort()[0] || today;
    to = ex.to || today;
  }
  const rows: ExportRow[] = [];
  for (let d = to; d >= from; d = add(d, -1)) {
    const e = diet[d];
    if (e && (e.day || Object.values(e.meals).some(Boolean) || e.note)) rows.push([d, e]);
    if (rows.length > 2000) break;
  }
  return { from, to, rows };
}

const lab = (k: MealStatus | null | undefined) => (k ? ST[k].label : '—');
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function writeTemp(name: string, content: string) {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(content);
  return f.uri;
}

export function buildCsv(rows: ExportRow[], meals: string[], notes: boolean) {
  const esc = (v: string) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['Data', 'Dia', ...meals, ...(notes ? ['Observação'] : [])];
  const lines = [
    head.map(esc).join(';'),
    ...rows.map(([d, e]) => [dmy(d), lab(e.day), ...meals.map((m) => lab(e.meals[m])), ...(notes ? [e.note || ''] : [])].map(esc).join(';')),
  ];
  // BOM para o Excel reconhecer UTF-8
  return '﻿' + lines.join('\n');
}

export function buildText(rows: ExportRow[], meals: string[], notes: boolean, from: string, to: string) {
  return (
    'Diário de dieta · ' + dmy(from) + ' a ' + dmy(to) + '\n\n' +
    rows
      .slice()
      .reverse()
      .map(([d, e]) => {
        const ms = meals.filter((m) => e.meals[m]).map((m) => '  ' + m + ': ' + lab(e.meals[m])).join('\n');
        return dmy(d) + ' — ' + lab(e.day) + (ms ? '\n' + ms : '') + (notes && e.note ? '\n  Obs.: ' + e.note : '');
      })
      .join('\n\n')
  );
}

export function buildHtml(rows: ExportRow[], meals: string[], notes: boolean, from: string, to: string) {
  const color: Record<MealStatus, string> = { segui: ST.segui.color, adaptei: ST.adaptei.color, sai: ST.sai.color };
  const cell = (k?: MealStatus | null) => (k ? `<td style="color:${color[k]};font-weight:600">${ST[k].label}</td>` : '<td style="color:#999">—</td>');
  const cnt = (k: MealStatus) => rows.filter(([, e]) => e.day === k).length;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
body{font-family:-apple-system,Roboto,system-ui,sans-serif;color:#1b1c16;margin:32px}h1{font-size:22px;margin:0}p{color:#555;margin:4px 0 16px}
table{border-collapse:collapse;width:100%;font-size:11px}th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}
th{background:#eff0e6}.s{display:flex;gap:24px;margin-bottom:16px;font-size:13px}.s b{font-size:18px;display:block}tr{page-break-inside:avoid}
</style></head><body><h1>Diário de dieta</h1><p>${dmy(from)} a ${dmy(to)} · ${rows.length} dias registrados</p>
<div class="s"><div><b>${cnt('segui')}</b>Segui</div><div><b>${cnt('adaptei')}</b>Adaptei</div><div><b>${cnt('sai')}</b>Saí</div></div>
<table><thead><tr><th>Data</th><th>Dia</th>${meals.map((m) => '<th>' + escHtml(m) + '</th>').join('')}${notes ? '<th>Observação</th>' : ''}</tr></thead><tbody>
${rows.map(([d, e]) => '<tr><td>' + dmy(d) + '</td>' + cell(e.day) + meals.map((m) => cell(e.meals[m])).join('') + (notes ? '<td>' + escHtml(e.note || '') + '</td>' : '') + '</tr>').join('')}
</tbody></table></body></html>`;
}

/** Gera e compartilha o arquivo. Devolve true se algo foi compartilhado. */
export async function runExport(diet: Record<string, DietDay>, meals: string[], ex: ExportOptions, today: string) {
  const { from, to, rows } = exportDays(diet, ex, today);
  if (!rows.length) return false;
  const fname = 'diario-dieta_' + from + '_a_' + to;

  if (ex.fmt === 'texto') {
    const r = await Share.share({ message: buildText(rows, meals, ex.notes, from, to), title: 'Diário de dieta' });
    return r.action === Share.sharedAction;
  }
  if (ex.fmt === 'csv') {
    const uri = writeTemp(fname + '.csv', buildCsv(rows, meals, ex.notes));
    return shareFile(uri, 'text/csv', 'Exportar diário de dieta');
  }
  const { uri: tmp } = await Print.printToFileAsync({ html: buildHtml(rows, meals, ex.notes, from, to) });
  const dest = new File(Paths.cache, fname + '.pdf');
  if (dest.exists) dest.delete();
  new File(tmp).copy(dest);
  return shareFile(dest.uri, 'application/pdf', 'Exportar diário de dieta');
}
