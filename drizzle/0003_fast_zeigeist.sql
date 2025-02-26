ALTER TABLE "wallet_keys" ALTER COLUMN "ivString" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_keys" ALTER COLUMN "encryptedWalletData" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_keys" ADD COLUMN "userShare" text;