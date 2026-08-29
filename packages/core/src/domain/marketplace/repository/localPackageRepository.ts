import type { LocalPackage } from "../aggregate/localPackage";
import type { ArtifactValue, PackageManifestValue } from "../value/artifactValue";

/**
 * ローカルパッケージ集約の読み書きポート。`packages/<name>/` 配下のディレクトリ構造を隠蔽する。
 */
export interface LocalPackageRepository {
  /**
   * 名前でローカルパッケージを探し、既存の成果物一覧を読み込んで集約を復元する。
   *
   * @param name パッケージ名（kebab-case、`packages/<name>` のディレクトリ名）。
   * @returns 復元した LocalPackage。ディレクトリが無ければ undefined。
   */
  find(name: string): LocalPackage | undefined;

  /**
   * マニフェストからパッケージディレクトリと apm.yml / plugin.json を新規作成する。
   *
   * @param manifest 作成するパッケージの名前・バージョン・説明・対応ターゲット等。
   * @returns 作成直後（成果物なし）の LocalPackage。
   */
  create(manifest: PackageManifestValue): LocalPackage;

  /**
   * 未保存の成果物をファイルに書き出す。
   *
   * @param pkg 書き出す成果物を pendingArtifacts に持つ LocalPackage。
   * @returns 書き出した成果物と、そのファイルの vault 相対パス（例: packages/foo/.apm/skills/bar/SKILL.md）の組。
   */
  save(pkg: LocalPackage): { artifact: ArtifactValue; file: string }[];
}
