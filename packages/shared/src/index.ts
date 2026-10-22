export { z } from "zod";
import { z } from "zod";
export const leadSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  name: z.string().max(200).default(""),
  company: z.string().max(200).default(""),
  status: z.enum(["new", "contacted", "qualified", "archived"]).default("new"),
  notes: z.string().max(10000).default(""),
});
export const campaignSchema = z.object({
  name: z.string().trim().min(1).max(200),
  status: z.enum(["draft", "archived"]).default("draft"),
});
export const scheduleSchema = z
  .object({
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
    days: z.array(z.number().int().min(1).max(7)).max(7),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .refine((v) => v.startTime < v.endTime);
