/**
 * 日本語の UI 文言。キーは機能.要素 の 2 階層。
 */
export const ja = {
  app: { loading: "読み込み中…", lang: "言語" },
  tabs: { catalog: "カタログ", mining: "抽出", conventions: "規約の審査",
    catalogHint: "パッケージの一覧とインストール手順", miningHint: "レビューから暗黙の規約を抽出", conventionsHint: "抽出結果を承認・却下・昇格" },
  common: { copy: "コピー", close: "閉じる", save: "保存", delete: "削除", add: "追加", none: "なし", all: "すべて表示", running: "実行中…", done: "完了", failed: "失敗", optional: "（任意）", count: "{n} 件" },
  status: { proposed: "未審査", accepted: "承認済み", rejected: "却下", promoted: "昇格済み" },
  kind: { skill: "skill（手順）", instruction: "instruction（常時ルール）" },
  catalog: {
    intro: "使いたいパッケージを選ぶと、apm でインストールするコマンドが下に表示されます（--target は出力先のチップで調整）。",
    packages: "パッケージ", authorMode: "作者モード（おすすめ・見出し・プリセットを編集）", empty: "apm.yml にパッケージがありません。",
    manifestClaude: "Claude 用マニフェストあり", manifestClaudeMissing: "Claude 用マニフェスト未生成", manifestCodex: "Codex 用マニフェストあり", manifestCodexMissing: "Codex 用マニフェストなし",
    check: "検証", checkHint: "apm marketplace check: 到達性とバージョン解決を検証", outdated: "更新確認", outdatedHint: "apm marketplace outdated: 更新可能なパッケージ", pack: "マニフェスト再生成", packHint: "apm pack: marketplace.json を再生成",
    featured: "おすすめ", remote: "外部リポジトリ", hidden: "非表示", noArtifacts: "（skills / instructions なし）", selectHint: "インストール対象に追加",
    headline: "見出し（このパッケージが何をするか 1 行で）", audience: "対象者（カンマ区切り: backend, frontend）", hide: "一覧から隠す", saveEntry: "保存（teller.yml）", feature: "おすすめにする", unfeature: "おすすめを外す",
    presets: "プリセット", presetsEmpty: "まだありません。パッケージを選んでから下で作成できます。", presetName: "プリセット名（例: backend-starter）", presetDesc: "説明", createPreset: "選択中の {n} 件でプリセット作成",
    targets: "--target:", noTargets: "出力先のアシスタントを 1 つ以上チェックしてください。", installHint: "パッケージにチェックを入れると、ここにインストール手順が表示されます。", install: "インストール手順", clear: "選択解除",
  },
  mining: {
    intro: "対象リポジトリの PR レビュー・コメントを gh で取得し、Claude Code または Codex の対話セッションに「繰り返し指摘されている暗黙の規約」を {dir}/ へ書かせます。書き込みは hooks で検証されます。",
    agent: "使うエージェント", step1: "前提チェック", step2: "対象リポジトリ", step3: "抽出を実行",
    ready: "✓ すべて揃っています。抽出を実行できます。", notReady: "✗ {n} 件の必須項目が未対応です：{items}", checkingDetail: "前提を確認しています…（gh の認証や各リポジトリへの到達確認に数秒かかります）", recheck: "再チェック", checking: "確認中…", fix: "直し方",
    groupTools: "必要なコマンド", groupGithub: "GitHub", groupRepo: "このリポジトリの設定",
    check: { codex: "codex CLI（OpenAI Codex）", "codex-hooks": "Codex の hooks 設定", apm: "apm CLI", claude: "claude CLI（Claude Code）", gh: "gh CLI", self: "apm-teller が PATH 上にある（Claude の hook から呼ばれる）", "gh-auth": "gh でログイン済み", prompt: "抽出プロンプト", "agent-settings": "Claude の hooks 設定", sources: "対象リポジトリが設定済み", repo: "{repo} を読める" },
    fixes: { codex: "npm i -g @openai/codex のあと codex で一度ログイン", self: "npm i -g apm-teller（開発中は dist を指すシムを PATH に置く）", "gh-auth": "ターミナルで gh auth login", sources: "下の「2. 対象リポジトリ」で追加", prompt: "apm-teller init を実行", "agent-settings": "apm-teller init を実行", claude: "npm i -g @anthropic-ai/claude-code のあと claude で一度ログイン", repo: "リポジトリ名と gh トークンの読み取り権限を確認" },
    repoInput: "owner/repo または URL（GitHub Enterprise も可）", sourcesEmpty: "まだありません。レビュー履歴を読みたいリポジトリを owner/repo 形式で追加してください（例: microsoft/apm）。", lastPrs: "直近 {n} 件の PR", prsLabel: "件の PR", recent: "直近",
    blocked: "まだ実行できません：{items}", run: "▶ {n} 件のリポジトリから抽出する", skipFetch: "取得を省略（前回のデータを再利用）", skipFetchHint: "gh での再取得を省略し、前回取得した生データを使う",
    running: "実行中…", starting: "開始しています…", elapsed: "経過 {s} 秒", phaseFetch: "レビューを取得中 {done}/{total} {label}",  extraPrompt: "Claude への追加指示（任意・次回の実行に反映）", extraPromptHint: "例: テストとエラーハンドリングに関する規約だけを抽出して。日本語で書いて。", terminalHint: "下のターミナルは通常の claude セッションです。質問や許可の確認にはここでそのまま答えてください（Ctrl+C で中断）。", logTitle: "テキストログ（.teller/runs に保存）", phaseExtract: "Claude が規約を抽出中（下のターミナルで対話できます）", takesTime: "gh の取得のあと claude の対話セッションが始まります。完了したら「規約の審査」タブで確認してください。", logPlaceholder: "ログはここに表示されます。", past: "過去の実行:",
  },
  errors: {
    "install.noTargets": "出力先のアシスタントを 1 つ以上選んでください",
    "convention.invalidTransition": "「{from}」から「{to}」へは変更できません（{id}）",
    "convention.readOnly": "{id} は昇格済みのため編集できません",
    "convention.invalidEdit": "編集内容が不正です",
    "convention.notFound": "規約 {id} が見つかりません（ファイルが壊れている可能性があります）",
    "convention.notAccepted": "{id} は承認してから昇格してください（現在: {status}）",
    "package.remote": "{name} は外部リポジトリのパッケージです。ローカルパッケージにのみ昇格できます",
    "package.unknown": "存在しないパッケージ: {names}",
    "package.exists": "パッケージ {name} は既にあります",
    "package.badName": "パッケージ名は kebab-case にしてください: {name}",
    "package.artifactExists": "{pkg} に {kind}「{name}」は既にあります",
    "package.badArtifactName": "ファイル名は kebab-case にしてください: {name}",
    "mining.sourceExists": "{repo} は既に追加されています",
    "mining.badRepoRef": "リポジトリとして解釈できません: {input}（owner/repo か GitHub の URL）",
  },
  conventions: {
    intro: "レビュー履歴から抽出された暗黙の規約です。承認したものだけがパッケージに書き出されます。",
    empty: "該当なし。「抽出」タブから実行してください。", pick: "左の一覧から選んでください。", confidence: "確度", sources: "出典", run: "実行",
    kindHint: "昇格先の種別（ファイルに保存され、昇格フォームの初期値になります）", sourcesTitle: "出典（レビューコメント）", bodyTitle: "本文（## Rule / ## Rationale が必須）", saveChanges: "変更を保存", accept: "✓ 承認", reject: "✕ 却下", reopen: "↩ 審査に戻す", promotedTo: "書き出し先",
    promoteTitle: "パッケージへ昇格", promoteIntro: "承認した規約を skill（SKILL.md）または instruction（*.instructions.md）としてパッケージに書き出します。", orNew: "または新規:", newPackage: "新しいパッケージ名（kebab-case）",
    fileName: "ファイル名（kebab-case）", applyTo: "適用対象 glob（例: **/*.ts）", promote: "昇格する →", wrote: "✓ 書き出しました", packageCreated: "（パッケージを新規作成しました。カタログの「マニフェスト再生成」を実行してください）",
  },
};

export type Dict = typeof ja;
