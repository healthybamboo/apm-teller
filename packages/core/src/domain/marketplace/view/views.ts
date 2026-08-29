/**
 * パッケージ内の Skill（.apm/skills/<name>/SKILL.md）の読み取りモデル。
 */
export interface SkillView {
  /**
   * Skill 名（ディレクトリ名、kebab-case）。
   */
  name: string;

  /**
   * SKILL.md の front matter に書かれた説明文。無ければ省略。
   */
  description?: string;

  /**
   * SKILL.md の vault 相対パス。
   */
  file: string;
}

/**
 * パッケージ内の Instruction（.apm/instructions/<name>.instructions.md）の読み取りモデル。
 */
export interface InstructionView {
  /**
   * Instruction 名（ファイル名から `.instructions.md` を除いたもの、kebab-case）。
   */
  name: string;

  /**
   * front matter に書かれた説明文。無ければ省略。
   */
  description?: string;

  /**
   * 適用対象ファイルの glob（front matter の applyTo、例: "**\/*.ts"）。無ければ省略。
   */
  applyTo?: string;

  /**
   * Instruction ファイルの vault 相対パス。
   */
  file: string;
}

/**
 * apm.yml の marketplace.packages 1 件 + ローカルなら中身のスキャン結果。
 */
export interface PackageView {
  /**
   * パッケージ名（kebab-case）。
   */
  name: string;

  /**
   * バージョン（apm.yml 優先、無ければパッケージ側の apm.yml / plugin.json）。
   */
  version?: string;

  /**
   * パッケージの説明文。
   */
  description?: string;

  /**
   * 作者名。
   */
  author?: string;

  /**
   * apm.yml に書かれた参照先（ローカルなら ./packages/<name>、外部なら owner/repo 等）。
   */
  source: string;

  /**
   * このリポジトリ内に実体（ディレクトリ）があるか。
   */
  local: boolean;

  /**
   * ローカルの場合の vault 相対ディレクトリ（例: packages/<name>）。
   */
  dir?: string;

  /**
   * apm.yml の `subdir`（source が owner/repo でこのリポジトリ自身を指す形式）。実体は同じリポジトリ内にある。
   */
  subdir?: string;

  /**
   * apm.yml に書かれたバージョン指定（"^1.0.0" のような範囲）。`version` はパッケージ側の実バージョン。
   */
  versionRange?: string;

  /**
   * マーケットプレイス上のカテゴリ。
   */
  category?: string;

  /**
   * 検索用タグの一覧。
   */
  tags: string[];

  /**
   * 対応アシスタント種別の一覧。
   */
  targets: string[];

  /**
   * 依存関係。apm は他パッケージ、mcp は MCP サーバーの参照。
   */
  dependencies: { apm: string[]; mcp: string[] };

  /**
   * パッケージに含まれる Skill（ローカルの場合のみスキャン）。
   */
  skills: SkillView[];

  /**
   * パッケージに含まれる Instruction（ローカルの場合のみスキャン）。
   */
  instructions: InstructionView[];

  /**
   * Claude Code 用の plugin.json が存在するか。
   */
  hasPluginJson: boolean;
}

/**
 * vault 全体の読み取りモデル（GUI 表示用）。
 */
export interface VaultView {
  /**
   * vault ルートの絶対パス。
   */
  root: string;

  /**
   * apm.yml のマーケットプレイス名。
   */
  name?: string;

  /**
   * apm.yml のマーケットプレイスのバージョン。
   */
  version?: string;

  /**
   * マーケットプレイスの説明文。
   */
  description?: string;

  /**
   * 所有者の名前と URL。
   */
  owner?: { name?: string; url?: string };

  /**
   * `apm pack` の出力先ターゲット（claude / codex）。
   */
  outputs: string[];

  /**
   * 登録済みパッケージの一覧。
   */
  packages: PackageView[];

  /**
   * 生成済みマニフェスト（.claude-plugin / .codex）の有無。
   */
  manifests: { claude: boolean; codex: boolean };

  /**
   * 読み込み時に検出した警告メッセージ（壊れたパッケージ等）。
   */
  warnings: string[];
}
