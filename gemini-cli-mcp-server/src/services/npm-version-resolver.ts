import { Dependency } from '../shared-context/types.js';

type DistTags = { latest?: string } & Record<string, string | undefined>;

export class NpmVersionResolver {
  private cache = new Map<string, string>();

  async resolveLatestVersions(deps: Dependency[]): Promise<Dependency[]> {
    const updated = await Promise.all(
      deps.map(async (d) => ({ ...d, version: await this.getLatestTag(d.name, d.version) }))
    );
    return updated;
  }

  private async getLatestTag(pkgName: string, current?: string): Promise<string> {
    try {
      if (this.cache.has(pkgName)) return `^${this.cache.get(pkgName)}`;
      const encoded = encodeURIComponent(pkgName);
      const url = `https://registry.npmjs.org/-/package/${encoded}/dist-tags`;
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) return current || '*';
      const tags = (await res.json()) as DistTags;
      const latest = tags.latest;
      if (!latest) return current || '*';
      this.cache.set(pkgName, latest);
      return `^${latest}`;
    } catch {
      return current || '*';
    }
  }
}


