-- DropForeignKey
ALTER TABLE "Vendas" DROP CONSTRAINT "Vendas_produtoId_fkey";

-- AddForeignKey
ALTER TABLE "Vendas" ADD CONSTRAINT "Vendas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
