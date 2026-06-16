export type ProgressKpi = {
  label: string;
  raw: string;
  score: number;
  hint: string;
};

type ProgressInputs = {
  suppliersContacted: number;
  brandsApproved: number;
  productsAnalyzed: number;
  productsLaunched: number;
  totalRevenue: number;
  communityEngagements: number;
  tasksCompleted: number;
  tasksTotal: number;
  skoolCourseProgressPct: number;
};

const REVENUE_MILESTONES = [0, 1_000, 10_000, 100_000];

/**
 * Combines business-activity signals into a single "Overall Progress"
 * score, alongside the per-KPI breakdown. Each KPI is normalized against a
 * realistic target rather than an arbitrary scale, and Skool course
 * progress is included as one input among several rather than the whole
 * picture.
 */
export function computeProgress(inputs: ProgressInputs) {
  const kpis: ProgressKpi[] = [
    {
      label: "Supplier Outreach",
      raw: `${inputs.suppliersContacted} contacted`,
      score: pctOf(inputs.suppliersContacted, 20),
      hint: "Target: 20 suppliers contacted",
    },
    {
      label: "Brands Approved",
      raw: `${inputs.brandsApproved} approved`,
      score: pctOf(inputs.brandsApproved, 5),
      hint: "Target: 5 approved brands",
    },
    {
      label: "Products Analyzed",
      raw: `${inputs.productsAnalyzed} analyzed`,
      score: pctOf(inputs.productsAnalyzed, 20),
      hint: "Target: 20 products analyzed",
    },
    {
      label: "Products Launched",
      raw: `${inputs.productsLaunched} launched`,
      score: pctOf(inputs.productsLaunched, 3),
      hint: "Target: 3 launched products",
    },
    {
      label: "Revenue Milestone",
      raw: formatCurrency(inputs.totalRevenue),
      score: revenueMilestoneScore(inputs.totalRevenue),
      hint: "Milestones: $1k / $10k / $100k",
    },
    {
      label: "Community Engagement",
      raw: `${inputs.communityEngagements} logged`,
      score: pctOf(inputs.communityEngagements, 10),
      hint: "Target: 10 engagements this period",
    },
    {
      label: "Action Plan Tasks",
      raw:
        inputs.tasksTotal === 0
          ? "No tasks yet"
          : `${inputs.tasksCompleted}/${inputs.tasksTotal} done`,
      score:
        inputs.tasksTotal === 0
          ? 0
          : Math.round((inputs.tasksCompleted / inputs.tasksTotal) * 100),
      hint: "Self-assigned business tasks (not Skool lessons)",
    },
    {
      label: "Skool Course Progress",
      raw: `${inputs.skoolCourseProgressPct}%`,
      score: inputs.skoolCourseProgressPct,
      hint: "Self-reported until Skool API access exists",
    },
  ];

  const overall = Math.round(
    kpis.reduce((sum, k) => sum + k.score, 0) / kpis.length,
  );

  return { kpis, overall };
}

function pctOf(value: number, target: number) {
  return Math.round((Math.min(value, target) / target) * 100);
}

function revenueMilestoneScore(total: number) {
  const reached = REVENUE_MILESTONES.filter((m) => total >= m).length - 1;
  return Math.round((reached / (REVENUE_MILESTONES.length - 1)) * 100);
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
