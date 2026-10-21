"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ShopLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <motion.main
        key={pathname}
        className="flex-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
