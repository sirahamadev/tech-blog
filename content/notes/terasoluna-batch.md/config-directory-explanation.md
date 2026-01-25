<!-- copied from: second-brain/TERASOLUNA-Batch/configディレクトリについて/configディレクトリ解説.md -->
<!-- original-filename: configディレクトリ解説.md -->

# TERASOLUNA Batch Framework 設定クラス群の設計思想と役割

TERASOLUNA Batch のブランクプロジェクトには、Spring Batch の複雑な設定を整理・分離するための設定クラス群が用意されています。以下、各クラスの役割と設計思想を解説します。

---

## 1. 各クラスの役割

### **ApplicationContextFactoryHelper**

- **役割**: AsyncBatchDaemon（非同期実行）でジョブ設定クラスを動的に検出・ロードするためのユーティリティ
- **機能**: クラスパスから `@Configuration` アノテーション付きクラスを探し、`ApplicationContextFactory` を生成
- **設計意図**: 非同期実行時に、ジョブごとに独立した ApplicationContext を作成するため

### **AsyncBatchDaemonConfig**

- **役割**: 非同期バッチ実行基盤（DB ポーリング型）の設定
- **機能**:
  - バッチ要求テーブルを監視するスケジューラ設定
  - 非同期実行用のスレッドプール設定
  - ジョブの自動登録機構（AutomaticJobRegistrar）
- **設計意図**: Web システムからバッチを非同期起動する際の、ポーリング＆実行基盤を提供

### **JobBaseContextConfig**

- **役割**: 同期実行用ジョブの基底設定（プロファイル `!async` で有効化）
- **機能**: `LaunchContextConfig` をインポートするだけのシンプルな構成
- **設計意図**: 同期・非同期で設定を明確に分離し、誤って両方が有効化されるのを防ぐ

### **LaunchContextConfig**

- **役割**: **Spring Batch 実行の核となるインフラ設定**
- **機能**:
  - DataSource 設定（admin 用 / job 用の2系統）
  - TransactionManager 設定
  - JobRepository / JobOperator のセットアップ
  - MyBatis の SqlSessionFactory 設定
  - メッセージソース、バリデータなどの共通基盤
- **設計意図**: ジョブ実行に必要なすべての基盤コンポーネントを一元管理

### **TerasolunaBatchConfiguration**

- **役割**: Spring Batch の `DefaultBatchConfiguration` をカスタマイズ
- **機能**:
  - DataSource/TransactionManager の参照名を `adminDataSource` / `adminTransactionManager` に変更
  - JobRepository のトランザクション分離レベルを `SERIALIZABLE` → `READ_COMMITTED` に変更
  - JobOperator の JobParametersConverter を TERASOLUNA 独自実装に差し替え
- **設計意図**: Spring Batch のデフォルト動作を TERASOLUNA の規約に合わせて調整

---

## 2. 必須 vs 用途限定の分類

| クラス                              | 分類         | 条件                                   |
| ----------------------------------- | ------------ | -------------------------------------- |
| **LaunchContextConfig**             | **必須**     | すべてのバッチ実行で必要               |
| **TerasolunaBatchConfiguration**    | **必須**     | すべてのバッチ実行で必要               |
| **JobBaseContextConfig**            | **必須**     | 同期実行（CommandLineJobRunner）で必要 |
| **AsyncBatchDaemonConfig**          | **用途限定** | 非同期実行時のみ必要                   |
| **ApplicationContextFactoryHelper** | **用途限定** | 非同期実行時のみ必要                   |

### 判定理由

- **LaunchContextConfig**: JobRepository、DataSource など Spring Batch の動作に不可欠
- **TerasolunaBatchConfiguration**: DefaultBatchConfiguration のカスタマイズがないと、Bean 名の不一致でエラー
- **JobBaseContextConfig**: 同期実行時のエントリポイント（`@Import` で LaunchContextConfig を引き込む）
- **AsyncBatchDaemonConfig/Helper**: `@Profile("async")` または明示的な有効化が必要なオプション機能

---

## 3. 同期バッチ実行（CommandLineJobRunner）で使われるクラス

### 実行時の設定ロードチェーン

