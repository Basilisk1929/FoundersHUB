import { TaskDoc, UserDoc } from '@/types';

export interface EquitySlice {
  name: string;
  percentage: number;
  points: number;
  role: string;
  color?: string;
}

const PALETTE = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#14b8a6', // Teal
  '#06b6d4'  // Cyan
];

export function computeEquityBreakdown(
  founderName: string,
  proposedSplit: Record<string, number> = { 'Founder': 70, 'Builders Pool': 30 },
  completedTasks: TaskDoc[] = [],
  members: UserDoc[] = []
): EquitySlice[] {
  const slices: EquitySlice[] = [];

  // Founder base share
  const founderBasePct = proposedSplit['Founder'] || proposedSplit[founderName] || 60;
  const poolPct = 100 - founderBasePct;

  // Aggregate points per assignee
  const pointsMap: Record<string, { name: string; points: number }> = {};

  for (const task of completedTasks) {
    if (task.status === 'done' && task.assigneeId) {
      const p = task.contributionPoints || 10;
      if (!pointsMap[task.assigneeId]) {
        const user = members.find(m => m._id === task.assigneeId);
        pointsMap[task.assigneeId] = {
          name: task.assigneeName || user?.name || 'Developer',
          points: 0
        };
      }
      pointsMap[task.assigneeId].points += p;
    }
  }

  const totalBuilderPoints = Object.values(pointsMap).reduce((sum, item) => sum + item.points, 0);

  slices.push({
    name: `${founderName} (Founder)`,
    percentage: founderBasePct,
    points: 0,
    role: 'Founder',
    color: '#38bdf8'
  });

  if (totalBuilderPoints === 0 || Object.keys(pointsMap).length === 0) {
    slices.push({
      name: 'Unallocated Builders Pool',
      percentage: poolPct,
      points: 0,
      role: 'Reserve',
      color: '#64748b'
    });
    return slices;
  }

  let colorIdx = 0;
  let allocatedBuilderPct = 0;
  const entries = Object.entries(pointsMap);

  entries.forEach(([_, info], idx) => {
    // Proportional slice of the builder pool
    const share = Number(((info.points / totalBuilderPoints) * poolPct).toFixed(1));
    allocatedBuilderPct += share;
    slices.push({
      name: info.name,
      percentage: share,
      points: info.points,
      role: 'Builder',
      color: PALETTE[colorIdx % PALETTE.length]
    });
    colorIdx++;
  });

  // Remainder if any
  const remainder = Math.max(0, Number((poolPct - allocatedBuilderPct).toFixed(1)));
  if (remainder > 0.5) {
    slices.push({
      name: 'Unallocated Pool',
      percentage: remainder,
      points: 0,
      role: 'Reserve',
      color: '#475569'
    });
  }

  return slices;
}
