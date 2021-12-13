const supabase = require('../supabase');


async function uploadImagem(pasta, nomeArquivo, extensao, imagem) {
    const buffer = Buffer.from(imagem, 'base64')

    const { error } = await supabase
        .storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(`${pasta}/${nomeArquivo}.${extensao}`, buffer);
    return error;

};

async function modificarImagem(pasta, nomeArquivo, extensao, imagem) {

    const buffer = Buffer.from(imagem, 'base64')

    const { error } = await supabase
        .storage
        .from(process.env.SUPABASE_BUCKET)
        .update(`${pasta}/${nomeArquivo}.${extensao}`, buffer);
    return error;

};

async function deletarImagemNoBucket(pasta, nomeArquivo, extensao) {

    const caminhoDoArquivo = `${pasta}/${nomeArquivo}.${extensao}`;
    const extensaoENomeArquivo = `${nomeArquivo}.${extensao}`;

    const { data } = await supabase
        .storage
        .from(process.env.SUPABASE_BUCKET)
        .list(pasta, {
            limit: 10
        });

    const procurarArquivo = data.find(arquivo => arquivo.name === extensaoENomeArquivo);

    if (!procurarArquivo) {
        return `Arquivo não encontrado`;
    };

    const { error } = await supabase
        .storage
        .from(process.env.SUPABASE_BUCKET)
        .remove([caminhoDoArquivo]);

    return error;
};


module.exports = {
    uploadImagem,
    modificarImagem,
    deletarImagemNoBucket
}