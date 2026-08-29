/**
 * ローカルパッケージの apm.yml / plugin.json に相当するマニフェスト（値オブジェクト）。
 */
export interface PackageManifestValue {
  /**
   * パッケージ名（kebab-case、例: review-guidelines）。
   */
  name: string;

  /**
   * semver 形式のバージョン（例: 0.1.0）。
   */
  version: string;

  /**
   * パッケージの説明文（マーケットプレイス一覧に表示）。
   */
  description: string;

  /**
   * 作者名。未設定なら省略。
   */
  author?: string;

  /**
   * 対応アシスタント種別（claude / copilot 等の Target 値）の一覧。
   */
  targets: string[];

  /**
   * SPDX 形式のライセンス識別子（例: MIT）。未設定なら省略。
   */
  license?: string;
}

/**
 * パッケージに追加する成果物（値オブジェクト）。昇格した convention はこれになる。
 * skill は `.apm/skills/<name>/SKILL.md`、instruction は `.apm/instructions/<name>.instructions.md` として書き出される。
 */
export type ArtifactValue =
  | { kind: "skill"; name: string; description: string; body: string }
  | { kind: "instruction"; name: string; description: string; body: string; applyTo?: string };

/**
 * 成果物の種別（"skill" | "instruction"）。
 */
export type ArtifactKind = ArtifactValue["kind"];
