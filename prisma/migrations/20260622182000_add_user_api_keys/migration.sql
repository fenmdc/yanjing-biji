CREATE TYPE "ApiKeyProvider" AS ENUM ('BRAVE', 'TAVILY');

CREATE TABLE "UserApiKey" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "ApiKeyProvider" NOT NULL,
  "encryptedKey" TEXT NOT NULL,
  "keyPreview" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserApiKey_userId_provider_key" ON "UserApiKey"("userId", "provider");
CREATE INDEX "UserApiKey_userId_idx" ON "UserApiKey"("userId");

ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
