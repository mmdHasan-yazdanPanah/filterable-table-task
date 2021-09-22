class Node<T> {
  value: number;
  left: Node<T> | null = null;
  right: Node<T> | null = null;
  data: T[];

  constructor(data: T, value: number) {
    this.value = value;
    this.data = [data];
  }

  pushData(data: typeof this['data']) {
    this.data.push(...data);
  }
}

export class BianarySearchTree<T> {
  private root: Node<T> | null = null;

  private insertNode(node: Node<T>, newNode: Node<T>) {
    if (newNode.value === node.value) {
      node.pushData(newNode.data);
      return;
    }

    if (newNode.value > node.value) {
      if (node.right === null) {
        node.right = newNode;
        return;
      }
      this.insertNode(node.right, newNode);
      return;
    }

    if (node.left === null) {
      node.left = newNode;
      return;
    }
    this.insertNode(node.left, newNode);
  }

  private searchNode(node: Node<T> | null, value: number): T[] {
    if (node === null) {
      return [];
    }
    if (value === node.value) {
      return node.data;
    }
    if (value > node.value) {
      return this.searchNode(node.right, value);
    }
    return this.searchNode(node.left, value);
  }

  insert(data: T, value: number) {
    const newNode = new Node(data, value);

    if (!this.root) {
      this.root = newNode;
    } else {
      this.insertNode(this.root, newNode);
    }
  }

  search(value: number) {
    return this.searchNode(this.root, value);
  }
}
