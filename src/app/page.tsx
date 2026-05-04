"use client";

import { useState, useEffect } from "react";
import BrowseTab from "@/components/BrowseTab";
import AISearchTab from "@/components/AISearchTab";
import TabBar, { Tab } from "@/components/TabBar";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("browse");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "ai") setActiveTab("ai");
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <main className="flex flex-col h-dvh overflow-hidden pt-safe">
      <div className="flex-1 overflow-hidden">
        <div className={activeTab === "browse" ? "h-full" : "hidden h-full"}>
          <BrowseTab />
        </div>
        <div className={activeTab === "ai" ? "h-full" : "hidden h-full"}>
          <AISearchTab />
        </div>
      </div>
      <TabBar active={activeTab} onChange={handleTabChange} />
    </main>
  );
}
