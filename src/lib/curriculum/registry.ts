import rawRegistry from "../../../curriculum/registry.json";
import type { CanonicalKnowledgeNode, CurriculumRegistry } from "./types";

export const curriculumRegistry = rawRegistry as CurriculumRegistry;

const nodeById = new Map<string, CanonicalKnowledgeNode>(
  curriculumRegistry.nodes.map((node) => [node.id, node]),
);

export function getKnowledgeNode(id: string): CanonicalKnowledgeNode | undefined {
  return nodeById.get(id);
}

export function getKnowledgeNodesByLevel(
  level: CanonicalKnowledgeNode["cefrLevel"],
): CanonicalKnowledgeNode[] {
  return curriculumRegistry.nodes.filter((node) => node.cefrLevel === level);
}

export function getKnowledgeNodesByDomain(
  domain: CanonicalKnowledgeNode["domain"],
): CanonicalKnowledgeNode[] {
  return curriculumRegistry.nodes.filter((node) => node.domain === domain);
}
