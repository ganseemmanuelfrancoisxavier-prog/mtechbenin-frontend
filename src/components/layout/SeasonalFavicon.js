"use client";

import { useEffect } from "react";

function getSeasonalIcon(now) {
  const month = now.getMonth();
  const day = now.getDate();

  if ((month === 9 && day >= 25) || (month === 10 && day <= 15)) {
    return "halloween";
  }
  if (month === 11 && day >= 15 && day <= 29) return "christmas";
  if ((month === 11 && day >= 30) || (month === 0 && day <= 2)) {
    return "new-year";
  }

  if (month === 0 && day >= 4 && day <= 14) return "vodun";

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
