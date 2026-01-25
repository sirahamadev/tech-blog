---
slug: commonalization_guide
title: commonalization guide
tags:
  - Terasoluna Batch
published_date: 2026-01-25
---

TERASOLUNA Batch Framework における共通化の基準について、公式ガイドラインに基づいて解説します。

## 共通化の基本原則

TERASOLUNA Batch では「**ジョブ間の独立性**」と「**変更の局所化**」を重視しています。

### 1. MyBatis Mapper XMLファイルの配置

**公式の推奨：ジョブごとに個別配置**

現在のプロジェクトでは以下の2ファイルが存在しています：

```
src/main/resources/com/example/batch/job01/EmployeeRepository.xml
src/main/resources/com/example/batch/job02/EmployeeRepository.xml
```

#### なぜ共通化しないのか？

公式ガイドラインでは、以下の理由から**ジョブごとに個別配置**を推奨しています：

1. **ジョブ間の独立性確保**
   - job01とjob02で現在は同じSQLでも、将来的に異なる要件が発生する可能性が高い
   - 一方のジョブでSQL変更が必要になった際、他方に影響を与えない

2. **パッケージ構造との整合性**
   - Javaクラス（Repository interface）はジョブごとに別パッケージ
   - XMLファイルもパッケージ構造に合わせて配置することで、関連ファイルの探索が容易

3. **MapperScanの設定**
   ```java
   @MapperScan(basePackages = "com.example.batch.job01",
               sqlSessionFactoryRef = "jobSqlSessionFactory")
   ```
   各ジョブ設定で個別パッケージをスキャンする構成になっている

> 📘 **参考**: [TERASOLUNA Batch 5.x Development Guideline - Database Access (MyBatis3)](https://terasoluna-batch.github.io/guideline/5.5.0.RELEASE/en/Ch05_DBAccess.html#Ch05_DBAccess)

---

## 共通化の判断基準（公式ガイドライン準拠）

### ✅ 共通化すべきもの

#### 1. **フレームワーク設定クラス**

現在のプロジェクトで既に共通化されているもの：

```
LaunchContextConfig.java          ← データソース、トランザクション管理
JobBaseContextConfig.java         ← 同期ジョブ基盤設定
TerasolunaBatchConfiguration.java ← Spring Batch基本設定
AsyncBatchDaemonConfig.java       ← 非同期実行基盤設定（該当する場合）
```

**理由**: これらはフレームワークの動作を定義する設定であり、全ジョブで統一すべき

> 📘 **参考**: [Job Definition and Execution Management](https://terasoluna-batch.github.io/guideline/5.5.0.RELEASE/en/Ch04_JobParameter.html)

#### 2. **アプリケーション共通のUtilityクラス**

- 日付フォーマット処理
- 文字列変換処理
- 共通的な業務ロジック（複数ジョブで使用が確定しているもの）

配置場所例：

```
com.example.batch.common.util.DateUtil
com.example.batch.common.util.StringUtil
```

#### 3. **共通例外クラス**

```
com.example.batch.common.exception.BusinessException
com.example.batch.common.exception.SystemException
```

> 📘 **参考**: [Exception Handling](https://terasoluna-batch.github.io/guideline/5.5.0.RELEASE/en/Ch06_ExceptionHandling.html)

---

### ❌ 共通化すべきでないもの

#### 1. **ジョブ固有のドメインモデル（Entity/DTO）**

現在の配置（正しい）：

```java
com.example.batch.job01.Employee  ← job01専用
com.example.batch.job02.Employee  ← job02専用
```

**理由**:

- 現時点では同じ構造でも、ジョブごとに将来的に異なるフィールドが必要になる可能性
- 一方のジョブでの変更が他方に影響することを防ぐ

> 💡 **公式ガイドラインの考え方**: "Change Localization" - 変更の影響範囲を最小化する

#### 2. **Repository interface & Mapper XML**

現在の配置（正しい）：

```
com.example.batch.job01.EmployeeRepository (interface)
com.example.batch.job01.EmployeeRepository.xml
com.example.batch.job02.EmployeeRepository (interface)
com.example.batch.job02.EmployeeRepository.xml
```

#### 3. **ジョブ固有のビジネスロジック**

- Processor, Tasklet, Listener等のジョブ実装クラス

---

## 実践的な判断フロー

```
共通化を検討する際の質問：

1. このコンポーネントはフレームワーク層か？
   YES → 共通化する（config配下）
   NO  → 質問2へ

2. 3つ以上のジョブで確実に使用するか？
   YES → 質問3へ
   NO  → ジョブ個別で配置

3. 将来的に要件が分岐する可能性は低いか？
   YES → 共通化を検討（common配下）
   NO  → ジョブ個別で配置

4. 変更時の影響範囲を許容できるか？
   YES → 共通化する
   NO  → ジョブ個別で配置
```

---

## 推奨ディレクトリ構造

```
src/main/java/com/example/batch/
├── config/                          ← フレームワーク設定（全ジョブ共通）
│   ├── LaunchContextConfig.java
│   ├── JobBaseContextConfig.java
│   └── TerasolunaBatchConfiguration.java
│
├── common/                          ← アプリケーション共通（3ジョブ以上で使用）
│   ├── util/
│   ├── exception/
│   └── constant/
│
├── jobs/                            ← ジョブ定義クラス
│   ├── Job01Config.java
│   └── Job02Config.java
│
├── job01/                           ← job01専用
│   ├── Employee.java
│   ├── EmployeeRepository.java
│   ├── EmployeeProcessor.java
│   └── (EmployeeRepository.xml)    ← resources配下に配置
│
└── job02/                           ← job02専用
    ├── Employee.java
    ├── EmployeeRepository.java
    ├── EmployeeTasklet.java
    └── (EmployeeRepository.xml)    ← resources配下に配置
```

---

## 現在のプロジェクトの評価

あなたのプロジェクトは**公式ガイドラインに完全に準拠**しています：

✅ **正しい点**：

1. Mapper XMLをジョブごとに配置している
2. Employeeクラスをジョブごとに定義している
3. フレームワーク設定は共通化（config配下）
4. ジョブ定義クラスは別パッケージ（jobs配下）

---

## 補足：「DRY原則」との向き合い方

プログラミングの一般原則である「Don't Repeat Yourself (DRY)」と、TERASOLUNA Batchの「変更の局所化」は時に相反します。

**公式ガイドラインのスタンス**：

> バッチ処理では、長期運用における保守性を重視し、**適度な重複は許容する**

同じコードが2箇所にあっても、それが**異なるビジネス要件に対応する可能性がある場合**は、共通化せずに個別に保持することを推奨しています。

> 📘 **参考**: [Architecture and Design Guideline](https://terasoluna-batch.github.io/guideline/5.5.0.RELEASE/en/Ch02_GeneralBatchProcessing.html#Ch02_GeneralBatchProcessing_Arch)

---

## まとめ

**現在のEmployeeRepository.xml × 2 の配置は正しい**です。

公式ガイドラインでは、短期的なコード重複よりも、長期的な保守性（ジョブ間の独立性、変更の局所化）を優先する設計思想を採用しています。
