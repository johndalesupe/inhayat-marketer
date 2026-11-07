export const CONTACT_CATEGORIES = [
  {
    key: "web",
    label: "Mijozlar veb-sayti",
    description: "Mahsulotlar va aloqa sahifasi",
  },
  {
    key: "miniapp",
    label: "Telegram Mini App",
    description: "Mini App mahsulot sahifalari",
  },
  {
    key: "orders",
    label: "Buyurtmalar",
    description: "Mijozning buyurtma ma'lumotlari",
  },
  {
    key: "stream",
    label: "Oqim sahifalari",
    description: "Mahsulot reklama va lead sahifalari",
  },
  {
    key: "publish",
    label: "Telegram postlari",
    description: "Mahsulot, oqim va aksiya postlari",
  },
  {
    key: "marketer",
    label: "Marketolog yordami",
    description: "Marketolog ilovasidagi aloqa tugmasi",
  },
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["key"];
export type OperatorUrls = { uz: string; ru: string };
export type OperatorContactSettings = {
  defaults: OperatorUrls;
  surfaces: (OperatorUrls & { surface: ContactCategory })[];
  revision: number;
  updatedAt: string | null;
};
export type ResolvedOperatorContact = {
  url: string | null;
  urls: OperatorUrls;
  source: string;
  sources: { uz: string; ru: string };
  revision: number;
};
