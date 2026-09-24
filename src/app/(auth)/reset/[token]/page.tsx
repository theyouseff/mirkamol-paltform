import Link from "next/link";
import { ResetForm } from "@/components/ResetForm";
import { authCard, authLink } from "@/components/auth-ui";
import { findValidReset } from "@/lib/reset";

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await findValidReset(token))) {
    return (
      <div className={authCard}>
        <h1 className="text-2xl font-bold">Havola yaroqsiz</h1>
        <p className="text-sm text-gold-text/80">Havola eskirgan yoki allaqachon ishlatilgan.</p>
        <Link href="/forgot" className={`${authLink} block text-sm`}>Yangi havola so&apos;rash</Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}
