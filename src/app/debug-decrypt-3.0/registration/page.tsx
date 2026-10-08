import EventRegistrationPage from "@/app/events/[slug]/registration/page";

export default function DebugDecryptRegistrationPage() {
  return (
    <EventRegistrationPage
      params={Promise.resolve({ slug: "debug-decrypt-3.0" })}
    />
  );
}
