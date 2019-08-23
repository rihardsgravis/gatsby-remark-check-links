import * as visit from 'unist-util-visit';
import {Link, Parent} from 'mdast';
import {Node} from 'gatsby';

function getCacheKey(node: Node): string {
  return `remark-check-links-${node.id}-${node.internal.contentDigest}`;
}

interface HeadingsMapKey {
  key: string;
  hasHash: boolean;
  hashIndex: number;
}

function getHeadingsMapKey(link: string, path: string): HeadingsMapKey {
  let key = link;
  const hashIndex = link.indexOf('#');
  const hasHash = hashIndex !== -1;
  if (hasHash) {
    key = link.startsWith('#') ? path : link.slice(0, hashIndex);
  }

  return {
    key,
    hasHash,
    hashIndex
  };
}

function createPathPrefixer(pathPrefix): (url: string) => string {
  return function withPathPrefix(url): string {
    const prefixed = pathPrefix + url;
    return prefixed.replace(/\/\//, '/');
  };
}

export = async function plugin(
  {markdownAST, markdownNode, files, getNode, cache, getCache, pathPrefix},
  {exceptions = [], ignore = [], verbose = true} = {}
): Promise<Parent> {
  if (!markdownNode.fields) {
    // let the file pass if it has no fields
    return markdownAST;
  }

  const links = [];
  const headings = [];

  function visitor(node: Link, index: number, parent: Parent): void {
    if (parent.type === 'heading') {
      headings.push(parent.data.id);
      return;
    }

    if (node.url.startsWith('#') || /^\.{0,2}\//.test(node.url)) {
      links.push(node.url);
    }
  }

  visit(markdownAST, 'link', visitor);

  const withPathPrefix = createPathPrefixer(pathPrefix);
  const parent = await getNode(markdownNode.parent);
  cache.set(getCacheKey(parent), {
    path: withPathPrefix(markdownNode.fields.slug),
    links,
    headings
  });

  // wait to see if all of the Markdown and MDX has been visited
  const linksMap = {};
  const headingsMap = {};
  for (const file of files) {
    if (
      /^mdx?$/.test(file.extension) &&
      file.relativePath !== 'docs/README.md'
    ) {
      const key = getCacheKey(file);
      const visited = await cache.get(key);

      if (visited) {
        linksMap[visited.path] = visited.links;
        headingsMap[visited.path] = visited.headings;
        continue;
      }

      if (getCache) {
        // the cache provided to `gatsby-mdx` has its own namespace, and it
        // doesn't have access to `getCache`, so we have to check to see if
        // those files have been visited here.
        const mdxCache = getCache('gatsby-plugin-mdx');
        const mdxVisited = await mdxCache.get(key);
        if (mdxVisited) {
          linksMap[mdxVisited.path] = mdxVisited.links;
          headingsMap[mdxVisited.path] = mdxVisited.headings;
          continue;
        }
      }

      // don't continue if a page hasn't been visited yet
      return;
    }
  }

  let totalBrokenLinks = 0;
  const prefixedIgnore = ignore.map(withPathPrefix);
  const prefixedExceptions = exceptions.map(withPathPrefix);
  for (const path in linksMap) {
    if (prefixedIgnore.includes(path)) {
      // don't count broken links for ignored pages
      continue;
    }

    const linksForPath = linksMap[path];
    if (linksForPath.length) {
      const brokenLinks = linksForPath.filter((link: string): boolean => {
        // return true for broken links, false = pass
        const {key, hasHash, hashIndex} = getHeadingsMapKey(link, path);
        if (prefixedExceptions.includes(key)) {
          return false;
        }

        const headings = headingsMap[key];
        if (headings) {
          if (hasHash) {
            const id = link.slice(hashIndex + 1);
            return !prefixedExceptions.includes(id) && !headings.includes(id);
          }

          return false;
        }

        return true;
      });

      const brokenLinkCount = brokenLinks.length;
      totalBrokenLinks += brokenLinkCount;
      if (brokenLinkCount && verbose) {
        console.warn(`${brokenLinkCount} broken links found on ${path}`);
        for (const link of brokenLinks) {
          console.warn(`- ${link}`);
        }
        console.log('');
      }
    }
  }

  if (totalBrokenLinks) {
    const message = `${totalBrokenLinks} broken links found`;
    if (process.env.NODE_ENV === 'production') {
      // break builds with broken links before they get deployed for reals
      throw new Error(message);
    }

    if (verbose) {
      console.error(message);
    }
  } else if (verbose) {
    console.info('No broken links found');
  }

  return markdownAST;
};
