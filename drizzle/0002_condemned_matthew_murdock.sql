CREATE TABLE "balance_snapshots" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "balance_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"agentId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"injection" double precision NOT NULL,
	"equity" double precision NOT NULL,
	"balance" double precision NOT NULL,
	"startPeriodValue" double precision,
	"growthRate" double precision,
	"cumulativeMultiplier" double precision,
	"performance" double precision,
	"transactionHash" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;