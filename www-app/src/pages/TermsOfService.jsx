import { LegalLayout, H2, H3, P, UL, LI, Caps } from './LegalLayout.jsx';

export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="May 9, 2026">

      <H2>1. Agreement to Terms</H2>
      <P>These Terms of Service ("Terms") form a legally binding agreement between you and FOAM, LLC ("FOAM," "we," "us," or "our") governing your access to and use of the FOAM mobile application, website, and related services (collectively, the "Platform").</P>
      <P>By creating an account, downloading the app, or using any part of the Platform, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, do not use the Platform.</P>
      <P>If you are using the Platform on behalf of a business, you represent that you have authority to bind that business to these Terms, and that business agrees to these Terms.</P>

      <H2>2. Who We Are</H2>
      <P>FOAM, LLC operates the FOAM Platform, an online marketplace that connects customers seeking auto detailing services with professional operators, including mobile detailers, fixed-location detailing shops, and car washes. FOAM provides the technology platform, payment infrastructure, scheduling tools, and business management tools. FOAM is not itself a detailing service provider.</P>

      <H2>3. Eligibility</H2>
      <P>To use the Platform, you must:</P>
      <UL>
        <LI>Be at least 18 years of age</LI>
        <LI>Be capable of forming a binding contract under applicable law</LI>
        <LI>Not be prohibited from using the Platform under U.S. law or the laws of your jurisdiction</LI>
        <LI>Provide accurate, current, and complete information during registration and maintain that information</LI>
      </UL>
      <P>FOAM reserves the right to refuse service, terminate accounts, or remove content at its sole discretion.</P>

      <H2>4. Account Registration</H2>
      <H3>4.1 Account Creation</H3>
      <P>You must create an account to use most features of the Platform. You agree to provide truthful, accurate, and current information and to keep your account information updated.</P>
      <H3>4.2 Account Security</H3>
      <P>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to immediately notify FOAM of any unauthorized access or use of your account at legal@foamauto.com.</P>
      <H3>4.3 One Account Per Person</H3>
      <P>You may not create or maintain more than one account. Duplicate accounts may be suspended without notice.</P>

      <H2>5. Platform Roles</H2>
      <P>The Platform supports four user roles:</P>
      <UL>
        <LI><strong>Customer:</strong> a person who browses, books, and pays for detailing services through the Platform.</LI>
        <LI><strong>Operator:</strong> a professional detailer or detailing business (mobile, fixed-location, or hybrid) that offers services through the Platform. Operators are subject to additional terms in the Operator Agreement.</LI>
        <LI><strong>Manager:</strong> a designated representative of an Operator who manages business settings, crew, and jobs.</LI>
        <LI><strong>Crew / Team Member:</strong> a technician employed or contracted by an Operator who is assigned jobs through the Platform.</LI>
      </UL>
      <P>Each role has distinct permissions, obligations, and features. Creating an account as an Operator constitutes acceptance of both these Terms and the Operator Agreement.</P>

      <H2>6. Bookings and Appointments</H2>
      <H3>6.1 How Bookings Work</H3>
      <P>Customers may browse Operator profiles, view services and pricing, and request bookings through the Platform. A booking is confirmed when the Platform sends a confirmation notification to both the Customer and the Operator. FOAM does not guarantee the availability of any Operator.</P>
      <H3>6.2 Accurate Information</H3>
      <P>Customers are responsible for providing accurate service address, vehicle information, and contact details. Errors that result in failed service delivery are the Customer's responsibility.</P>
      <H3>6.3 Operator Independence</H3>
      <P>Operators are independent service providers, not employees or agents of FOAM. FOAM does not control the manner in which services are performed. Any dispute about service quality is between the Customer and the Operator, though FOAM provides dispute resolution tools as described in Section 11.</P>

      <H2>7. Payments</H2>
      <H3>7.1 Payment Authorization</H3>
      <P>When a booking is confirmed, the Platform places an authorization hold on your payment method for the full service amount. Your card is not charged at that time. The hold converts to a charge upon job completion.</P>
      <H3>7.2 Tips</H3>
      <P>Customers may add a tip at job completion. Tips are processed as a separate transaction and distributed to the Operator or crew according to FOAM's tip distribution policy.</P>
      <H3>7.3 Platform Fees</H3>
      <P>FOAM charges Operators a subscription fee and a per-booking platform fee. These fees are not charged to Customers. Customers pay the service price displayed at the time of booking.</P>
      <H3>7.4 No Surcharges</H3>
      <P>The price you see when booking is the price you pay. FOAM does not add hidden fees for Customers.</P>
      <H3>7.5 Accepted Payment Methods</H3>
      <P>The Platform accepts credit cards, debit cards, Apple Pay, Google Pay, and Cash App Pay. Payment processing is handled by Stripe. FOAM does not store your full card number.</P>
      <H3>7.6 Failed Payments</H3>
      <P>If a payment fails, the booking may be cancelled. You are responsible for ensuring your payment method is valid and has sufficient funds.</P>

      <H2>8. Cancellation and Refund Policy</H2>
      <H3>8.1 Customer Cancellations</H3>
      <P>The following cancellation fees apply when a Customer cancels a confirmed booking:</P>
      <UL>
        <LI>Cancelled within 72 hours of booking (and more than 24 hours before appointment): No fee. Full hold released.</LI>
        <LI>Cancelled 24 to 72 hours before the scheduled appointment: 25% of the service total is charged.</LI>
        <LI>Cancelled within 24 hours of the scheduled appointment: 50% of the service total is charged.</LI>
        <LI>No-show (Customer not present at time of appointment): 50% of the service total is charged.</LI>
      </UL>
      <H3>8.2 Operator Cancellations</H3>
      <P>If an Operator cancels a confirmed booking, no fee is charged to the Customer. FOAM will issue a platform credit to the Customer's account. The Operator will receive a cancellation strike on their record. Operators with excessive cancellations may be suspended or removed from the Platform.</P>
      <H3>8.3 Refunds</H3>
      <P>Refunds for completed services are not available through the Platform. Disputes about completed services should be submitted through the in-app dispute process within 48 hours of job completion.</P>

      <H2>9. Prohibited Conduct</H2>
      <P>You agree not to:</P>
      <UL>
        <LI>Use the Platform for any unlawful purpose or in violation of any regulations</LI>
        <LI>Impersonate any person or entity or misrepresent your affiliation with any person or entity</LI>
        <LI>Post false, misleading, or fraudulent reviews or ratings</LI>
        <LI>Attempt to circumvent the Platform to arrange off-platform transactions with Operators or Customers you discovered through FOAM</LI>
        <LI>Reverse engineer, decompile, or attempt to extract the source code of the Platform</LI>
        <LI>Use automated means to access the Platform or scrape Platform data</LI>
        <LI>Interfere with or disrupt the integrity or performance of the Platform</LI>
        <LI>Harass, abuse, or harm other users of the Platform</LI>
        <LI>Upload or transmit viruses or malicious code</LI>
        <LI>Attempt to gain unauthorized access to other accounts or Platform systems</LI>
      </UL>
      <P>Violations may result in immediate account suspension or termination, and FOAM reserves the right to pursue legal remedies.</P>

      <H2>10. Reviews and Ratings</H2>
      <P>Customers may leave a review after a completed booking. Reviews must be honest, accurate, and based on a genuine experience. FOAM reserves the right to remove reviews that violate these Terms, including reviews that are fraudulent, offensive, or unrelated to the service received.</P>
      <P>Operators may not solicit reviews in exchange for discounts or other incentives. Customers may not be coerced into leaving positive reviews.</P>

      <H2>11. Disputes Between Users</H2>
      <P>FOAM provides an in-app dispute resolution process. To submit a dispute, navigate to the completed booking and select "Report an Issue" within 48 hours of job completion.</P>
      <P>FOAM will review submitted evidence including before and after photos, booking records, and communications. FOAM's determination is final and binding with respect to any platform credit or fee adjustments. FOAM is not a party to the underlying service contract and has no obligation to issue refunds for services rendered.</P>
      <P>For claims exceeding $500, or claims involving property damage, personal injury, or criminal conduct, you should seek appropriate legal counsel. FOAM's dispute process is not a substitute for legal proceedings.</P>

      <H2>12. Intellectual Property</H2>
      <H3>12.1 FOAM's Property</H3>
      <P>The Platform, including its design, code, content, trademarks, and brand elements, is owned by FOAM and protected by applicable intellectual property laws. You may not use FOAM's name, logo, or brand elements without prior written consent.</P>
      <H3>12.2 Your Content</H3>
      <P>By submitting content to the Platform (including profile photos, portfolio images, reviews, or job photos), you grant FOAM a non-exclusive, worldwide, royalty-free license to use, store, display, and reproduce that content in connection with operating and promoting the Platform.</P>
      <P>You represent that you own or have the rights to any content you submit, and that your content does not infringe on the rights of any third party.</P>

      <H2>13. Privacy</H2>
      <P>Your privacy matters. FOAM's collection and use of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the data practices described in the Privacy Policy.</P>

      <H2>14. Disclaimers</H2>
      <Caps>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. FOAM DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.</Caps>
      <Caps>FOAM DOES NOT WARRANT THE QUALITY, SAFETY, SUITABILITY, OR LEGALITY OF ANY SERVICES PROVIDED BY OPERATORS. FOAM IS NOT RESPONSIBLE FOR THE ACTS OR OMISSIONS OF OPERATORS.</Caps>

      <H2>15. Limitation of Liability</H2>
      <Caps>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FOAM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE PLATFORM.</Caps>
      <Caps>FOAM'S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT PAID BY YOU TO FOAM IN THE SIX MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).</Caps>
      <P>Some jurisdictions do not allow exclusion of certain warranties or limitations on liability, so the above may not fully apply to you.</P>

      <H2>16. Indemnification</H2>
      <P>You agree to defend, indemnify, and hold harmless FOAM, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; or (d) content you submit to the Platform.</P>

      <H2>17. Governing Law and Dispute Resolution</H2>
      <H3>17.1 Governing Law</H3>
      <P>These Terms are governed by the laws of the State of Georgia, without regard to its conflict of law provisions.</P>
      <H3>17.2 Arbitration</H3>
      <P>Any dispute, claim, or controversy arising from these Terms or the Platform that cannot be resolved through FOAM's internal dispute process will be resolved by binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules. Arbitration will take place in Atlanta, Georgia. The arbitrator's decision is final and may be entered as a judgment in any court of competent jurisdiction.</P>
      <H3>17.3 Class Action Waiver</H3>
      <P>You agree to resolve disputes with FOAM on an individual basis only. You waive any right to bring or participate in a class action lawsuit or class-wide arbitration against FOAM.</P>
      <H3>17.4 Exceptions</H3>
      <P>Either party may seek emergency injunctive relief in a court of competent jurisdiction to prevent irreparable harm while arbitration is pending.</P>

      <H2>18. Modifications to Terms</H2>
      <P>FOAM may update these Terms at any time. We will notify you of material changes via email or in-app notification at least 14 days before the changes take effect. Your continued use of the Platform after the effective date of any changes constitutes acceptance of the updated Terms.</P>

      <H2>19. Termination</H2>
      <P>FOAM may suspend or terminate your account at any time, with or without notice, for any violation of these Terms or for any other reason at FOAM's discretion. You may close your account at any time by contacting support@foamauto.com.</P>
      <P>Termination does not relieve you of any obligations incurred before termination. Sections 12, 14, 15, 16, and 17 survive termination of these Terms.</P>

      <H2>20. Miscellaneous</H2>
      <UL>
        <LI><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy and (for Operators) the Operator Agreement, constitute the entire agreement between you and FOAM regarding the Platform.</LI>
        <LI><strong>Severability:</strong> If any provision of these Terms is found unenforceable, the remaining provisions remain in full force.</LI>
        <LI><strong>Waiver:</strong> FOAM's failure to enforce any right or provision is not a waiver of that right or provision.</LI>
        <LI><strong>Assignment:</strong> You may not assign these Terms without FOAM's consent. FOAM may assign these Terms in connection with a merger, acquisition, or sale of assets.</LI>
      </UL>

      <H2>21. Contact</H2>
      <P>For questions about these Terms, contact us at:</P>
      <P>FOAM, LLC · Atlanta, Georgia<br />Email: <a href="mailto:legal@foamauto.com" style={{ color: '#339DC7' }}>legal@foamauto.com</a></P>

    </LegalLayout>
  );
}
