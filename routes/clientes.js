const express = require('express');
const path = require('path');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const passport = require('passport');
const bcrypt = require("bcryptjs");
require('../src/helpers');


// Rota de cadastro
router.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

router.post('/cadastro', (req, res) => {
    let erros = [];
    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome inválido!" });
    }
    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({ texto: "E-mail inválido!" });
    }
    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ texto: "Senha inválida!" });
    }
    if (req.body.senha.length < 4) {
        erros.push({ texto: "Senha muito curta!" });
    }
    if (req.body.senha != req.body.senha2) {
        erros.push({ texto: "Senhas diferentes, tente novamente!" });
    }

    if (erros.length > 0) {
        res.render('cadastro', { erros: erros });
    } else {
        // Verifica se já existe um cliente com o mesmo email no banco de dados
        prisma.clientes.findUnique({
            where: {
                email: req.body.email
            }
        })
        .then(clienteExistente => {
            if (clienteExistente) {
                // Cliente já existe
                erros.push({ texto: "E-mail já cadastrado!" });
                res.render('cadastro', { erros: erros });
            } else {
                // Hash da senha usando bcrypt
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(req.body.senha, salt, (err, hash) => {
                        if (err) {
                            console.error('Erro ao gerar hash da senha:', err);
                            res.render('error');
                        } else {
                            // Cria um novo cliente com a senha hasheada
                            prisma.clientes.create({
                                data: {
                                    nome: req.body.nome,
                                    email: req.body.email,
                                    senha: hash  // Salva a senha hasheada no banco de dados
                                }
                            })
                            .then(novoCliente => {
                                console.log('Novo cliente criado:', novoCliente);
                                req.flash("success_msg", "Cliente criado com sucesso!");
                                res.redirect("/clientes/login"); 
                            })
                            .catch(error => {
                                console.error('Erro ao criar cliente:', error);
                                req.flash("error_msg", "Houve um erro ao criar o usuário, tente novamente!");
                                res.redirect("/clientes/registrocliente");
                            });
                        }
                    });
                });
            }
        })
        .catch(error => {
            console.error('Erro ao verificar cliente existente:', error);
            res.render('error');
        });
    }
});



// Rota de dashboard
router.get('/dashboard', (req, res) => {
    res.render('dashboard', {isAuthenticated: req.isAuthenticated()});
});


//--------------------------------------------------------------------------------------
//                   FUNÇÕES NO DASHBOARD

// Cadastrando Produto
router.get('/cadastrarproduto', async (req, res) => {
    try {
        const produtos = await prisma.produtos.findMany();

        // Formata os valores de preço e preço de venda
        const formattedProdutos = produtos.map(produto => ({
            ...produto,
            preco: produto.preco.toFixed(2).replace('.', ','),
            precovenda: produto.precovenda.toFixed(2).replace('.', ',')
        }));

        const nenhumProdutoCadastrado = formattedProdutos.length === 0;
        res.render('cadproduto', { produtos: formattedProdutos, nenhumProdutoCadastrado });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        req.flash('error_msg', 'Erro ao buscar produtos');
        res.redirect('/clientes/dashboard');
    }
});


