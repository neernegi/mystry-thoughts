"use client";

import AIIInsight from "./AIInsights";

const DashboardInsights = () => {
  return (
    <div className="space-y-8 mb-30">
      <div className="mb-20">
        <h2 className="text-2xl text-white font-bold mb-4">Thought Insights</h2>
        <div className="grid gap-20">
          <AIIInsight type="thought" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl text-white font-bold mb-4">
          Confession Insights
        </h2>
        <div className="grid gap-20">
          <AIIInsight type="confession" />
        </div>
      </div>
    </div>
  );
};

export default DashboardInsights;
