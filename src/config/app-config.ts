import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Gems Bid",
  version: packageJson.version,
  copyright: `© ${currentYear}, Gems Bid.`,
  meta: {
    title: "Gems Bid Admin",
    description: "Gems Bid — Admin panel for managing auctions, lots, vendors, and bids.",
  },
};
