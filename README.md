# Tech Blog

## Markdown を Supabase に同期

このプロジェクトは、同期スクリプトを使用して `content/` 内のローカル Markdown コンテンツを Supabase データベースにプッシュします。

### セットアップ

1.  **環境変数**:
    ルートディレクトリに `.env` ファイルを作成し(利用可能な場合は `.env.example` を基に)、以下を設定してください:

    ```bash
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

2.  **依存関係**:
    ```bash
    pnpm install
    ```

### ローカルで同期を実行

コンテンツを手動で同期するには:

```bash
pnpm sync
# または
pnpm tsx scripts/sync.ts
```

### GitHub Actions

`.github/workflows/sync.yml` を介して、`main` へのプッシュ時に同期が自動的に実行されます。

**必要なシークレット**:
GitHub リポジトリのシークレットに以下を設定してください:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

> [!WARNING]
> **データ可用性のリスク**
> 同期プロセスは「全削除 -> 全挿入」戦略を使用しています。
>
> 1. `post_tags`、`note_nodes`、`tags`、`posts` からすべての行を削除します。
> 2. ローカルファイルから新しいデータを挿入します。
>
> **スクリプトが実行途中で失敗した場合(例: ネットワークエラー)、データベースが空のままになるか、部分的にのみデータが投入された状態になる可能性があります。**
> 復旧するには、成功するまでスクリプトを再実行してください(ローカルで実行、または Action を再トリガー)。
