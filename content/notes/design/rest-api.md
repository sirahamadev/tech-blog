---
slug: rest-api-basics
title: REST API 設計メモ
tags:
  - design
  - api
published_date: 2026-01-24
---

## REST API 設計の基本

### リソース指向
- 動詞ではなく名詞を使う
- `/users`, `/posts`, `/posts/{id}`

### HTTPメソッド
- GET: 取得
- POST: 作成
- PUT / PATCH: 更新
- DELETE: 削除

### ステータスコード
- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

### メモ
- エラー形式は必ず統一する
- フロント都合でAPIを歪めない
