/** Shown wherever members might be tempted to arrange a private handover (mostly outside hub states). */
export const MEETUP_WARNING =
  "Gratis Castle only supports handovers at our pickup hubs or through Gratis Castle delivery. Meeting another member in person is against our guidelines, isn't protected by Gratis Castle and is entirely at your own risk — arranging private meetups can also lead to your account being suspended. If you still choose to meet, be security conscious:";

export const MEETUP_SAFETY_TIPS = [
  "Meet only in a busy, public, well-lit place in daylight — a shopping mall, bank hall or the front of a police station. Never at a home, hotel, uncompleted building or quiet street.",
  "Don't go alone. Take a trusted friend or family member with you.",
  "Tell someone where you're going, who you're meeting and when, and share your live location with them.",
  "Never send money to another member. Every item on Gratis Castle is free — anyone asking for a \"transport\", \"logistics\", \"release\" or \"holding\" fee is likely a scammer. The only fee you ever pay is a delivery fee, and only when it's shown on your Gratis Castle order page.",
  "Never share your home address, bank details, BVN, ATM card, PINs, one-time codes or copies of your ID.",
  "Don't get into anyone's car or follow them to a second location. If the plan changes at the last minute, walk away.",
  "Keep your phone charged, carry only what you need and keep valuables out of sight.",
  "Trust your instincts — if anything feels off, leave and report the member. In an emergency, call 112.",
];

/** Reviewer-supplied safety message (homepage hero slide + Safety page). */
export const SAFETY_BANNER = {
  title: "A gift should never cost your safety.",
  body: "Items on Gratis Castle are offered for free. Be cautious if anyone asks you for a “release fee”, deposit, payment to reserve an item, or a verification code. Report suspicious requests to Gratis Castle.",
};

/** Short reassurance shown beside the item call-to-action buttons. */
export const NO_HIDDEN_FEE = "Free gift. No hidden fees.";


/** Full “Stay safe while sharing” notice — Safety page and before a member's first checkout. */
export const SAFETY_NOTICE = {
  title: "Stay safe while sharing",
  intro:
    "Gratis Castle helps people offer items they no longer need to people who can use them. We want every exchange to be safe and respectful, but we cannot guarantee the identity, intentions, condition of items, or conduct of every user.",
  lead: "Before you get an item",
  points: [
    "Never pay anyone to reserve, release or collect an item — items on Gratis Castle are free. If you choose delivery, the only payment is the delivery fee shown on your Gratis Castle order page; anyone asking for any other money is not acting for Gratis Castle.",
    "Never share your password, one-time code, banking details or identity documents with another user.",
    "Keep conversations on the platform. Be cautious of unexpected links or pressure to move the conversation elsewhere.",
    "Collect only at a Gratis Castle pickup hub or through Gratis Castle delivery — never at a private address. Inspect the item when you receive it.",
    "If an offer or request feels suspicious, stop the exchange and use Report Listing or Report User.",
  ],
  outro:
    "Users are responsible for deciding whether to proceed with an exchange. Gratis Castle may review reports and remove listings or accounts that appear to misuse the platform.",
};

/** Monthly claim limit — mirrors the backend default (setting `monthly_claim_limit`). */
export const MONTHLY_CLAIM_LIMIT = 3;

export type ContentSection = { heading: string; body?: string; points?: string[] };
export type ContentPageData = { eyebrow: string; title: string; intro: string; updated?: string; sections: ContentSection[] };

