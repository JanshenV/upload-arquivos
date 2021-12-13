const nodemailer = require('../nodemailer');


function enviarEmail(nome, email) {
    const dadosAseremEnviados = {
        from: 'Market Cubos <do-not-reply@marketcubos.com>',
        to: email,
        subject: 'Cadastro a Market Cubos',
        text: `Olá ${nome} você se cadastrou a Market Cubos. Você pode estar usufruindo nossos serviços com o email: ${email}`
    };

    nodemailer.sendMail(dadosAseremEnviados);

};




module.exports = enviarEmail;