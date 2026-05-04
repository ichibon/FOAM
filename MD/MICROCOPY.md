# Microcopy

## Voice & Tone
**Upbeat. Friendly. Energetic. With swagger.**

This app talks like a confident friend who knows the detailing game inside and out — van side and bay side. Not corporate. Not stiff. Not trying too hard to be cool — just genuinely in it with you. Whether you're a customer who just wants their car looking right, a mobile detailer building a real operation, or a shop owner trying to fill their bays, the app speaks your language.

Think: the energy of a great barber who's also a great businessman. Knows their craft. Respects your time. Makes you feel taken care of.

---

## Voice Attributes

| Attribute | What It Sounds Like | What It Never Sounds Like |
|-----------|--------------------|-----------------------------|
| Upbeat | "Your car's about to look incredible." | "Thank you for your submission." |
| Friendly | "Let's get you set up." | "Please complete the required fields." |
| Energetic | "Time to get clean." | "Processing your request." |
| Swagger | "That detail is confirmed. No cap." | "Your appointment has been scheduled." |
| Clear | "Something went wrong. Try again." | "Error code 403: Unauthorized." |

---

## Onboarding Copy

### Customer Onboarding
```
Welcome screen:
Headline:     "Your car deserves better."
Subhead:      "Find the best detailers near you — mobile or shop — and book in seconds."
CTA:          "Let's Go"

Role selection:
Headline:     "What brings you here?"
Option A:     "I need my car detailed"
Option B:     "I run a detailing business"
Option C:     "I'm part of a crew"

Customer setup:
Step 1:       "Where are you located?" (location for discovery of nearby mobile ops and shops)
Step 2:       "Tell us about your ride." (vehicle profile)
Step 3:       "How do you want to pay?" (payment setup)
Completion:   "You're all set. Let's find you a detailer."
```

### Detailer Onboarding

**Mobile Operator**
```
Welcome:
Headline:     "Run your whole business from right here."
Subhead:      "Bookings. Payments. Customers. Crew. All in one place."
CTA:          "Build My Profile"

Profile setup steps:
Step 1 label: "Your Brand" — (name, bio, photo)
Step 2 label: "What You Offer" — (service menu and pricing)
Step 3 label: "Your Territory" — (service radius and availability)
Step 4 label: "Get Paid" — (Stripe payout setup)
Completion:   "You're live. Time to get some cars clean."
```

**Fixed Location / Shop Operator**
```
Welcome:
Headline:     "Run your whole shop from right here."
Subhead:      "Bookings. Bay management. Customers. Crew. All in one place."
CTA:          "Build My Profile"

Profile setup steps:
Step 1 label: "Your Shop" — (name, bio, photo)
Step 2 label: "What You Offer" — (service menu and pricing)
Step 3 label: "Your Location" — (physical address, operating hours, bay count)
Step 4 label: "Get Paid" — (Stripe payout setup)
Completion:   "You're live. Time to fill those bays."
```

**Hybrid Operator**
```
Welcome:
Headline:     "One app. Both sides of your business."
Subhead:      "Mobile jobs. Shop appointments. Payments. Crew. All in one place."
CTA:          "Build My Profile"

Profile setup steps:
Step 1 label: "Your Brand" — (name, bio, photo)
Step 2 label: "What You Offer" — (service menu and pricing)
Step 3 label: "Your Coverage" — (mobile radius + shop address and hours)
Step 4 label: "Get Paid" — (Stripe payout setup)
Completion:   "You're live on both channels. Let's get to work."
```

---

## Booking Flow Copy

### Customer Side — Mobile Booking
```
Discover screen header:    "Who's working near you?"
Search placeholder:        "Address, neighborhood, or zip"
Filter button:             "Filter"
Filter options:            "Come to me" / "Drop off nearby" / "Both"
Detailer card — rating:    "4.9 (142 reviews)"
Detailer card — distance:  "2.3 miles away"
Book button:               "Book [Detailer Name]"

Service selection header:  "What does your car need?"
Add-on prompt:             "Want to add anything else?"
Add-on label:              "Add to service"

Date/time header:          "When works for you?"
No availability message:   "Fully booked for this day. Try another date."
Slot button:               "10:00 AM"

Location header:           "Where should they come to you?"
Location options:          "Home / Work / Somewhere else"

Review screen header:      "Looking good. Here's your order."
Price breakdown label:     "Service total"
Tip label:                 "Add a tip for [Name]"
Confirm button:            "Confirm & Pay"

Confirmation screen:
Headline:     "You're on the books."
Subhead:      "[Detailer Name] will be there [Date] at [Time]."
Detail line:  "We'll remind you the day before and an hour out."
CTA:          "View Booking"
```

### Customer Side — Shop / Drop-Off Booking
```
Discover screen header:    "Who's working near you?"
(Same search and filter as mobile — customer chooses "Drop off nearby" in filter)

Shop card — rating:        "4.9 (142 reviews)"
Shop card — distance:      "1.1 miles away"
Shop card — hours:         "Open until 6pm"
Book button:               "Book [Shop Name]"

Service selection header:  "What does your car need?"
Add-on prompt:             "Want to add anything else?"

Date/time header:          "When do you want to drop off?"
No availability message:   "Fully booked for this day. Try another date."

Slot button:               "Drop off: 9:00 AM"

Location display:          "[Shop Name] · [Address]"
(No location input — customer goes to the shop)

Review screen header:      "Looking good. Here's your order."
Price breakdown label:     "Service total"
Confirm button:            "Confirm & Pay"

Confirmation screen:
Headline:     "You're on the books."
Subhead:      "Drop your car at [Shop Name] on [Date] at [Time]."
Detail line:  "We'll remind you the day before. They'll notify you when it's ready."
CTA:          "View Booking"
```

