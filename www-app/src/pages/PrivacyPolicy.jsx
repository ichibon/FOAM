import { LegalLayout, H2, H3, P, UL, LI } from './LegalLayout.jsx';

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="May 9, 2026">

      <H2>1. Introduction</H2>
      <P>FOAM Technologies, Inc. ("FOAM," "we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, who we share it with, and the choices you have about your information when you use the FOAM mobile application, website, and related services (collectively, the "Platform").</P>
      <P>By using the Platform, you agree to the collection and use of information in accordance with this Policy. This Policy applies to all users including Customers, Operators, Managers, and Crew Members.</P>
      <P>This Privacy Policy is written to comply with the California Consumer Privacy Act (CCPA), applicable Google Play and Apple App Store requirements, and GDPR baseline standards for international users.</P>

      <H2>2. Information We Collect</H2>
      <H3>2.1 Information You Provide</H3>
      <P>We collect information you provide when you create an account, use the Platform, or communicate with us:</P>
      <UL>
        <LI>Identity information: full name, email address, phone number, profile photo</LI>
        <LI>Account credentials: email and password (passwords are hashed and never stored in plaintext)</LI>
        <LI>For Operators: business name, business address, service area, services offered, pricing, bio, portfolio photos</LI>
        <LI>For Operators: bank account information for payouts (collected and stored by Stripe on our behalf; FOAM does not store full bank account numbers)</LI>
        <LI>Vehicle information: make, model, year, color, license plate (provided by Customers for booking purposes)</LI>
        <LI>Payment information: card number, expiration, and CVV are collected and stored by Stripe. FOAM stores only payment metadata (last four digits, card brand, transaction IDs)</LI>
        <LI>Communications: messages, support inquiries, and feedback you send to us</LI>
        <LI>Job photos: before and after photos uploaded by Operators for completed jobs</LI>
        <LI>Business documents: insurance certificates and licenses uploaded by Operators (stored securely, accessible only to the Operator)</LI>
      </UL>
      <H3>2.2 Information Collected Automatically</H3>
      <P>When you use the Platform, we automatically collect:</P>
      <UL>
        <LI>Device information: device type, operating system, unique device identifiers</LI>
        <LI>Usage data: features accessed, pages visited, booking activity, session duration</LI>
        <LI>Log data: IP address, browser type, access times, referring URLs</LI>
        <LI>Location data: approximate location (derived from IP) for service discovery; precise GPS location for mobile Operators using crew tracking features (with consent)</LI>
        <LI>Crash reports and performance data to diagnose and improve the Platform</LI>
      </UL>
      <H3>2.3 Information from Third Parties</H3>
      <P>We receive information from third parties in limited circumstances:</P>
      <UL>
        <LI>Stripe: payment confirmation, payout status, identity verification results for Operators</LI>
        <LI>Google or Apple: if you sign in using social login, we receive your name and email address from that provider</LI>
        <LI>Tomorrow.io: precipitation data by zip code used for Rain Coverage claims (no personal data involved)</LI>
        <LI>Google Maps API: address validation results when you enter a service address</LI>
      </UL>

      <H2>3. How We Use Your Information</H2>
      <H3>3.1 Operate the Platform</H3>
      <UL>
        <LI>Create and manage your account</LI>
        <LI>Process bookings, payments, and payouts</LI>
        <LI>Send booking confirmations, reminders, and status updates via push notification and SMS</LI>
        <LI>Enable communication between Customers and Operators</LI>
        <LI>Display Operator profiles and services to Customers</LI>
        <LI>Route mobile Operator bookings based on service area</LI>
        <LI>Evaluate Rain Coverage claims using weather data and booking history</LI>
      </UL>
      <H3>3.2 Protect the Platform and Users</H3>
      <UL>
        <LI>Detect fraud, abuse, and unauthorized access</LI>
        <LI>Assemble dispute evidence packages from before/after photos and booking records</LI>
        <LI>Enforce our Terms of Service and Operator Agreement</LI>
        <LI>Monitor for safety violations and policy breaches</LI>
      </UL>
      <H3>3.3 Improve the Platform</H3>
      <UL>
        <LI>Analyze usage patterns to improve features and fix bugs</LI>
        <LI>Conduct internal analytics on platform performance</LI>
        <LI>Test new features in staging environments</LI>
      </UL>
      <H3>3.4 Communicate with You</H3>
      <UL>
        <LI>Send transactional messages (receipts, booking confirmations, status changes)</LI>
        <LI>Send service announcements and policy updates</LI>
        <LI>Respond to your support inquiries</LI>
        <LI>Send marketing communications if you have opted in (you may opt out at any time)</LI>
      </UL>
      <H3>3.5 Legal Compliance</H3>
      <UL>
        <LI>Meet our legal obligations, including tax reporting (1099-K via Stripe for Operators)</LI>
        <LI>Respond to lawful requests from law enforcement or regulatory authorities</LI>
        <LI>Enforce our legal rights</LI>
      </UL>

      <H2>4. How We Share Your Information</H2>
      <P>FOAM does not sell your personal information. We share information only in the following circumstances:</P>
      <H3>4.1 Between Users on the Platform</H3>
      <P>When a booking is confirmed, Customers and Operators share certain information with each other:</P>
      <UL>
        <LI>Customers share: first name, service address, vehicle information, and contact phone number with the assigned Operator</LI>
        <LI>Operators share: business name, profile photo, rating, and contact information with the Customer</LI>
      </UL>
      <P>This sharing is necessary to complete the service. We limit shared information to what is needed for the booking.</P>
      <H3>4.2 Service Providers</H3>
      <P>We share information with third-party service providers who help us operate the Platform:</P>
      <UL>
        <LI>Stripe: payment processing, payouts, identity verification, and tax reporting</LI>
        <LI>Supabase: database hosting and file storage (AWS-backed infrastructure)</LI>
        <LI>Twilio: SMS delivery for appointment reminders and confirmations</LI>
        <LI>Expo: push notification delivery</LI>
        <LI>Tomorrow.io: weather data for Rain Coverage claims</LI>
        <LI>Google: maps, address validation, and (optionally) social login</LI>
      </UL>
      <P>These providers are contractually obligated to protect your information and use it only for the purposes we specify.</P>
      <H3>4.3 Business Transfers</H3>
      <P>If FOAM is acquired, merges with another company, or sells a significant portion of its assets, your information may be transferred as part of that transaction. We will notify you before your information is subject to a materially different privacy policy.</P>
      <H3>4.4 Legal Requirements</H3>
      <P>We may disclose your information if we believe in good faith that disclosure is necessary to: comply with applicable law or legal process; protect the rights, property, or safety of FOAM, our users, or others; detect or prevent fraud or security incidents; or enforce our Terms.</P>

      <H2>5. Data Storage and Security</H2>
      <H3>5.1 Where Data is Stored</H3>
      <P>Your data is stored on Supabase infrastructure backed by Amazon Web Services (AWS) in the United States. By using the Platform, you consent to your information being processed and stored in the United States.</P>
      <H3>5.2 Security Measures</H3>
      <P>We implement industry-standard security measures including:</P>
      <UL>
        <LI>Row-level security on all database tables, enforced at the database layer</LI>
        <LI>JWT-based authentication with server-side signature validation on every request</LI>
        <LI>Encrypted connections (TLS) for all data in transit</LI>
        <LI>Access-controlled storage buckets — sensitive files accessible only to authorized account holders</LI>
        <LI>No storage of full card numbers or CVV codes — all payment data handled by Stripe (PCI-DSS compliant)</LI>
        <LI>Hashed passwords — plaintext passwords are never stored</LI>
      </UL>
      <H3>5.3 Limitations</H3>
      <P>No security system is impenetrable. We cannot guarantee the absolute security of your information. In the event of a data breach that affects your rights, we will notify you as required by applicable law.</P>
      <H3>5.4 Retention</H3>
      <P>We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and personal data. We retain certain records (booking history, payment records) for legal and tax compliance purposes for up to 7 years after account closure, even after other data is deleted.</P>

      <H2>6. Your Choices and Rights</H2>
      <H3>6.1 All Users</H3>
      <P>Regardless of your location, you have the following choices:</P>
      <UL>
        <LI>Access and update your account information at any time through your profile settings</LI>
        <LI>Opt out of marketing emails by clicking "unsubscribe" in any marketing email, or through notification settings in the app</LI>
        <LI>Control push notifications through your device's notification settings</LI>
        <LI>Request account deletion by contacting support@foamauto.com</LI>
      </UL>
      <H3>6.2 SMS Communications and Mobile Number Consent</H3>
      <P>When you provide your mobile phone number to FOAM, you may receive SMS text messages related to your use of the Platform. These messages include booking confirmations, appointment reminders, status updates, and account notifications. Message and data rates may apply. Message frequency varies based on your activity on the Platform.</P>
      <P>Mobile numbers collected for SMS communications will not be shared with third parties for their marketing purposes. Your mobile number is used solely to deliver transactional messages related to your FOAM account and bookings. SMS consent is not a condition of purchasing or using any service.</P>
      <P>To opt out of SMS messages at any time, reply STOP to any message you receive from FOAM. Reply HELP for assistance. You may also update your notification preferences in the app under Settings. Opting out of SMS does not affect your ability to use the Platform, but you will no longer receive text message reminders for upcoming bookings.</P>
      <H3>6.3 California Residents (CCPA)</H3>
      <P>If you are a California resident, you have the following rights under the California Consumer Privacy Act:</P>
      <UL>
        <LI><strong>Right to Know:</strong> You may request information about the categories and specific pieces of personal information we have collected about you in the past 12 months.</LI>
        <LI><strong>Right to Delete:</strong> You may request deletion of personal information we have collected about you, subject to certain exceptions.</LI>
        <LI><strong>Right to Opt Out:</strong> FOAM does not sell personal information. If this changes, we will provide a clear opt-out mechanism.</LI>
        <LI><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</LI>
      </UL>
      <P>To exercise your CCPA rights, contact us at legal@foamauto.com. We will respond to verified requests within 45 days.</P>
      <H3>6.4 International Users (GDPR Basis)</H3>
      <P>If you are located in the European Economic Area, United Kingdom, or Switzerland, we process your personal data under the following legal bases:</P>
      <UL>
        <LI><strong>Contract:</strong> processing necessary to perform the services you have requested</LI>
        <LI><strong>Legitimate interests:</strong> fraud prevention, security, and platform improvement, where these do not override your rights</LI>
        <LI><strong>Legal obligation:</strong> compliance with applicable law</LI>
        <LI><strong>Consent:</strong> marketing communications, where we have obtained your consent</LI>
      </UL>
      <P>You have rights to access, rectify, erase, restrict, and port your personal data, and to object to processing. To exercise these rights, contact legal@foamauto.com. You also have the right to lodge a complaint with your local data protection authority.</P>

      <H2>7. Children's Privacy</H2>
      <P>The Platform is not intended for users under the age of 18. We do not knowingly collect personal information from anyone under 18. If we become aware that a person under 18 has created an account, we will delete that account and associated data. If you believe a minor has submitted information to us, contact legal@foamauto.com.</P>

      <H2>8. Cookies and Tracking (foamauto.com)</H2>
      <P>The FOAM website (foamauto.com) uses cookies and similar tracking technologies for the following purposes:</P>
      <UL>
        <LI><strong>Essential cookies:</strong> required for the website to function, including session management and security</LI>
        <LI><strong>Analytics cookies:</strong> we use analytics tools to understand how visitors use the site and improve it. These tools may collect IP address, browser type, and pages visited.</LI>
        <LI><strong>Marketing cookies:</strong> if you consent, we may use cookies to measure the effectiveness of our marketing campaigns</LI>
      </UL>
      <P>You can control cookie preferences through your browser settings or through our cookie consent tool on the website. Note that disabling certain cookies may affect site functionality.</P>

      <H2>9. Third-Party Links</H2>
      <P>The Platform may contain links to third-party websites or services that are not operated by FOAM. We have no control over, and assume no responsibility for, the privacy practices of third-party sites. We encourage you to review the privacy policy of any third-party site you visit.</P>

      <H2>10. Changes to This Policy</H2>
      <P>We may update this Privacy Policy from time to time. We will notify you of material changes by email and through in-app notification at least 14 days before the changes take effect. The date of the most recent update is shown at the top of this Policy.</P>

      <H2>11. Contact Us</H2>
      <P>For questions, requests, or concerns about this Privacy Policy or our data practices, contact us at:</P>
      <P>FOAM Technologies, Inc. · Atlanta, Georgia<br />
        Privacy inquiries: <a href="mailto:legal@foamauto.com" style={{ color: '#339DC7' }}>legal@foamauto.com</a><br />
        Support: <a href="mailto:support@foamauto.com" style={{ color: '#339DC7' }}>support@foamauto.com</a>
      </P>

    </LegalLayout>
  );
}
