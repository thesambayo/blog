export const SITE = {
  website: "https://samueladebayo.dev/", // replace this with your deployed domain
  author: "Samuel Adebayo",
  profile: "https://samueladebayo.dev/",
  desc: "A minimal, responsive and SEO-friendly Astro blog theme.",
  title: "Samuel Adebayo",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 5,
  postPerPage: 5,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Suggest Changes",
    url: "https://github.com/thesambayo/blog/edit/main/",
  },
  dynamicOgImage: true,
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Africa/Lagos", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
