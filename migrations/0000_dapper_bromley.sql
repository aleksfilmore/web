CREATE TABLE "audiobook_listens" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar(128) NOT NULL,
	"user_identifier" varchar(255) DEFAULT '',
	"minutes" integer DEFAULT 0 NOT NULL,
	"region" varchar(128) DEFAULT 'unknown',
	"listened_at" timestamp DEFAULT now() NOT NULL,
	"file" varchar(255) DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "bonus_chapter_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"send_method" varchar(64) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"message_id" varchar(255) DEFAULT '',
	"metadata" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar(128) NOT NULL,
	"from_status" varchar(64) DEFAULT '',
	"to_status" varchar(64) NOT NULL,
	"note" text DEFAULT '',
	"changed_by" varchar(255) DEFAULT 'admin',
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"stripe_id" varchar(128) NOT NULL,
	"product_type" varchar(64) NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"status" varchar(64) DEFAULT 'pending' NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"shipping" jsonb DEFAULT '{}',
	"personalization" text DEFAULT '',
	"token" varchar(255) DEFAULT '',
	"confirmation_sent" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"content" text DEFAULT '' NOT NULL
);
