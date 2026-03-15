import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

export function applyChartDefaults(isDark: boolean) {
  const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  ChartJS.defaults.color = textColor
  ChartJS.defaults.borderColor = gridColor
  if (ChartJS.defaults.plugins.legend?.labels) {
    ChartJS.defaults.plugins.legend.labels.color = textColor
  }
}

export const SKILL_COLORS: Record<string, string> = {
  Reading: '#378ADD',
  Writing: '#1D9E75',
  Listening: '#534AB7',
  Speaking: '#D85A30',
  Vocabulary: '#BA7517',
  Grammar: '#D4537E',
  'Mock Test': '#E24B4A',
  Revision: '#888780',
  Math: '#7F77DD',
}
