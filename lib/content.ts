export type ContentSection = { heading: string; body?: string; points?: string[] };
export type ContentPageData = { eyebrow: string; title: string; intro: string; updated?: string; sections: ContentSection[] };

export const CONTENT_PAGES = {
  "how-it-works": {
    eyebrow: "How it works",
    title: "Good things deserve a second home",
    intro: "Gratis Castle connects people who have something to give with people who need it. Every item is free, and givers and receivers never meet — Gratis Castle handles every handover.",
    sections: [
      { heading: "1. Share", body: "List an item you no longer need. Add a few honest photos, describe its condition, pick a category and your general area. You never share your home address." },
      { heading: "2. Discover", body: "Browse free items by category, condition and location. Save the ones you like and come back to them later." },
      { heading: "3. Request", body: "Found something useful? Send a short, friendly request: introduce yourself, then choose a Gratis Castle pickup hub in your state or waybill delivery. The giver is notified straight away." },
      { heading: "4. Rehome", body: "Givers choose who receives their item. Once a request is accepted the item is reserved and the Gratis Castle team arranges the handover: the giver drops it at a pickup hub (or it goes by waybill) and the receiver collects it from their hub. Givers and receivers never meet." },
      {
        heading: "Pickup hubs and waybill",
        points: [
          "Pickup hubs are run by Gratis Castle and set by our team — members can't choose their own pickup spots. We're in Lagos, Ogun, Oyo and Abuja, with more states coming.",
          "No hub in your state? Choose waybill delivery. Any transport cost is shown in the app and confirmed by you before it's sent.",
          "For everyone's safety, givers and receivers never meet in person.",
          "The item itself is always free. A waybill cost is never a price for the item.",
        ],
      },
    ],
  },
  about: {
    eyebrow: "About Gratis Castle",
    title: "Give freely. Receive gratefully. Build community.",
    intro: "Gratis Castle is a free marketplace where neighbours pass on useful things they no longer need. “Gratis” means free — and everything here is.",
    sections: [
      { heading: "Why we built it", body: "Homes are full of good things that could change someone's day — a desk for a student, a stroller for a new parent, books for a curious child. Gratis Castle makes it simple to pass them on, without money changing hands." },
      { heading: "What we believe", points: ["Generosity should be easy and dignified for everyone involved.", "Reusing is better than throwing away.", "Strong communities are built one small act of kindness at a time."] },
      { heading: "Always free", body: "There is no checkout and no selling on Gratis Castle. Items are given, never sold." },
    ],
  },
  "community-guidelines": {
    eyebrow: "Community guidelines",
    title: "Keeping Gratis Castle kind, safe and free",
    intro: "These guidelines apply to every listing, request and conversation. Breaking them can lead to listings being removed or accounts being suspended.",
    sections: [
      { heading: "Everything is free", points: ["Never ask for money for an item, or attach a price to a listing.", "Waybill costs, if any, are disclosed in the app and kept separate from the item."] },
      { heading: "Be honest", points: ["Describe items accurately, including any wear, faults or missing parts.", "Only use photos of the actual item."] },
      { heading: "Be respectful", points: ["No harassment, discrimination or hateful language.", "Givers decide who receives an item — please accept their decision graciously.", "Never try to arrange a private meetup — all handovers go through Gratis Castle hubs or waybill."] },
      { heading: "Not allowed on Gratis Castle", points: ["Selling or reselling items.", "Weapons, drugs, alcohol, tobacco, prescription medicines, recalled products or anything illegal or dangerous.", "Scams, fraudulent behaviour or attempts to collect personal or payment details."] },
      { heading: "Reporting", body: "If something doesn't feel right, report the listing, member or conversation. Our moderators review every report." },
    ],
  },
  safety: {
    eyebrow: "Safety guidelines",
    title: "Stay safe when giving and receiving",
    intro: "Gratis Castle is designed so you never have to meet a stranger: every handover goes through a Gratis Castle pickup hub or waybill.",
    sections: [
      { heading: "Protect your privacy", points: ["Only share a general area in listings — never your home address.", "Your phone number and delivery address are only seen by the Gratis Castle team, never by the other member.", "Keep all conversations on Gratis Castle."] },
      { heading: "No meetups", points: ["Givers and receivers never meet in person. Gratis Castle staff handle drop-off and collection at our pickup hubs.", "Pickup hubs are set by Gratis Castle — if anyone suggests meeting somewhere else, decline and report it.", "Bring a valid ID when collecting from a hub."] },
      { heading: "Watch out for scams", points: ["Nobody should ask you to pay for an item on Gratis Castle.", "Never share bank details, card numbers or one-time codes.", "Be wary of anyone pressuring you to move off the platform quickly."] },
      { heading: "Delivery", body: "Waybill is arranged by the Gratis Castle team. If it has a transport cost, we show it in the app and you confirm it before anything is sent. The item itself remains free." },
      { heading: "Blocking and reporting", body: "You can block a member from their profile or a conversation. Blocked members can't message you or request your items. Report anything that breaks our guidelines." },
    ],
  },
  faq: {
    eyebrow: "FAQs",
    title: "Frequently asked questions",
    intro: "Quick answers to the questions members ask most.",
    sections: [
      { heading: "Is everything really free?", body: "Yes. Items on Gratis Castle are always free. If waybill delivery has a transport cost, it's shown separately and is never a price for the item." },
      { heading: "Do I need an account?", body: "You can browse without one. To give or request items you'll need a free account with a verified email address." },
      { heading: "Who decides who gets an item?", body: "The giver. They read each request and choose who receives the item. Only one person can receive each item." },
      { heading: "Will my address be public?", body: "No. Listings only show a general area, and your phone and delivery address are only visible to the Gratis Castle team." },
      { heading: "Do I meet the giver or receiver?", body: "No — never. For safety, givers drop items at a Gratis Castle pickup hub (or we send them by waybill) and receivers collect from their chosen hub." },
      { heading: "Where are the pickup hubs?", body: "Gratis Castle runs pickup hubs in Lagos, Ogun, Oyo and Abuja, with more states coming. See the Pickup hubs page for addresses and opening hours." },
      { heading: "What does “Demo” mean on a listing?", body: "Demo listings are samples that show how Gratis Castle works. They aren't real community items and are never counted in community statistics." },
      { heading: "How do I report a problem?", body: "Use the report option on a listing, profile or conversation, or contact us. Moderators review every report." },
    ],
  },
  privacy: {
    eyebrow: "Privacy policy",
    title: "How we handle your information",
    intro: "We collect only what we need to run a safe community marketplace, and we never sell your personal data.",
    sections: [
      { heading: "What we collect", points: ["Account details: name, email, optional phone number, profile photo, bio and general location.", "Listings, requests and messages you create.", "Basic technical information needed to keep the service secure."] },
      { heading: "How we use it", points: ["To run your account and show your listings and profile.", "To send the notifications you've chosen to receive.", "To keep the community safe, including reviewing reports."] },
      { heading: "What's public", body: "Your name, profile photo, bio, general location and listings are public. Your email, phone number and private conversations are not." },
      { heading: "Your choices", body: "You can update your profile and notification preferences at any time, and delete your account from Profile settings." },
    ],
  },
  terms: {
    eyebrow: "Terms of service",
    title: "Terms of service",
    intro: "By using Gratis Castle you agree to these terms and to our community guidelines.",
    sections: [
      { heading: "Free items only", body: "Gratis Castle is for giving items away for free. Selling, or asking for payment for an item, is not permitted. Any waybill cost must be disclosed and agreed separately." },
      { heading: "Your responsibilities", points: ["Describe items honestly and only list items you have the right to give away.", "Do not list prohibited or dangerous items.", "Use Gratis Castle pickup hubs or waybill for every handover — private meetups are not permitted."] },
      { heading: "Our role", body: "Gratis Castle connects members and coordinates handovers through its pickup hubs and waybill partners. We may remove content or suspend accounts that break these terms or our community guidelines." },
      { heading: "Changes", body: "We may update these terms. We'll let members know about significant changes." },
    ],
  },
} satisfies Record<string, ContentPageData>;

export type ContentSlug = keyof typeof CONTENT_PAGES;
