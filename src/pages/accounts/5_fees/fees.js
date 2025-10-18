import SMLayout from "../../../layouts/AccountLayout";
import { useState } from "react";

import Collection from "./collection";
import Reminder from "./remider";

export default function Fees() {
  const [activeTab, setActiveTab] = useState("collection");

  return (
    <SMLayout>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-60 bg-white rounded-xl shadow-md p-4 space-y-3">
         
          <button
            onClick={() => setActiveTab("collection")}
            className={`block w-full text-left px-4 py-5 rounded-lg ${
              activeTab === "collection"
                ? "bg-blue-100 text-black"
                : "hover:bg-blue-100 text-black"
            }`}
          >
            💰 Fees Collection
          </button>
          <button
            onClick={() => setActiveTab("reminder")}
            className={`block w-full text-left px-4 py-5 rounded-lg ${
              activeTab === "reminder"
                ? "bg-blue-100 text-black"
                : "hover:bg-blue-100 text-black"
            }`}
          >
            ⏰ Fee Reminder
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-lg p-6 overflow-y-auto">
          {activeTab === "collection" && <Collection />}
          {activeTab === "reminder" && <Reminder />}
        </div>
      </div>
    </SMLayout>
  );
}
