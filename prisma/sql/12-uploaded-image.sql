-- Kompyuterdan yuklangan rasmlar (expand: yangi jadval, eski kodga ta'sir qilmaydi).
CREATE TABLE "UploadedImage" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedImage_pkey" PRIMARY KEY ("id")
);
