export function scoreNode(node, q, role) {
  if (!q) return 1;
  const text = [
    String(node.id),
    node.title,
    node.classification,
    ...(node.tags || []),
    role === 'admin' ? node.adminContent : node.visitorContent
  ].join(' ').toLowerCase();
  const title = node.title.toLowerCase();
  const tags = (node.tags || []).join(' ').toLowerCase();
  const query = q.toLowerCase();

  let score = 0;
  if (title === query) score += 100;
  if (title.includes(query)) score += 40;
  if (tags.includes(query)) score += 25;
  if (text.includes(query)) score += 10;
  return score;
}

export function searchNodes(nodes, q, role) {
  const ranked = nodes
    .map((node) => ({ node, score: scoreNode(node, q, role) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.node.id - b.node.id)
    .map((x) => x.node);
  return ranked;
}

export function highlight(text, query) {
  if (!query) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${safe})`, 'ig'), '<mark>$1</mark>');
}
