import type { Route } from "./+types/home";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Vortex - Free, disposable email addresses" },
    { name: "description", content: "Free, disposable email addresses for annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses." },
  ];
}

export default function Home() {
  return (
    <>
      <div className="space-y-2 text-center w-[80%] mx-auto mt-8">
        <h1 className="text-4xl font-bold">Free, disposable email addresses</h1>
        <p className="text-xl">For annoying newsletters, websites, and everything in between! Protect your privacy and avoid spam with temporary email addresses.</p>
      </div>
    </>
  );
}
