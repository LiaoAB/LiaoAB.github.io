import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(repositoryRoot, 'nz2027', 'remote-content.json');
const documentId = '1DliYnD_FpiU2wPb2cpuZdPl5L4AOvVVdCC-znfRWa5I';
const exportURL = process.env.NZ2027_GOOGLE_DOC_EXPORT_URL || `https://docs.google.com/document/d/${documentId}/export?format=txt`;

const clean = value => String(value || '').replace(/\uFEFF/g, '').replace(/\s+/g, ' ').trim();
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

function extractJSON(text) {
  const source = text.replace(/^\uFEFF/, '').trim();
  const fenced = source.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced ? fenced[1] : source).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function taskCategory(title) {
  if (/預約|Fergburger|Deer|Hot Pools/i.test(title)) return '預約';
  if (/帶|換紐幣|泳衣|防蚊|保冰|傳輸線/i.test(title)) return '行李';
  if (/地圖|停車|CarPlay|超市/i.test(title)) return '開車';
  return '文件';
}

function taskId(number, title) {
  const value = `${number} ${title}`;
  if (/guideline/i.test(value)) return 'guideline';
  if (/eSIM/i.test(value)) return 'esim';
  if (/紐幣/i.test(value)) return 'cash';
  if (/研替/i.test(value)) return 'school';
  if (/NZTD|伸報|申報/i.test(value)) return number === 6 ? 'nztd-start' : 'nztd-final';
  if (/冰川健行/i.test(value)) return 'glacier-form';
  if (/Deer/i.test(value)) return 'deer';
  if (/Hot Pools/i.test(value)) return 'hotpools';
  if (/Fergburger/i.test(value)) return 'ferg';
  if (/離線地圖/i.test(value)) return 'maps';
  if (/傳輸線/i.test(value)) return 'carplay';
  if (/超市/i.test(value)) return 'supermarket';
  if (/停車/i.test(value)) return 'parking';
  return `doc-task-${number}`;
}

function parseTasks(text) {
  const start = text.indexOf('待辦:');
  const end = text.indexOf('日期', start);
  if (start < 0 || end < 0) return [];
  const tasks = [];
  for (const line of text.slice(start, end).split(/\r?\n/)) {
    const match = line.trim().match(/^(\d+)\.\s*(.+)$/);
    if (!match) continue;
    const number = Number(match[1]);
    let title = clean(match[2]);
    const urls = title.match(/https?:\/\/\S+/g) || [];
    title = clean(title.replace(/https?:\/\/\S+/g, '').replace(/\s*[:：]\s*$/, ''));
    const dueMatch = title.match(/^(\d{1,2}\/\d{1,2})\s+/);
    const due = dueMatch ? dueMatch[1] : '—';
    tasks.push({
      id: taskId(number, title),
      title,
      detail: `Google Doc 待辦第 ${number} 項`,
      category: taskCategory(title),
      due,
      critical: /申請|NZTD|冰川|Deer|Hot Pools|離線地圖|停車/i.test(title),
      ...(urls[0] ? { url: urls[0] } : {}),
    });
  }
  return tasks;
}

function dayType(id, highlights) {
  if ([0, 16].includes(id)) return 'flight';
  if (id === 17) return 'arrival';
  if (highlights.some(item => /直升機|跳傘|遊輪|螢火蟲|Hot Pools|企鵝|冰河船|觀星團/i.test(item))) return 'booking';
  if (highlights.some(item => /步道|登山|健行/i.test(item))) return 'hike';
  return 'drive';
}

function titleForDay(id, highlights, city) {
  if (id === 0) return '啟程：台北 → 基督城';
  if (id === 1) return '抵達基督城・城市散步';
  if (id === 16) return '返程：基督城 → 台北';
  if (id === 17) return '抵達桃園・Sweet home';
  const first = clean(highlights[0] || '今日行程').split(/[、，,]/)[0];
  const shortCity = city.replace(/\s+[\u4e00-\u9fff].*$/, '').trim() || city;
  return `${first}・${shortCity}`;
}

