CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "Testament" AS ENUM ('OLD', 'NEW');
CREATE TYPE "StudyStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "NoteType" AS ENUM ('PASSAGE', 'TOPIC', 'QUESTION', 'SERMON');
CREATE TYPE "NoteSource" AS ENUM ('INTERNAL', 'OBSIDIAN_IMPORT');
CREATE TYPE "TagType" AS ENUM ('TOPIC', 'BOOK', 'CUSTOM', 'DOCTRINE');
CREATE TYPE "LinkType" AS ENUM ('OBSIDIAN_WIKILINK', 'MANUAL');
CREATE TYPE "DocumentSource" AS ENUM ('UPLOAD', 'OBSIDIAN_IMPORT');
CREATE TYPE "DocumentVisibility" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC_SUBMISSION');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BibleBook" (
  "id" TEXT NOT NULL,
  "testament" "Testament" NOT NULL,
  "nameZh" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "abbreviation" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "chaptersCount" INTEGER NOT NULL,

  CONSTRAINT "BibleBook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BibleVerse" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "chapter" INTEGER NOT NULL,
  "verse" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "translation" TEXT NOT NULL DEFAULT 'CUVS',

  CONSTRAINT "BibleVerse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyProject" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "passageLabel" TEXT NOT NULL,
  "status" "StudyStatus" NOT NULL DEFAULT 'ACTIVE',
  "summary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StudyProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyPassage" (
  "id" TEXT NOT NULL,
  "studyProjectId" TEXT NOT NULL,
  "bibleVerseId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,

  CONSTRAINT "StudyPassage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Note" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "studyProjectId" TEXT,
  "type" "NoteType" NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "markdownBody" TEXT NOT NULL,
  "excerpt" TEXT,
  "source" "NoteSource" NOT NULL DEFAULT 'INTERNAL',
  "obsidianPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "TagType" NOT NULL DEFAULT 'CUSTOM',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NoteTag" (
  "id" TEXT NOT NULL,
  "noteId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,

  CONSTRAINT "NoteTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NoteLink" (
  "id" TEXT NOT NULL,
  "fromNoteId" TEXT NOT NULL,
  "toNoteId" TEXT,
  "targetTitle" TEXT NOT NULL,
  "linkType" "LinkType" NOT NULL DEFAULT 'OBSIDIAN_WIKILINK',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NoteLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "storagePath" TEXT,
  "extractedText" TEXT,
  "excerpt" TEXT,
  "source" "DocumentSource" NOT NULL DEFAULT 'UPLOAD',
  "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PRIVATE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentTag" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,

  CONSTRAINT "DocumentTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentPassage" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "bibleVerseId" TEXT NOT NULL,
  "referenceLabel" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentPassage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "BibleBook_nameEn_key" ON "BibleBook"("nameEn");
CREATE INDEX "BibleBook_orderIndex_idx" ON "BibleBook"("orderIndex");
CREATE UNIQUE INDEX "BibleVerse_translation_bookId_chapter_verse_key" ON "BibleVerse"("translation", "bookId", "chapter", "verse");
CREATE INDEX "BibleVerse_bookId_chapter_idx" ON "BibleVerse"("bookId", "chapter");
CREATE INDEX "StudyProject_userId_updatedAt_idx" ON "StudyProject"("userId", "updatedAt");
CREATE UNIQUE INDEX "StudyPassage_studyProjectId_bibleVerseId_key" ON "StudyPassage"("studyProjectId", "bibleVerseId");
CREATE INDEX "StudyPassage_bibleVerseId_idx" ON "StudyPassage"("bibleVerseId");
CREATE UNIQUE INDEX "Note_userId_slug_key" ON "Note"("userId", "slug");
CREATE INDEX "Note_userId_type_updatedAt_idx" ON "Note"("userId", "type", "updatedAt");
CREATE UNIQUE INDEX "Tag_userId_slug_key" ON "Tag"("userId", "slug");
CREATE UNIQUE INDEX "NoteTag_noteId_tagId_key" ON "NoteTag"("noteId", "tagId");
CREATE INDEX "NoteLink_fromNoteId_idx" ON "NoteLink"("fromNoteId");
CREATE INDEX "NoteLink_toNoteId_idx" ON "NoteLink"("toNoteId");
CREATE INDEX "Document_userId_updatedAt_idx" ON "Document"("userId", "updatedAt");
CREATE UNIQUE INDEX "DocumentTag_documentId_tagId_key" ON "DocumentTag"("documentId", "tagId");
CREATE INDEX "DocumentPassage_documentId_idx" ON "DocumentPassage"("documentId");
CREATE INDEX "DocumentPassage_bibleVerseId_idx" ON "DocumentPassage"("bibleVerseId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BibleVerse" ADD CONSTRAINT "BibleVerse_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BibleBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyProject" ADD CONSTRAINT "StudyProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyPassage" ADD CONSTRAINT "StudyPassage_studyProjectId_fkey" FOREIGN KEY ("studyProjectId") REFERENCES "StudyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyPassage" ADD CONSTRAINT "StudyPassage_bibleVerseId_fkey" FOREIGN KEY ("bibleVerseId") REFERENCES "BibleVerse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_studyProjectId_fkey" FOREIGN KEY ("studyProjectId") REFERENCES "StudyProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_fromNoteId_fkey" FOREIGN KEY ("fromNoteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_toNoteId_fkey" FOREIGN KEY ("toNoteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentTag" ADD CONSTRAINT "DocumentTag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentTag" ADD CONSTRAINT "DocumentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentPassage" ADD CONSTRAINT "DocumentPassage_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentPassage" ADD CONSTRAINT "DocumentPassage_bibleVerseId_fkey" FOREIGN KEY ("bibleVerseId") REFERENCES "BibleVerse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
