"use client";

import { useEffect } from "react";

function getSecondFridayOfJanuary(year) {
  const firstDay = new Date(year, 0, 1).getDay();
  const daysUntilFriday = (5 - firstDay + 7) % 7;
  return new Date(year, 0, 1 + daysUntilFriday + 7);
}

function getSeasonalIcon(now) {
  const month = now.getMonth();
  const day = now.getDate();

  if (month === 9 && day >= 25) return "halloween";
  if (month === 11 && day >= 15 && day <= 26) return "christmas";
  if ((month === 11 && day >= 29) || (month === 0 && day <= 2)) {
    return "new-year";
  }

  const vodunFriday = getSecondFridayOfJanuary(now.getFullYear());
  const vodunStart = new Date(vodunFriday);
  const vodunEnd = new Date(vodunFriday);
  vodunStart.setDate(vodunStart.getDate() - 1);
  vodunEnd.setDate(vodunEnd.getDate() + 1);
  const dateOnly = new Date(now.getFullYear(), month, day);
  if (dateOnly >= vodunStart && dateOnly <= vodunEnd) return "vodun";

  return null;
}

export default function SeasonalFavicon() {
  useEffect(() => {
    const updateFavicon = () => {
      const holiday = getSeasonalIcon(new Date());
      let link = document.querySelector("link[data-seasonal-favicon]");

      if (!holiday) {
        link?.remove();
        return;
      }

      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/svg+xml";
        link.dataset.seasonalFavicon = "true";
        document.head.appendChild(link);
      }

      link.href = `/icons/favicon-${holiday}.svg?v=${new Date().getFullYear()}`;
    };

    updateFavicon();
    const interval = window.setInterval(updateFavicon, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
