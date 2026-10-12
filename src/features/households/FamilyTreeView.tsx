import { cn } from '../../lib/utils'
import type { FamilyTree, FamilyTreeNode } from '../../lib/types'

// Renders the tree GET /households/{id}/family-tree returns using the pure-CSS org-chart
// technique in src/index.css (.family-tree) — nested <ul>/<li>, connector lines from
// ::before/::after borders, no charting library. See docs/modules/09-household-family-tree.md.

function ageLabel(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return ''
  const ageMs = Date.now() - dob.getTime()
  return `${Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000))}y`
}

function PersonNode({ label, sublabel, head }: { label: string; sublabel: string; head?: boolean }) {
  return (
    <div
      className={cn(
        'inline-block whitespace-nowrap rounded-md border px-3 py-2 text-center text-[12px]',
        head ? 'border-brand bg-brand text-white' : 'border-border bg-card',
      )}
    >
      <div className="font-semibold">{label}</div>
      <div className={cn('text-[11px]', head ? 'text-white/80' : 'text-text-secondary')}>{sublabel}</div>
    </div>
  )
}

function TreeNodeList({ nodes }: { nodes: FamilyTreeNode[] }) {
  if (nodes.length === 0) return null
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.voter.id}>
          <PersonNode label={node.voter.fullName} sublabel={ageLabel(node.voter.dateOfBirth)} />
          <TreeNodeList nodes={node.children} />
        </li>
      ))}
    </ul>
  )
}

export function FamilyTreeView({ tree }: { tree: FamilyTree }) {
  if (!tree.headOfHousehold) {
    return <p className="py-6 text-center text-[13px] text-text-secondary">Set a house owner above to start building the family tree.</p>
  }

  const headLabel = tree.spouse ? `${tree.headOfHousehold.fullName} & ${tree.spouse.fullName}` : tree.headOfHousehold.fullName

  return (
    <div className="overflow-x-auto py-4">
      <ul className="family-tree">
        <li>
          <PersonNode label={headLabel} sublabel={ageLabel(tree.headOfHousehold.dateOfBirth)} head />
          <TreeNodeList nodes={tree.children} />
        </li>
      </ul>
    </div>
  )
}
