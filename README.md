# HomebankingAPI

Este projeto destina-se a um desafio proposto pela empresa Sysnovare.

## Instruções para uso da aplicação

- Fazer clone/download do zip
- Correr `npm install`
- Correr `node app.js`
- Abrir `http://localhost:3000` num browser
- Criar utilizador (email e password)
- Obter token
- Login do utilizador que foi criado (utilizar token que foi automaticamente criado)
- Para o reconhecimento do token, escrever `Bearer` e em seguida o token
- Acesso à conta que foi criada e a sua funcionalidade Homebanking (valor existente na conta, depósito de fundos e retirar fundos)

## Descrição de funcionalidades

- Criação de um novo utilizador num sistema de ficheiros (substituição de base de dados)
- Validação de Login para um utilizador existente (acesso a rotas privadas)
- Preenchimento de campos obrigatórios (Email e Password)
- Verificar, Adicionar e Remover Fundos
- Validações de Adição e Remoção de Fundos
- Validação Não Remover Fundos se a quantia for maior do que o total disponível
- Utilização de Swagger para o interface do projeto e os seus plug-ins (Inert e Vision)
- Utilização de JWT para rotas públicas/privadas
- Utilização de JSONWEBTOKEN para criação de token
