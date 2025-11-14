CREATE TABLE "calendar_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"email" text NOT NULL,
	"calendar_id" text,
	"is_enabled" boolean NOT NULL,
	"last_synced_at" timestamp,
	"next_sync_at" timestamp,
	"sync_token" text,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"external_event_id" text NOT NULL,
	"provider" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"duration" integer,
	"is_all_day" boolean NOT NULL,
	"location" text,
	"attendee_count" integer,
	"mood_prompt_sent" boolean NOT NULL,
	"mood_prompt_sent_at" timestamp,
	"mood_logged" boolean NOT NULL,
	"mood_entry_id" uuid,
	"external_metadata" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calendar_account_id" uuid,
	"status" text NOT NULL,
	"error" text,
	"events_imported" integer NOT NULL,
	"events_updated" integer NOT NULL,
	"events_deleted" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_accounts" ADD CONSTRAINT "calendar_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_account_id_calendar_accounts_id_fk" FOREIGN KEY ("calendar_account_id") REFERENCES "public"."calendar_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_mood_entry_id_calendar_entries_id_fk" FOREIGN KEY ("mood_entry_id") REFERENCES "public"."calendar_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ADD CONSTRAINT "calendar_syncs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ADD CONSTRAINT "calendar_syncs_calendar_account_id_calendar_accounts_id_fk" FOREIGN KEY ("calendar_account_id") REFERENCES "public"."calendar_accounts"("id") ON DELETE cascade ON UPDATE no action;