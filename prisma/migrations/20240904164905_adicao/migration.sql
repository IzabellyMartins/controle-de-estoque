-- CreateTable
CREATE TABLE "Saidas" (
    "id" SERIAL NOT NULL,
    "nomesaida" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Saidas_pkey" PRIMARY KEY ("id")
);
