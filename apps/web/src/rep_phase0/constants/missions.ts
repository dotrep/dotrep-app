export type MissionSlug =
  | "charge-signal"
  | "link-echo"
  | "go-live"
  | "first-attest"
  | "discover-network";

export const PHASE0_MISSIONS: {
  slug: MissionSlug;
  title: string;
  description: string;
  xp: number;
  gatedBy?: MissionSlug[];
}[] = [
  {
    slug: "charge-signal",
    title: "Charge Your Signal ⚡",
    description: "Verify your wallet and activate your .rep identity.",
    xp: 50,
  },
  {
    slug: "link-echo",
    title: "Link Your Echo 🔁",
    description: "Connect one social (X, Lens, or Farcaster) to prove you're real.",
    xp: 40,
    gatedBy: ["charge-signal"],
  },
  {
    slug: "go-live",
    title: "Go Live 🟢",
    description: "Log in on 3 different days within 7 days to keep Signal active.",
    xp: 60,
    gatedBy: ["charge-signal"],
  },
  {
    slug: "first-attest",
    title: "Leave Your Mark 💬",
    description: "Post your first on-chain attestation (e.g., 'gm from .rep').",
    xp: 60,
    gatedBy: ["charge-signal"],
  },
  {
    slug: "discover-network",
    title: "Discover the Network 🧭",
    description: "View 3 other active Signals to explore the constellation.",
    xp: 30,
    gatedBy: ["charge-signal"],
  },
];