router.post('/cadastrarproduto', async (req, res) => {
    const { nomeproduto, preco, precovenda, validade, quantidade } = req.body;

    let erros = [];

    // Valida e converte os valores
    const precoNumerico = parseFloat(preco.replace(',', '.'));
    const precovendaNumerico = parseFloat(precovenda.replace(',', '.'));
    const validadeDate = validade ? new Date(validade) : null;
    const quantidadeNumerica = parseInt(quantidade);

    if (!nomeproduto || nomeproduto.trim() === '') {
        erros.push({ texto: "Nome do produto inválido!" });
    }
    if (isNaN(precoNumerico)) {
        erros.push({ texto: "Preço inválido!" });
    }
    if (isNaN(precovendaNumerico)) {
        erros.push({ texto: "Preço de venda inválido!" });
    }
    if (validadeDate && isNaN(validadeDate.getTime())) {
        erros.push({ texto: "Validade inválida!" });
    }
    if (isNaN(quantidadeNumerica)) {
        erros.push({ texto: "Quantidade inválida!" });
    }

    if (erros.length > 0) {
        const produtos = await prisma.produtos.findMany();
        const formattedProdutos = produtos.map(produto => ({
            ...produto,
            preco: produto.preco.toFixed(2).replace('.', ','),
            precovenda: produto.precovenda.toFixed(2).replace('.', ',')
        }));
        return res.render('cadproduto', { erros, produtos: formattedProdutos, nenhumProdutoCadastrado: formattedProdutos.length === 0 });
    }

    try {
        const novoProduto = await prisma.produtos.create({
            data: {
                nomeproduto,
                preco: precoNumerico,
                precovenda: precovendaNumerico,
                validade: validadeDate ? validadeDate.toISOString() : null,
                quantidade: quantidadeNumerica
            }
        });

        req.flash('success_msg', 'Produto cadastrado com sucesso!');
        res.redirect('/clientes/cadastrarproduto');
    } catch (error) {
        console.error('Erro ao cadastrar o produto:', error);
        req.flash('error_msg', 'Erro ao cadastrar o produto');
        res.redirect('/clientes/cadastrarproduto');
    }
});



// Rota de pesquisa de produto
router.get('/pesquisarproduto', async (req, res) => {
    try {
        const { pesquisar } = req.query;
        let produtos = [];
        let error_msg = null;

        if (pesquisar) {
            produtos = await prisma.produtos.findMany({
                where: {
                    nomeproduto: {
                        contains: pesquisar,
                        mode: 'insensitive',
                    },
                },
            });
            if (produtos.length === 0) {
                error_msg = 'Nenhum produto encontrado.';
            }
        } else {
            produtos = await prisma.produtos.findMany();
        }

        res.render('cadproduto', { produtos, error_msg });
    } catch (error) {
        req.flash('error_msg', 'Erro ao pesquisar os produtos');
        res.redirect('/clientes/cadastrarproduto');
    }
});

// Rota para renderizar o formulário de edição de um produto
router.get('/editarproduto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const produto = await prisma.produtos.findUnique({
            where: { id: parseInt(id) }
        });
        if (!produto) {
            req.flash('error_msg', 'Produto não encontrado!');
            return res.redirect('/clientes/cadastrarproduto');
        }
        res.render('editproduto', { produto });
    } catch (error) {
        console.error('Erro ao buscar o produto:', error);
        req.flash('error_msg', 'Erro ao buscar o produto!');
        res.redirect('/clientes/cadastrarproduto');
    }
});

// Rota para editar as informações de um produto
router.post('/editarproduto/:id', async (req, res) => {
    const { id } = req.params;
    const { nomeproduto, preco, precovenda, validade, quantidade } = req.body;

    try {
        const updateData = {
            nomeproduto,
            preco: parseFloat(preco),
            precovenda: parseFloat(precovenda),
            quantidade: parseInt(quantidade)
        };

        if (validade) {
            const validadeDate = new Date(validade);
            if (isNaN(validadeDate.getTime())) {
                throw new Error("Invalid date format for validade");
            }
            updateData.validade = validadeDate.toISOString();
        }

        await prisma.produtos.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        req.flash('success_msg', 'Produto atualizado com sucesso!');
        res.redirect('/clientes/cadastrarproduto');
    } catch (error) {
        console.error('Erro ao atualizar o produto:', error);
        req.flash('error_msg', 'Erro ao atualizar o produto!');
        res.redirect('/clientes/cadastrarproduto');
    }
});

router.delete('/deletarproduto/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.produtos.delete({
            where: { id: Number(id) }
        });
        req.flash('success_msg', 'Produto deletado com sucesso!')
        res.redirect('/clientes/cadastrarproduto');
    } catch (error) {
        req.flash('error_msg', 'Erro interno ao deletar o produto.')
        res.redirect('/clientes/cadastrarproduto')
    }
});

