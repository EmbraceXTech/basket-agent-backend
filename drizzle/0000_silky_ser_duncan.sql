CREATE TABLE "agents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"chainId" varchar(255) NOT NULL,
	"selected_tokens" text[],
	"strategy" varchar(255) NOT NULL,
	"walletAddress" varchar(255) NOT NULL,
	"intervalSeconds" integer NOT NULL,
	"end_date" timestamp NOT NULL,
	"stopLossUSD" integer NOT NULL,
	"takeProfitUSD" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "knowledges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"agentId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"agentId" integer NOT NULL,
	"thought" text NOT NULL,
	"action" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"tokenAddr" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"telegramId" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_telegramId_unique" UNIQUE("telegramId")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledges" ADD CONSTRAINT "knowledges_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;