# 2027NZ Google Doc 同步格式

`nz2027` 會保留網站內嵌資料作為備援；GitHub Actions 每 30 分鐘從指定 Google Doc 匯出純文字，解析「待辦」、Day 0–17 摘要與各 Day 標題下的詳細行程，更新 `nz2027/remote-content.json`。網站展開每日卡片時會顯示詳細行程、景點說明與相關連結。

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

一般文件模式會同步待辦、每日摘要，以及第二次出現的 `Day N 月/日` 標題之後到下一個 Day 標題之前的詳細內容。景點標題、其後說明、地圖網址、報到／營業時間會整理成每日時間軸項目；原文有寫時間時保留該時間，沒有寫時間時按原文順序列出。為讓解析穩定，請每個詳細行程以獨立一行的景點／活動名稱開頭，後續說明放在下一行；避免把數個景點放在同一行。待辦仍使用 `待辦:` 至 `日期` 之間的編號格式。

若使用 JSON 模式，`days` 的 `highlights`、`notes` 是陣列；詳細行程可用 `timelines`，格式為 `{ "1": [["15:30", "河濱市場", "午餐與補給"]] }`；`tasks` 至少包含 `id`、`title`、`detail`、`category`；`bookings` 至少包含 `id`、`day`、`title`；`packs` 需要 `title`、`icon` 與 `items`。

同步器會檢查是否至少解析到 10 天的詳細行程；若 Google 文件匯出內容不完整或格式意外變動，該次同步會失敗並保留上一份網站資料，不會用空白詳細行程覆蓋。

同步成功後，網站「工具」頁會顯示同步時間。若文件暫時無法讀取，網站會繼續顯示內嵌備援，不會清空既有行程。
