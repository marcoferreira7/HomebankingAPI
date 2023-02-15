'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const fs = require('fs');
const Jwt = require('@hapi/jwt');
const jsonwebtoken = require("jsonwebtoken");
const Joi = require("joi");
const JWT_SECRET = "some_shared_secret";


const init = async () => {

    // Configuração Hapi

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    // Configuração Swagger e Autorização JWT

    const swaggerOptions = {
        info: {
            title: 'Test API Documentation',
            version: Pack.version,
        },
        securityDefinitions: {
            jwt: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header'
            }
        },
        security: [{ jwt: [] }],
    };

    // Configuração dos Plug-ins Swagger

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);

    // Configuração JWT - Retorna um token e chama a funçao Validate para retornar Token

    await server.register(Jwt);

    server.auth.strategy('my_jwt_strategy', 'jwt', {
        keys: JWT_SECRET,
        verify: false,
        validate: (artifacts, request, h) => {

            return {
                isValid: true,
                credentials: { email: artifacts.decoded.payload.email }
            };
        }
    });

    // Definir tipo de autenticação JWT

    server.auth.default('my_jwt_strategy');

    // Configuração do Servidor

    server.route({
        method: 'GET',
        path: '/',
        options: {
            auth: false,
        },
        handler: (request, h) => {

            return h.redirect('/documentation');
        }
    });

    /**
    * Rota Subscribe - Cria Utilizador na Base de Dados (test.json)
    */

    server.route({
        method: 'POST',
        path: '/subscribe',
        options: {
            description: 'Cria utilizador na base de dados',
            notes: 'Verificar se o utilizador já existe, se não existir é criado',
            auth: false,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().required(),
                    password: Joi.string().required()
                })
            }
        },
        handler: (request, h) => {
            let basededados;
            let basededadosstring;
            let user_para_gravar
            user_para_gravar = request.payload;
            user_para_gravar.fundos = 0;
            try {
                basededadosstring = fs.readFileSync('test.json', 'utf8');
                basededados = JSON.parse(basededadosstring);
                if (request.payload.email === basededados.email) {
                    // Verifica se o email já existe
                    return 'Ja existe';
                } else {
                    // Utilizar JSON.stringify para transformar o ficheiro JSON em texto
                    const data = fs.writeFileSync('test.json', JSON.stringify(user_para_gravar), { flag: 'w+' });
                    return 'Guardado com sucesso';
                }
            } catch (err) {
                console.log(err);
            }
        }
    });

    /**
     * Rota Login - Login do Utilizador criado (retorna token JWT se o utilizador existir)
     */

    server.route({
        method: 'POST',
        path: '/login',
        options: {
            description: 'Login do Utilizador criado',
            notes: 'Verificar se os valores do utilizador coincidem (email e password), retorna token se o utilizador existir',
            auth: false,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().required(),
                    password: Joi.string().required()
                })
            }
        },
        handler: (request, h) => {
            let basededados;
            let basededadosstring;
            try {
                basededadosstring = fs.readFileSync('test.json', 'utf8');
                // Passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                if (request.payload.email === basededados.email) {
                    if (request.payload.password === basededados.password) {
                        // Verifica se os valores coincidem
                        const jwt = jsonwebtoken.sign({ sub: basededados.email }, JWT_SECRET);
                        // Retorna token JWT se o utilizador existir
                        return { jwt };
                    } else {
                        return 'Password errada';
                    }
                } else {
                    return 'Email não registado';
                }

            } catch (err) {
                return err;
            }
        }
    });

    /**
     * Rota Funds (GET) - Retorna o valor dos fundos do utilizador
     */

    server.route({
        method: 'GET',
        path: '/funds',
        options: {
            description: 'Retorna o valor dos fundos da conta do utilizador',
            notes: 'Acesso à conta criada e verifica os fundos da mesma',
            tags: ['api'],
        },
        handler: (request, h) => {
            let basededados;
            let basededadosstring;
            try {
                basededadosstring = fs.readFileSync('test.json', 'utf8');
                // Passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                return basededados.fundos;
            }
            catch (err) {
                return err;
            }
        }
    });

    /**
     * Rota Funds (PUT) - Deposita o valor que o utilizador pretende na conta
     */

    server.route({
        method: 'PUT',
        path: '/funds',
        options: {
            description: 'Depositar o valor que o utilizador pretende na conta',
            notes: 'Verifica se os valores do utilizador coincidem (email), insere o valor pretendido se o utilizador existir',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().required(),
                    fundos: Joi.number().required()
                })
            }
        },
        handler: (request, h) => {
            let basededados;
            let basededadosstring;
            try {
                basededadosstring = fs.readFileSync('test.json', 'utf8');
                // Passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                if (request.payload.email === basededados.email) {
                    // Adiciona o valor de fundos à conta do utilizador
                    basededados.fundos = basededados.fundos + request.payload.fundos;
                    const data = fs.writeFileSync('test.json', JSON.stringify(basededados), { flag: 'w+' });
                    return 'Fundos adicionados!';
                } else {
                    return 'Sem sucesso'
                }
            } catch (err) {
                return err;
            }
        }
    });

    /**
     * Rota Funds (DELETE) - Retira o valor que o utilizador pretende da conta
     */

    server.route({
        method: 'DELETE',
        path: '/funds',
        options: {
            description: 'Retira o valor que o utilizador pretende da conta',
            notes: 'Verifica se os valores do utilizador coincidem (email) e retira o valor pretendido se o utilizador existir. Verifica se a quantia não é maior do que o total disponível',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().required(),
                    fundos: Joi.number().required()
                })
            }
        },
        handler: (request, h) => {
            let basededados;
            let basededadosstring;
            try {
                basededadosstring = fs.readFileSync('test.json', 'utf8');
                // Passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                if (request.payload.email === basededados.email) {
                    // Verifica se a quantia não é maior do que o total disponível
                    if (request.payload.fundos > basededados.fundos) {
                        return 'Saldo insuficiente';
                    } else {
                        // Retira o valor que o utilizador pretende
                        basededados.fundos = basededados.fundos - request.payload.fundos;
                        const data = fs.writeFileSync('test.json', JSON.stringify(basededados), { flag: 'w+' })
                    }
                    return 'Fundos retirados!';
                } else {
                    return "Email nao registado";
                }
            } catch (err) {
                return err;
            }
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();