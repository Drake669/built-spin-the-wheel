import SpinWheel from "@/components/spin-the-wheel";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ wheelId: string; email: string }>;
}) {
  const { wheelId, email } = await searchParams;

  let eligibilityData = null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eligibility = await fetch(
    `${baseUrl}/api/check-eligibility?wheelId=${wheelId}&email=${email}`
  );
  eligibilityData = await eligibility.json();
  console.log(eligibilityData, "HERERE\n\n\n\n\n");

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg-3.jpg')" }}
    >
      <SpinWheel />
    </div>
  );
}
