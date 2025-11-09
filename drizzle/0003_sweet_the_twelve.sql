CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" text NOT NULL,
	"default_view" text NOT NULL,
	"enable_notifications" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "calendar_entries" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_entries" ADD COLUMN "time_of_day" text;--> statement-breakpoint
ALTER TABLE "calendar_entries" ADD COLUMN "is_private" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "emotions" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "emotions" ADD COLUMN "order" text NOT NULL;--> statement-breakpoint
ALTER TABLE "emotions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "visibility" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "allow_multiple_moods_per_day" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "require_comment" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "show_weekends" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "personal_mode" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_entries" ADD CONSTRAINT "calendar_entries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotions" ADD CONSTRAINT "emotions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;