import {BTNodeResult, LeafNode, SelectorNode, SequenceNode} from "../../src/utils/BehaviourTree";

describe('Behaviour tree structure', () => {
  describe('Sequence node', () => {
    it('should return success when has all successes', () => {
      const success = jest.fn(() => BTNodeResult.SUCCESS);
      const sequenceTree = new SequenceNode<string>([
        new LeafNode<string>(success),
        new LeafNode<string>(success),
        new LeafNode<string>(success),
      ]);

      const btNodeResult = sequenceTree.process("");

      expect(btNodeResult).toEqual(BTNodeResult.SUCCESS);
      expect(success.mock.calls.length).toBe(3);
    });

    it('should return fail when has fail on last node', () => {
      const success = jest.fn(() => BTNodeResult.SUCCESS);
      const failure = jest.fn(() => BTNodeResult.FAILURE);
      const sequenceTree = new SequenceNode<string>([
        new LeafNode<string>(success),
        new LeafNode<string>(success),
        new LeafNode<string>(failure),
      ]);

      const btNodeResult = sequenceTree.process("");

      expect(btNodeResult).toEqual(BTNodeResult.FAILURE);
      expect(success.mock.calls.length).toBe(2);
      expect(failure.mock.calls.length).toBe(1);
    });

    it('should return RUNNING when has RUNNING on last node, then processing the tree second time should process only running node', () => {
      const success = jest.fn(() => BTNodeResult.SUCCESS);
      const running = jest.fn(() => BTNodeResult.RUNNING);
      const sequenceTree = new SequenceNode<string>([
        new LeafNode<string>(success),
        new LeafNode<string>(success),
        new LeafNode<string>(running),
      ]);

      const btNodeResult1 = sequenceTree.process("");
      const btNodeResult2 = sequenceTree.process("");

      expect(btNodeResult1).toEqual(BTNodeResult.RUNNING);
      expect(btNodeResult2).toEqual(BTNodeResult.RUNNING);
      expect(success.mock.calls.length).toBe(2);
      expect(running.mock.calls.length).toBe(2);
    });

    it('should pick up execution after RUNNING when it becomes SUCCESS', () => {
      const success = jest.fn(() => BTNodeResult.SUCCESS)
      const running = jest.fn().mockReturnValueOnce(BTNodeResult.RUNNING).mockReturnValueOnce(BTNodeResult.SUCCESS)
      const afterRunning = jest.fn(() => BTNodeResult.SUCCESS)
      const tree = new SequenceNode<string>([
        new LeafNode(success),
        new LeafNode(running),
        new LeafNode(afterRunning),
      ])

      const result1 = tree.process("")

      expect(result1).toBe(BTNodeResult.RUNNING)
      expect(success.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(1)
      expect(afterRunning.mock.calls.length).toBe(0)

      const result2 = tree.process("")

      expect(result2).toBe(BTNodeResult.SUCCESS)
      expect(success.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(2)
      expect(afterRunning.mock.calls.length).toBe(1)
    });
  });

  describe('Selector node', () => {
    it('should return success when has last successes', () => {
      const failure = jest.fn(() => BTNodeResult.FAILURE);
      const success = jest.fn(() => BTNodeResult.SUCCESS);
      const sequenceTree = new SelectorNode<string>([
        new LeafNode<string>(failure),
        new LeafNode<string>(failure),
        new LeafNode<string>(success),
      ]);

      const btNodeResult = sequenceTree.process("");

      expect(btNodeResult).toEqual(BTNodeResult.SUCCESS);
      expect(success.mock.calls.length).toBe(1);
    });

    it('should return fail when all fails', () => {
      const failure = jest.fn(() => BTNodeResult.FAILURE);
      const sequenceTree = new SelectorNode<string>([
        new LeafNode<string>(failure),
        new LeafNode<string>(failure),
        new LeafNode<string>(failure),
      ]);

      const btNodeResult = sequenceTree.process("");

      expect(btNodeResult).toEqual(BTNodeResult.FAILURE);
      expect(failure.mock.calls.length).toBe(3);
    });

    it('should return RUNNING when has RUNNING on last node, then processing the tree second time should process only running node', () => {
      const success = jest.fn(() => BTNodeResult.SUCCESS);
      const running = jest.fn(() => BTNodeResult.RUNNING);
      const sequenceTree = new SelectorNode<string>([
        new LeafNode<string>(running),
        new LeafNode<string>(success),
        new LeafNode<string>(success),
      ]);

      const btNodeResult1 = sequenceTree.process("");
      const btNodeResult2 = sequenceTree.process("");

      expect(btNodeResult1).toEqual(BTNodeResult.RUNNING);
      expect(btNodeResult2).toEqual(BTNodeResult.RUNNING);
      expect(success.mock.calls.length).toBe(0);
      expect(running.mock.calls.length).toBe(2);
    });

    it('should pick up execution after RUNNING when it becomes SUCCESS', () => {
      const failure = jest.fn(() => BTNodeResult.FAILURE)
      const running = jest.fn().mockReturnValueOnce(BTNodeResult.RUNNING).mockReturnValueOnce(BTNodeResult.FAILURE)
      const afterRunning = jest.fn(() => BTNodeResult.SUCCESS)
      const tree = new SelectorNode<string>([
        new LeafNode(failure),
        new LeafNode(running),
        new LeafNode(afterRunning),
      ])

      const result1 = tree.process("")

      expect(result1).toBe(BTNodeResult.RUNNING)
      expect(failure.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(1)
      expect(afterRunning.mock.calls.length).toBe(0)

      const result2 = tree.process("")

      expect(result2).toBe(BTNodeResult.SUCCESS)
      expect(failure.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(2)
      expect(afterRunning.mock.calls.length).toBe(1)
    });
  });

  describe('Sequence and Selector in same tree', () => {
    it('should return SUCCESS when inner selector node has failure and success', () => {
      const seqSuccess = jest.fn(() => BTNodeResult.SUCCESS);
      const selSuccess = jest.fn(() => BTNodeResult.SUCCESS);
      const failure = jest.fn(() => BTNodeResult.FAILURE);
      const tree = new SequenceNode<string>([
        new LeafNode<string>(seqSuccess),
        new SelectorNode([
          new LeafNode(failure),
          new LeafNode(selSuccess),
          new LeafNode(selSuccess),
        ]),
        new LeafNode<string>(seqSuccess),
      ]);

      const result = tree.process("");

      expect(result).toEqual(BTNodeResult.SUCCESS)
      expect(seqSuccess.mock.calls.length).toBe(2)
      expect(selSuccess.mock.calls.length).toBe(1)
      expect(failure.mock.calls.length).toBe(1)
    });

    it('should return SUCCESS when inner sequece node has failure but outer selector has success', () => {
      const seqSuccess = jest.fn(() => BTNodeResult.SUCCESS);
      const selSuccess = jest.fn(() => BTNodeResult.SUCCESS);
      const failure = jest.fn(() => BTNodeResult.FAILURE);
      const tree = new SelectorNode<string>([
        new SequenceNode([
          new LeafNode(seqSuccess),
          new LeafNode(failure),
          new LeafNode(seqSuccess),
        ]),
        new LeafNode<string>(failure),
        new LeafNode<string>(selSuccess),
      ]);

      const result = tree.process("");

      expect(result).toEqual(BTNodeResult.SUCCESS)
      expect(seqSuccess.mock.calls.length).toBe(1)
      expect(failure.mock.calls.length).toBe(2)
      expect(selSuccess.mock.calls.length).toBe(1)
    });

    it('should resume execution after RUNNING. Seq in Sel', () => {
      const success = jest.fn(() => BTNodeResult.SUCCESS)
      const running = jest.fn().mockReturnValueOnce(BTNodeResult.RUNNING).mockReturnValueOnce(BTNodeResult.SUCCESS)
      const afterRunning = jest.fn(() => BTNodeResult.SUCCESS)
      const failure = jest.fn(() => BTNodeResult.FAILURE)
      const tree = new SelectorNode<string>([
        new SequenceNode([
          new LeafNode(success),
          new LeafNode(running),
          new LeafNode(failure),
        ]),
        new LeafNode<string>(afterRunning)
      ]);

      const result1 = tree.process("");

      expect(result1).toEqual(BTNodeResult.RUNNING)
      expect(success.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(1)
      expect(failure.mock.calls.length).toBe(0)
      expect(afterRunning.mock.calls.length).toBe(0)

      const result2 = tree.process("");

      expect(result2).toEqual(BTNodeResult.SUCCESS)
      expect(success.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(2)
      expect(failure.mock.calls.length).toBe(1)
      expect(afterRunning.mock.calls.length).toBe(1)
    });

    it('should resume execution after RUNNING. Sel in Seq', () => {
      const success = jest.fn(() => BTNodeResult.SUCCESS)
      const running = jest.fn().mockReturnValueOnce(BTNodeResult.RUNNING).mockReturnValueOnce(BTNodeResult.SUCCESS)
      const afterRunning = jest.fn(() => BTNodeResult.SUCCESS)
      const failure = jest.fn(() => BTNodeResult.FAILURE)
      const tree = new SequenceNode<string>([
        new LeafNode<string>(success),
        new SelectorNode([
          new LeafNode(failure),
          new LeafNode(running),
          new LeafNode(failure),
        ]),
        new LeafNode<string>(afterRunning)
      ]);

      const result1 = tree.process("");

      expect(result1).toEqual(BTNodeResult.RUNNING)
      expect(success.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(1)
      expect(failure.mock.calls.length).toBe(1)
      expect(afterRunning.mock.calls.length).toBe(0)

      const result2 = tree.process("");

      expect(result2).toEqual(BTNodeResult.SUCCESS)
      expect(success.mock.calls.length).toBe(1)
      expect(running.mock.calls.length).toBe(2)
      expect(failure.mock.calls.length).toBe(1)
      expect(afterRunning.mock.calls.length).toBe(1)
    });
  });
});
