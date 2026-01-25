<!-- copied from: second-brain/TERASOLUNA-Batch/memo_2.md -->
<!-- original-filename: memo_2.md -->

> **Summary**
> Explains why the "Official Blank Project" places Repositories under job directories (e.g., `job01`) instead of a shared folder, and advises following this standard for the business team.

# 公式ブランクのディレクトリ構成と Repository の配置について

## 1. 結論（公式構成への準拠）

現在の `Job01Config` や `EmployeeRepository` の配置は、「公式ブランクプロジェクト」の構成そのものである。
「repository ディレクトリ（共通）がない」という疑問への答えは、以下の通り。

> **「公式がそうしている（Repository/Mapper をジョブ配下に置く）」**

---

## 2. 公式ブランクが採っている構成の意図

### ① `sample.config`（基盤・共通）

`AsyncBatchDaemonConfig`, `JobBaseContextConfig` などを置く場所。ジョブに依存しない共通設定をまとめる。

### ② `sample.jobs`（ジョブ定義・組み立て）

`Job01Config` などが存在する。

- `@Import(JobBaseContextConfig.class)`: 共通基盤設定を取り込み。
- `@ComponentScan("sample.job01")`: ジョブ部品を拾う。
- `@MapperScan`: MyBatis Mapper を拾う。
  👉 **「ジョブ定義 ↔ ジョブ部品」の分離** を明確にしている。

### ③ `sample.job01`（ジョブ部品・業務ロジック）

ここに以下を置く：

- Pojo/DTO (`Employee`)
- Logic (`EmployeeProcessor`, `Tasklet`)
- Data Access (`EmployeeRepository`)

公式は **Repository を “共通の repository パッケージ” に集約せず、ジョブ配下に置く** 作りになっている。これは Batch という特性上、ジョブごとにクエリやマッピングが最適化されることが多いためである。

### ④ `resources/sample/job01/`

Mapper XML (`EmployeeRepository.xml`) も同様に、ジョブ単位のディレクトリに閉じている。

---

## 3. 今後の方針（共通基盤としての解）

「業務チームには公式へ誘導したい」という方針に合わせるなら、以下とする。

### ✅ 方針

- **公式ブランクの分割（config / jobs / jobXX / resources/jobXX）をそのまま踏襲する。**
- 業務チームからの質問への回答：
  > 「公式は repository を “jobごとのパッケージ（sample.jobXX）” に置く構成です」

### ✅ 明文化すべきルール

1. **`jobXX`**: ジョブに閉じた部品置き場（DTO, Processor, Tasklet, Mapper）。
2. **`jobs`**: Job/Step 構築（Config）のみ。
3. **`config`**: 共通基盤（DataSource, Transaction, Launcher）。

---

## 4. DB → 加工 → ファイル出力の実装方針

公式 job01 をベースにするなら：

1. `sample.job01.EmployeeRepository`（インタフェース）はそのまま。
2. `resources/.../EmployeeRepository.xml` に `select` 文を書く。
3. `Job01Config` の Reader を、`ListItemReader` から `MyBatisCursorItemReader` 等に差し替える。

👉 **「公式の箱」はそのまま、中身だけ差し替える** のが最も公式準拠である。
