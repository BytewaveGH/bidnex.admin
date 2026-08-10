"use client";

import { useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Info, Play, Plus, Scissors, Trash2, X } from "lucide-react";
import { Controller, type Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useCreateVendorLot } from "../_logics/useCreateVendorLot";
import { usePublicCategories } from "../_logics/usePublicCategories";
import { useUploadVendorLotImages } from "../_logics/useUploadVendorLotImages";
import { type CreateVendorLotPayload, getCreatedLotId } from "../_logics/vendor-lot-types";
import type { IAdminUser } from "./data";
import { type LotFormValues, lotFormSchema } from "./lot-form-schema";
import { captureVideoPosterFrame } from "./video-trim/capture-poster";
import { formatFileSize, MAX_VIDEO_SIZE_BYTES } from "./video-trim/constants";
import { VideoTrimDialog } from "./video-trim/video-trim-dialog";

type NewProductSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: IAdminUser | null;
  onSuccess?: () => void;
};

const MIN_IMAGES = 3;

export function NewProductSheet({ open, onOpenChange, vendor, onSuccess }: NewProductSheetProps) {
  const [images, setImages] = useState<Array<{ file: File; preview: string; posterUrl?: string }>>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<"idle" | "creating" | "uploading">("idle");
  const [trimIndex, setTrimIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createLot } = useCreateVendorLot();
  const { uploadLotImages } = useUploadVendorLotImages();
  const { categories, isLoading: isCategoriesLoading, error: categoriesError } = usePublicCategories(open);
  const isSubmitting = submitPhase !== "idle";

  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  function updatePosterForFile(file: File, posterUrl: string) {
    setImages((prev) => {
      const index = prev.findIndex((item) => item.file === file);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = { ...next[index], posterUrl };
      return next;
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...next]);
    setImagesError(null);
    e.target.value = "";

    for (const file of files) {
      if (file.type.startsWith("video/")) {
        if (file.size > MAX_VIDEO_SIZE_BYTES) {
          toast.error(`"${file.name}" is ${formatFileSize(file.size)}, over the 25MB limit. Trim it before saving.`);
        }
        void captureVideoPosterFrame(file).then((posterUrl) => {
          if (posterUrl) updatePosterForFile(file, posterUrl);
        });
      }
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleTrimConfirm(trimmedFile: File) {
    setImages((prev) => {
      if (trimIndex === null) return prev;
      URL.revokeObjectURL(prev[trimIndex].preview);
      const next = [...prev];
      next[trimIndex] = { file: trimmedFile, preview: URL.createObjectURL(trimmedFile) };
      return next;
    });
    setTrimIndex(null);
    void captureVideoPosterFrame(trimmedFile).then((posterUrl) => {
      if (posterUrl) updatePosterForFile(trimmedFile, posterUrl);
    });
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema) as Resolver<LotFormValues>,
    defaultValues: {
      pickupAvailable: false,
      shippingAvailable: false,
      specifications: [],
    },
  });

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({
    control,
    name: "specifications",
  });

  function submitButtonLabel() {
    if (submitPhase === "creating") return "Creating...";
    if (submitPhase === "uploading") return "Uploading images...";
    return "Create Product";
  }

  function resetForm() {
    reset();
    images.forEach((img) => {
      URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    setImagesError(null);
  }

  async function onSubmit(values: LotFormValues) {
    if (!vendor) return;

    if (images.length < MIN_IMAGES) {
      setImagesError(`Please upload at least ${MIN_IMAGES} images.`);
      toast.error(`Please upload at least ${MIN_IMAGES} images.`);
      return;
    }
    setImagesError(null);

    const specifications = values.specifications
      .filter((s) => s.key.trim())
      .reduce<Record<string, unknown>>((acc, { key, value }) => {
        acc[key.trim()] = value.trim();
        return acc;
      }, {});

    const payload: CreateVendorLotPayload = {
      title: values.title,
      description: values.description,
      condition: values.condition,
      ...(values.reservePrice !== undefined && { reservePrice: values.reservePrice }),
      ...(values.buyNowPrice !== undefined && { buyNowPrice: values.buyNowPrice }),
      categoryId: values.categoryId,
      pickupAvailable: values.pickupAvailable,
      shippingAvailable: values.shippingAvailable,
      ...(Object.keys(specifications).length > 0 && { specifications }),
      vendorId: vendor.id,
    };

    setSubmitPhase("creating");

    try {
      const result = await createLot(payload);
      const lotId = result ? getCreatedLotId(result) : null;

      if (!lotId) {
        throw new Error("Lot created but no ID was returned.");
      }

      if (images.length > 0) {
        setSubmitPhase("uploading");
        await uploadLotImages(
          lotId,
          images.map((img) => img.file),
        );
      }

      toast.success("Lot created successfully.");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create lot. Please try again.";
      toast.error(message);
    } finally {
      setSubmitPhase("idle");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && !isSubmitting) resetForm();
        onOpenChange(next);
      }}
    >
      <SheetContent className="flex flex-col">
        <SheetHeader className="shrink-0 px-6 py-4">
          <SheetTitle>Create Lot for {vendor?.username}</SheetTitle>
          <SheetDescription>Fill in the details below to list a new product for auction.</SheetDescription>
        </SheetHeader>

        <TooltipProvider>
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-4">
              <Field
                label="Title"
                hint="The display name of your product as it will appear in the auction listing."
                error={errors.title?.message}
              >
                <Input className="h-11" placeholder="e.g. iPhone 14 Pro — 256GB Midnight" {...register("title")} />
              </Field>

              <Field
                label="Description"
                hint="Provide detailed information about the item — condition, history, dimensions, or any relevant notes for buyers."
                error={errors.description?.message}
              >
                <Textarea placeholder="Describe the product..." rows={4} {...register("description")} />
              </Field>

              <Field
                label="Category"
                hint="Select the category that best fits your product. This helps buyers find your listing."
                error={errors.categoryId?.message ?? categoriesError ?? undefined}
              >
                <Select
                  disabled={isCategoriesLoading || categories.length === 0}
                  onValueChange={(v) => setValue("categoryId", Number(v), { shouldValidate: true })}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder={isCategoriesLoading ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Condition"
                hint="The physical state of the item. Choose the option that best describes its current condition."
                error={errors.condition?.message}
              >
                <Select
                  onValueChange={(v) =>
                    setValue("condition", v as LotFormValues["condition"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="good_condition">Good Condition</SelectItem>
                    <SelectItem value="as_is">As Is</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Minimum Price (GHS)"
                hint="The minimum price you're willing to accept. The item won't sell unless bidding reaches this amount."
                error={errors.reservePrice?.message}
              >
                <Input
                  className="h-11"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="200"
                  {...register("reservePrice")}
                />
              </Field>

              <Field
                label="Buy Now Price (GHS)"
                hint="Buyers can instantly purchase the item at this price, ending the auction immediately."
                error={errors.buyNowPrice?.message}
              >
                <Input
                  className="h-11"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="500"
                  {...register("buyNowPrice")}
                />
              </Field>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <Label>Specifications</Label>
                  <FieldTooltip hint="Key/value pairs describing product specs (e.g. Storage: 256GB)." />
                </div>
                {specFields.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {specFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Input
                          className="h-9 flex-1"
                          placeholder="Key (e.g. Storage)"
                          {...register(`specifications.${index}.key`)}
                        />
                        <Input
                          className="h-9 flex-1"
                          placeholder="Value (e.g. 256GB)"
                          {...register(`specifications.${index}.value`)}
                        />
                        <button
                          type="button"
                          onClick={() => removeSpec(index)}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => appendSpec({ key: "", value: "" })}
                >
                  <Plus className="size-4" />
                  Add Specification
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <Label>Images</Label>
                  <FieldTooltip hint="Upload at least 3 photos or videos to showcase your product." />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-input border-dashed py-8 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  <ImageIcon className="size-7" />
                  <span className="text-sm">Click to upload images or videos</span>
                  <span className="text-xs opacity-60">PNG, JPG, WEBP, MP4, etc. — minimum 3 required</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={img.preview} className="relative aspect-square overflow-hidden rounded-md border">
                        <ImagePreviewThumb img={img} />
                        {img.file.type.startsWith("video/") && (
                          <button
                            type="button"
                            onClick={() => setTrimIndex(i)}
                            className="absolute top-1 left-1 rounded-full bg-black/50 p-0.5 text-white transition-colors hover:bg-black/70"
                          >
                            <Scissors className="size-3" />
                          </button>
                        )}
                        {img.file.type.startsWith("video/") && img.file.size > MAX_VIDEO_SIZE_BYTES && (
                          <span className="absolute bottom-1 left-1 rounded bg-destructive/90 px-1 text-[10px] text-white">
                            {formatFileSize(img.file.size)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white transition-colors hover:bg-black/70"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {imagesError && <p className="text-destructive text-xs">{imagesError}</p>}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="pickupAvailable">Pickup Available</Label>
                    <FieldTooltip hint="Allow buyers to collect the item in person." />
                  </div>
                  <Controller
                    name="pickupAvailable"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="pickupAvailable"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="size-5 border-foreground/40"
                      />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="shippingAvailable">Delivery Available</Label>
                    <FieldTooltip hint="Offer delivery as a fulfilment option for buyers." />
                  </div>
                  <Controller
                    name="shippingAvailable"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="shippingAvailable"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="size-5 border-foreground/40"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="shrink-0 border-t px-6 py-4">
              <Button
                size="lg"
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button size="lg" type="submit" className="h-11" disabled={isSubmitting}>
                {submitButtonLabel()}
              </Button>
            </SheetFooter>
          </form>
        </TooltipProvider>
      </SheetContent>

      <VideoTrimDialog
        open={trimIndex !== null}
        file={trimIndex !== null ? images[trimIndex].file : null}
        onOpenChange={(next) => !next && setTrimIndex(null)}
        onConfirm={handleTrimConfirm}
      />
    </Sheet>
  );
}

function ImagePreviewThumb({ img }: { img: { file: File; preview: string; posterUrl?: string } }) {
  if (!img.file.type.startsWith("video/")) {
    // biome-ignore lint/performance/noImgElement: local blob preview of a not-yet-uploaded file
    return <img src={img.preview} alt="" className="h-full w-full object-cover" />;
  }

  if (img.posterUrl) {
    // biome-ignore lint/performance/noImgElement: locally captured video poster frame
    return <img src={img.posterUrl} alt="" className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-800">
      <Play className="size-4 text-white/40" />
    </div>
  );
}

function FieldTooltip({ hint }: { hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="size-3.5 cursor-default text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent side="right">{hint}</TooltipContent>
    </Tooltip>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        {hint && <FieldTooltip hint={hint} />}
      </div>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
