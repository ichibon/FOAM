import { Metadata } from "next";
import AtlantaClient from "./AtlantaClient";

export const metadata: Metadata = {
  title: "Car Detailing Atlanta — Book Mobile Detailers & Shops | FOAM",
  description:
    "Mobile detailers and local shops across Atlanta, all bookable through FOAM. Interior detail, full detail, ceramic coating, and more.",
};

export default function AtlantaPage() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "FOAM Auto Detailing",
    serviceType: "Auto Detailing / Mobile Auto Detailing",
    areaServed: "Atlanta, GA",
    url: "https://foamauto.com/detailing/atlanta",
    description:
      "FOAM connects customers in Atlanta with verified mobile detailers and local detailing shops. Book online in minutes.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://foamauto.com" },
      { "@type": "ListItem", position: 2, name: "Detailing", item: "https://foamauto.com/detailing" },
      { "@type": "ListItem", position: 3, name: "Atlanta", item: "https://foamauto.com/detailing/atlanta" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AtlantaClient />
    </>
  );
}
