import * as pty from "node-pty";
import type { ExtractorPort, AgentLaunchValue, AgentSession } from "@apm-teller/core";

/**
 * 疑似端末（PTY）上でエージェント CLI（claude / codex）を起動する {@link ExtractorPort} 実装。
 * 通常のターミナルでコマンドを打つのと同じ挙動で、出力と入力をブラウザのターミナルに中継できる。
 */
export class PtyAgentExtractor implements ExtractorPort {
  /**
   * 起動先ディレクトリを受け取る。
   *
   * @param root vault ルートの絶対パス（セッションの cwd）
   */
  constructor(private readonly root: string) {}

  /**
   * PTY 上でセッションを開始する。
   *
   * @param launch 起動するコマンドと引数（AgentCommandService が組み立てたもの）
   * @returns 起動したセッション（出力購読・入力・リサイズ・kill）
   */
  open(launch: AgentLaunchValue): AgentSession {
    const term = pty.spawn(launch.command, launch.args, {
      name: "xterm-256color", cols: 120, rows: 36, cwd: this.root,
      env: { ...process.env, TERM: "xterm-256color", LANG: process.env.LANG ?? "en_US.UTF-8" } as Record<string, string>,
    });
    return {
      onData: (cb) => { term.onData(cb); },
      onExit: (cb) => { term.onExit((e) => cb(e.exitCode)); },
      write: (data) => term.write(data),
      resize: (cols, rows) => { if (cols > 0 && rows > 0) term.resize(cols, rows); },
      kill: () => term.kill(),
    };
  }
}
