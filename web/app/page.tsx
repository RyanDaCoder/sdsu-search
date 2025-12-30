import { redirect } from "next/navigation";

export default function Home() {
  redirect("/search?term=GROSSMONT_2026SP");
}
