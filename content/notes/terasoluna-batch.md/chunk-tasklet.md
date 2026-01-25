---
slug: chunk-tasklet
title: chunk tasklet
tags:
  - Terasoluna Batch
published_date: 2026-01-25
---

> **Summary**
> Comprehensive guide comparing Chunk vs Tasklet models in Terasoluna Batch 5.x, including implementation rules, transaction differences, and selection criteria.

# Chunk vs Tasklet: 使い分けと実装ルール（Terasoluna Batch 5.x）

## 1. Chunk と Tasklet の根本的な違い

### Chunk（公式サンプルの本流）

- **動作**: `Read` → `Process` → `Write` を一定件数（チャンク）ごとに繰り返す。
- **特徴**: トランザクションが分割される（例: 10件ごと）。
- **メリット**: 途中再開（Restart）が容易。大量データをメモリに溜め込まずに処理できる。
- **用途**: 大量データ処理、DB to File、File to DB など。

### Tasklet（独自の単発処理）

- **動作**: `execute()` メソッド内で「全ての処理」を一括で行う。
- **特徴**: 基本的に 1 ステップ = 1 トランザクション。
- **メリット**: 自由度が高い。ファイル移動、メール送信、単純なプロシージャ呼び出しなどに適する。
- **用途**: 件数が少ない処理、一括処理、バッチ前後の準備・後始末。

---

## 2. ディレクトリ配置ルール（公式準拠）

公式ブランクの思想（配線と部品の分離）を守る。

| 場所           | 役割               | 格納するクラス例                             |
| :------------- | :----------------- | :------------------------------------------- |
| `sample.jobs`  | **配線（Config）** | `Job02Config` (Builder, Reader/Writer Bean)  |
| `sample.job02` | **部品（Logic）**  | `EmployeeTasklet`, `EmployeeRepository`, DTO |

---

## 3. Tasklet で Reader/Writer を使う際の重要ルール

Tasklet 内で Chunk 用の `ItemWriter` 等を使う場合、フレームワークによる自動管理が効かないため、自前で管理が必要になる。

### ルールA: `open` / `close` を自前で呼ぶ

Chunk モデルでは自動だが、Tasklet では手動。`StepExecutionListener` を実装して制御する。

**推奨実装（統一パターン）**:

```java
@Component
public class EmployeeTasklet implements Tasklet, StepExecutionListener {
    @Override
    public void beforeStep(StepExecution stepExecution) {
        writer.open(stepExecution.getExecutionContext());
    }
    @Override
    public ExitStatus afterStep(StepExecution stepExecution) {
        writer.close();
        return null;
    }
}
```

### ルールB: `write(Chunk)` を使う（Spring Batch 5系）

5系から `ItemWriter` の引数が `List` ではなく `Chunk` オブジェクトに変更されている。

```java
// ❌ Old
writer.write(employees);
// ✅ New
writer.write(new Chunk<>(employees));
```

### ルールC: メモリ使用量に注意

Tasklet で `repository.findAll()` などをすると、**全件がメモリに乗る**。
数万件を超える可能性がある場合は、Tasklet ではなく **Chunk モデル** を採用すべきである。

---

## 4. トランザクションとリカバリの違い

| モデル      | トランザクション単位            | リカバリ（再実行）                       |
| :---------- | :------------------------------ | :--------------------------------------- |
| **Chunk**   | チャンクサイズ（例: 100件）ごと | **途中から再開可能**（Checkpointが入る） |
| **Tasklet** | ステップ全体で 1 回             | **最初から全やり直し**（基本）           |

**業務チームへの案内**:

- 「途中から再開したい」なら Chunk 一択。
- Tasklet は「失敗したら最初から」で問題ない軽い処理か、冪等性（何度やっても同じ結果）が必要な処理に向く。

---

## 5. 業務チームへの「使い分け」説明用サマリ

> - **大量データ / 途中再開が必要 / 安定運用** → **Chunk**（公式の推奨）
> - **単発の処理 / 軽い処理 / ファイル操作** → **Tasklet**（シンプル記述）
