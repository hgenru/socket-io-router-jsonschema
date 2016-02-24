'use strict';
const co = require('co');
const chai = require('chai');
chai.should();
chai.use(require('chai-like'));
const ajvFresh = require('ajv');

const utils = require('./utils');

const Router = require('socket-io-router');
const schema = require('../lib');

const TEST_SCHEMA1 = {
    '$schema': 'http://json-schema.org/draft-04/schema#',
    'name': 'Abuse',
    'type': 'object',
    'properties': {
        'field1': {'type': 'number'}
    },
    'required': ['field1']
};

describe('schema', function() {
    let server;
    let router;
    let done;
    let ajv;

    beforeEach(co.wrap(function*() {
        server = yield utils.createServer();
        router = new Router(server);
        done = utils.done();
        ajv = ajvFresh();
    }));

    it('test input on good data', co.wrap(function*() {
        let config = {data: ajv.compile(TEST_SCHEMA1)};
        router.route('test', [schema(config), done.resolve]);
        let client = utils.createClient(server);
        yield client._connect;
        client.emit(':test', {field1: 1});
        yield done;
    }));

    it('test input on wrong data', co.wrap(function*() {
        let config = {
            data: ajv.compile(TEST_SCHEMA1)
        };
        router.route('test', [schema(config), done.reject]);
        let client = utils.createClient(server);
        yield client._connect;
        client.on(':test:error', (data) => {
            data.should.have.property('code', 400);
            data.should.have.property('errors');
            done.resolve();
        });
        client.emit(':test', {field1: '1'});
        yield done;
    }));

    it('test result on good data', co.wrap(function*() {
        let config = {success: ajv.compile(TEST_SCHEMA1)};
        router.route('test', [
            schema(config),
            (ctx) => ctx.success({field1: 1})
        ]);
        let client = utils.createClient(server);
        yield client._connect;
        client.on(':test:success', done.resolve);
        client.on(':test:error', done.reject);
        client.emit(':test');
        yield done;
    }));
});
