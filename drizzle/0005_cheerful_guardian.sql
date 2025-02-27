ALTER TABLE "logs" ADD COLUMN "logType" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "thought";--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "action";--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "tokenAddr";