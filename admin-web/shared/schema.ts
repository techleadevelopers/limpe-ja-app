import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verification status enum
export const verificationStatusEnum = ["PENDING_DOCUMENTS_UPLOAD", "PENDING_MANUAL_REVIEW", "APPROVED", "REJECTED", "BLOCKED"] as const;

// Providers table
export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  verificationStatus: text("verification_status").$type<typeof verificationStatusEnum[number]>().default("PENDING_DOCUMENTS_UPLOAD"),
  documentPhotoFrontUrl: text("document_photo_front_url"),
  documentPhotoBackUrl: text("document_photo_back_url"),
  selfieWithDocumentUrl: text("selfie_with_document_url"),
  ocrResult: jsonb("ocr_result").$type<{
    name?: string;
    idNumber?: string;
    birthDate?: string;
    confidence?: number;
  }>(),
  livenessResult: jsonb("liveness_result").$type<{
    status?: string;
    faceMatch?: number;
    livenessScore?: number;
    qualityScore?: number;
  }>(),
  rejectionReason: text("rejection_reason"),
  fiveStarReviewCount: integer("five_star_review_count").default(0),
  monthlyBookingsCount: integer("monthly_bookings_count").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0.00"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  providerId: varchar("provider_id").references(() => providers.id).notNull(),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  status: text("status").default("PENDING"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities table for tracking admin panel actions
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "USER_REGISTRATION", "PROVIDER_APPROVED", "BOOKING_COMPLETED", etc.
  description: text("description").notNull(),
  entityId: varchar("entity_id"), // ID of the related entity (user, provider, booking, etc.)
  entityType: text("entity_type"), // "USER", "PROVIDER", "BOOKING", etc.
  status: text("status"), // "COMPLETED", "PENDING", "APPROVED", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type VerificationStatus = typeof verificationStatusEnum[number];
