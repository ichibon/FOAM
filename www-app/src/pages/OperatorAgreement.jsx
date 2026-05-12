import { LegalLayout, H2, H3, P, UL, LI, PricingTable } from './LegalLayout.jsx';

export function OperatorAgreement() {
  return (
    <LegalLayout title="Operator Agreement" effectiveDate="May 9, 2026">

      <P>This Operator Agreement ("Agreement") is entered into between you ("Operator") and FOAM, LLC ("FOAM"). By creating an Operator account, completing the onboarding process, or using the Platform to offer services, you confirm that you have read and agree to this Agreement. This Agreement supplements FOAM's Terms of Service, which you have also agreed to.</P>

      <H2>1. Definitions</H2>
      <UL>
        <LI><strong>"Platform"</strong> means the FOAM mobile application, web portal, and related services.</LI>
        <LI><strong>"Operator"</strong> means an individual or business that uses the Platform to offer, schedule, and fulfill auto detailing services to Customers.</LI>
        <LI><strong>"Customer"</strong> means a person who books and pays for services through the Platform.</LI>
        <LI><strong>"Booking"</strong> means a confirmed appointment between a Customer and an Operator for auto detailing services.</LI>
        <LI><strong>"Platform Fee"</strong> means the percentage of each completed Booking's service total that FOAM collects as described in Section 5.</LI>
        <LI><strong>"GMV"</strong> (Gross Merchandise Value) means the total value of services transacted through the Platform.</LI>
      </UL>

      <H2>2. Operator Status</H2>
      <H3>2.1 Independent Contractor</H3>
      <P>Operator is an independent contractor, not an employee, agent, partner, or joint venturer of FOAM. FOAM does not control the manner, means, or methods by which Operator performs services. Operator is solely responsible for determining how to perform the services offered.</P>
      <H3>2.2 No Exclusivity</H3>
      <P>This Agreement does not create an exclusive relationship. Operator may offer services through other platforms or directly to clients outside of FOAM. FOAM may contract with other operators in the same geographic area.</P>
      <H3>2.3 Operator Responsibility</H3>
      <P>Operator is solely responsible for the quality, safety, and legality of services provided, for all tax obligations arising from income earned through the Platform, for compliance with all applicable local, state, and federal laws and regulations, and for any damage to Customer property that occurs during service delivery.</P>

      <H2>3. Operator Eligibility and Verification</H2>
      <H3>3.1 Eligibility Requirements</H3>
      <P>To use the Platform as an Operator, you must:</P>
      <UL>
        <LI>Be at least 18 years of age</LI>
        <LI>Have legal authorization to work in the United States</LI>
        <LI>Operate a legitimate auto detailing business</LI>
        <LI>Complete FOAM's identity and payment verification through Stripe Connect</LI>
        <LI>Maintain current, valid insurance coverage as described in Section 3.2</LI>
      </UL>
      <H3>3.2 Insurance Requirements</H3>
      <P>Operators are strongly encouraged to maintain general liability insurance coverage appropriate for their operation type. Fixed-location operators should carry commercial property coverage in addition to general liability. FOAM may, at its discretion, require proof of insurance as a condition of continued Platform access. FOAM does not provide insurance to Operators or their crew.</P>
      <H3>3.3 Verification Badge</H3>
      <P>Operators who complete identity verification through Stripe Connect receive a verified badge on their FOAM profile. Verification does not constitute FOAM's endorsement of the Operator's skills, services, or business practices.</P>
      <H3>3.4 Operation Types</H3>
      <P>Operators register under one of three operation types, which determines the booking flow and features available:</P>
      <UL>
        <LI><strong>Mobile:</strong> serves customers at the customer's location within a defined service radius</LI>
        <LI><strong>Fixed Location:</strong> operates from a physical shop or car wash; customers bring their vehicle to the location</LI>
        <LI><strong>Hybrid:</strong> operates both mobile and fixed-location services</LI>
      </UL>
      <P>Operators must accurately represent their operation type. Misrepresentation may result in account suspension.</P>

      <H2>4. Subscription Plans</H2>
      <H3>4.1 Plan Tiers</H3>
      <P>Operator access to the Platform requires an active subscription. FOAM offers three tiers:</P>
      <PricingTable />
      <H3>4.2 Founding Operator Rate Lock</H3>
      <P>Operators who join during FOAM's founding period (as designated by FOAM at time of onboarding) are eligible for a 12-month rate lock at their initial subscription price. After 12 months, Founding Operators retain their existing rate. Future price increases apply only to new subscribers after the founding period ends.</P>
      <H3>4.3 Annual Subscriptions</H3>
      <P>Annual subscriptions are billed upfront and provide approximately two months of free service relative to monthly billing. Annual subscriptions are non-refundable after 30 days from the billing date.</P>
      <H3>4.4 Plan Changes</H3>
      <P>Operators may upgrade their plan at any time. Upgrades take effect immediately, and the billing cycle adjusts accordingly. Downgrades take effect at the start of the next billing cycle.</P>
      <H3>4.5 Failed Payments</H3>
      <P>If subscription payment fails, FOAM will attempt to collect payment for up to 7 days. After 7 days of failed payment, the Operator's account will be suspended until payment is resolved. Active bookings will remain visible to Customers, but Operator will be unable to accept new bookings or access platform tools until the account is reinstated.</P>

      <H2>5. Platform Fee and Payment</H2>
      <H3>5.1 Platform Fee</H3>
      <P>FOAM charges a per-booking platform fee on every completed Booking. The fee is calculated as a percentage of the total service amount (excluding tips). FOAM absorbs Stripe's payment processing costs; Operators are not separately charged for payment processing.</P>
      <H3>5.2 Fee Deduction</H3>
      <P>Platform fees are automatically deducted before payouts are transferred to the Operator's connected bank account. Operators receive the net amount after the platform fee. There are no separate invoices for platform fees — the deduction occurs at the time of each completed booking.</P>
      <H3>5.3 Tip Handling</H3>
      <P>Tips are processed as separate transactions and are not subject to the platform fee. Tips are distributed to the Operator per FOAM's tip distribution model, which Operators may configure for multi-tech crew operations.</P>
      <H3>5.4 Cancellation Fee Revenue</H3>
      <P>When a Customer cancellation fee is collected, FOAM takes its standard platform fee percentage. The Operator receives the remainder. Cancellation fees are not collected when the Operator initiates a cancellation.</P>
      <H3>5.5 Payout Schedule</H3>
      <P>Payouts to connected bank accounts via ACH are processed on a rolling 2-business-day basis. Operators may elect Instant Payout for a 1.5% fee on the payout amount, processed same-day. Payout timing is subject to Stripe's processing schedule and bank processing times.</P>
      <H3>5.6 Stripe Connect</H3>
      <P>Operators must connect a bank account through Stripe Connect Express during onboarding. Stripe handles identity verification, bank account verification, and tax reporting (1099-K). Operators agree to Stripe's Terms of Service in addition to this Agreement. FOAM is not responsible for delays or issues caused by Stripe's systems.</P>
      <H3>5.7 Disputes and Chargebacks</H3>
      <P>In the event of a Customer chargeback, FOAM will freeze the disputed amount from the Operator's pending payout and assemble a dispute evidence package from booking records and before/after photos. FOAM will submit this evidence to Stripe on the Operator's behalf. If the dispute is resolved in the Operator's favor, funds are released. If resolved in the Customer's favor, the chargeback amount is absorbed from the Operator's pending balance. Operators with frequent chargebacks may be subject to account review.</P>

      <H2>6. Bookings and Scheduling</H2>
      <H3>6.1 Accepting Bookings</H3>
      <P>Customers may request bookings based on the Operator's published availability, service offerings, and pricing. Bookings are confirmed when the Platform sends a confirmation notification to both parties.</P>
      <H3>6.2 Calendar Accuracy</H3>
      <P>Operators are responsible for keeping their availability calendar accurate. Booking a Customer and then cancelling due to calendar error is treated as an Operator cancellation and may result in a cancellation strike.</P>
      <H3>6.3 Operator Cancellations</H3>
      <P>Operators may cancel a confirmed booking through the Platform. Operator cancellations are always free for the Customer. FOAM will issue a platform credit to the Customer's account. Each Operator cancellation logs a strike on the Operator's account. The following strike thresholds apply:</P>
      <UL>
        <LI>3 strikes: written warning from FOAM</LI>
        <LI>5 strikes: temporary suspension (14 days)</LI>
        <LI>7 strikes: account review and possible permanent suspension</LI>
      </UL>
      <P>FOAM may, at its discretion, waive strikes in cases of genuine emergency with documentation.</P>
      <H3>6.4 No-Shows</H3>
      <P>If a Customer does not appear for a scheduled appointment, the Operator may mark the booking as a no-show through the Platform after a 10-minute grace period from the scheduled start time. No-show fees (50% of service total) are collected from the Customer. FOAM takes its standard platform fee on no-show fees. Operators may not abuse the no-show process; misuse may result in account review.</P>
      <H3>6.5 Before and After Photos</H3>
      <P>Operators are required to upload before and after photos for every completed job through the Platform. This requirement is not optional. Photos serve as dispute evidence and protect Operators in the event of a chargeback or damage claim. Jobs marked complete without before and after photos may not qualify for dispute protection.</P>
      <H3>6.6 Reschedules</H3>
      <P>Customers may reschedule a booking up to 2 times with no fee. Additional reschedule requests may be declined by the Operator. Operators may reschedule a booking with Customer consent, subject to availability. Operator-initiated reschedules without Customer consent are treated as Operator cancellations.</P>

      <H2>7. Service Listings and Pricing</H2>
      <H3>7.1 Accurate Representation</H3>
      <P>Operators are responsible for ensuring that their service listings, descriptions, and pricing are accurate, current, and not misleading. FOAM reserves the right to remove listings that violate platform standards or that are flagged by multiple Customers as inaccurate.</P>
      <H3>7.2 Pricing Authority</H3>
      <P>Operators set their own service prices. FOAM does not dictate pricing. Operators may not charge Customers more than the price displayed on the Platform at the time of booking.</P>
      <H3>7.3 Field Modifications</H3>
      <P>Operators may request additional services during a job (with Customer approval). Field-added services create an additional authorization on the Customer's payment method. Operators may not add services to a job without explicit Customer consent.</P>

      <H2>8. Operator Conduct Standards</H2>
      <P>Operators represent the FOAM platform to Customers. All Operators agree to:</P>
      <UL>
        <LI>Arrive at the scheduled time or notify the Customer promptly of any delay</LI>
        <LI>Perform services as described in the booking</LI>
        <LI>Treat Customers, their vehicles, and their property with respect and care</LI>
        <LI>Maintain a professional appearance and conduct</LI>
        <LI>Not solicit Customers to book future services outside of the Platform (off-platform circumvention is a material breach of this Agreement)</LI>
        <LI>Not discriminate against Customers on the basis of race, color, religion, sex, national origin, disability, sexual orientation, or any other protected characteristic</LI>
        <LI>Not engage in deceptive practices, including creating fake reviews or manipulating ratings</LI>
        <LI>Comply with all local licensing, permitting, and zoning requirements applicable to their operation</LI>
      </UL>

      <H2>9. Reviews and Ratings</H2>
      <P>Customers may leave a rating and review after each completed booking. Operators may not solicit, incentivize, or coerce positive reviews. Operators may report reviews that they believe violate FOAM's review policies. FOAM's decision on disputed reviews is final.</P>
      <P>Operators maintain an aggregate rating on their profile. Operators whose average rating falls below 3.5 over a trailing 30-day period will receive a performance warning. Sustained low ratings may result in account suspension pending review.</P>

      <H2>10. Crew Management</H2>
      <P>Operators on the Crew plan may add up to 3 crew members to their account. Additional crew may be added for $20 to $25 per technician per month, as published in the Platform at the time of addition.</P>
      <P>Operators are fully responsible for:</P>
      <UL>
        <LI>The conduct and performance of their crew members on every job</LI>
        <LI>Ensuring crew members are properly trained and qualified</LI>
        <LI>Compliance with applicable labor and employment laws with respect to crew members</LI>
        <LI>Any liability arising from crew member actions during service delivery</LI>
      </UL>
      <P>Crew members are not employees or contractors of FOAM. FOAM provides crew management tools as a feature of the Operator subscription; FOAM has no employment relationship with crew.</P>

      <H2>11. Prohibited Operator Conduct</H2>
      <P>The following constitute material breaches of this Agreement and may result in immediate account termination:</P>
      <UL>
        <LI><strong>Off-platform solicitation:</strong> directly soliciting Customers (discovered through FOAM) to book services outside the Platform, including offering discounts for direct payment</LI>
        <LI><strong>Fraudulent activity:</strong> submitting false job photos, completing bookings for services not rendered, or manipulating the Platform's payment system</LI>
        <LI><strong>Identity misrepresentation:</strong> using another person's credentials, misrepresenting business ownership, or misrepresenting qualifications</LI>
        <LI>Harassment or abuse of Customers, FOAM staff, or other Operators</LI>
        <LI>Knowingly violating applicable law in the course of service delivery</LI>
        <LI>Repeated conduct that generates Customer complaints or chargebacks</LI>
      </UL>

      <H2>12. Account Suspension and Termination</H2>
      <H3>12.1 FOAM's Rights</H3>
      <P>FOAM may suspend or terminate an Operator account at any time for:</P>
      <UL>
        <LI>Material breach of this Agreement or the Terms of Service</LI>
        <LI>Sustained low customer ratings</LI>
        <LI>Excessive cancellations, no-show disputes, or chargebacks</LI>
        <LI>Off-platform solicitation</LI>
        <LI>Fraudulent activity</LI>
        <LI>Any conduct that FOAM determines poses a risk to Customers, the Platform, or FOAM's reputation</LI>
      </UL>
      <H3>12.2 Notice</H3>
      <P>Where feasible, FOAM will provide written notice and a brief cure period before suspension or termination for non-emergency violations. For serious violations (fraud, harassment, safety incidents), FOAM may act immediately without notice.</P>
      <H3>12.3 Effect of Termination</H3>
      <P>Upon termination, the Operator's access to the Platform is revoked. Pending payouts for completed, confirmed bookings will be processed in accordance with FOAM's standard payout schedule. Bookings confirmed prior to termination will be cancelled and Customers notified. FOAM is not responsible for lost revenue resulting from termination for cause.</P>
      <H3>12.4 Operator Termination</H3>
      <P>Operators may close their account at any time by contacting support@foamauto.com. Account closure does not result in a refund of any subscription fees paid for the current billing cycle.</P>

      <H2>13. Confidentiality</H2>
      <P>Through use of the Platform, Operators may access non-public information about Customers (contact information, vehicle details, service history) and about the Platform (features, pricing structures, analytics). Operators agree to:</P>
      <UL>
        <LI>Use Customer information only for the purpose of fulfilling bookings</LI>
        <LI>Not disclose Customer information to third parties without Customer consent</LI>
        <LI>Not use Platform data for competitive intelligence or to build competing products</LI>
        <LI>Not use Customer contact information obtained through the Platform to solicit services outside of FOAM</LI>
      </UL>

      <H2>14. Intellectual Property</H2>
      <P>Operators retain ownership of their business name, portfolio photos, and original service offerings. By uploading content to the Platform (including portfolio photos, before/after job photos, and profile information), Operators grant FOAM a non-exclusive, worldwide, royalty-free license to use, store, display, and reproduce that content in connection with operating and marketing the Platform.</P>
      <P>FOAM retains all rights to the Platform, its code, design, brand, and data. Operators may not use FOAM's brand elements without prior written consent, except as expressly permitted by the Platform (e.g., FOAM-provided badges for marketing use).</P>

      <H2>15. Indemnification</H2>
      <P>Operator agrees to defend, indemnify, and hold harmless FOAM and its officers, directors, employees, and agents from any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:</P>
      <UL>
        <LI>Operator's provision of services to Customers</LI>
        <LI>Operator's violation of this Agreement or the Terms of Service</LI>
        <LI>Operator's violation of any applicable law, including labor laws with respect to crew</LI>
        <LI>Any property damage or personal injury caused by Operator or Operator's crew during service delivery</LI>
        <LI>Operator's content on the Platform</LI>
      </UL>

      <H2>16. Limitation of Liability</H2>
      <P>FOAM's total liability to an Operator for any claim arising from this Agreement shall not exceed the subscription fees paid by the Operator to FOAM in the three months preceding the claim. FOAM is not liable for lost revenue, lost Customers, or consequential damages arising from Platform downtime, account suspension, or changes to Platform features.</P>

      <H2>17. Modifications to This Agreement</H2>
      <P>FOAM may update this Agreement at any time. We will notify Operators of material changes via email at least 14 days before the changes take effect. Continued use of the Platform after the effective date constitutes acceptance of the updated Agreement. If an Operator does not accept updated terms, the Operator should close their account before the effective date.</P>

      <H2>18. Governing Law and Dispute Resolution</H2>
      <P>This Agreement is governed by the laws of the State of Georgia. Any dispute arising from this Agreement that cannot be resolved through good-faith negotiation will be submitted to binding arbitration in Atlanta, Georgia, administered by the American Arbitration Association under its Commercial Arbitration Rules. Each party bears its own fees and costs in arbitration, unless the arbitrator determines otherwise. The arbitrator's decision is final and binding.</P>

      <H2>19. Entire Agreement</H2>
      <P>This Operator Agreement, together with FOAM's Terms of Service and Privacy Policy, constitutes the entire agreement between FOAM and the Operator. In the event of a conflict between this Agreement and the Terms of Service, this Agreement controls with respect to Operator-specific obligations.</P>

      <H2>20. Contact</H2>
      <P>For questions about this Agreement, or to report a concern, contact:</P>
      <P>FOAM, LLC · Atlanta, Georgia<br />
        Email: <a href="mailto:legal@foamauto.com" style={{ color: '#339DC7' }}>legal@foamauto.com</a><br />
        Support: <a href="mailto:support@foamauto.com" style={{ color: '#339DC7' }}>support@foamauto.com</a>
      </P>

    </LegalLayout>
  );
}
