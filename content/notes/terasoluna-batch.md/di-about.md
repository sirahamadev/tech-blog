<!-- copied from: second-brain/TERASOLUNA-Batch/DIについて.md -->
<!-- original-filename: DIについて.md -->

> **Summary**
> Explains Dependency Injection (DI) in the context of Spring Batch/TeraSoluna, using concrete examples like Tasklet and Repository injection.

# DI（依存性注入）について - Spring Batch 編

## 1. 結論（一文で）

> **「自分で `new` しないで、Spring から渡してもらう設計」**

---

## 2. DI がない世界 vs ある世界

### ❌ DI なし（密結合）

```java
public class EmployeeTasklet {
    private EmployeeRepository repository = new EmployeeRepository(); // 自分で作る

    public void execute() {
        repository.findAll();
    }
}
```

**問題点**: Repository の実装を変えたい時に、Tasklet も修正が必要になる。

### ✅ DI あり（疎結合）

```java
@Component // Spring に「これ管理して」と伝える
public class EmployeeTasklet {
    private final EmployeeRepository repository;

    // 「渡してもらう」コンストラクタ
    public EmployeeTasklet(EmployeeRepository repository) {
        this.repository = repository;
    }
}
```

**メリット**: Tasklet は「Repository を使う」ことだけを知っていればよく、「どう作るか」に関心を持たなくて済む。

---

## 3. Spring Batch / Terasoluna での実装

あなたのコード（`Job01Config` や Tasklet）は、**完璧に DI できている**。

```java
public EmployeeTasklet(EmployeeRepository employeeRepository,
                       FlatFileItemWriter<Employee> job02EmployeeWriter) {
    this.employeeRepository = employeeRepository;
    this.job02EmployeeWriter = job02EmployeeWriter;
}
```

- **Tasklet**: Repository や Writer が「どこから来るか」を知らない。
- **Spring**: 裏側で `Repository` と `Writer` を生成し、Tasklet のコンストラクタに渡している。

これがフレームワークを使う最大の利点である。

---

## 4. まとめの言葉

> - **DI = new しない**
> - **DI = 外から渡す**
> - **DI = Spring が面倒を見る**

これだけ理解していれば、Spring Batch の設計で困ることはない。
