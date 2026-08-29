import { MiningConfig, type MiningConfigRepository } from "../../domain/mining";
import type { TellerFile } from "./tellerFile";

/**
 * teller.yml の `mining:` ブロックを MiningConfig 集約として読み書きする。
 */
export class YamlMiningConfigRepository implements MiningConfigRepository {
  constructor(private readonly file: TellerFile) {}

  /**
   * mining ブロックを読み込み、検証して集約にする。
   *
   * @returns MiningConfig 集約（ブロックが無ければ既定値で構築）
   * @throws {InvariantViolation} mining ブロックがスキーマに適合しない場合
   */
  load(): MiningConfig { return MiningConfig.from(this.file.block("mining")); }

  /**
   * mining ブロックを書き戻す（他ブロックとコメントは保持）。
   *
   * @param config 保存する MiningConfig 集約
   */
  save(config: MiningConfig) { this.file.setBlock("mining", config.toData()); }
}
