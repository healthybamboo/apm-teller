import type { CheckReadinessUseCase } from "@apm-teller/core";
import type { CliCommand } from "./command";

/**
 * 前提条件を一覧表示し、必須が欠けていれば 1 を返す。
 */
export class DoctorCommand implements CliCommand {
  constructor(private readonly readiness: CheckReadinessUseCase) {}

  /**
   * 前提条件（gh / claude / apm / repo アクセスなど）を検査し、結果を 1 行ずつ標準出力へ表示する。
   * 失敗した項目には修正方法（fix）も併記する。
   *
   * @returns 必須項目が 1 つでも失敗していれば 1、それ以外は 0
   */
  run() {
    const checks = this.readiness.execute();
    for (const c of checks) {
      console.log(`${c.ok ? "✓" : c.required ? "✗" : "△"} ${c.label}${c.detail ? `  — ${c.detail}` : ""}${!c.ok && c.fix ? `\n     fix: ${c.fix}` : ""}`);
    }
    return checks.some((c) => c.required && !c.ok) ? 1 : 0;
  }
}
