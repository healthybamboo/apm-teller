import type { MiningConfig } from "../aggregate/miningConfig";

/**
 * MiningConfig 集約の読み書きポート。
 * 永続化先（teller.yml の `mining:` ブロック）の詳細はインフラ層の実装に委ねる。
 */
export interface MiningConfigRepository {
  /**
   * 永続化先から設定を読み込む。未定義なら空の設定を返す実装を想定する。
   *
   * @returns 復元した MiningConfig 集約。
   */
  load(): MiningConfig;

  /**
   * 設定の現在の状態を永続化する。
   *
   * @param config 保存する MiningConfig 集約。
   */
  save(config: MiningConfig): void;
}
