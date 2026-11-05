"use client";

import { PreviewList } from "./PreviewList";

export type ActivityItem = {
  id: string;
  at: number;
  message: string;
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <PreviewList
      items={items}
      modalTitle="All activity"
      empty={
        <p className="px-4 py-5 text-sm text-mist/40">
          Actions from this session appear here.
        </p>
      }
      getKey={(item) => item.id}
      renderItem={(item) => (
        <div className="px-4 py-3 text-sm text-mist/75">
          <p>{item.message}</p>
          <p className="mt-1 font-mono text-[10px] text-mist/35">
            {new Date(item.at).toLocaleTimeString()}
          </p>
        </div>
      )}
    />
  );
}
