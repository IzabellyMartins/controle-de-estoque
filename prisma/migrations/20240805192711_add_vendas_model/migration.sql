-- CreateTable
CREATE TABLE "Vendas" (
    "id" SERIAL NOT NULL,
    "nomeproduto" TEXT NOT NULL,
    "precovenda" DOUBLE PRECISION NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "datavenda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produtoId" INTEGER NOT NULL,

    CONSTRAINT "Vendas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vendas" ADD CONSTRAINT "Vendas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
