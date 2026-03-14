export const APP_NAME = "HumanHub";
export const TAGLINE = "The internet, verified.";

export const DETECTOR_THRESHOLDS = {
    TEXT_AI: 0.85,
    MEDIA_AI: 0.80,
    BOT_BEHAVIOR: 0.75
};

export const ROUTES = {
    HOME: "/",
    FEED: "/feed",
    COMMUNITIES: "/communities",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/mod-dashboard",
    PROFILE: "/u/"
};

export const FADE_UP_VARIANTS = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
};
