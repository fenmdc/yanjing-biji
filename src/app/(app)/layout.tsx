import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();

  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      {children}
    </AppShell>
  );
}
