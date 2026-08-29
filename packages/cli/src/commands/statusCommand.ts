import type { InspectVaultUseCase, ReviewConventionUseCase } from "@apm-teller/core";
import type { CliCommand } from "./command";

/**
 * vault と convention の要約をテキスト表示する。
 */
export class StatusCommand implements CliCommand {
  constructor(private readonly inspect: InspectVaultUseCase, private readonly review: ReviewConventionUseCase) {}

  /**
   * vault 名とルート、各パッケージの skill / instruction 数、convention の状態別件数、
   * vault の警告を標準出力へ表示する。
   *
   * @returns 常に 0
   */
  run() {
    const { vault } = this.inspect.execute();
    const { conventions, invalid } = this.review.list();
    console.log(`${vault.name ?? "(unnamed)"} @ ${vault.root}`);
    for (const p of vault.packages) console.log(`  ${p.name}@${p.version ?? "?"}  skills:${p.skills.length} instructions:${p.instructions.length}${p.local ? "" : " (remote)"}`);
    const by = (s: string) => conventions.filter((i) => i.status === s).length;
    console.log(`conventions: proposed ${by("proposed")} / accepted ${by("accepted")} / rejected ${by("rejected")} / promoted ${by("promoted")}${invalid.length ? ` / invalid ${invalid.length}` : ""}`);
    for (const w of vault.warnings) console.log(`warning: ${w}`);
    return 0;
  }
}
