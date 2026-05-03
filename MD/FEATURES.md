# Features

## MVP Features (V1)

---

### Customer Side
| Feature | Description |
|---------|-------------|
| Unified Discovery | Map + list showing both mobile detailers and fixed locations near the customer |
| Service Type Filter | Filter by "Come to me" (mobile), "I'll go there" (fixed), or show both |
| Operator Profiles | View services, pricing, ratings, reviews, portfolio — works for both mobile and fixed |
| Vehicle Profile | Save vehicle info (make, model, year, color) for faster booking |
| Mobile Booking Flow | Enter location → pick detailer → select service → pick time → pay |
| Fixed Location Booking Flow | Pick location → select service → pick drop-off time → pay or walk in |
| Real-Time Availability | See open slots for mobile time blocks and fixed location bay slots |
| Secure Payment | Pay through app via Stripe, tip at checkout |
| Appointment Confirmation | Booking confirmation with job details and operator contact |
| Reminders | Push and SMS reminders before appointment |
| Ratings & Reviews | Rate and review operator after each completed job |
| Booking History | View all past and upcoming appointments |

---

### Operator Side (All Types)
| Feature | Description |
|---------|-------------|
| Profile Setup | Name, bio, operation type (mobile/fixed/hybrid), profile photo, portfolio photos |
| Operation Type Config | Mobile: service radius + home base. Fixed: address + hours + bay count. Hybrid: both |
| Service Menu Builder | Create packages, set pricing, define durations, add add-ons |
| Dynamic Pricing by Vehicle Size | Set different prices for sedan, SUV, truck, van |
| Calendar & Availability | Unified calendar showing all jobs across mobile and fixed channels |
| Booking Management | Accept, decline, reschedule incoming bookings |
| Customer Profiles | Basic vehicle info, contact details, service history |
| Payment Collection | Invoice generation, payment processing via Stripe |
| Tipping | Built into customer checkout flow |
| Payout Tracking | See earned, pending, and paid out amounts |
| Appointment Reminders | Automated SMS/push notifications to customers |
| Review Requests | Automated post-job prompt for customer rating and review |
| Before/After Photos | Upload and attach photos to specific completed jobs |

### Mobile-Specific Operator Features
| Feature | Description |
|---------|-------------|
| Travel Time Buffers | Auto-add buffer time between appointments based on distance |
| Service Radius Management | Set and adjust how far they're willing to travel |

### Fixed Location-Specific Operator Features
| Feature | Description |
|---------|-------------|
| Bay/Station Management | Define number of simultaneous jobs the location can handle |
| Operating Hours | Set location open/close times and days |
| Walk-in Capacity | Toggle walk-in acceptance on/off in real time |
| Location Verification | Physical address verified for customer trust |
| Drop-off/Pick-up Notifications | Auto-notify customer when car is ready |

### Hybrid Operator Features
| Feature | Description |
|---------|-------------|
| Unified Calendar | Single view of mobile jobs and fixed location slots with no conflicts |
| Channel Revenue Split | See earnings broken down by mobile vs. fixed |
| Dual Discovery Listing | Profile appears in both "Come to me" and "I'll go there" search results |

---

### Team Manager Side
| Feature | Description |
|---------|-------------|
| All Operator Features | Full operator OS included |
| Team Member Management | Add team members, set permissions, deactivate accounts |
| Job Assignment | Assign incoming bookings to specific team members |
| Team Calendar View | See all team members' schedules in one view |
| Commission & Tip Splitting | Define split rules per team member |
| Team Performance Overview | Jobs completed, ratings, revenue per member |

---

### Team Member Side
| Feature | Description |
|---------|-------------|
| Daily Job View | See assigned jobs for the day in chronological order |
| Job Details | Customer name, vehicle info, service requested, location |
| Navigation | One-tap directions to job location (mobile jobs) |
| Drop-off Check-in | Mark customer arrived at fixed location |
| Job Completion | Mark job as complete, trigger customer review request |
| Before/After Photos | Upload job documentation |
| Earnings View | See personal earnings for current pay period |

---

## V2 Features

### Customer Side
| Feature | Description |
|---------|-------------|
| Saved Payment Methods | One-tap rebooking with saved card |
| Favorite Operators | Follow preferred operators, get notified when they have openings |
| Referral Program | Refer a friend, earn credit toward next booking |
| Loyalty Points | Earn points per booking, redeem for discounts or add-ons |
| In-App Messaging | Message operator directly within the app |
| Waitlist | Join waitlist for fully booked operators |
| Package Bundles | Buy 3 details, get one at a discount |
| Rain Protection Membership | $7.99/month — exterior wash covered if rain falls within 72hrs of detail |
| Priority Booking | Members get access to appointment slots before non-members |
| Walk-in Wait Time | See estimated wait time at fixed locations before going |

### Operator Side
| Feature | Description |
|---------|-------------|
| Full CRM | Complete service history per customer and per vehicle |
| Lapsed Customer Automation | Auto-ping customers who haven't booked in 60+ days |
| Recurring Appointment Automation | Set and manage recurring bookings with reduced fees |
| Expense Tracking | Log supply and operational costs per job |
| Basic P&L View | Revenue minus expenses, broken down by channel for hybrid |
| Service Performance Reporting | Best selling services, average ticket, busiest days/times |
| Revenue Dashboard | Weekly, monthly, yearly trends — mobile vs. fixed breakdown for hybrid |
| Digital Waivers | Customer signs service agreement before work begins |
| Damage Documentation | Time-stamped photo capture for pre-existing damage |
| Promo Codes | Create and share discount codes for seasonal promotions |
| Inventory Tracking | Log supplies, track usage per job, low stock alerts |
| Business Document Storage | Insurance certificates, business license uploads |

### Team Manager V2
| Feature | Description |
|---------|-------------|
| GPS Team Tracking | See all active team members' locations in real time |
| Route Optimization | Sequence daily mobile jobs to minimize total drive time |
| Customer ETA Notifications | Push to customer when team member is en route with live ETA |
| Team Chat | In-app communication between manager and team members |

---

## Feature Flags — Build Order Priority

### Must Have at Launch (P0)
- Unified customer discovery (mobile + fixed in one feed)
- Mobile operator profile, service menu, and availability
- Fixed location operator profile, bay config, and operating hours
- Customer booking flow — both mobile and fixed location versions
- Payment processing and payouts
- Appointment reminders (push + SMS)
- Ratings and reviews
- Before/after photos
- Team manager job assignment
- Team member job view and completion

### High Value, Post-Launch (P1)
- Full CRM and service history
- Recurring appointments (mobile and fixed)
- Revenue dashboard with channel breakdown for hybrid
- Dynamic pricing by vehicle size
- Digital waivers
- Drop-off/pick-up notifications for fixed locations
- Walk-in toggle for fixed locations

### Growth Phase (P2)
- Rain Protection Membership
- Route optimization (mobile)
- GPS team tracking
- Loyalty and referral programs
- Lapsed customer automation
- Inventory tracking
- Walk-in wait time display
- Team chat
