const knex = require('../conexao');
const supabase = require('../supabase');
const {
    uploadImagem,
    modificarImagem,
    deletarImagemNoBucket
} = require('../manipularBucket/manipularBucket');


const listarProdutos = async(req, res) => {
    const { usuario } = req;
    const { categoria } = req.query;

    try {
        const produtos = await knex('produtos')
            .where({ usuario_id: usuario.id })
            .where(query => {
                if (categoria) {
                    return query.where('categoria', 'ilike', `%${categoria}%`);
                }
            });

        return res.status(200).json(produtos);
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const obterProduto = async(req, res) => {
    const { usuario } = req;
    const { id } = req.params;

    try {
        const produto = await knex('produtos').where({
            id,
            usuario_id: usuario.id
        }).first();

        if (!produto) {
            return res.status(404).json('Produto não encontrado');
        }

        return res.status(200).json(produto);
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const cadastrarProduto = async(req, res) => {
    const { usuario } = req;
    const {
        nome,
        pasta,
        quantidade,
        preco,
        categoria,
        descricao,
        nomeImagem,
        imagem,
        extensao
    } = req.body;

    if (!nome) {
        return res.status(404).json('O campo nome & nomeGitHub são obrigatórios');
    }

    if (!quantidade) {
        return res.status(404).json('O campo quantidade é obrigatório');
    }

    if (!preco) {
        return res.status(404).json('O campo preco é obrigatório');
    }

    if (!descricao) {
        return res.status(404).json('O campo descricao é obrigatório');
    }

    try {
        if (imagem) {
            if (!pasta || !nomeImagem || !extensao) {
                return res.status(400).json('Se deseja inserir uma imagem, é necessária o nome da pasta, nome da imagem e qual extensão da imagem(jpg, png, etc).');
            };

            const tratamentoDeErro = await uploadImagem(pasta, nomeImagem, extensao, imagem);

            if (tratamentoDeErro) {
                return res.status(400).json({ erro: tratamentoDeErro.message });
            };
        };

        const produto = await knex('produtos').insert({
            usuario_id: usuario.id,
            nome,
            quantidade,
            preco,
            categoria,
            descricao,
            imagem
        }).returning('*');

        //Como adicionar imagens de forma que consuma menos da aplicação.
        if (!produto) {
            return res.status(400).json('O produto não foi cadastrado');
        };

        return res.status(200).json('Produto cadastrado com sucesso!');
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const atualizarProduto = async(req, res) => {
    const { usuario } = req;
    const { id } = req.params;
    const {
        nome,
        quantidade,
        preco,
        categoria,
        descricao,
        pasta,
        imagemNome,
        extensao,
        imagem
    } = req.body;

    if (!nome && !quantidade && !preco && !categoria && !descricao && !imagem) {
        return res.status(404).json('Informe ao menos um campo para atualizaçao do produto');
    }

    try {
        const produtoEncontrado = await knex('produtos').where({
            id,
            usuario_id: usuario.id
        }).first();

        if (!produtoEncontrado) {
            return res.status(404).json('Produto não encontrado');
        }

        if (imagem) {
            if (!pasta || !imagemNome || !extensao) {
                return res.status(400).json('Os campos pasta, imagemNome e extensão são obrigatórios caso queria modificar uma imagem.');
            };

            const tratamentoDeErro = await modificarImagem(pasta, imagemNome, extensao, imagem);

            if (tratamentoDeErro) {
                return res.status(400).json({ putError: tratamentoDeErro });
            };
        };

        const produto = await knex('produtos')
            .where({ id })
            .update({
                nome,
                quantidade,
                preco,
                categoria,
                descricao,
                imagem
            });

        if (!produto) {
            return res.status(400).json("O produto não foi atualizado");
        }

        return res.status(200).json('produto foi atualizado com sucesso.');
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const excluirProduto = async(req, res) => {
    const { usuario } = req;
    const { id } = req.params;

    try {
        const produtoEncontrado = await knex('produtos').where({
            id,
            usuario_id: usuario.id
        }).first();

        if (!produtoEncontrado) {
            return res.status(404).json('Produto não encontrado');
        }

        const produtoExcluido = await knex('produtos').where({
            id,
            usuario_id: usuario.id
        }).del();

        if (!produtoExcluido) {
            return res.status(400).json("O produto não foi excluido");
        }

        return res.status(200).json('Produto excluido com sucesso');
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const excluirImagem = async(req, res) => {
    const { usuario } = req;
    const { id } = req.params;
    const { imagemNome, pasta, extensao } = req.body;

    if (!imagemNome || !pasta || !extensao) {
        return res.json("Campos imagemNome, pasta e extensão devem ser informados para que o caminho do arquivo seja alcançado.");
    };


    try {
        const produtoEncontrado = await knex('produtos').where({
            id,
            usuario_id: usuario.id
        }).first();

        if (!produtoEncontrado) {
            return res.json("Produto não encontrado.");
        };

        if (!produtoEncontrado.imagem) {
            return res.json("Não existe imagem a ser excluida.");
        };

        const tratamentoDeErro = await deletarImagemNoBucket(pasta, imagemNome, extensao);

        if (tratamentoDeErro) {
            return res.status(400).json({ erro: tratamentoDeErro });
        };


        const deletarImagemDB = await knex('produtos').update({
            imagem: null
        }).where({
            id,
            usuario_id: usuario.id
        });


        return res.json("imagem foi removida.");
    } catch (error) {
        return res.status(error.message);
    };
}

const atualizarImagem = async(req, res) => {
    const { usuario } = req;
    const { id } = req.params;
    const {
        pasta,
        imagemNome,
        extensao,
        imagem
    } = req.body;

    if (!imagemNome || !pasta || !extensao) {
        return res.json("Campos imagemNome, pasta e extensão são obrigatórios.");
    };

    if (!imagem) {
        return res.json("Uma imagem deve ser informada.");
    };

    try {
        const produtoEncontrado = await knex('produtos').where({
            id,
            usuario_id: usuario.id
        }).first();

        if (!produtoEncontrado) {
            return res.json("Produto não encontrado.");
        };

        const tratamentoDeErro = await modificarImagem(pasta, imagemNome, extensao, imagem);

        if (tratamentoDeErro) {
            return res.status(400).json({ erro: tratamentoDeErro })
        };



        const atualizarImagemDataBase = await knex('produtos')
            .update({ imagem: imagem })
            .where({
                id,
                usuario_id: usuario.id
            });


        return res.status(200).json('Imagem Atualizada com sucesso!');

    } catch (error) {
        return res.status(error.message);
    }
}

module.exports = {
    listarProdutos,
    obterProduto,
    cadastrarProduto,
    atualizarProduto,
    excluirProduto,
    excluirImagem,
    atualizarImagem
}