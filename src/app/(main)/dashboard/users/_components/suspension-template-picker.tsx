"use client";

import * as React from "react";

import { LayoutTemplate } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const suspensionTemplates = [
  {
    label: "Policy Violation",
    text: "Your account has been suspended due to a violation of our platform policies. Please contact support for more information.",
  },
  {
    label: "Suspicious Activity",
    text: "Your account has been suspended due to suspicious activity. Our team will review your account and follow up if needed.",
  },
  {
    label: "Fraudulent Bids",
    text: "Your account has been suspended due to fraudulent bidding activity on the platform.",
  },
  {
    label: "Payment Issues",
    text: "Your account has been suspended due to unresolved payment issues. Please clear outstanding balances and contact support.",
  },
  {
    label: "Abuse / Harassment",
    text: "Your account has been suspended due to abusive or harassing behaviour toward other users.",
  },
  {
    label: "Multiple Accounts",
    text: "Your account has been suspended for operating multiple accounts in violation of our terms of service.",
  },
];

export function SuspensionTemplatePicker({ onSelect }: { onSelect: (text: string) => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs">
          <LayoutTemplate className="size-3.5" />
          Template
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Apply template..." />
          <CommandList>
            <CommandGroup heading="Suspension Reasons">
              {suspensionTemplates.map((template) => (
                <CommandItem
                  key={template.label}
                  value={template.label}
                  onSelect={() => {
                    onSelect(template.text);
                    setOpen(false);
                  }}
                >
                  {template.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
