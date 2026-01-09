// Mind map layout utilities
export interface MindMapData {
  title: string;
  summary?: string;
  children: MindMapSection[];
}

export interface MindMapSection {
  title: string;
  icon?: string;
  description?: string;
  children?: MindMapSection[];
}

export interface MindMapNodeData {
  label: string;
  level: number;
  branchIndex: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  icon?: string;
  customColor?: number;
  description?: string;
  parentLabel?: string;
  documentSummary?: string;
}

// Configuration for layout
const LAYOUT_CONFIG = {
  nodeWidth: 220,
  nodeHeight: 50,
  horizontalSpacing: 320,
  verticalSpacing: 40,
  levelSpacingMultiplier: [1.2, 1, 0.9, 0.8],
};

interface TreeNode {
  id: string;
  data: MindMapNodeData;
  children: TreeNode[];
  subtreeHeight: number;
  x: number;
  y: number;
}

const calculateSubtreeHeight = (
  children: { subtreeHeight: number }[],
  nodeHeight: number,
  verticalSpacing: number
): number => {
  if (children.length === 0) return nodeHeight;
  
  let totalHeight = 0;
  children.forEach((child, index) => {
    totalHeight += child.subtreeHeight;
    if (index < children.length - 1) {
      totalHeight += verticalSpacing;
    }
  });
  
  return Math.max(totalHeight, nodeHeight);
};

const buildTree = (data: MindMapData): TreeNode => {
  const buildNode = (
    section: MindMapSection,
    parentId: string,
    index: number,
    level: number,
    branchIndex: number
  ): TreeNode => {
    const id = `${parentId}-${index}`;
    const currentBranchIndex = level === 1 ? index : branchIndex;

    const children = (section.children || []).map((child, i) =>
      buildNode(child, id, i, level + 1, currentBranchIndex)
    );

    return {
      id,
      data: {
        label: section.title,
        level,
        branchIndex: currentBranchIndex,
        icon: section.icon,
        hasChildren: children.length > 0,
        isExpanded: true,
        description: section.description,
      },
      children,
      subtreeHeight: 0,
      x: 0,
      y: 0,
    };
  };

  const rootChildren = data.children.map((child, i) =>
    buildNode(child, "root", i, 1, i)
  );

  return {
    id: "root",
    data: {
      label: data.title,
      level: 0,
      branchIndex: 0,
      hasChildren: rootChildren.length > 0,
      isExpanded: true,
    },
    children: rootChildren,
    subtreeHeight: 0,
    x: 0,
    y: 0,
  };
};

const computeSubtreeHeights = (node: TreeNode, level: number = 0): number => {
  const spacingMultiplier = LAYOUT_CONFIG.levelSpacingMultiplier[Math.min(level, 3)];
  const verticalSpacing = LAYOUT_CONFIG.verticalSpacing * spacingMultiplier;

  if (node.children.length === 0) {
    node.subtreeHeight = LAYOUT_CONFIG.nodeHeight;
    return node.subtreeHeight;
  }

  node.children.forEach(child => computeSubtreeHeights(child, level + 1));

  node.subtreeHeight = calculateSubtreeHeight(
    node.children,
    LAYOUT_CONFIG.nodeHeight,
    verticalSpacing
  );

  return node.subtreeHeight;
};

const positionNodes = (node: TreeNode, x: number, yCenter: number, level: number = 0): void => {
  node.x = x;
  node.y = yCenter - LAYOUT_CONFIG.nodeHeight / 2;

  if (node.children.length === 0) return;

  const spacingMultiplier = LAYOUT_CONFIG.levelSpacingMultiplier[Math.min(level, 3)];
  const verticalSpacing = LAYOUT_CONFIG.verticalSpacing * spacingMultiplier;
  const horizontalSpacing = LAYOUT_CONFIG.horizontalSpacing * spacingMultiplier;

  const totalChildrenHeight = node.children.reduce((sum, child, index) => {
    return sum + child.subtreeHeight + (index > 0 ? verticalSpacing : 0);
  }, 0);

  let currentY = yCenter - totalChildrenHeight / 2;

  node.children.forEach((child) => {
    const childYCenter = currentY + child.subtreeHeight / 2;
    positionNodes(child, x + horizontalSpacing, childYCenter, level + 1);
    currentY += child.subtreeHeight + verticalSpacing;
  });
};

export const generateMindMapLayout = (
  data: MindMapData
): { nodes: any[]; edges: any[] } => {
  if (!data || !data.children || data.children.length === 0) {
    return {
      nodes: [
        {
          id: "root",
          type: "mindmap",
          position: { x: 0, y: 0 },
          data: {
            label: data?.title || "Mind Map",
            level: 0,
            branchIndex: 0,
            hasChildren: false,
            isExpanded: true,
          },
        },
      ],
      edges: [],
    };
  }

  const tree = buildTree(data);
  computeSubtreeHeights(tree);
  positionNodes(tree, 0, 0);

  const nodes: any[] = [];
  const edges: any[] = [];

  const traverse = (node: TreeNode, parentId?: string) => {
    nodes.push({
      id: node.id,
      type: "mindmap",
      position: { x: node.x, y: node.y },
      data: node.data,
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "animated",
        data: {
          branchIndex: node.data.branchIndex,
          level: node.data.level,
        },
      });
    }

    node.children.forEach((child) => traverse(child, node.id));
  };

  traverse(tree);
  return { nodes, edges };
};

export const getNodesInAnimationOrder = (
  nodes: any[],
  edges: any[]
): any[] => {
  if (nodes.length === 0) return [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  const result: any[] = [];
  const queue = ["root"];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      result.push(node);
      const children = childrenMap.get(id) || [];
      queue.push(...children);
    }
  }

  return result;
};
