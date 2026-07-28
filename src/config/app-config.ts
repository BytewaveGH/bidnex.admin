import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Bidchale",
  version: packageJson.version,
  copyright: `© ${currentYear}, Bidchale.`,
  meta: {
    title: "Bidchale Admin",
    description: "Bidchale — Admin panel for managing auctions, lots, vendors, and bids.",
  },
};
