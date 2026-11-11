import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Create your account · SabiLab" };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg tracking-tighter mb-6 block">
          Sabi<em className="text-[#6d28d9]">Lab</em>
        </Link>
        <div className="panel p-6">
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-[#756b86]">
            A username and a password. No email.
          </p>
          <div className="mt-6">
            <AuthForm mode="signup" />
          </div>
        </div>
        <p className="mt-4 text-xs text-[#756b86]">
          Prototype only. Your account is stored on this device&apos;s server
          and is not a production login. The real build will use secure accounts
          on a hosted database.
        </p>
      </div>
    </div>
  );
}
