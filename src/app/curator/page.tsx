import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export default async function CuratorPage({ searchParams }: { searchParams: Promise<{ q?: string; student?: string }> }) {
  const { q, student } = await searchParams;
  return <AnalyticsView basePath="/curator" q={q} student={student} />;
}
