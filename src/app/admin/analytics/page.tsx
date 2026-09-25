import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ q?: string; student?: string }> }) {
  const { q, student } = await searchParams;
  return <AnalyticsView basePath="/admin/analytics" q={q} student={student} />;
}