### Detailer Side — Mobile
```
New booking notification:  "New booking request from [Customer Name]"
Accepted state:            "Booking confirmed. [Customer] is locked in."
Reminder notification:     "Heads up — you've got [Customer Name] at [Time] tomorrow."
Payment received:          "[Amount] just hit your account. Clean work."
Review received — 5 star:  "[Customer Name] gave you 5 stars. That's what it's about."
Review received — low:     "[Customer Name] left feedback. Worth a read."
```

### Operator Side — Shop
```
New booking notification:  "New drop-off booked. [Customer Name] — [Date] at [Time]."
Bay assigned state:        "[Customer]'s car is in Bay [N]."
Car ready notification:    "[Customer Name]'s car is done. Tap to notify them."
Customer notified:         "[Customer] is on their way."
Payment received:          "[Amount] just hit your account. Clean work."
Review received — 5 star:  "[Customer Name] gave you 5 stars. That's what it's about."
Walk-in check-in:          "Walk-in added. [Vehicle] in Bay [N]. [Service]."
```

---

## Empty States

### Customer
```
No upcoming bookings:
Headline:   "Your calendar's wide open."
Body:       "Find a mobile detailer or a shop nearby and get your car looking right."
CTA:        "Find a Detailer"

No booking history:
Headline:   "No detailing history yet."
Body:       "Your first booking is one tap away."
CTA:        "Book Now"

No detailers nearby (mobile filter):
Headline:   "Nobody mobile nearby right now."
Body:       "Try a shop in your area — or check back when your schedule opens up."
CTA:        "See Shops Near You"

No shops nearby:
Headline:   "No shops in this area yet."
Body:       "We're growing fast. Try mobile, or check back soon."
CTA:        "See Mobile Detailers"
```

### Mobile Operator
```
No bookings today:
Headline:   "Wide open today."
Body:       "Your calendar is clear. Good time to follow up with past customers."
CTA:        "View Customers"

No customers yet:
Headline:   "Your customer list starts here."
Body:       "Every booking adds to your history. It builds fast."
CTA:        "Share Your Profile"

No reviews yet:
Headline:   "No reviews yet."
Body:       "Do the work. They'll come."
```

### Shop Operator
```
No bookings today:
Headline:   "Bays are open."
Body:       "No bookings today — yet. Share your booking link and fill the dead time."
CTA:        "Share Booking Link"

No customers yet:
Headline:   "Your customer list starts here."
Body:       "Every drop-off adds to your history. It builds fast."
CTA:        "Share Your Profile"

Bay idle state:
Label:      "Empty"
Sub-label:  "Ready for the next car."
```

---

## Notifications

### Customer
```
24-hour reminder (mobile):  "Heads up — [Detailer Name] is coming tomorrow at [Time]."
1-hour reminder (mobile):   "[Detailer Name] is about an hour away. Get your car accessible."
Detailer on the way:        "[Detailer Name] is on their way. [ETA] minutes."
Booking complete:           "Looking clean. Leave [Detailer Name] a review."

24-hour reminder (shop):    "Reminder — drop your car at [Shop Name] tomorrow at [Time]."
Car ready notification:     "Your car is ready at [Shop Name]. Come grab it."
Rain Coverage triggered:    "It rained after your detail. Your free exterior wash is ready to book."
```

### Mobile Operator
```
New booking:       "New booking: [Customer Name] on [Date] at [Time]."
Same-day booking:  "Same-day booking added. [Customer Name] at [Time]. [Address]."
Cancellation:      "[Customer Name] canceled their [Date] booking."
Low rating:        "New review from [Customer Name]. Check your ratings."
Payout sent:       "Payout of [Amount] is on its way. Lands [Day]."
```

### Shop Operator
```
New booking:            "New drop-off booked. [Customer Name] — [Date] at [Time]."
Walk-in toggle:         "Walk-ins are now [On/Off] for your location."
Bay status reminder:    "Bay [N] has been in progress for [X] hours. All good?"
Payout sent:            "Payout of [Amount] is on its way. Lands [Day]."
```

---

## Error Messages

```
Payment failed:         "Payment didn't go through. Try a different card."
Booking conflict:       "That time is taken. Pick another slot."
Location out of range:  "You're outside this detailer's service area."
Profile incomplete:     "Finish your profile to go live."
Connection error:       "Something went wrong. Check your connection and try again."
Bay overbooking:        "That bay slot is taken. Pick another time."
```

---

## Rain Coverage Copy

```
Enrollment CTA:         "Protect your next detail."
Membership description: "If measurable rain falls within 72 hours of your detail, your next exterior wash is on us. No claim to file. The app just knows."
Triggered state:        "It rained after your detail. Your free exterior wash is ready."
Redemption CTA:         "Book Your Free Wash"
Expired offer:          "Your Rain Coverage wash expired. Still here if you need it next time."
```

---

*Every word in this doc was written for real operators — mobile and shop — and real customers. If a new line of copy can't be traced back to something a real detailer or a real car owner would actually say or feel, it doesn't belong here.*
