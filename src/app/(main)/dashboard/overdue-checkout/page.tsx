import { OverdueCheckoutList } from "./_components/overdue-checkout-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl tracking-tight">Overdue Checkout</h2>
        <p className="text-muted-foreground text-sm">
          Lots won at auction where the buyer has not completed checkout within the allowed window.
        </p>
      </div>
      <OverdueCheckoutList />
    </div>
  );
}
