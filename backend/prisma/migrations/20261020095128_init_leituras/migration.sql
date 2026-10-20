-- CreateTable
CREATE TABLE "leituras_temperatura" (
    "id" TEXT NOT NULL,
    "temperatura" DOUBLE PRECISION NOT NULL,
    "tipoOrigem" TEXT NOT NULL DEFAULT 'AO_VIVO',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leituras_temperatura_pkey" PRIMARY KEY ("id")
);