function parseDays(text) {
  const scheduleStart = text.indexOf('日期');
  if (scheduleStart < 0) return [];
  const lines = text.slice(scheduleStart).split(/\r?\n/).map(clean);
  const starts = [];
  lines.forEach((line, index) => {
    const match = line.match(/^Day\s*(\d+)(?:\s+(\d{1,2}\s*\/\s*\d{1,2})(?:\s*\([^)]*\))?(?:\s+.*)?)?$/i);
    if (match) starts.push({
      id: Number(match[1]),
      index,
      heading: line,
      inlineDate: match[2]?.replace(/\s+/g, ''),
      hasInlineDate: Boolean(match[2]),
    });
  });
  // The summary uses a bare "Day N" heading with its date on the next line.
  // Detailed sections use "Day N M/D (weekday) [departure time]" inline.
  const detailedStarts = starts.filter(start => start.hasInlineDate);
  const summaryStarts = starts.filter(start => !start.hasInlineDate);
  const summaries = new Map();
  for (const [position, start] of summaryStarts.entries()) {
    const end = summaryStarts[position + 1]?.index ?? detailedStarts[0]?.index ?? lines.length;
    const block = lines.slice(start.index + 1, end).filter(Boolean);
    const dateIndex = block.findIndex(line => /^\d{1,2}\/\d{1,2}/.test(line));
    const distanceIndex = block.findIndex(line => /^\d+\s*km$/i.test(line));
    const cityIndex = block.findIndex((line, index) => index > dateIndex && /^\(.+\)$/.test(line));
    const city = cityIndex > 0 ? `${block[cityIndex - 1]} ${block[cityIndex].slice(1, -1)}` : ([0, 16].includes(start.id) ? '空中' : start.id === 17 ? 'Sweet home' : '');
    const activityEnd = cityIndex > 0 ? cityIndex - 1 : distanceIndex >= 0 ? distanceIndex : block.length;
    const activityStart = dateIndex >= 0 ? dateIndex + 1 : 0;
    const highlights = block.slice(activityStart, activityEnd)
      .filter(line => !/^2026\s+12\/31/.test(line))
      .flatMap(line => line.split(/[、，,]/).map(clean))
      .filter(line => line && !/^Day\s+/i.test(line));
    summaries.set(start.id, {
      date: dateIndex >= 0 ? block[dateIndex].replace(/\s*\([^)]*\)/, '') : '',
      city,
      distance: distanceIndex >= 0 ? block[distanceIndex] : null,
      drive: distanceIndex >= 0 && /^(?:\d+(?:\.\d+)?\s*(?:hr|min))$/i.test(block[distanceIndex + 1] || '') ? block[distanceIndex + 1] : null,
      highlights,
    });
  }
  if (!detailedStarts.length) return [];
  const parsed = [];
  for (const [position, start] of detailedStarts.entries()) {
    const end = detailedStarts[position + 1]?.index ?? lines.length;
    const block = lines.slice(start.index + 1, end).filter(line => line && !/^2026\s+12\/31/.test(line));
    const dateIndex = block.findIndex(line => /^\d{1,2}\/\d{1,2}/.test(line));
    if (dateIndex < 0 && !start.inlineDate) continue;
    const date = start.inlineDate || block[dateIndex];
    const summary = summaries.get(start.id) || {};
    const city = summary.city || (start.id === 17 ? 'Sweet home' : [0, 16].includes(start.id) ? '空中' : '');
    const highlights = summary.highlights || [];
    const distance = summary.distance || null;
    const drive = summary.drive || null;
    const detailedLines = block;
    const timeline = [];
    let current = null;
    const ignored = /^(?:Day\s+\d+\s+\d{1,2}\/\d{1,2}|Lunch time|Dinner time|Quick lunch time|shopping\s*!*|\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2},?\s*|住宿地址[:：]?\s*|_{4,})$/i;
    const detailHeading = /^(?:(\d{1,2}:\d{2}(?:\s*[–-]\s*\d{1,2}:\d{2})?)\s+)?(.+)$/;
    for (const line of detailedLines) {
      if (ignored.test(line)) continue;
      const match = line.match(detailHeading);
      if (!match) continue;
      const value = clean(match[2]);
      const isContinuation = /^(?:https?:\/\/|位置[:：]|停車場座標|集合地點[:：]|營業時間[:：]|停車位置[:：]|官網[:：]|網址[:：])/.test(value)
        || (current && !/^\d+[.、-]?\s/.test(value) && !/^\d{1,2}:\d{2}/.test(value));
      if (isContinuation && current) {
        current[2] = clean(`${current[2]} ${value}`);
      } else {
        current = [match[1] || '', value.replace(/\s+https?:\/\/\S+.*$/, ''), ''];
        timeline.push(current);
      }
    }
    const renderedTimeline = timeline.map(([time, title, detail]) => [time, title, detail || '']);
    parsed.push({
      id: start.id,
      date: summary.date || date,
      title: titleForDay(start.id, highlights, city || '旅程'),
      city: city || '未設定',
      distance,
      drive,
      highlights: highlights.length ? highlights : ['Google Doc 尚未填寫白天景點'],
      notes: ['詳細行程與景點說明已由 Google Doc 同步。'],
      type: dayType(start.id, highlights),
      ...(renderedTimeline.length ? { timeline: renderedTimeline } : {}),
    });
  }
  return parsed;
}

