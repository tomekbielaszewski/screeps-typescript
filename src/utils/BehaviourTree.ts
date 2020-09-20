export enum BTNodeResult {
  SUCCESS,
  FAILURE,
  RUNNING,
  ERRORED
}

export interface BTNode<T> {
  process: (context: T) => BTNodeResult
}

export class LeafNode<T> implements BTNode<T> {
  private readonly runner: (context: T) => BTNodeResult;

  public constructor(runner: (context: T) => BTNodeResult) {
    this.runner = runner;
  }

  public process(ctx: T): BTNodeResult {
    return this.runner(ctx);
  }
}

export abstract class NonLeafNode<T> implements BTNode<T> {
  protected readonly children: BTNode<T>[];
  protected runningChildIndex: number | null;

  protected constructor(children: BTNode<T>[]) {
    if (children.length === 0) throw new Error('Non leaf node has to have at least 1 child!');
    this.children = children;
    this.runningChildIndex = null;
  }

  protected abstract resolve(context: T, fromIndex: number): { result: BTNodeResult, childIndex: number }

  public process(context: T): BTNodeResult {
    const {result, childIndex} = this.resolve(context, this.runningChildIndex || 0);
    if (result === BTNodeResult.RUNNING) {
      this.runningChildIndex = childIndex;
      return result;
    } else {
      this.runningChildIndex = null;
      return result;
    }
  }
}

export class SequenceNode<T> extends NonLeafNode<T> {
  public constructor(children: BTNode<T>[]) {
    super(children);
  }

  protected resolve(context: T, fromIndex: number): { result: BTNodeResult; childIndex: number } {
    for (let childIndex = fromIndex; childIndex < this.children.length; childIndex++) {
      const child = this.children[childIndex];
      try {
        const result = child.process(context);
        if (result !== BTNodeResult.SUCCESS) {
          return {result, childIndex};
        }
      } catch (e) {
        console.log(JSON.stringify(e));
        return {result: BTNodeResult.ERRORED, childIndex};
      }
    }
    return {result: BTNodeResult.SUCCESS, childIndex: 0};
  }
}

export class SelectorNode<T> extends NonLeafNode<T> {
  public constructor(children: BTNode<T>[]) {
    super(children);
  }

  protected resolve(context: T, fromIndex: number): { result: BTNodeResult; childIndex: number } {
    for (let childIndex = fromIndex; childIndex < this.children.length; childIndex++) {
      const child = this.children[childIndex];
      try {
        const result = child.process(context);
        if (result === BTNodeResult.SUCCESS || result === BTNodeResult.RUNNING) {
          return {result, childIndex};
        }
      } catch (e) {
        console.log(JSON.stringify(e));
        return {result: BTNodeResult.ERRORED, childIndex};
      }
    }
    return {result: BTNodeResult.FAILURE, childIndex: 0};
  }
}
