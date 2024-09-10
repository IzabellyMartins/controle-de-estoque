const Handlebars = require('handlebars');

Handlebars.registerHelper('formatarNumero', function(preco) {
    if (preco === undefined || preco === null || isNaN(preco)) {
        return '0,00'; 
    }
    preco = parseFloat(preco);
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
});


// Helper para formatar a data
Handlebars.registerHelper('formatarData', function(data) {
    if (!data) return '';
    const date = new Date(data);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
});

module.exports = {
    formatarNumero: Handlebars.helpers.formatarNumero
};