import { integer, pgTable, varchar, text, jsonb, timestamp, serial } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull().default('')
});

// Orders table: stores Stripe checkout/session snapshots and order metadata
export const orders = pgTable('orders', {
    id: varchar({ length: 128 }).primaryKey(), // use Stripe session id
    stripe_id: varchar({ length: 128 }).notNull(),
    product_type: varchar({ length: 64 }).notNull(),
    amount_cents: integer().notNull(),
    currency: varchar({ length: 8 }).notNull().default('USD'),
    status: varchar({ length: 64 }).notNull().default('pending'),
    customer_email: varchar({ length: 255 }).notNull(),
    shipping: jsonb().default('{}'),
    personalization: text().default(''),
    token: varchar({ length: 255 }).default(''),
    confirmation_sent: integer().default(0),
    metadata: jsonb().default('{}'),
    created_at: timestamp().notNull().defaultNow()
});

// Audiobook listens: store per-listen events for analytics
export const audiobook_listens = pgTable('audiobook_listens', {
    id: serial('id').primaryKey(),
    order_id: varchar({ length: 128 }).notNull(),
    user_identifier: varchar({ length: 255 }).default(''),
    minutes: integer().notNull().default(0),
    region: varchar({ length: 128 }).default('unknown'),
    listened_at: timestamp().notNull().defaultNow(),
    file: varchar({ length: 255 }).default('')
});

// Bonus chapter send log
export const bonus_chapter_log = pgTable('bonus_chapter_log', {
    id: serial('id').primaryKey(),
    recipient_email: varchar({ length: 255 }).notNull(),
    send_method: varchar({ length: 64 }).notNull(),
    sent_at: timestamp().notNull().defaultNow(),
    message_id: varchar({ length: 255 }).default(''),
    metadata: jsonb().default('{}')
});

// Order status history for auditing
export const order_status_history = pgTable('order_status_history', {
    id: serial('id').primaryKey(),
    order_id: varchar({ length: 128 }).notNull(),
    from_status: varchar({ length: 64 }).default(''),
    to_status: varchar({ length: 64 }).notNull(),
    note: text().default(''),
    changed_by: varchar({ length: 255 }).default('admin'),
    changed_at: timestamp().notNull().defaultNow()
});