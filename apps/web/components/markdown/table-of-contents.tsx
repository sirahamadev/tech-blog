'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => {
    const normalized = (content ?? '').replace(/\\n/g, '\n');
    const items: TOCItem[] = [];
    const regex = /^(#{1,3})\s+(.+)$/gm;
    let match;

    while ((match = regex.exec(normalized)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
        .replace(/^-|-$/g, '');

      items.push({ id, text, level });
    }

    return items;
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      <h4 className="mb-3 text-sm font-semibold">目次</h4>
      <ul className="space-y-1 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                'block py-1 text-muted-foreground transition-colors hover:text-foreground',
                heading.level === 2 && 'pl-0',
                heading.level === 3 && 'pl-4',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
