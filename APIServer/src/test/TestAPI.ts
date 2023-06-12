import express from 'express'
import * as utils from '../../../LibShare/dist/Utils'
import * as common from '../../../LibShare/dist/Common'


async function hello(req : express.Request, res : express.Response)
{
    res.send('hello...');
}

async function echo(req : express.Request, res : express.Response)
{
    utils.logger.log('echo...');
    utils.logger.log(req.body);
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify(req.body));
    res.end();
}

var apiTest = express.Router();
apiTest.get('/hello', common.FnTryCatch(hello));
apiTest.post('/echo', common.FnTryCatch(echo));

export {apiTest};
