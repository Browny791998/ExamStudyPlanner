import { toast } from 'sonner'

export const showToast = {
  taskCompleted: (taskTitle: string) =>
    toast.success(`"${taskTitle}" completed!`, { duration: 3000 }),

  testUnlocked: (setName: string) =>
    toast.info(`Mock test unlocked: ${setName}`, { duration: 5000 }),

  milestoneAchieved: (title: string) =>
    toast.success(`Milestone achieved: ${title}`, {
      duration: 6000,
      description: 'Great work — keep it up!',
    }),

  examCountdown: (days: number) =>
    toast.warning(`${days} days until your exam!`, {
      duration: 8000,
      description: "Make sure you're on track.",
    }),

  newExamSet: (setName: string) =>
    toast.info(`New exam set available: ${setName}`, { duration: 5000 }),

  planGenerated: (examType: string, taskCount: number) =>
    toast.success(`Your ${examType} study plan is ready!`, {
      duration: 5000,
      description: `${taskCount} study sessions scheduled`,
    }),

  gcalSynced: (count: number) =>
    toast.success(`${count} sessions synced to Google Calendar`, { duration: 4000 }),

  error: (message: string) =>
    toast.error(message, { duration: 4000 }),

  loading: (message: string) =>
    toast.loading(message),
}
