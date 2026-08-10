"use client";

import { Banknote, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { vendorPayoutAccounts } from "./accounts-data";

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function AccountsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">Vendor Payout Accounts</CardTitle>
        <CardDescription>The default account each vendor is paid out to.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="overflow-x-auto">
          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
            <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-row']:hover:bg-transparent">
              {vendorPayoutAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-sm">{account.vendorName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1.5 rounded-sm border font-medium",
                        account.accountType === "mobile_money"
                          ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                          : "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
                      )}
                    >
                      {account.accountType === "mobile_money" ? (
                        <Smartphone className="size-3.5" />
                      ) : (
                        <Banknote className="size-3.5" />
                      )}
                      {account.accountType === "mobile_money" ? "Mobile Money" : "Bank"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{account.provider}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-sm">{account.accountNumber}</TableCell>
                  <TableCell className="text-sm">{account.accountName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(account.addedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