// ------------------------------------------------------------------------------------------------
//          ROTA DE VENDAS 

// Rota para exibir a página de vendas
router.get('/venda', async (req, res) => {
    res.render('venda');
});

// Rota para pesquisar produtos
router.get('/venda/pesquisar', async (req, res) => {
    const { pesquisaproduto } = req.query;

    try {
        
        const produtos = await prisma.produtos.findMany({
            where: {
                nomeproduto: {
                    contains: pesquisaproduto,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                nomeproduto: true,
                precovenda: true,
                quantidade: true,
            },
        });

        res.render('venda', { produtos });
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).send('Erro ao buscar produtos.');
    }
});

// Rota para concluir uma venda
router.post('/vender', async (req, res) => {
    let produtosNoCarrinho;

    if (!req.body.produtosNoCarrinho) {
        req.flash('error_msg', 'Carrinho vazio.');
        return res.redirect('/clientes/venda');
    }

    try {
        produtosNoCarrinho = JSON.parse(req.body.produtosNoCarrinho);
    } catch (error) {
        console.error('Erro ao analisar JSON:', error);
        req.flash('error_msg', 'Erro ao processar o carrinho.');
        return res.redirect('/clientes/venda');
    }

    try {
        for (const produto of produtosNoCarrinho) {
            console.log('Dados recebidos do produto:', produto);

            const precovenda = parseFloat(produto.total / produto.quantidade);
            if (isNaN(precovenda)) {
                throw new Error(`Preço de venda inválido para o produto ${produto.nome}`);
            }

            const produtoId = parseInt(produto.id, 10);
            if (isNaN(produtoId)) {
                throw new Error(`ID do produto inválido: ${produto.id}`);
            }

            const produtoExistente = await prisma.produtos.findUnique({
                where: { id: produtoId }
            });

            if (!produtoExistente) {
                throw new Error(`Produto com ID ${produtoId} não encontrado.`);
            }

            if (produtoExistente.quantidade < produto.quantidade) {
                throw new Error(`Quantidade disponível insuficiente para o produto ${produto.nome}. Quantidade disponível: ${produtoExistente.quantidade}.`);
            }

            await prisma.vendas.create({
                data: {
                    nomeproduto: produto.nome,
                    quantidade: produto.quantidade,
                    produtoId: produtoId,
                    precovenda: parseFloat(produto.total) 
                }
            });

            await prisma.produtos.update({
                where: { id: produtoId },
                data: { quantidade: produtoExistente.quantidade - produto.quantidade }
            });
        }
        req.flash('success_msg', 'Venda realizada com sucesso!');
        res.redirect('/clientes/venda');
    } catch (error) {
        console.error('Erro ao realizar venda:', error);
        req.flash('error_msg', error.message);
        res.redirect('/clientes/venda');
    }
});

// Rota para cancelar uma venda
router.post('/cancelar', (req, res) => {
    // Limpar o carrinho na sessão
    req.session.carrinho = [];
    req.flash('success_msg', 'Venda cancelada com sucesso!');
    res.redirect('/clientes/venda');
});

// ---------------------------------------------------------------------------------------------
//          ROTA DE DETALHES DE VENDAS

// Rota para detalhes de vendas com filtro de data
router.get('/detalhesvenda', async (req, res) => {
    const { dataInicio, dataFim } = req.query;

    try {
        // Verifica se as datas de início e fim foram fornecidas
        if (dataInicio && dataFim) {
            const vendas = await prisma.vendas.findMany({
                where: {
                    datavenda: {
                        gte: new Date(dataInicio),
                        lte: new Date(dataFim),
                    },
                },
                include: {
                    produto: true, 
                },
                orderBy: {
                    datavenda: 'desc', 
                },
            });

        
            res.render('detalhesvenda', { vendas });
        } else {
           
            res.render('detalhesvenda', { vendas: [] });
        }
    } catch (error) {
        console.error('Erro ao buscar detalhes de vendas:', error);
        req.flash('error_msg', 'Erro ao buscar detalhes de vendas.');
        res.redirect('/clientes/dashboard');
    }
});

