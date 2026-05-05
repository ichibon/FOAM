import { Metadata } from "next";
import ForShopsClient from "./ForShopsClient";

export const metadata: Metadata = {
  title: "For Detailing Shops — FOAM",
  description: "FOAM helps detailing shops manage drop-offs, walk-ins, bay capacity, payments, customer history, and reviews from one place.",
};

export default function ForShopsPage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FOAM",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android",
    description: "The operating system for auto detailing shops.",
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
      <ForShopsClient />
    </>
  );
}
