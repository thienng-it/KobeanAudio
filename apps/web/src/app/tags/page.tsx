"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TagsManagerPage } from "@/components/tags/TagsManagerPage";
import { useTagStore } from "@/stores/tagStore";

export default function TagsRoute() {
  const router = useRouter();
  const { loadSavedCustomTags } = useTagStore();

  useEffect(() => {
    loadSavedCustomTags();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-base)]">
      <TagsManagerPage onNavigateToStudio={() => router.push("/")} />
    </div>
  );
}
