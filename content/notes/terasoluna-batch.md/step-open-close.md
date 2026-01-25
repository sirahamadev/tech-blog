# open / close の概念整理（Terasoluna Batch / Spring Batch）

## 1. open / close とは何か（結論）

`open()` / `close()` は **メモリ解放そのものではない**。
正体は **Step 実行単位に紐づいたリソース管理**。

- `open()`
  → Step で使う外部リソースを「使える状態」に初期化する
- `close()`
  → Step が終わったので、使っていたリソースを「確実に後始末する」

ここで言うリソースとは主に以下：

- ファイルストリーム
- DB コネクション
- バッファ
- ExecutionContext に紐づく状態情報

---

## 2. Chunk モデルで open / close を意識しなくていい理由

Chunk モデルでは、Spring Batch が Step のライフサイクルを完全に管理する。

内部的には以下が自動で行われる：

1. Step 開始時
   - `ItemReader.open()`
   - `ItemWriter.open()`

2. チャンク処理（Read → Process → Write を繰り返す）
3. Step 終了時
   - `ItemWriter.close()`
   - `ItemReader.close()`

そのため、**Chunk を使う場合は open / close を自分で書く必要がない**。

---

## 3. Tasklet で open / close が必要になる理由

Tasklet は以下の思想で設計されている：

> 「execute() の中で何をするかはフレームワークは知らない」

つまり Spring Batch から見ると：

- Reader / Writer を使うか分からない
- ファイルを扱うか分からない
- DB にアクセスするか分からない

👉 **自動管理ができない**

そのため、Tasklet 内で Chunk 用の `ItemWriter` や `ItemReader` を使う場合、
**open / close を自前で管理する責任が発生する**。

---

## 4. open() が実際にやっていること

例：`FlatFileItemWriter`

`open()` の中では主に以下を行っている：

- 出力ファイルを開く
- 書き込み用ストリームを初期化
- `ExecutionContext` から状態を復元
  - 再実行時の書き込み位置
  - 前回実行時の情報

つまり `open()` は、

> 「この Step 用に Writer を正しい状態で起動する処理」

`open()` を呼ばないと、Writer は **正常に動作しない前提**。

---

## 5. close() が実際にやっていること

`close()` では以下が行われる：

- バッファの flush
- ストリームの close
- `ExecutionContext` への状態保存

これを呼ばないと：

- ファイルが途中で壊れる
- 書き込みが完了しない
- 再実行時に状態が残らない

👉 **地味だが致命的になりやすい**

---

## 6. 「メモリ解放」ではない理由

よくある誤解：

> close = メモリ解放

実際には：

- JVM メモリ → GC が管理
- close が対象にしているのは **JVM 外のリソース**

例：

- ファイルハンドル
- DB コネクション
- ソケット

これらは **close しない限り解放されない**。

---

## 7. なぜ StepExecutionListener を使うのか

Tasklet の `execute()` 内で open / close を行うと：

- 例外時に close が呼ばれない可能性がある
- Step の責務と処理ロジックが混ざる

そのため、**Step のライフサイクルに正しく乗せるために**
`StepExecutionListener` を使うのが定石。

```java
public class EmployeeTasklet
        implements Tasklet, StepExecutionListener {

    @Override
    public void beforeStep(StepExecution stepExecution) {
        writer.open(stepExecution.getExecutionContext());
    }

    @Override
    public ExitStatus afterStep(StepExecution stepExecution) {
        writer.close();
        return ExitStatus.COMPLETED;
    }
}
```

---

## 8. Chunk と Tasklet の決定的な違い（open / close 視点）

| 観点             | Chunk                | Tasklet            |
| ---------------- | -------------------- | ------------------ |
| open / close     | フレームワークが自動 | 実装者が管理       |
| ExecutionContext | 自動                 | 明示的に扱う       |
| 安全性           | 高い                 | 実装ミスの余地あり |
| 推奨用途         | 大量データ           | 軽量・単発処理     |

---

## 9. まとめ（覚えるポイント）

- open / close は「メモリ解放」の話ではない
- **Step 単位のリソース管理**
- Chunk はフレームワーク管理
- Tasklet は自己責任
- Tasklet で Chunk 用部品を使うなら
  - open / close は必須
  - StepExecutionListener が定石

---

この md、**そのまま second-brain / Terasoluna メモに置いてOKな粒度**。
次に続けるなら、

- ExecutionContext に何が保存されているか
- 再実行時に Chunk と Tasklet で何が違うか

ここを足すと「公式ガイドラインを説明できる資料」になるよ。
