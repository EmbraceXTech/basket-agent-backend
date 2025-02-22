ALTER TABLE "knowledges" DROP CONSTRAINT "knowledges_agentId_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_agentId_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "wallet_keys" DROP CONSTRAINT "wallet_keys_agentId_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "knowledges" ADD CONSTRAINT "knowledges_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_keys" ADD CONSTRAINT "wallet_keys_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;