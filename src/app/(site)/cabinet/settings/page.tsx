import { requireUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function SettingsPage() {
  await requireUser();
  return <ChangePasswordForm />;
}
