"use client";

import * as React from "react";

import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import type { ICategoryPayload } from "../_logics/services";
import type { FlatCategory } from "./data";

interface CategoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
  initialData?: FlatCategory | null;
  topLevelOptions: FlatCategory[];
  onSubmit: (payload: ICategoryPayload) => Promise<unknown>;
  isSubmitting: boolean;
}

const URL_RE = /^https?:\/\/.+/;

function submitLabel(mode: "create" | "update", submitting: boolean) {
  if (mode === "create") return submitting ? "Creating…" : "Create Category";
  return submitting ? "Saving…" : "Save Changes";
}

function isValidUrl(v: string) {
  return v === "" || URL_RE.test(v);
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  mode,
  initialData,
  topLevelOptions,
  onSubmit,
  isSubmitting,
}: CategoryFormSheetProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconUrl, setIconUrl] = React.useState("");
  const [parentId, setParentId] = React.useState<string>("none");
  const [errors, setErrors] = React.useState<{ name?: string; iconUrl?: string }>({});

  // Sync initial data when sheet opens
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setDescription(initialData?.description ?? "");
      setIconUrl(initialData?.iconUrl ?? "");
      setParentId(initialData?.parentId != null ? String(initialData.parentId) : "none");
      setErrors({});
    }
  }, [open, initialData]);

  const iconUrlValid = isValidUrl(iconUrl);
  const showPreview = iconUrl !== "" && iconUrlValid;

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!isValidUrl(iconUrl)) next.iconUrl = "Must be a valid http/https URL.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: ICategoryPayload = {
      name: name.trim(),
      parentId: parentId === "none" ? null : Number(parentId),
    };
    if (description.trim()) payload.description = description.trim();
    if (iconUrl.trim()) payload.iconUrl = iconUrl.trim();

    await onSubmit(payload);
  }

  const parentChoices = topLevelOptions.filter((o) => mode === "create" || o.id !== initialData?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 pb-4">
          <SheetTitle>{mode === "create" ? "Add Category" : "Edit Category"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Create a new top-level category or subcategory."
              : "Update the selected category's details."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="e.g. Electronics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                placeholder="Short description of what this category covers…"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Icon URL */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-icon">Icon URL</Label>
              <Input
                id="cat-icon"
                placeholder="https://example.com/icon.png"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                aria-invalid={!!errors.iconUrl}
              />
              {errors.iconUrl && <p className="text-destructive text-xs">{errors.iconUrl}</p>}
              {/* Live preview */}
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {showPreview && (
                  // biome-ignore lint/performance/noImgElement: icon preview from URL
                  <img
                    src={iconUrl}
                    alt="Icon preview"
                    className="size-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                {!showPreview && <ImageOff className="size-5 text-muted-foreground/40" />}
              </div>
            </div>

            <Separator />

            {/* Parent category */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-parent">Parent Category</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="cat-parent">
                  <SelectValue placeholder="Top-level (no parent)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Top-level (no parent)</span>
                    </SelectItem>
                    {parentChoices.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Leave empty to create a top-level category. Select a parent to create a subcategory.
              </p>
              {parentId !== "none" && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <span>Will be nested under</span>
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-xs">
                    {parentChoices.find((o) => String(o.id) === parentId)?.name}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="border-t px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? submitLabel(mode, true) : submitLabel(mode, false)}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
