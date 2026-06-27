import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import AiAgentClient from "@/components/AiAgentClient";

export const dynamic = "force-dynamic";

export default async function AiAgentPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch {
    redirect("/login");
  }

  return (
    <AiAgentClient
      userId={user.id}
      userEmail={user.email}
      userName={user.name ?? user.email}
    />
  );
}
