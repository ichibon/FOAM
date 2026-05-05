import { Metadata } from "next";
import ForDetailersClient from "./ForDetailersClient";

export const metadata: Metadata = {
  title: "For Mobile Detailers — FOAM",
  description: "FOAM gives mobile detailers the back office they never had: bookings, payments, customer history, routes, reviews, and crew tools in one app.",
};

export default function ForDetailersPage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FOAM",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android",
    description: "The operating system for auto detailing operators.",
    offers: {
      "@type": "Offer",
      price: "29.00",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <ForDetailersClient />
    </>
  );
}
