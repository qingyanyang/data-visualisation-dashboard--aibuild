import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // const cookieStore = await cookies();
  // const token = cookieStore.get("token");
  const token = "I_am_token";
  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
