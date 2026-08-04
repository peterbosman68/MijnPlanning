export type DependencyEdge = Readonly<{
  prerequisiteSubtaskId: string;
  blockedSubtaskId: string;
}>;

export function hasDependencyPath(
  edges: ReadonlyArray<DependencyEdge>,
  startSubtaskId: string,
  targetSubtaskId: string,
): boolean {
  if (startSubtaskId === targetSubtaskId) {
    return true;
  }

  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const current = adjacency.get(edge.prerequisiteSubtaskId) ?? [];
    current.push(edge.blockedSubtaskId);
    adjacency.set(edge.prerequisiteSubtaskId, current);
  }

  const visited = new Set<string>();
  const stack = [startSubtaskId];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const nextNode of adjacency.get(current) ?? []) {
      if (nextNode === targetSubtaskId) {
        return true;
      }

      stack.push(nextNode);
    }
  }

  return false;
}
