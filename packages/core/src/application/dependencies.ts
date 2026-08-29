import type { VaultRepository, LocalPackageRepository, InstallRecipeService } from "../domain/marketplace";
import type { CatalogRepository } from "../domain/catalog";
import type { ConventionRepository } from "../domain/convention";
import type { MiningConfigRepository, ReviewSourcePort, ExtractorPort, RunLogPort, EnvironmentProbePort, ReadinessService, RunIdGenerator, AgentCommandService } from "../domain/mining";
import type { TellerLayout } from "./layoutPort";
import type { PromptSourcePort } from "./promptSourcePort";
import type { ProvenanceFormatterPort } from "./provenancePort";

/**
 * ユースケースが必要とする依存の束。composition root（CLI）で組み立てる。
 */
export interface Dependencies {
  // repositories（集約ごと）
  /**
   * Vault 集約（apm.yml）。
   */
  vaults: VaultRepository;
  /**
   * LocalPackage 集約（packages/<name>）。
   */
  packages: LocalPackageRepository;
  /**
   * Catalog 集約（teller.yml catalog）。
   */
  catalogs: CatalogRepository;
  /**
   * Convention 集約（1 ファイル 1 件）。
   */
  conventions: ConventionRepository;
  /**
   * MiningConfig 集約（teller.yml mining）。
   */
  miningConfigs: MiningConfigRepository;
  // external ports
  /**
   * レビュー履歴の取得（gh）。
   */
  reviews: ReviewSourcePort;
  /**
   * 抽出エージェントの起動（claude -p）。
   */
  extractor: ExtractorPort;
  /**
   * 実行ログの永続化。
   */
  runs: RunLogPort;
  /**
   * 実行環境の検査。
   */
  probe: EnvironmentProbePort;
  /**
   * プロンプトテンプレートの読み出し。
   */
  prompts: PromptSourcePort;
  // domain services
  /**
   * 前提条件の評価サービス。
   */
  readiness: ReadinessService;
  /**
   * インストール手順の生成サービス。
   */
  installRecipes: InstallRecipeService;
  /**
   * run ID の発行。
   */
  runIds: RunIdGenerator;

  /**
   * エージェント種別ごとの起動コマンド組み立て。
   */
  agentCommands: AgentCommandService;
  /**
   * 昇格時の出典欄の整形。
   */
  provenance: ProvenanceFormatterPort;
  // config
  /**
   * ツールが使うパス群。
   */
  layout: TellerLayout;
  /**
   * 現在時刻の供給（テスト差し替え用）。
   */
  clock: () => Date;
}
