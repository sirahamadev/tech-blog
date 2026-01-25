<!-- copied from: second-brain/TERASOLUNA-Batch/memo.md -->
<!-- original-filename: memo.md -->

> **Summary**
> Short references for Job component placement rules and command line execution examples.

# 開発メモ（ルール & コマンド）

## 1. コンポーネント配置ルール

| 種類                    | 配置先      | 理由                                                     |
| :---------------------- | :---------- | :------------------------------------------------------- |
| **Reader / Writer**     | `JobConfig` | ジョブ仕様そのものであるため、組み立て（Config）側で定義 |
| **Processor / Tasklet** | `jobXX`     | 業務ロジックそのものであるため、ジョブディレクトリへ     |
| **DTO / Repository**    | `jobXX`     | ジョブ固有のデータ構造・アクセス定義であるため           |

---

## 2. 実行コマンド例

### Chunk Job (job01)

```bash
java -cp "target/blank-project-1.0.0-SNAPSHOT.jar:target/lib/*" \
  org.springframework.batch.core.launch.support.CommandLineJobRunner \
  sample.jobs.chunk.ChunkSampleJobConfig chunkSampleJob
```

### Tasklet Job (job02)

```bash
java -cp "target/blank-project-1.0.0-SNAPSHOT.jar:target/lib/*" \
  org.springframework.batch.core.launch.support.CommandLineJobRunner \
  sample.jobs.tasklet.TaskletSampleJobConfig taskletSampleJob
```

---

## 3. DB初期化 (PostgreSQL)

```sql
DROP TABLE IF EXISTS sample_data;

CREATE TABLE sample_data (
  id   SERIAL PRIMARY KEY,
  data TEXT NOT NULL
);

INSERT INTO sample_data (data) VALUES
('Item One'), ('Item Two'), ('Item Three'), ('Item Four'), ('Item Five');
```
