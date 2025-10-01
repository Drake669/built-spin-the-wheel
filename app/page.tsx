import SpinWheel from "@/components/spin-the-wheel";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    wheelId: string;
    email: string;
    name: string;
    phoneNumber: string;
  }>;
}) {
  const { wheelId, email, name, phoneNumber } = await searchParams;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eligibility = await fetch(
    `${baseUrl}/api/check-eligibility?wheelId=${wheelId}&email=${email}`,
    { cache: "no-store" }
  );
  const eligibilityData = await eligibility.json();

  let content;

  if (!eligibility.ok) {
    content = (
      <h1 className="text-4xl font-bold text-white bg-black/50 p-6 rounded-lg text-center">
        You are not eligible to spin. {eligibilityData.error}
      </h1>
    );
  } else if (!eligibilityData.eligible) {
    content = (
      <h1 className="text-4xl font-bold text-white bg-black/50 p-6 rounded-lg text-center">
        You are not eligible to spin. {eligibilityData.reason}
      </h1>
    );
  } else {
    content = (
      <SpinWheel
        wheelId={wheelId}
        email={email}
        name={name}
        phoneNumber={phoneNumber}
        initialEligibilityData={eligibilityData}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 lg:p-8"
      style={{ backgroundImage: "url('/bg-3.jpg')" }}
    >
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 max-w-7xl mx-auto">
        <div className="w-full max-w-md lg:max-w-lg flex-shrink-0">
          <img
            src="/customer-service-week.webp"
            alt="Built Customer Service Week"
            className="w-full h-auto object-contain rounded-xl shadow-2xl"
          />
        </div>

        <div className="flex items-center justify-center">{content}</div>
      </div>
    </div>
  );
}
