'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Folder, FileText, Code, Award, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteNode } from '@/types/api';

interface NotesTreeProps {
  nodes: NoteNode[];
}

const rootIcons: Record<string, React.ElementType> = {
  projects: Code,
  certifications: Award,
  notes: FileText,
};

/**
 * 指定した親IDを持つ子ノード一覧を取得する
 * - parent_id で絞り込み
 * - sort_order で表示順を安定化
 */
function getChildren(nodes: NoteNode[], parentId: string | null) {
  return nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * ツリーの1行（ノード1つ分）を描画する再帰コンポーネント
 * - 子がある場合は展開/折りたたみできる
 * - 展開状態(expandedIds)は親で一元管理し、このコンポーネントは表示に専念する
 */
function TreeItem({
  node,
  allNodes,
  level = 0,
  parentPath,
  expandedIds,
  toggleExpanded,
  currentPathname,
  exactMatch = false,
  Icon: CustomIcon,
}: {
  node: NoteNode;
  allNodes: NoteNode[];
  level?: number;
  parentPath: string;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  currentPathname: string;
  exactMatch?: boolean;

  // 呼び出し側からアイコン差し替え可能（例：Homeアイコン）
  Icon?: React.ElementType;
}) {
  const children = getChildren(allNodes, node.id);
  const hasChildren = children.length > 0;

  // expandedIds は「開いているフォルダのID集合」
  const isExpanded = expandedIds.has(node.id);

  const isFolder = node.node_type === 'folder';

  /**
   * アイコンの決定ロジック
   * 1) 呼び出し側から CustomIcon が渡されていればそれを優先
   * 2) ルート階層(level === 0)のフォルダなら、slug に応じたアイコンを使う
   * 3) それ以外のフォルダは Folder、ファイルは FileText
   */
  const Icon =
    CustomIcon ||
    (level === 0 && isFolder ? rootIcons[node.slug] || Folder : isFolder ? Folder : FileText);

  /**
   * このノードの遷移先URLを作る
   * - slug がある: /notes/parent/child のように繋ぐ
   * - slug が空（Homeの仮ノード）: parentPath をそのまま使う（/notes）
   */
  const href = node.slug ? `${parentPath}/${node.slug}` : parentPath;

  /**
   * アクティブ判定（現在表示中のパスと比較）
   * - exactMatch=true : 完全一致のみアクティブ（Home用）
   * - exactMatch=false: 自分自身 or 自分配下のページでもアクティブ扱い（フォルダ用）
   */
  const isActive = exactMatch
    ? currentPathname === href
    : currentPathname === href || currentPathname.startsWith(href + '/');

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
          // 階層が深いほどインデントをつける
          level > 0 && 'ml-3',
        )}
      >
        {/* 展開ボタン or 空白スペーサー（左端の幅合わせ） */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleExpanded(node.id);
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-accent"
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
            />
          </button>
        )}

        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        {/* ノードタイトル。はみ出す場合は省略 */}
        <Link href={href} className="flex-1 truncate font-medium">
          {node.title}
        </Link>
      </div>

      {/* 子がいて、かつ展開中のときだけ子リストを描画（再帰） */}
      {hasChildren && isExpanded && (
        <div className="ml-2 border-l border-border">
          {children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              allNodes={allNodes}
              level={level + 1}
              parentPath={href}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              currentPathname={currentPathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * DBには存在しない「Notes Home」用の仮ノード
 * - ルートの先頭に差し込んで、/notes への導線として使う
 * - slug を空にすることで href が parentPath(/notes) になる
 */
const HOME_NODE: NoteNode = {
  id: 'virtual-home',
  parent_id: null,
  node_type: 'folder', // 表示上はフォルダ扱い（アイコン/スタイルを揃える）
  slug: '', // 空slug → href は parentPath (/notes)
  title: 'Notes Home',
  sort_order: -1, // 先頭に出したい意図（ただしここでは配列の先頭に入れるので保険）
  created_at: '',
  updated_at: '',
  post_id: null,
};

export function NotesTree({ nodes }: NotesTreeProps) {
  const pathname = usePathname();

  /**
   * 展開状態の初期化
   * - ルート直下のフォルダは最初から開いた状態にする（UX）
   * - Set を使うと「含まれているか」の判定が速く、重複も起きない
   */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const roots = getChildren(nodes, null);
    roots.forEach((n) => {
      if (n.node_type === 'folder') initial.add(n.id);
    });
    return initial;
  });

  /**
   * 指定IDの展開/折りたたみをトグルする
   * - Set は破壊的変更を避けるため、毎回 new Set(prev) を作って返す
   */
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /**
   * ルート直下のDBノードの前に、HOME_NODE（仮ノード）を差し込む
   * - HomeはDB上の子を持たない（allNodes=nodesのままでOK）
   */
  const rootNodesWithHome = [HOME_NODE, ...getChildren(nodes, null)];

  return (
    <div className="space-y-1">
      {rootNodesWithHome.map((node) => {
        const isHome = node.id === HOME_NODE.id;

        return (
          <TreeItem
            key={node.id}
            node={node}
            allNodes={nodes} // HomeはDBノードではないが、子を持たないのでこれで問題なし
            parentPath="/notes"
            expandedIds={expandedIds}
            toggleExpanded={toggleExpanded}
            currentPathname={pathname}
            // Home専用の挙動
            exactMatch={isHome} // Homeは /notes だけをアクティブにしたい
            Icon={isHome ? Home : undefined}
          />
        );
      })}
    </div>
  );
}
