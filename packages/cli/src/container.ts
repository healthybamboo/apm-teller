import {
  TellerFile, YamlCatalogRepository, YamlMiningConfigRepository, GitSlugResolver, ApmYmlVaultRepository, FsLocalPackageRepository,
  MarkdownConventionRepository, FsPromptSource, ReadinessService, InstallRecipeService, RunIdGenerator, AgentCommandService, DefaultProvenanceFormatter,
  InspectVaultUseCase, GetInstallRecipesUseCase, CurateCatalogUseCase, ConfigureMiningUseCase, ReviewConventionUseCase,
  ValidateConventionUseCase, PromoteConventionUseCase, CheckReadinessUseCase, MineConventionsUseCase,
  type Dependencies,
} from "@apm-teller/core";
import { GhReviewSource } from "./infrastructure/ghReviewSource";
import { PtyAgentExtractor } from "./infrastructure/ptyAgentExtractor";
import { FsRunLog } from "./infrastructure/fsRunLog";
import { ShellEnvironmentProbe } from "./infrastructure/shellEnvironmentProbe";
import { ApmCli } from "./infrastructure/apmCli";
import { VaultInitializer } from "./infrastructure/vaultInitializer";

/**
 * ユースケース一式。Controller / Command はこれだけに依存する。
 */
export interface UseCases {
  /**
   * vault の概要（パッケージ一覧・警告）を取得するユースケース。
   */
  inspect: InspectVaultUseCase;

  /**
   * パッケージのインストール手順（apm コマンド等）を生成するユースケース。
   */
  install: GetInstallRecipesUseCase;

  /**
   * カタログ（エントリ・featured・preset）を編集するユースケース。
   */
  catalog: CurateCatalogUseCase;

  /**
   * マイニング設定（対象 repo の追加・削除）を扱うユースケース。
   */
  mining: ConfigureMiningUseCase;

  /**
   * convention の審査（承認 / 却下 / 再開 / 編集）を行うユースケース。
   */
  review: ReviewConventionUseCase;

  /**
   * convention ファイルを検証するユースケース（Claude Code hook から使う）。
   */
  validate: ValidateConventionUseCase;

  /**
   * 承認済み convention をパッケージへ昇格させるユースケース。
   */
  promote: PromoteConventionUseCase;

  /**
   * マイニングの前提条件を検査するユースケース（doctor）。
   */
  readiness: CheckReadinessUseCase;

  /**
   * gh でレビューを取得し `claude -p` で convention 草稿を生成するユースケース。
   */
  mine: MineConventionsUseCase;
}

/**
 * 配線結果。
 */
export interface Container {
  /**
   * vault ルートの絶対パス。
   */
  root: string;

  /**
   * リポジトリ・ポート・ドメインサービスなど全依存（テストや追加配線用）。
   */
  deps: Dependencies;

  /**
   * ユースケース一式。
   */
  usecases: UseCases;

  /**
   * apm CLI（pack / check / outdated）の呼び出しアダプタ。
   */
  apm: ApmCli;

  /**
   * `apm-teller init` の実装（テンプレート配置と .gitignore 整備）。
   */
  initializer: VaultInitializer;
}

/**
 * composition root。vault ルートを基点に全アダプタ・ドメインサービス・ユースケースを配線する。
 *
 * @param root vault ルートの絶対パス（apm.yml または teller.yml があるディレクトリ。例: `/Users/me/my-vault`）
 * @returns 配線済みの依存・ユースケース・アダプタをまとめた Container
 */
export function createContainer(root: string): Container {
  const clock = () => new Date();
  const teller = new TellerFile(root);
  const layout = teller.layout();
  const probe = new ShellEnvironmentProbe(root);
  const deps: Dependencies = {
    vaults: new ApmYmlVaultRepository(root, new GitSlugResolver(root, teller.vaultSlug())),
    packages: new FsLocalPackageRepository(root),
    catalogs: new YamlCatalogRepository(teller),
    conventions: new MarkdownConventionRepository(root, layout.conventions),
    miningConfigs: new YamlMiningConfigRepository(teller),
    reviews: new GhReviewSource(root),
    extractor: new PtyAgentExtractor(root),
    runs: new FsRunLog(root, layout.runs),
    probe,
    prompts: new FsPromptSource(root),
    readiness: new ReadinessService(probe),
    installRecipes: new InstallRecipeService(),
    runIds: new RunIdGenerator(clock),
    agentCommands: new AgentCommandService(),
    provenance: new DefaultProvenanceFormatter(),
    layout,
    clock,
  };
  const readiness = new CheckReadinessUseCase(deps);
  const validate = new ValidateConventionUseCase(deps);
  const usecases: UseCases = {
    inspect: new InspectVaultUseCase(deps),
    install: new GetInstallRecipesUseCase(deps),
    catalog: new CurateCatalogUseCase(deps),
    mining: new ConfigureMiningUseCase(deps),
    review: new ReviewConventionUseCase(deps),
    validate,
    promote: new PromoteConventionUseCase(deps),
    readiness,
    mine: new MineConventionsUseCase(deps, readiness, validate),
  };
  return { root, deps, usecases, apm: new ApmCli(root), initializer: new VaultInitializer(root, layout) };
}
