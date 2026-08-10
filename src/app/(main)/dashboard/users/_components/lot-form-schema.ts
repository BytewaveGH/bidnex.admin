import { z } from "zod";

export const specRowSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const optionalPositivePrice = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.coerce.number().positive("Must be greater than 0").optional(),
);

export const lotFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.coerce.number().int().positive("Please select a category"),
  condition: z.enum(["new", "like_new", "good_condition", "as_is"], { error: "Condition is required" }),
  reservePrice: optionalPositivePrice,
  buyNowPrice: optionalPositivePrice,
  pickupAvailable: z.boolean(),
  shippingAvailable: z.boolean(),
  specifications: z.array(specRowSchema).default([]),
});

export type LotFormValues = z.infer<typeof lotFormSchema>;

export type LotCondition = LotFormValues["condition"];
