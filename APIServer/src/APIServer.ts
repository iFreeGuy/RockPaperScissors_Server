import {apiServerConfig} from './APIServerConfig'
import express from 'express'
import {apiTest} from './test/TestAPI'
import {apiLogin} from './LoginAPI'
import {apiGame} from './GameAPI'
import * as message from '../../LibShare/dist/APIMessage'
import * as utils from '../../LibShare/dist/Utils'
import * as DB from '../../LibShare/dist/DB'
import {gameServerManager} from '../../LibShare/dist/GameServerManager'



gameServerManager.init().then(value => {
    if (!value)
    {
        utils.logger.error("fail to init gameServerManager");
        process.exit(0);
    }
});

DB.DBInit(apiServerConfig.MongoUrl, apiServerConfig.MongoDB).then(value => {
    if (!value)
    {
        utils.logger.error("fail to init dbs");
        process.exit(0);
    }
});


const app = express();

app.use(express.json());

app.use('/test', apiTest);
app.use('/', apiLogin);
app.use('/', apiGame);


// error handler
app.use(function (err : any, req : express.Request, res : express.Response, next : express.NextFunction) {
    
    utils.logger.error(`express handler error : ${(<Error>err).message}`);
    utils.logger.error(`${(<Error>err).stack}`);

    message.sendMessage(res, message.msgUnknown);
});


const server = app.listen(apiServerConfig.MainServerPort, () => {
    utils.logger.log(`APIServer: localhost: ${apiServerConfig.MainServerPort}`);
});





