ALTER TABLE "agents" ALTER COLUMN "walletKeyId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_keys" ALTER COLUMN "agentId" DROP NOT NULL;