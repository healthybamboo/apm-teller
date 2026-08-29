/**
 * CLI コマンドの共通 I/F。`run` は終了コードを返す。
 */
export interface CliCommand<O = void> {
  /**
   * コマンドを実行し、プロセスの終了コードを返す。
   *
   * @param opts コマンド固有のオプション
   * @returns 終了コード（0 が成功）。同期・非同期どちらでもよい
   */
  run(opts: O): Promise<number> | number;
}
