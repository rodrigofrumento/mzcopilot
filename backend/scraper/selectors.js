// Todos os seletores CSS do scraping ficam aqui.
// Se o MZ atualizar o HTML, só precisa mexer neste arquivo.

module.exports = {
  login: {
    usernameInput: 'input[name="username"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'input[type="submit"], button[type="submit"]',
    postLoginIndicator: '#top_bar_teamname, .team-name, #clubhouse_content',
  },
};
