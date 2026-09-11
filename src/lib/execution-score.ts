import { TaskDoc, SprintDoc, TimelineEventDoc } from '@/types';

export function calculateExecutionScore(
  sprint: SprintDoc | null,
  tasks: TaskDoc[],
  timelineEvents: TimelineEventDoc[] = []
): number {
  if (!sprint || tasks.length === 0) {
    return 20; // baseline for initial draft / setup
  }

  // 1. Task completion ratio (0-45 points)
  const completedTasks = tasks.filter(t => t.status === 'done');
  const taskRatio = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
  const taskPointsScore = Math.round(taskRatio * 45);

  // 2. High priority delivery (0-25 points)
  const criticalAndHigh = tasks.filter(t => t.priority === 'critical' || t.priority === 'high');
  const completedHigh = criticalAndHigh.filter(t => t.status === 'done');
  const highPriorityScore = criticalAndHigh.length > 0 
    ? Math.round((completedHigh.length / criticalAndHigh.length) * 25) 
    : 15;

  // 3. Activity / Velocity from Timeline (0-20 points)
  const eventCount = timelineEvents.length;
  const activityScore = Math.min(20, Math.round(eventCount * 2.5));

  // 4. Sprint Health / Commitment (0-10 points)
  const hoursCommitmentBonus = sprint.founderCommitment?.value ? 10 : 5;

  const total = taskPointsScore + highPriorityScore + activityScore + hoursCommitmentBonus;
  return Math.min(100, Math.max(0, total));
}
