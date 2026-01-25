<!-- copied from: second-brain/TERASOLUNA-Batch/knowledge/stepScope.md -->
<!-- original-filename: stepScope.md -->

# StepScope の理解と判断基準（Spring Batch / TERASOLUNA Batch）

## 概要（結論）

`@StepScope` は **Step 実行のたびに Bean を生成するスコープ**である。  
主目的は **JobParameters 等の「実行時に決まる値」を Bean に注入する（Late Binding）**こと。

- 通常の `@Bean` は **singleton**（起動時に1回生成し共有）
- `@StepScope` は **Step 開始時に生成**し、Step のコンテキストに紐づく

また、StepScope の Bean は Spring によって **実体ではなくプロキシとして保持**され、  
Step 実行時に「現在の StepContext から実体を取り出す」動きになる（＝一定のオーバーヘッドと理解コストがある）。

---

## StepScope とは何か

### 生成タイミングの違い

- singleton（デフォルト）
  - アプリ起動時に生成
  - 以後同じインスタンスが使われ続ける
- StepScope
  - Step 開始時に生成
  - Step コンテキストに紐づく（Step ごとにインスタンスが分かれる）

---

## なぜ StepScope が必要になるのか（Late Binding）

**「実行時に決まる値」を注入したい**とき、StepScope が必要になる。

例：入力ファイルパスを JobParameters から受け取る

```java
@Bean
@StepScope
public FlatFileItemReader<Employee> reader(
  @Value("#{jobParameters['inputFile']}") String inputFile
) {
  ...
}
```

ポイント：

- `jobParameters` は **ジョブ開始前には存在しない**
- singleton だと生成タイミングが早すぎて、値が取れない／固定される
- そのため **Step 開始時に生成する必要がある** → `@StepScope`

---

## StepScope を付けたときの効果とコスト

### 得られるもの（メリット）

- `jobParameters`, `stepExecutionContext`, `jobExecutionContext` を `@Value("#{...}")` で参照できる
- Step ごとにインスタンスが分かれるため、状態を持つコンポーネントの分離に使える（ただし設計次第）

### 失うもの（デメリット／コスト）

- Bean が **プロキシになる**（デバッグ・理解が一段難しくなる）
- Bean 生成が **毎 Step** になる（オーバーヘッド）
- 「とりあえず StepScope」を誘発しやすい（共通基盤だと教育コストが増える）

---

## 「Late Binding が不要なら外してよい」は正しいか

**基本は Yes**。以下に該当するなら singleton で問題ないことが多い。

- `jobParameters` を使っていない
- `stepExecutionContext` / `jobExecutionContext` を参照していない
- Step ごとに作り直す必要のある状態を持っていない（または設計上共有しない）

この場合、`@StepScope` は **複雑さが増えるだけ**になりやすい。

---

## 例外：Late Binding がなくても StepScope が役に立つケース

### 例外1：状態を持つ Reader / Writer を Step ごとに分離したい

`ItemReader` / `ItemWriter` は処理中に状態（カーソル位置、ファイル位置など）を持つことがある。
同一定義を複数 Step で共有したり、並列実行したりする設計では、StepScope で分離できる。

ただし、**通常は「Step ごとに別 Bean を定義する」設計にしておけば singleton でも問題にならないことが多い**。

### 例外2：`@Value("#{...}")` を使った注入をしたい

設定値を SpEL で Step/Job コンテキストから引きたい場合は StepScope が必要になる。

---

## 実務での判断基準（チェックリスト）

対象：`MyBatisCursorItemReader<Employee> employeeReader(...)` 等の Reader/Writer

### StepScope が必要（付ける）

- `@Value("#{jobParameters['...']}")` を使用している
- `stepExecutionContext` / `jobExecutionContext` を参照している
- 同一 Reader/Writer 定義を複数 Step/並列で共有し、Step ごとに状態分離が必要

### StepScope は不要（外してよい）

- 固定設定のみ（DataSource / SqlSessionFactory / queryId / fetchSize 等）
- Job/Step コンテキスト参照なし
- そもそも Step ごとに Bean を分けている（例：job01 専用 reader）

---

## 「プロキシのオーバーヘッド」はどれくらい重要か

性能面で致命傷になるケースは多くない。
共通基盤としての「優先度」が上がる理由は、性能よりも次が大きい。

- 理解コストが増える
- 「いつ生成される Bean か」が初心者に見えにくい
- 「とりあえず StepScope」文化が生まれる

そのため、**不要なら外す**判断は妥当になりやすい。

---

## 説明用テンプレ

> StepScope は「Step 開始時に Bean を生成する」仕組みです。
> JobParameters など実行時に決まる値を Reader/Writer に注入する場合に使用します。
> 固定設定のみであれば singleton で十分なため、混乱防止の観点から StepScope は付けません。

---

## 補足（断言のために見るべきポイント）

`employeeReader` に対して StepScope 必要/不要を断言するには、以下を確認すればよい。

- `@Value("#{jobParameters[...]}" )` があるか
- Step/Job コンテキスト参照があるか
- 同一 Reader/Writer を複数 Step で共有していないか（並列含む）
