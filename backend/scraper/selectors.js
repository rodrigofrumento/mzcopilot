// Todos os seletores CSS do scraping ficam aqui.
// Se o MZ atualizar o HTML, só precisa mexer neste arquivo.

module.exports = {
  squad: {
    // A tabela correta do Squad Summary — células: No | Name | Value | Salary | Age | Born | skills...
    summaryReady: '#playerAltViewTable a[href*="pid="]',
    playerLink: '#playerAltViewTable a[href*="pid="]',
  },

  login: {
    usernameInput: '#login_username',
    passwordInput: '#login_password',
    // Clique via JS para garantir que o evento do MD5 dispara
    submitButton: null,
  },
};
