/**
 * 集約ルートの基底。識別子を持つエンティティであり、不変条件の保護境界。
 * これを継承するクラスだけがリポジトリの保存単位になる。
 */
export abstract class AggregateRoot<Id extends string = string> {
  /**
   * 集約を一意に識別する ID。リポジトリの検索キーになる。
   */
  abstract get id(): Id;
}