//------------------------------------------------------------------------------------------
//          ROTA DE ENTRADA E SAÍDA

// Rota para cadastrar uma nova saída
router.post('/entradaesaida', async (req, res) => {
    const { nomesaida, valor, data } = req.body;

    try {
        // Substituir a vírgula por um ponto para garantir o formato numérico correto
        const valorDecimal = parseFloat(valor.replace(/\./g, '').replace(',', '.'));

        const novaSaida = await prisma.saidas.create({
            data: {
                nomesaida,
                valor: valorDecimal, // Valor tratado corretamente
                data: new Date(data),
            },
        });

        req.flash('success_msg', 'Saída cadastrada com sucesso!');
        res.redirect('/clientes/entradaesaida');
    } catch (error) {
        console.error('Erro ao cadastrar a saída:', error);
        req.flash('error_msg', 'Erro ao cadastrar a saída!');
        res.redirect('/clientes/entradaesaida');
    }
});



// Detalhes de entradas e saídas por período pesquisado
router.get('/entradaesaida', async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    
    try {
        if (dataInicio && dataFim) {
            const entradas = await prisma.vendas.findMany({
                where: {
                    datavenda: {
                        gte: new Date(dataInicio),
                        lte: new Date(dataFim),
                    },
                },
                orderBy: {
                    datavenda: 'desc',
                },
            });

            const saidas = await prisma.saidas.findMany({
                where: {
                    data: {
                        gte: new Date(dataInicio),
                        lte: new Date(dataFim),
                    },
                },
                orderBy: {
                    data: 'desc',
                },
            });

            // Converter os valores de entradas (precovenda) para números corretamente
            const totalVendas = entradas.reduce((acc, venda) => acc + Number(venda.precovenda), 0);

            // Converter os valores de saídas (valor) para números corretamente
            const totalSaidas = saidas.reduce((acc, saida) => acc + Number(saida.valor), 0);

            // Calcular o lucro (entradas - saídas)
            const lucro = totalVendas - totalSaidas;

            res.render('entradaesaida', {
                entradas,
                saidas,
                totalVendas: totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).replace('R$', '').trim(),
                totalSaidas: totalSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).replace('R$', '').trim(),
                lucro: lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).replace('R$', '').trim(),
                formatarData: (data) => new Date(data).toLocaleDateString('pt-BR')
            });
        } else {
            res.render('entradaesaida', {
                entradas: [],
                saidas: [],
                totalVendas: '0,00',
                totalSaidas: '0,00',
                lucro: '0,00',
                formatarData: (data) => new Date(data).toLocaleDateString('pt-BR'),
            });
        }
    } catch (error) {
        console.error('Erro ao buscar entradas e saídas:', error);
        req.flash('error_msg', 'Erro ao buscar entradas e saídas.');
        res.redirect('/clientes/dashboard');
    }
});



/*---------------------------------------------------------------------------------------*/
//              ROTA DE LOGIN E AUTENTICAÇÃO

router.get('/login', (req, res) => {
    res.render('login')
});

router.post('/login/cliente', passport.authenticate('cliente-local', {
    successRedirect: '/clientes/dashboard',
    failureRedirect: '/clientes/login',
    failureFlash: true
}));

// Rota de logout
router.get('/sair', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            console.error("Erro ao deslogar:", err);
            req.flash('error_msg', 'Erro ao deslogar');
            return next(err);
        }
        req.flash('success_msg', 'Deslogado com sucesso!');
        res.redirect('/');
    });
});

//--------------------------------------------------------------------------------------------

//          ROTA DE CONTATO

router.get('/contato', (req, res) => {
    res.render('contato')
});

module.exports = router;
