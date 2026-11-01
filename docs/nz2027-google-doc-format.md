# 2027NZ Google Doc 同步格式

`nz2027` 會保留網站內嵌資料作為備援；GitHub Actions 每 30 分鐘從指定 Google Doc 匯出純文字，解析目前文件中的「待辦」與 Day 0–17 行程摘要，更新 `nz2027/remote-content.json`。

Google Doc 請設定成「知道連結的任何人：檢視者」。你目前使用的一般中文／表格內容已經可以直接同步；只要保留 `待辦:`、`日期`、`Day 0` 到 `Day 17` 這些標記即可。也支援把 JSON 放在文件內，方便未來需要同步更細緻的資料。

最常需要更新的是 `days`、`tasks`、`bookings`、`stays`。例如：

```json
{
  "days": [
    {
      "id": 3,
      "date": "1/3 (日)",
      "title": "直升機冰河健行",
      "city": "Fox Glacier 福克斯冰河",
      "distance": "250 km",
      "drive": "3.5 hr",
      "highlights": ["11:20 報到", "Lake Matheson"],
      "notes": ["依天候確認是否起飛。"],
      "type": "booking"
    }
  ],
  "tasks": [
    {
      "id": "glacier-form",
      "title": "填寫冰川健行風險同意書",
      "detail": "確認活動表單與護照資料。",
      "category": "文件",
      "due": "12/6",
      "critical": true,
      "url": "https://www.foxguides.co.nz/"
    }
  ]
}
```

一般文件模式會同步待辦清單與每日摘要；詳細景點說明仍保留在 Google Doc，網站摘要會標示「詳細景點與注意事項以原文件為準」。若使用 JSON 模式，`days` 的 `highlights`、`notes` 是陣列；`tasks` 至少包含 `id`、`title`、`detail`、`category`；`bookings` 至少包含 `id`、`day`、`title`；`packs` 需要 `title`、`icon` 與 `items`。

同步成功後，網站「工具」頁會顯示同步時間。若文件暫時無法讀取，網站會繼續顯示內嵌備援，不會清空既有行程。
