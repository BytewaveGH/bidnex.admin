import { FulfillmentList } from "./_components/fulfillment-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl tracking-tight">Fulfillment & Settlement</h2>
        <p className="text-muted-foreground text-sm">
          Manage the post-auction process from buyer payment through delivery and vendor payout.
        </p>
      </div>
      <FulfillmentList />
    </div>
  );
}
