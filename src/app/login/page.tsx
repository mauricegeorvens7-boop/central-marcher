import { AuthForms } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/admin/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  if (user?.role === "seller") redirect("/seller");
  if (user?.role === "customer") redirect("/account");
  return <AuthForms />;
}
