"use client";

import { useState } from "react";
import BrowseTab from "@/components/BrowseTab";
import AISearchTab from "@/components/AISearchTab";
import TabBar, { Tab } from "@/components/TabBar";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("browse");

  return (
    <main className="flex flex-col h-dvh overflow-hidden pt-safe">
      {/* Tab content — fill remaining space, each tab manages its own scroll */}
      <div className="flex-1 overflow-hidden">
        <div className={activeTab === "browse" ? "h-full" : "hidden h-full"}>
          <BrowseTab />
        </div>
        <div className={activeTab === "ai" ? "h-full" : "hidden h-full"}>
          <AISearchTab />
        </div>
      </div>

      {/* Persistent bottom tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </main>
  );
}
