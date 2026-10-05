import SpinWheel from "@/components/spin-the-wheel";
import UserInfoForm from "@/components/user-info-form";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    wheelId: string;
    email: string;
    name: string;
    phoneNumber: string;
    countryCode: string;
  }>;
}) {
  const { wheelId, email, name, phoneNumber, countryCode } = await searchParams;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eligibility = await fetch(
    `${baseUrl}/api/check-eligibility?wheelId=${wheelId}&email=${encodeURIComponent(email)}&countryCode=${countryCode}`,
    { cache: "no-store" }
  );
  const eligibilityData = await eligibility.json();

  let content;

  if (!eligibility.ok) {
    if (!email || email === "undefined" || email.trim() === "") {
      content = (
        <UserInfoForm 
          wheelId={wheelId} 
          countryCode={countryCode} 
        />
      );
    } else {
      content = (
        <h1 className="text-2xl sm:text-3xl font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center max-w-xl">
          You are not eligible to spin. {eligibilityData.error}
        </h1>
      );
    }
  } else if (!eligibilityData.eligible) {
    if (!email || email === "undefined" || email.trim() === "") {
      content = (
        <UserInfoForm 
          wheelId={wheelId} 
          countryCode={countryCode} 
        />
      );
    } else {
      content = (
        <h1 className="text-2xl sm:text-3xl font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center max-w-xl">
          You are not eligible to spin. {eligibilityData.reason}
        </h1>
      );
    }
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
      className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-[#0b2a6b]"
    >
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 max-w-7xl mx-auto">
        <div className="w-full max-w-md lg:max-w-lg shrink-0">
          <img
            src="/customer-service.png"
            alt="Built Customer Service Week"
            className="w-full h-auto object-contain rounded-2xl shadow-2xl ring-4 ring-white/20"
          />
        </div>

        <div className="flex items-center justify-center">{content}</div>
      </div>
    </div>
  );
}
