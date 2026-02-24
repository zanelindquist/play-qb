const isProd = process.env.NODE_ENV === "production";

export default {
  expo: {
    name: "Play QB",
    slug: "play-qb",
    version: "1.0.0",
    extra: {
      BACKEND_URL: isProd
        ? process.env.REACT_APP_BACKEND_URL_PROD || "https://morequizbowl.com"
        : process.env.REACT_APP_BACKEND_URL_DEV || "http://10.104.5.175:5000",
      ENV: isProd ? "production" : "development"
    }
  }
};