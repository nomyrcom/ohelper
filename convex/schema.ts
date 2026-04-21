import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    city: v.optional(v.string()),
    points: v.number(),
    ratingSum: v.number(),
    ratingCount: v.number(),
    isAdmin: v.optional(v.boolean()),
  }).index("by_token", ["tokenIdentifier"]),

  services: defineTable({
    requesterId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    city: v.string(),
    points: v.number(),
    status: v.string(),
    providerId: v.optional(v.id("users")),
    requesterConfirmed: v.optional(v.boolean()),
    providerConfirmed: v.optional(v.boolean()),
  }).index("by_status", ["status"]),

  pointTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    relatedServiceId: v.optional(v.id("services")),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    serviceId: v.id("services"),
    senderId: v.id("users"),
    text: v.string(),
  }).index("by_service", ["serviceId"]),

  ratings: defineTable({
    serviceId: v.id("services"),
    raterId: v.id("users"),
    ratedId: v.id("users"),
    score: v.number(),
    comment: v.optional(v.string()),
  }).index("by_rated", ["ratedId"]),

  pushIdentities: defineTable({
    secret: v.string(),
    visitorId: v.string(),
  }).index("by_visitor", ["visitorId"]),
});
