import fs from "node:fs";
import path from "node:path";

export const SOURCE_DOCUMENTS = [
  "docs/CURRICULUM_A1_GRAMMAR_FUNCTIONS.md",
  "docs/CURRICULUM_A1_VOCAB_SKILLS.md",
  "docs/CURRICULUM_A2_GRAMMAR_FUNCTIONS.md",
  "docs/CURRICULUM_A2_VOCAB_SKILLS.md",
  "docs/CURRICULUM_B1_GRAMMAR_FUNCTIONS.md",
  "docs/CURRICULUM_B1_VOCAB_SKILLS.md",
  "docs/CURRICULUM_B2_GRAMMAR_FUNCTIONS.md",
  "docs/CURRICULUM_B2_VOCAB_SKILLS.md",
];

export const EXPECTED_COUNTS = {
  total: 735,
  byLevel: { A1: 124, A2: 164, B1: 206, B2: 241 },
};

const DOMAIN_BY_PREFIX = {
  GR: "grammar",
  CF: "communicative_function",
  VX: "vocabulary",
  PR: "pronunciation",
  LS: "listening",
  SP: "speaking",
  RD: "reading",
  WR: "writing",
};

const LEVEL_ORDER = { A1: 0, A2: 1, B1: 2, B2: 3 };
const DOMAIN_ORDER = {
  grammar: 0,
  communicative_function: 1,
  vocabulary: 2,
  pronunciation: 3,
  listening: 4,
  speaking: 5,
  reading: 6,
  writing: 7,
};

const NODE_ID_PATTERN = /^(GR|CF|VX|PR|LS|SP|RD|WR)-(A1|A2|B1|B2)-[A-Z0-9][A-Z0-9-]*-\d{2}$/;
const NODE_ID_IN_CODE_PATTERN = /`((?:GR|CF|VX|PR|LS|SP|RD|WR)-(?:A1|A2|B1|B2)-[A-Z0-9][A-Z0-9-]*-\d{2})`/g;

function cleanInlineMarkdown(value) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\\\|/g, "|")
    .trim();
}

function splitMarkdownTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

function parseNodeId(raw) {
  const id = cleanInlineMarkdown(raw);
  const match = id.match(NODE_ID_PATTERN);
  if (!match) return null;
  return { id, prefix: match[1], level: match[2] };
}

function extractPrerequisites(raw) {
  return [...raw.matchAll(NODE_ID_IN_CODE_PATTERN)].map((match) => match[1]);
}

export function parseCurriculumDocument(documentPath, markdown) {
  const nodes = [];
  let currentSection = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) {
      currentSection = cleanInlineMarkdown(heading[1]);
      continue;
    }

    const cells = splitMarkdownTableRow(line);
    if (!cells || cells.length < 3) continue;

    const parsedId = parseNodeId(cells[0]);
    if (!parsedId) continue;

    const { id, prefix, level } = parsedId;
    nodes.push({
      id,
      cefrLevel: level,
      domain: DOMAIN_BY_PREFIX[prefix],
      title: cleanInlineMarkdown(cells[1]),
      hardPrerequisites: extractPrerequisites(cells[2]),
      outcome: cells[3] ? cleanInlineMarkdown(cells[3]) : null,
      lifecycle: "draft",
      source: {
        document: documentPath,
        section: currentSection,
      },
    });
  }

  return nodes;
}

export function buildRegistry(rootDir = process.cwd()) {
  const nodes = SOURCE_DOCUMENTS.flatMap((documentPath) => {
    const absolutePath = path.join(rootDir, documentPath);
    const markdown = fs.readFileSync(absolutePath, "utf8");
    return parseCurriculumDocument(documentPath, markdown);
  });

  nodes.sort((a, b) => {
    return (
      LEVEL_ORDER[a.cefrLevel] - LEVEL_ORDER[b.cefrLevel] ||
      DOMAIN_ORDER[a.domain] - DOMAIN_ORDER[b.domain] ||
      a.id.localeCompare(b.id)
    );
  });

  return {
    schemaVersion: 1,
    curriculumVersion: "phase0-freeze-v1",
    generatedFrom: [...SOURCE_DOCUMENTS],
    expectedCounts: EXPECTED_COUNTS,
    nodes,
  };
}

export function stableRegistryJson(registry) {
  return `${JSON.stringify(registry, null, 2)}\n`;
}

export function validateRegistry(registry) {
  const errors = [];
  const nodes = registry?.nodes;

  if (!Array.isArray(nodes)) {
    return { ok: false, errors: ["registry.nodes must be an array"] };
  }

  if (nodes.length !== EXPECTED_COUNTS.total) {
    errors.push(`expected ${EXPECTED_COUNTS.total} nodes, found ${nodes.length}`);
  }

  const byLevel = { A1: 0, A2: 0, B1: 0, B2: 0 };
  const ids = new Set();
  const duplicates = new Set();

  for (const node of nodes) {
    if (byLevel[node.cefrLevel] === undefined) {
      errors.push(`invalid CEFR level for ${node.id}: ${node.cefrLevel}`);
    } else {
      byLevel[node.cefrLevel] += 1;
    }

    if (ids.has(node.id)) duplicates.add(node.id);
    ids.add(node.id);

    if (!NODE_ID_PATTERN.test(node.id)) {
      errors.push(`invalid node id format: ${node.id}`);
    }

    if (!Object.values(DOMAIN_BY_PREFIX).includes(node.domain)) {
      errors.push(`invalid domain for ${node.id}: ${node.domain}`);
    }

    if (!Array.isArray(node.hardPrerequisites)) {
      errors.push(`hardPrerequisites must be an array for ${node.id}`);
    }

    if (node.lifecycle !== "draft") {
      errors.push(`Phase 0 imported node must remain draft: ${node.id}`);
    }
  }

  for (const [level, expected] of Object.entries(EXPECTED_COUNTS.byLevel)) {
    if (byLevel[level] !== expected) {
      errors.push(`expected ${expected} ${level} nodes, found ${byLevel[level]}`);
    }
  }

  if (duplicates.size > 0) {
    errors.push(`duplicate IDs: ${[...duplicates].sort().join(", ")}`);
  }

  for (const node of nodes) {
    for (const prerequisite of node.hardPrerequisites) {
      if (!ids.has(prerequisite)) {
        errors.push(`missing hard prerequisite ${prerequisite} required by ${node.id}`);
      }
    }
  }

  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const dependents = new Map(nodes.map((node) => [node.id, []]));

  for (const node of nodes) {
    for (const prerequisite of node.hardPrerequisites) {
      if (!indegree.has(prerequisite)) continue;
      indegree.set(node.id, indegree.get(node.id) + 1);
      dependents.get(prerequisite).push(node.id);
    }
  }

  const queue = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort();
  let visited = 0;

  while (queue.length > 0) {
    const id = queue.shift();
    visited += 1;
    for (const dependent of dependents.get(id)) {
      const nextDegree = indegree.get(dependent) - 1;
      indegree.set(dependent, nextDegree);
      if (nextDegree === 0) {
        queue.push(dependent);
        queue.sort();
      }
    }
  }

  if (visited !== nodes.length) {
    const cyclic = [...indegree.entries()]
      .filter(([, degree]) => degree > 0)
      .map(([id]) => id)
      .sort();
    errors.push(`cycle detected; topological sort visited ${visited}/${nodes.length}: ${cyclic.join(", ")}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      total: nodes.length,
      byLevel,
      topologicalVisited: visited,
    },
  };
}
