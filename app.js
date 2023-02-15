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

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

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

    // swagger

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);

    // jwt - retorna um token e chama a funçao validate para retornar token

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

    // Set the strategy

    server.auth.default('my_jwt_strategy');

    //

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

    // cria na base de dados

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
                    return 'Ja existe';
                } else {
                    // utilizar JSON.stringify para transformar o ficheiro JSON em texto
                    const data = fs.writeFileSync('test.json', JSON.stringify(user_para_gravar), { flag: 'w+' });
                    return 'Guardado com sucesso';
                }
                // arquivo escrito com sucesso
            } catch (err) {
                console.log(err);
            }
        }
    });

    // retorna token jwt se o user existir

    server.route({
        method: 'POST',
        path: '/login',
        options: {
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
                // passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                if (request.payload.email === basededados.email) {
                    if (request.payload.password === basededados.password) {
                        const jwt = jsonwebtoken.sign({ sub: basededados.email }, JWT_SECRET);
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

    // Retorna os fundos

    server.route({
        method: 'GET',
        path: '/funds',
        options: {
            tags: ['api'],
        },
        handler: (request, h) => {
            let basededados;
            let basededadosstring;
            try {
                basededadosstring = fs.readFileSync('test.json', 'utf8');
                // passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                return basededados.fundos;
            }
            catch (err) {
                return err;
            }
        }
    });

    // Depositar fundos

    server.route({
        method: 'PUT',
        path: '/funds',
        options: {
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
                // passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                if (request.payload.email === basededados.email) {
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

    // Retirar fundos

    server.route({
        method: 'DELETE',
        path: '/funds',
        options: {
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
                // passar de string para JSON
                basededados = JSON.parse(basededadosstring);
                if (request.payload.email === basededados.email) {
                    if (request.payload.fundos > basededados.fundos) {
                        return 'Saldo insuficiente';
                    } else {
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