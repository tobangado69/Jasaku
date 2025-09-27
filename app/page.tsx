"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@/components/shared/LoadingSpinner";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const userRole = (session.user as any)?.role?.toLowerCase();

    switch (userRole) {
      case "provider":
        router.push("/provider");
        break;
      case "seeker":
        router.push("/seeker");
        break;
      case "admin":
        router.push("/admin");
        break;
      default:
        router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <LoadingPage />;
  }

  return <LoadingPage />;
}
