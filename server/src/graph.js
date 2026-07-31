import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const DOMAINS = ['auth', 'econ', 'hist', 'phil', 'rhet', 'soc', 'tech'];

function normalizeLinks(links) {
  const out = [];
  for (const [type, targets] of Object.entries(links ?? {})) {
    for (const l of targets ?? []) {
      if (typeof l === 'string') out.push({ type, target: l });
      else out.push({ type, target: l.target, ...(l.why ? { why: l.why } : {}) });
    }
  }
  return out;
}

export async function loadGraph(repoRoot) {
  const rel = await readFile(join(repoRoot, 'RELEASE_NOTES.md'), 'utf8');
  const vm = rel.match(/retflo v(\d+\.\d+\.\d+)/);
  const version = vm ? vm[1] : '0.0.0';

  const nodes = new Map();
  const warnings = [];
  for (const domain of DOMAINS) {
    const dir = join(repoRoot, 'nodes', domain);
    let files;
    try { files = await readdir(dir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.md') || f === 'DOMAIN.md') continue;
      const raw = await readFile(join(dir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!m) { warnings.push(`no frontmatter: ${domain}/${f}`); continue; }
      let fm;
      try { fm = parseYaml(m[1]); } catch (e) {
        warnings.push(`bad frontmatter in ${domain}/${f}: ${e.message}`);
        continue;
      }
      const body = m[2].trim();
      const title = (body.match(/^# (.+)$/m) ?? [, fm.coordinate])[1].trim();
      nodes.set(fm.coordinate, {
        coordinate: fm.coordinate,
        domain: fm.domain ?? domain,
        title,
        tags: fm.tags ?? [],
        aliases: fm.aliases ?? [],
        links: normalizeLinks(fm.links),
        body,
        file: `${domain}/${f}`,
      });
    }
  }
  for (const node of nodes.values()) {
    for (const l of node.links) {
      if (!nodes.has(l.target)) {
        warnings.push(`${node.coordinate}: link target ${l.target} not found`);
      }
    }
  }
  return { version, nodes, warnings };
}
