# Microcopy

## Voice & Tone
**Upbeat. Friendly. Energetic. With swagger.**

This app talks like a confident friend who knows the detailing game inside and out. Not corporate. Not stiff. Not trying too hard to be cool — just genuinely in it with you. Whether you're a customer who just wants their car looking right or a detailer building a real business, the app speaks your language.

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
Subhead:      "Find the best mobile detailers near you and book in seconds."
CTA:          "Let's Go"

Role selection:
Headline:     "What brings you here?"
Option A:     "I need my car detailed"
Option B:     "I run a detailing business"
Option C:     "I'm part of a crew"

Customer setup:
Step 1:       "Where do you want us to come to you?" (location)
Step 2:       "Tell us about your ride." (vehicle profile)
Step 3:       "How do you want to pay?" (payment setup)
Completion:   "You're all set. Let's find you a detailer."
```

### Detailer Onboarding
```
Welcome:
Headline:     "Run your whole business from right here."
Subhead:      "Bookings. Payments. Customers. Crew. All in one place."
CTA:          "Build My Profile"

Profile setup steps:
Step 1 label: "Your Shop, Your Brand" — (name, bio, photo)
Step 2 label: "What You Offer" — (service menu and pricing)
Step 3 label: "Your Territory" — (service area and availability)
Step 4 label: "Get Paid" — (Stripe payout setup)
Completion:   "You're live. Time to get some cars clean."
```

---

## Booking Flow Copy

### Customer Side
```
Discover screen header:    "Who's working near you?"
Search placeholder:        "Address, neighborhood, or zip"
Filter button:             "Filter"
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

### Detailer Side
```
New booking notification:  "New booking request from [Customer Name]"
Accepted state:            "Booking confirmed. [Customer] is locked in."
Reminder notification:     "Heads up — you've got [Customer Name] at [Time] tomorrow."
Payment received:          "[Amount] just hit your account. Clean work."
Review received — 5 star:  "[Customer Name] gave you 5 stars. That's what it's about."
Review received — low:     "[Customer Name] left feedback. Worth a read."
```

---

## Empty States

### Customer
```
No upcoming bookings:
Headline:   "Your calendar's wide open."
Body:       "Find a detailer and get your car looking right."
CTA:        "Find a Detailer"

No booking history:
Headline:   "No detailing history yet."
Body:       "Your first booking is one tap away."
CTA:        "Book Now"

No detailers found in area:
Headline:   "Nobody's in your area yet."
Body:       "We're growing fast. Check back soon or expand your search."
CTA:        "Expand Search"
```

### Detailer
```
No bookings today:
Headline:   "Wide open today."
Body:       "Share your booking link and put someone on the calendar."
CTA:        "Share My Link"

No customers yet:
Headline:   "Your first customer is out there."
Body:       "Let's go find them."
CTA:        "Share Profile"

No crew members:
Headline:   "Flying solo for now."
Body:       "Ready to scale? Add your first tech."
CTA:        "Add Crew Member"

No reviews yet:
Headline:   "No reviews yet."
Body:       "Do the work, the reviews will come."
```

---

## Error States

```
Generic error:
"Something went sideways. Give it another tap."

Payment failed:
"Your payment didn't go through. Check your card and try again."

Booking conflict:
"That slot just got taken. Pick another time."

Location not found:
"We couldn't find that address. Double-check it and try again."

No internet:
"Looks like you're offline. Check your connection and come back."

Session expired:
"You've been gone a while. Log back in to pick up where you left off."
```

---

## Notifications

### Customer Notifications
```
Booking confirmed:    "You're booked with [Name] on [Date] at [Time]. 🚗✨"
Day before reminder:  "Tomorrow's the day. [Name] will be at [Location] at [Time]."
Hour before:          "[Name] is heading your way. They'll be there around [Time]."
En route (V2):        "[Name] is [X] minutes away."
Job complete:         "Your car is fresh. How'd [Name] do?"
Rain protection hit:  "Rain came for your detail. Your free wash is ready to use."
```

### Detailer Notifications
```
New booking:          "New booking from [Customer]. [Service] on [Date]."
Booking cancelled:    "[Customer] cancelled their [Date] appointment."
Payment received:     "💰 [Amount] from [Customer] just landed."
New review:           "[Customer] left you a [X]-star review."
Low inventory (V2):   "Running low on [Item]. Time to restock."
Crew assigned (V2):   "[Tech Name] has been assigned to [Customer]'s job."
```

---

## Buttons & CTAs — Tone Guide
```
Primary actions:      Active, present tense — "Book Now", "Get Paid", "Start Job"
Confirmation:         Decisive — "Confirm Booking", "Yes, Cancel It", "Add to Crew"
Destructive:          Clear but not alarming — "Cancel Appointment", "Remove Tech"
Back/secondary:       Low key — "Go Back", "Not Now", "Skip for Now"
Success completion:   Energetic — "Done. Let's go.", "All set.", "You're live."
```

---

## Rain Protection Membership Copy
```
Feature name:         "Rain Coverage"
Tagline:              "We can't control the weather. But we've got you."
Description:          "If it rains within 3 days of your detail, we'll cover a free exterior wash. Simple."
Price display:        "$7.99/month"
Subscribe CTA:        "Get Covered"
Active state label:   "Rain Coverage Active ✓"
Claim triggered:      "Rain hit after your last detail. Your free wash is ready."
Claim CTA:            "Book My Free Wash"
```
