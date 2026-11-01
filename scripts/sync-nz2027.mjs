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
  const detailStart = text.indexOf('________________', scheduleStart);
  if (scheduleStart < 0 || detailStart < 0) return [];
  const lines = text.slice(scheduleStart, detailStart).split(/\r?\n/).map(clean);
  const starts = [];
  lines.forEach((line, index) => {
    const match = line.match(/^Day\s+(\d+)$/i);
    if (match) starts.push({ id: Number(match[1]), index });
  });
  const parsed = [];
  for (const [position, start] of starts.entries()) {
    const end = starts[position + 1]?.index ?? lines.length;
    const block = lines.slice(start.index + 1, end).filter(line => line && !/^2026\s+12\/31/.test(line));
    const dateIndex = block.findIndex(line => /^\d{1,2}\/\d{1,2}/.test(line));
    if (dateIndex < 0) continue;
    const date = block[dateIndex];
    const distanceIndex = block.findIndex((line, index) => index > dateIndex && /^\d+\s*km$/i.test(line));
    const beforeLocation = distanceIndex >= 0 ? block.slice(dateIndex + 1, distanceIndex) : block.slice(dateIndex + 1);
    const cityPairIndex = beforeLocation.findIndex(line => /^\(.+\)$/.test(line));
    let city = '';
    let activityLines = beforeLocation;
    if (cityPairIndex > 0) {
      city = `${beforeLocation[cityPairIndex - 1]} ${beforeLocation[cityPairIndex].slice(1, -1)}`;
      activityLines = beforeLocation.slice(0, cityPairIndex - 1);
    } else if (start.id === 17) {
      city = 'Sweet home';
    } else if (start.id === 0 || start.id === 16) {
      city = '空中';
    }
    const highlights = activityLines
      .filter(line => line && !/^Day\s+/i.test(line))
      .flatMap(line => line.split(/[、，]/).map(clean))
      .filter(line => line && !/^\d{4}\s+\d/.test(line));
    const distance = distanceIndex >= 0 ? block[distanceIndex] : null;
    const drive = distanceIndex >= 0 && block[distanceIndex + 1] && /^(?:\d+(?:\.\d+)?\s*(?:hr|min)|\d+\.\d+\s*hr)$/i.test(block[distanceIndex + 1]) ? block[distanceIndex + 1] : null;
    parsed.push({
      id: start.id,
      date,
      title: titleForDay(start.id, highlights, city || '旅程'),
      city: city || '未設定',
      distance,
      drive,
      highlights: highlights.length ? highlights : ['Google Doc 尚未填寫白天景點'],
      notes: ['此日資料由 Google Doc 自動同步；詳細景點與注意事項以原文件為準。'],
      type: dayType(start.id, highlights),
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
  };
}

function validate(content) {
  if (!isObject(content)) throw new Error('同步資料必須是 JSON 物件');
  if (content.days && (!Array.isArray(content.days) || content.days.some(day => !day || typeof day !== 'object' || !Number.isInteger(day.id)))) {
    throw new Error('days 必須是包含 id 的陣列');
  }
  if (content.tasks && (!Array.isArray(content.tasks) || content.tasks.some(task => !task || typeof task.id !== 'string'))) {
    throw new Error('tasks 必須是包含 id 的陣列');
  }
}

const response = await fetch(exportURL, { headers: { 'User-Agent': '2027NZ-sync/1.0' } });
if (!response.ok) throw new Error(`Google Doc 匯出失敗：HTTP ${response.status}`);
const content = parseDocument(await response.text());
validate(content);
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
