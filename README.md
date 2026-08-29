# apm-teller

[Microsoft APM](https://github.com/microsoft/apm) マーケットプレイスリポジトリ（[apm-vault](https://github.com/healthybamboo/apm-vault) のような "vault"）のための、
**ローカル GUI + 暗黙知マイニング** ツールです。

- **Catalog** — vault 内のパッケージ / skills / instructions を可視化し、利用者は GUI でパッケージやプリセットを選ぶだけで各アシスタント向けのインストールコマンドを得られる（README を書かなくてよい）。作者は「おすすめ」「見出し」「プリセット」をぽちぽち設定できる。
- **Mining** — `gh` で対象リポジトリの PR レビュー・コメントを取得し、`claude -p`（ヘッドレス Claude Code）に「繰り返し指摘されている暗黙のチーム規約」を `.teller/conventions/*.md` として書かせる。書き込みは Claude Code の hooks 経由で `apm-teller validate` が検証し、フォーマット違反はその場で差し戻す。
- **Conventions** — 抽出された規約を GUI で審査（accept / reject / edit）し、承認したものをパッケージの `SKILL.md` / `*.instructions.md` に昇格。必要ならパッケージも新規作成して `apm.yml` に登録する。

**永続化データは vault リポジトリ内のテキストファイルだけ**（`teller.yml` と `.teller/`）。DB も外部サービスもなく、GUI は git 操作をしません。差分を確認してコミットするのは人の仕事です。

## 使い方

```sh
npm i -g apm-teller          # hooks から `apm-teller validate` が呼ばれるため PATH に必要
cd path/to/your-vault        # apm.yml のあるリポジトリ
apm-teller init              # teller.yml / .teller/ の雛形を作成
apm-teller doctor            # gh / claude / apm / 認証 / repo 到達性をチェック
apm-teller serve             # http://localhost:4747
```

マイニングは GUI の Mining タブ、または CLI から:

```sh
apm-teller mine                    # teller.yml の mining.sources 全件
apm-teller mine owner/repo --dry-run
apm-teller review <id> accept
apm-teller promote <id> --package team-conventions --apply-to '**/*.ts'
apm pack                           # 新規パッケージを作った場合はマニフェスト再生成
```

## vault 内に置かれるもの

```
teller.yml                         # ツール設定の SSOT（paths / catalog / mining）
.teller/
  conventions/<id>.md              # 1 ファイル = 1 規約（front matter + ## Rule / ## Rationale）
  prompts/extract-conventions.md   # Claude への抽出プロンプト（編集可）
  claude/settings.json             # Claude Code の hooks（PostToolUse → apm-teller validate --hook）
  runs/<run-id>.md                 # 実行サマリ（*.log は既定で gitignore）
  raw/                             # gh で取得した生データ（既定で gitignore）
```

## アーキテクチャ

pnpm workspace の 3 パッケージ。`core` は外部プロセスに依存せず、`cli` が composition root です。

```
packages/core/src
  domain/
    shared/        AggregateRoot、ドメインエラー、Logger、命名規約
    marketplace/   Vault・LocalPackage 集約、成果物、InstallRecipeService
    catalog/       Catalog 集約（featured / 表示情報 / プリセット）
    convention/    Convention 集約（状態遷移・本文ポリシー）
    mining/        MiningConfig 集約、各ポート（ReviewSource / Extractor / RunLog / EnvironmentProbe）、ReadinessService
    (各コンテキストは aggregate/ value/ schema/ repository/ port/ service/ view/ dto/ に分割)
  application/     ユースケース（*UseCase）と Dependencies
  infrastructure/  teller.yml / apm.yml / Markdown のリポジトリ実装
packages/cli/src
  infrastructure/  gh・claude・apm・shell アダプタ
  http/            Hono Controller（DI）
  commands/        CLI コマンド（DI）
  container.ts     composition root
packages/web       React + Vite（API 経由のみ）
```

命名規約: 集約ルートは無 suffix（`Vault`, `Convention`…）、それ以外はロール suffix（`*Repository`, `*Port`, `*Service`, `*UseCase`, `*Value`, `*Dto`, `*View`, `*Schema`）。ファイル名は lowerCamelCase、import に拡張子は付けない。TSDoc は日本語・複数行必須（`pnpm lint` で強制）。

## 開発

```sh
pnpm install
pnpm build        # core → web → cli（cli/public に web を同梱）
pnpm typecheck
pnpm lint
pnpm link --global --filter apm-teller   # ローカルの apm-teller を PATH に載せる
```

`apm-package/` は apm-vault に同梱するための APM パッケージ（Skill）です。
