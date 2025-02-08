ALTER TABLE "agents" ALTER COLUMN "strategy" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "name" varchar(255) NOT NULL;