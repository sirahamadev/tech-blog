---
slug: reader-write-process-separation
title: reader write process separation
tags:
  - Terasoluna Batch
published_date: 2026-01-25
---

# 読み書き処理分離の考え方（TERASOLUNA Batch）

## 概要（結論）

TERASOLUNA Batch の公式ブランクでは、  
**Reader / Writer と Processor / Tasklet を意図的に分離する設計思想**が採用されている。

結論を一言でまとめると以下。

> **Reader / Writer は「ジョブに強く依存する設定」**  
> **Processor / Tasklet は「業務ロジックとして独立しやすい処理」**

この違いにより、配置場所が分かれている。

---

## Reader / Writer を JobConfig に置く理由

Reader / Writer には、ほぼ必ず以下の要素が含まれる。

- どの DB / ファイルを読むか
- 使用する SQL ID や Mapper
- 出力ファイルパス
- 区切り文字、カラム順、フォーマット

これらはすべて、

> **「そのジョブが何を読み、どこに出力するか」**

という **ジョブ固有の仕様**であり、  
業務ロジックというより **配線・設定情報**に近い。

そのため公式ブランクでは、以下のように  
JobConfig クラス内で `@Bean` 定義される。

```java
@Configuration
public class Job01Config {

    @Bean
    @StepScope
    public ItemReader<Employee> employeeReader(...) {
        ...
    }

    @Bean
    public ItemWriter<Employee> employeeWriter() {
        ...
    }
}
```

---

## Processor を jobXX パッケージに置く理由

Processor が担う役割は以下。

- 入力 → 出力の変換
- 値の加工・補正
- フィルタリング（`null` を返す等）

これは明確に **業務ロジック**であり、次の特徴を持つ。

- 単体で意味を持つ
- テストしやすい
- 将来、別ジョブで再利用される可能性がある

そのため、Processor は設定クラスから切り離し、
クラスとして jobXX パッケージに配置する。

```java
@Component
public class EmployeeProcessor
        implements ItemProcessor<Employee, Employee> {
    ...
}
```

---

## 「Processor は必ず外に出すべきか？」

ここは誤解しやすいポイント。

### 正確な整理は以下。

- Processor は **外に出しやすい**
- ただし **必ず外に出さなければならないわけではない**

公式的な判断基準は次の通り。

- 処理が軽く単純
  → JobConfig に `@Bean` 定義しても問題ない
- 業務ロジックとして意味を持つ
  → クラスとして切り出す方が望ましい

つまり **設計判断の問題**である。

---

## 公式ブランクの配置思想まとめ

| 種別                | 配置場所  | 理由                   |
| ------------------- | --------- | ---------------------- |
| Reader              | JobConfig | ジョブ固有の入出力仕様 |
| Writer              | JobConfig | ジョブ固有の入出力仕様 |
| Processor           | jobXX     | 業務ロジック           |
| Tasklet             | jobXX     | 業務ロジック           |
| DTO                 | jobXX     | ジョブのデータ構造     |
| Repository / Mapper | jobXX     | DBアクセス定義         |

---

## よくある誤解の補正

- ❌「Processor だけ外に出せば正解」
- ⭕「**Processor は外に出すと設計がきれいになりやすい**」

このニュアンスの差が重要。

---

## 公式思想を一文で説明すると（説明用）

> Reader / Writer はジョブ固有の入出力仕様であるため JobConfig に定義し、
> Processor や Tasklet のような業務ロジックは job パッケージに切り出すのが、
> TERASOLUNA Batch 公式ブランクの設計思想です。

---

## まとめ

- 読み書き（Reader / Writer）は「設定・配線」
- 変換・処理（Processor / Tasklet）は「業務ロジック」
- 分離することで
  - 設計が明確になる
  - 再利用性・テスト性が向上する

- すべては **ジョブ仕様とロジックを混ぜないため**
