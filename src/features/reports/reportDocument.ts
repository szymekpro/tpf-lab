import type { GlycemiaUnit, ReportData } from '../../mocks';
import { convertGlycemia } from '../../contexts/UnitContext';
import {
  AGP_H,
  AGP_W,
  agpBandPath,
  agpLinePath,
  agpX,
  agpY,
} from './agp';

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function agpSvg(data: ReportData, unit: GlycemiaUnit): string {
  const { agp, targetMin, targetMax } = data;
  const yMax = agpY(targetMax);
  const yMin = agpY(targetMin);
  const yLabels = [targetMax, targetMin].map(
    v => `<text x="2" y="${(agpY(v) - 2).toFixed(1)}" font-size="7" fill="#64748b">${convertGlycemia(v, unit)}</text>`,
  );
  return `
    <svg viewBox="0 0 ${AGP_W} ${AGP_H}" width="100%" height="180" preserveAspectRatio="none" style="background:#fff;border:1px solid #e2e8f0;border-radius:8px">
      <rect x="0" y="${yMax.toFixed(1)}" width="${AGP_W}" height="${(yMin - yMax).toFixed(1)}" fill="rgba(136,217,130,0.18)" />
      <line x1="0" y1="${yMax.toFixed(1)}" x2="${AGP_W}" y2="${yMax.toFixed(1)}" stroke="rgba(51,130,54,0.45)" stroke-dasharray="4 4" stroke-width="0.7" />
      <line x1="0" y1="${yMin.toFixed(1)}" x2="${AGP_W}" y2="${yMin.toFixed(1)}" stroke="rgba(51,130,54,0.45)" stroke-dasharray="4 4" stroke-width="0.7" />
      <path d="${agpBandPath(agp, 'p90', 'p10')}" fill="rgba(8,126,139,0.12)" />
      <path d="${agpBandPath(agp, 'p75', 'p25')}" fill="rgba(8,126,139,0.25)" />
      <path d="${agpLinePath(agp, 'p50')}" fill="none" stroke="#087e8b" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />
      ${yLabels.join('')}
      ${[0, 6, 12, 18, 24]
        .map(h => `<text x="${agpX(h * 60).toFixed(1)}" y="${AGP_H - 1}" font-size="6.5" fill="#94a3b8" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}">${String(h).padStart(2, '0')}:00</text>`)
        .join('')}
    </svg>`;
}

function tirBar(data: ReportData): string {
  const { stats } = data;
  const seg = (w: number, color: string) => (w > 0 ? `<div style="width:${w}%;background:${color}"></div>` : '');
  return `
    <div style="display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0">
      ${seg(stats.below, '#e5484d')}
      ${seg(stats.tir, '#88d982')}
      ${seg(stats.above, '#cbe7f5')}
    </div>`;
}

export function buildReportHtml(data: ReportData, unit: GlycemiaUnit): string {
  const { stats, daily, targetMin, targetMax, periodDays, patientName } = data;
  const u = unit;
  const c = (v: number) => convertGlycemia(v, unit);

  const dailyRows = daily
    .map(
      d => `
      <tr>
        <td>${esc(d.date)}</td>
        <td>${c(d.avg)} ${u}</td>
        <td>${d.tir}%</td>
        <td>${c(d.min)}–${c(d.max)} ${u}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<title>Raport glikemii – ${esc(patientName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; margin: 24px 0 10px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #087e8b; padding-bottom: 12px; }
  .brand { color: #087e8b; font-weight: 700; font-size: 13px; }
  .meta { font-size: 12px; color: #64748b; text-align: right; line-height: 1.5; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
  .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
  .card .value { font-size: 24px; font-weight: 800; margin-top: 4px; }
  .card .unit { font-size: 12px; color: #64748b; font-weight: 600; }
  .legend { display: flex; gap: 16px; font-size: 11px; color: #475569; margin-top: 8px; }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eef2f6; }
  th { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  .footer { margin-top: 28px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  @media print { body { padding: 16px; } @page { margin: 12mm; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">DiabetCare</div>
      <h1>Raport glikemii</h1>
      <div style="font-size:13px;color:#475569">Pacjent: <strong>${esc(patientName)}</strong></div>
    </div>
    <div class="meta">
      Okres: <strong>${periodDays} dni</strong><br />
      Zakres docelowy: ${c(targetMin)}–${c(targetMax)} ${u}<br />
      Wygenerowano: ${esc(formatDateTime(data.generatedAt))}
    </div>
  </div>

  <h2>Kluczowe wskaźniki</h2>
  <div class="cards">
    <div class="card"><div class="label">Czas w celu (TIR)</div><div class="value" style="color:#1f9d57">${stats.tir}%</div></div>
    <div class="card"><div class="label">Średnia glikemia</div><div class="value">${c(stats.avgGlycemia)}<span class="unit"> ${u}</span></div></div>
    <div class="card"><div class="label">Szac. HbA1c (GMI)</div><div class="value">${stats.gmi}<span class="unit"> %</span></div></div>
    <div class="card"><div class="label">Liczba pomiarów</div><div class="value">${stats.sampleCount}</div></div>
  </div>

  <h2>Rozkład czasu w zakresach</h2>
  ${tirBar(data)}
  <div class="legend">
    <span><i class="dot" style="background:#e5484d"></i> Poniżej (&lt;${c(targetMin)}): ${stats.below}%</span>
    <span><i class="dot" style="background:#88d982"></i> W zakresie: ${stats.tir}%</span>
    <span><i class="dot" style="background:#cbe7f5"></i> Powyżej (&gt;${c(targetMax)}): ${stats.above}%</span>
  </div>

  <h2>Profil dobowy AGP (${periodDays} dni)</h2>
  ${agpSvg(data, unit)}
  <div class="legend">
    <span><i class="dot" style="background:#087e8b"></i> Mediana</span>
    <span><i class="dot" style="background:rgba(8,126,139,0.25)"></i> 25–75%</span>
    <span><i class="dot" style="background:rgba(8,126,139,0.12)"></i> 10–90%</span>
  </div>

  <h2>Statystyki dzienne</h2>
  <table>
    <thead>
      <tr><th>Data</th><th>Średnia</th><th>TIR</th><th>Zakres min–max</th></tr>
    </thead>
    <tbody>${dailyRows}</tbody>
  </table>

  <div class="footer">
    Raport wygenerowany automatycznie przez aplikację DiabetCare na podstawie danych z sensora CGM.
    Dokument ma charakter poglądowy i nie zastępuje konsultacji lekarskiej.
  </div>
</body>
</html>`;
}

export function openPrintableReport(data: ReportData, unit: GlycemiaUnit): void {
  const html = buildReportHtml(data, unit);
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    alert('Nie udało się otworzyć okna raportu. Sprawdź ustawienia blokady wyskakujących okien.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}