function parseDocument(text) {
  const json = extractJSON(text);
  if (json) return json;
  const days = parseDays(text);
  const allDays = days.filter(day => day.id !== 17);
  const arrivalDay = days.find(day => day.id === 17);
  const tasks = parseTasks(text);
  if (!allDays.length && !tasks.length) throw new Error('Google Doc 中找不到可辨識的待辦或 Day 行程');
  return {
    ...(allDays.length ? { days: allDays } : {}),
    ...(arrivalDay ? { arrivalDay } : {}),
    ...(tasks.length ? { tasks } : {}),
    ...(days.length ? { timelines: Object.fromEntries(days.filter(day => day.timeline).map(day => [day.id, day.timeline])) } : {}),
  };
}

function validate(content, sourceText = '') {
  if (!isObject(content)) throw new Error('同步資料必須是 JSON 物件');
  if (content.days && (!Array.isArray(content.days) || content.days.some(day => !day || typeof day !== 'object' || !Number.isInteger(day.id)))) {
    throw new Error('days 必須是包含 id 的陣列');
  }
  if (content.tasks && (!Array.isArray(content.tasks) || content.tasks.some(task => !task || typeof task.id !== 'string'))) {
    throw new Error('tasks 必須是包含 id 的陣列');
  }
  if (content.timelines && (!isObject(content.timelines) || Object.values(content.timelines).some(items => !Array.isArray(items) || items.some(item => !Array.isArray(item) || item.length < 3 || item.some(value => typeof value !== 'string'))))) {
    throw new Error('timelines 必須是每日詳細行程陣列');
  }
  if (!content.timelines || Object.keys(content.timelines).length < 10) {
    const timelineDays = content.timelines && isObject(content.timelines)
      ? Object.keys(content.timelines).sort((a, b) => Number(a) - Number(b))
      : [];
    const detailHeadings = [...sourceText.matchAll(/^\s*Day\s*(\d+)\s+(\d{1,2}\s*\/\s*\d{1,2})[^\r\n]*/gim)]
      .map(match => match[0].trim());
    const unparsedDetailDays = detailHeadings
      .map(heading => heading.match(/^Day\s*(\d+)/i)?.[1])
      .filter(id => id && !timelineDays.includes(id));
    const diagnostics = [
      `解析到詳細行程：${timelineDays.length} 天（至少需要 10 天）`,
      `解析到的 Day 編號：${timelineDays.length ? timelineDays.join(', ') : '無'}`,
      `詳細區標題（${detailHeadings.length}）：${detailHeadings.length ? detailHeadings.join(' | ') : '無'}`,
      `有標題但未解析出行程的 Day：${unparsedDetailDays.length ? [...new Set(unparsedDetailDays)].join(', ') : '無'}`,
      `Google Doc 匯出文字長度：${sourceText.length} 字元`,
    ];
    throw new Error(`Google Doc 詳細行程解析不足，拒絕覆蓋既有網站資料。\n${diagnostics.join('\n')}`);
  }
}

const response = await fetch(exportURL, { headers: { 'User-Agent': '2027NZ-sync/1.0' } });
if (!response.ok) throw new Error(`Google Doc 匯出失敗：HTTP ${response.status}`);
const sourceText = await response.text();
const content = parseDocument(sourceText);
validate(content, sourceText);
content._meta = { source: exportURL, updatedAt: new Date().toISOString() };

let previous = null;
try {
  previous = JSON.parse(await readFile(outputPath, 'utf8'));
} catch {
  // The first successful sync creates the file.
}
const comparable = value => {
  if (!value || typeof value !== 'object') return value;
  const copy = { ...value };
  delete copy._meta;
  return copy;
};
const next = JSON.stringify(content, null, 2) + '\n';
if (JSON.stringify(comparable(previous)) === JSON.stringify(comparable(content))) {
  console.log('2027NZ remote content is unchanged.');
} else {
  await writeFile(outputPath, next);
  console.log(`2027NZ remote content updated: ${outputPath}`);
}
