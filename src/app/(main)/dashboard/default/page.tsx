import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnalyticsPlatformPage } from "../analytics/_components/analytics-platform-page";
import { AnalyticsOperations } from "./_components/analytics-operations";
import { Overview } from "./_components/overview";

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <Overview />
        </TabsContent>

        <TabsContent value="analytics" className="flex flex-col gap-8">
          <AnalyticsPlatformPage />
          <AnalyticsOperations />
        </TabsContent>
      </Tabs>
    </div>
  );
}