export const CONTENT_PAGES = {
  "how-it-works": {
    eyebrow: "How it works",
    title: "Good things deserve a second home",
    intro: "Gratis Castle connects people who have something to give with people who need it. Every item is free, collecting it from our pickup hub is free, and givers and receivers never meet — Gratis Castle handles every handover. Prefer delivery? You just cover the delivery cost.",
    sections: [
      { heading: "1. Give", body: "List an item you no longer need. Add honest photos, describe its condition, pick a category and your general area, and tell us whether you'll drop it at our hub or want our dispatch to pick it up. You never share your home address publicly." },
      { heading: "2. Discover", body: "Browse free items by category, condition and location. Save the ones you like and come back to them later." },
      { heading: "3. Get it free", body: "Found something useful? Check out just like any online shop — except the item costs ₦0. Collect it free from a Gratis Castle pickup hub, or have it delivered to you and pay only the delivery cost. The first person to check out gets the item; there's no waiting for approval." },
      { heading: "4. Receive", body: "Gratis Castle arranges the handover: the giver drops the item at our hub (or our dispatch collects it), then you collect it from the hub or we deliver it to you. Track each step in your dashboard and confirm when you've received it." },
      {
        heading: "Pickup hubs and delivery",
        points: [
          "Pickup hubs are run by Gratis Castle and set by our team — members can't choose their own pickup spots. Our hub is currently in Lagos, with more states coming.",
          "Collecting from a pickup hub is free. Anywhere else in Nigeria, choose delivery at checkout — you pay the delivery cost, and we confirm the exact fee on your order before dispatch.",
          "For everyone's safety, givers and receivers never meet in person.",
          `To keep things fair, each member can get up to ${MONTHLY_CLAIM_LIMIT} items per month.`,
        ],
      },
    ],
  },
  about: {
    eyebrow: "About Gratis Castle",
    title: "Give freely. Receive gratefully. Build community.",
    intro: "Gratis Castle is a free community marketplace where neighbours pass on useful things they no longer need. “Gratis” means free — and everything here is.",
    sections: [
      { heading: "Why we built it", body: "Homes are full of good things that could change someone's day — a desk for a student, a stroller for a new parent, books for a curious child. Gratis Castle makes it simple to pass them on, without money changing hands." },
      { heading: "What we believe", points: ["Generosity should be easy and dignified for everyone involved.", "Reusing is better than throwing away — even damaged items can be repaired and reused.", "Strong communities are built one small act of kindness at a time."] },
      { heading: "100% free items", body: "No prices. Items are given, never sold, and collecting them from a Gratis Castle pickup hub is free. If you'd rather have an item delivered, you pay only the delivery cost." },
    ],
  },
  "community-guidelines": {
    eyebrow: "Community guidelines",
    title: "Keeping Gratis Castle kind, safe and free",
    intro: "These guidelines apply to every listing, order and conversation. Breaking them can lead to listings being removed or accounts being suspended or banned.",
    sections: [
      { heading: "Items are free", points: ["Never ask another member for money — for an item, its release or its delivery — and never attach a price to a listing. Delivery fees are only ever quoted by Gratis Castle on the receiver's order.", "Only list an item if you are happy to give it away for free — once listed, it cannot be taken back."] },
      { heading: "Be honest", points: ["Describe items accurately, including any wear, faults or missing parts. Damaged items belong in “Damaged but Valuable”.", "Only use photos of the actual item."] },
      { heading: "Be fair", points: [`Get only what you need — each member can get up to ${MONTHLY_CLAIM_LIMIT} items per month.`, "One person, one account. Members found running multiple accounts will be banned."] },
      { heading: "Be respectful", points: ["No harassment, discrimination or hateful language.", "Never try to arrange a private meetup — all handovers go through Gratis Castle hubs or delivery."] },
      { heading: "Not allowed on Gratis Castle", points: ["Selling or reselling items.", "Weapons, drugs, alcohol, tobacco, prescription medicines, recalled products or anything illegal or dangerous.", "Scams, fraudulent behaviour or attempts to collect personal or payment details."] },
      { heading: "Reporting", body: "If something doesn't feel right, report the listing, member or conversation. Our moderators review every report." },
    ],
  },
  safety: {
    eyebrow: "Safety guidelines",
    title: SAFETY_NOTICE.title,
    intro: SAFETY_NOTICE.intro,
    sections: [
      { heading: SAFETY_NOTICE.lead, points: SAFETY_NOTICE.points },
      { heading: SAFETY_BANNER.title, body: SAFETY_BANNER.body },
      { heading: "Protect your privacy", points: ["Only share a general area in listings — never your home address.", "Your phone number and addresses are only seen by the Gratis Castle team, never by the other member.", "Keep all conversations on Gratis Castle."] },
      { heading: "No meetups", points: ["Givers and receivers never meet in person. Gratis Castle staff handle drop-off, dispatch pickup, collection and delivery.", "Pickup hubs are set by Gratis Castle — if anyone suggests meeting somewhere else, decline and report it.", "Bring a valid ID when collecting from a hub."] },
      { heading: "If someone suggests meeting in person", body: MEETUP_WARNING, points: MEETUP_SAFETY_TIPS },
      { heading: "Delivery", body: "Delivery is arranged by the Gratis Castle team and paid for by the receiver. Collecting from a hub is free; if you choose delivery, we show the exact delivery fee on your order page before dispatch. Never pay more than that amount, never pay the giver, and nobody — including a courier — should ask you to pay for the item itself." },
      { heading: "Blocking and reporting", body: "You can block a member from their profile or a conversation. Blocked members can't message you or get your items. Report anything that breaks our guidelines." },
      { heading: "Your responsibility", body: SAFETY_NOTICE.outro },
    ],
  },
  faq: {
    eyebrow: "FAQs",
    title: "Frequently asked questions",
    intro: "Quick answers to the questions members ask most.",
    sections: [
      { heading: "Is everything really free?", body: "Every item is free, and so is collecting it from a Gratis Castle pickup hub. Delivery isn't free: if you choose delivery, you pay the delivery cost. If anyone asks you for any other fee, deposit or code, don't pay — report them." },
      { heading: "How much does delivery cost?", body: "It depends on the item's size and how far it has to travel. You'll see the exact delivery fee on your order page — and we'll notify you — before the item is dispatched. Only pay the amount shown on your order. Prefer not to pay? Collect free from a pickup hub instead." },
      { heading: "Do I need an account?", body: "You can browse without one. To give or get items you'll need a free account with a verified email address. You must be 18 or older." },
      { heading: "Who gets an item?", body: "The first member to complete checkout. There's no approval step — by listing an item, the giver has already agreed to give it away for free." },
      { heading: "How many items can I get?", body: `Up to ${MONTHLY_CLAIM_LIMIT} items per calendar month, so everyone gets a fair chance.` },
      { heading: "Can I take back an item I listed?", body: "No. Only list items you're sure you want to give away. Once someone has checked out your item it can't be withdrawn." },
      { heading: "How does the giver hand the item over?", body: "When listing, givers choose to drop the item at a Gratis Castle hub or have our dispatch rider pick it up from them. Their pickup address is only seen by Gratis Castle staff." },
      { heading: "Will my address be public?", body: "No. Listings only show a general area, and your phone and addresses are only visible to the Gratis Castle team." },
      { heading: "Do I meet the giver or receiver?", body: "No — never. Gratis Castle handles every handover through our pickup hubs and delivery." },
      { heading: "Where are the pickup hubs?", body: "Our pickup hub is currently in Lagos. Collection there is free. Everywhere else in Nigeria, choose delivery at checkout (you pay the delivery cost). The Pickup hubs page always shows the latest hubs, addresses and opening hours." },
      { heading: "I'm outside Lagos. Can I meet the giver instead?", body: "We strongly advise against it. Private meetups are against our guidelines, aren't covered by Gratis Castle and are entirely at your own risk — choose Gratis Castle delivery instead (you pay only the delivery cost). If you still decide to meet, read the safety tips on our Safety page first." },
      { heading: "What does “Demo” mean on a listing?", body: "Demo listings are samples that show how Gratis Castle works. They aren't real community items and are never counted in community statistics." },
      { heading: "How do I report a problem?", body: "Use the report option on a listing, profile or conversation, or contact us. Moderators review every report." },
    ],
  },
  privacy: {
    eyebrow: "Privacy policy",
    title: "How we handle your information",
    intro: "We collect only what we need to run a safe community marketplace, and we never sell your personal data.",
    sections: [
      { heading: "What we collect", points: ["Account details: first, middle and last name, email, phone number, profile photo, bio and general location, and your confirmation that you are 18 or older.", "Listings, orders, pickup and delivery addresses, and messages you create.", "Basic technical information needed to keep the service secure and prevent duplicate accounts."] },
      { heading: "How we use it", points: ["To run your account and show your listings and profile.", "To arrange pickups and deliveries.", "To send the notifications you've chosen to receive.", "To keep the community safe, including reviewing reports and detecting multiple accounts."] },
      { heading: "What's public", body: "Your name, profile photo, bio, general location and listings are public. Your email, phone number, addresses and private conversations are not." },
      { heading: "Your choices", body: "You can update your profile and notification preferences at any time, and delete your account from Profile settings." },
    ],
  },
  terms: {
    eyebrow: "Terms of service",
    title: "Terms of service",
    intro: "By using Gratis Castle you agree to these terms and to our community guidelines.",
    sections: [
      { heading: "Eligibility", points: ["You must be 18 years or older to create an account.", "One person, one account. Where a member is found to have multiple accounts, they will be banned."] },
      { heading: "Free items only", body: "Gratis Castle is for giving items away for free. Selling an item, or asking another member for payment for an item, its release or its delivery, is not permitted. Collecting an item from a Gratis Castle pickup hub is free. Gratis Castle does not cover delivery costs: a receiver who chooses delivery pays the delivery fee that Gratis Castle quotes on their order." },
      { heading: "Giving", points: ["Items uploaded are free and cannot be taken back. Make sure you are willing to give an item away for free before uploading it.", "Describe items honestly and only list items you have the right to give away.", "Do not list prohibited or dangerous items.", "Hand items over only at a Gratis Castle hub or to Gratis Castle dispatch."] },
      { heading: "Getting items", points: [`Each member can get up to ${MONTHLY_CLAIM_LIMIT} items per calendar month.`, "The first member to complete checkout receives the item.", "Confirm in your dashboard when you have received your item."] },
      { heading: "Our role", body: "Gratis Castle connects members and coordinates handovers through its pickup hubs and delivery partners. We cannot guarantee the identity, intentions or conduct of every user or the condition of every item. We may remove content or suspend or ban accounts that break these terms or our community guidelines." },
      { heading: "Changes", body: "We may update these terms. We'll let members know about significant changes." },
    ],
  },
} satisfies Record<string, ContentPageData>;

export type ContentSlug = keyof typeof CONTENT_PAGES;
