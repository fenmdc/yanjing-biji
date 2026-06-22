CREATE TABLE "StudyDocument" (
  "id" TEXT NOT NULL,
  "studyProjectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StudyDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudyDocument_studyProjectId_documentId_key" ON "StudyDocument"("studyProjectId", "documentId");
CREATE INDEX "StudyDocument_documentId_idx" ON "StudyDocument"("documentId");

ALTER TABLE "StudyDocument" ADD CONSTRAINT "StudyDocument_studyProjectId_fkey" FOREIGN KEY ("studyProjectId") REFERENCES "StudyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyDocument" ADD CONSTRAINT "StudyDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