```
CommandLineJobRunner
  ↓
Job01Config (@Configuration)
  ↓ @Import
JobBaseContextConfig
  ↓ @Import
LaunchContextConfig
  ↓ @Import
TerasolunaBatchConfiguration
```

### **使われるクラス**

1. **Job01Config** (または Job02Config)
   - 起動引数で指定するジョブ固有の設定クラス
2. **JobBaseContextConfig**
   - Job01Config が `@Import` で読み込む
3. **LaunchContextConfig**
   - JobBaseContextConfig が `@Import` で読み込む
4. **TerasolunaBatchConfiguration**
   - LaunchContextConfig が `@Import` で読み込む

### **使われないクラス**

- **AsyncBatchDaemonConfig**: プロファイル `async` が無効なので読み込まれない
- **ApplicationContextFactoryHelper**: AsyncBatchDaemonConfig 内でのみ使用

---

## 4. 開発者・業務チームが「基本的に触らなくてよい理由」

### **触らなくてよいクラス**

#### **LaunchContextConfig**

- **理由**: DataSource 接続情報は `batch-application.properties` で外部化されており、設定クラス自体は変更不要
- **例外**: 特殊な DataSource 設定（コネクションプール調整など）が必要な場合のみ

#### **TerasolunaBatchConfiguration**

- **理由**: TERASOLUNA の規約に従った Spring Batch のカスタマイズ済み。変更すると予期しない動作を引き起こす
- **例外**: トランザクション分離レベルをさらに変更する必要がある場合（まれ）

#### **JobBaseContextConfig**

- **理由**: 単なる橋渡し役。機能がないため変更する必要がない

#### **AsyncBatchDaemonConfig / ApplicationContextFactoryHelper**

- **理由**: 非同期実行を使わない限り無関係。使う場合でも、プロパティ設定で調整可能

### **触るべきクラス**

- **Job01Config / Job02Config**: ジョブ固有のビジネスロジック設定（Reader/Processor/Writer）
- **batch-application.properties**: 環境別の接続情報、スキーマ初期化フラグなど

---

## 5. 設計レビュー・質問対応の簡潔説明

### **Q1: LaunchContextConfig は何をしているのか？**

> Spring Batch 実行に必要な DataSource、TransactionManager、JobRepository などの基盤コンポーネントを一元管理する設定クラスです。

### **Q2: TerasolunaBatchConfiguration は必要か？**

> 必要です。Spring Batch のデフォルト設定を TERASOLUNA の規約（Bean 名、トランザクション分離レベルなど）に合わせてカスタマイズしています。

### **Q3: AsyncBatchDaemonConfig は同期実行で使われるか？**

> 使われません。非同期実行（DB ポーリング型）でのみ有効化される設定です。

### **Q4: JobBaseContextConfig の役割は？**

> 同期実行時のエントリポイントで、LaunchContextConfig をインポートするだけのシンプルな橋渡し役です。プロファイル制御により非同期設定との排他を保証します。

### **Q5: これらの設定クラスを変更する必要はあるか？**

> 基本的にありません。接続情報などはプロパティファイルで外部化されており、ジョブ固有の設定は Job01Config などで行います。

### **Q6: ApplicationContextFactoryHelper の存在意義は？**

> 非同期実行時に、クラスパスから `@Configuration` 付きジョブ設定クラスを動的に検出し、ジョブごとに独立した ApplicationContext を生成するためのユーティリティです。

---

## まとめ：設計思想の核心

TERASOLUNA Batch の設定クラス群は、以下の設計原則に基づいています：

1. **関心の分離**: インフラ設定（LaunchContextConfig）とジョブ設定（Job01Config）を明確に分離
2. **規約による統一**: TerasolunaBatchConfiguration で Spring Batch の挙動を統一
3. **同期・非同期の排他制御**: プロファイルにより実行モードを明示的に分離
4. **変更の局所化**: プロパティファイルとジョブ設定クラスに変更を集約し、基盤設定は不変に保つ

この構成により、開発者はビジネスロジック（Job/Step/Tasklet）に集中でき、インフラ設定の誤りによる障害を防ぐことができます。
