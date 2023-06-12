import {Server, WebSocket, RawData} from 'ws';
import * as http from 'http';
import { gameServerConfig } from './GameServerConfig';
import { logger } from '../../LibShare/dist/Utils'
import { wsClientManager } from './WSClientManager';
import { WSMessage } from './WSMessage';
import * as DB from '../../LibShare/dist/DB'


DB.DBInit(gameServerConfig.MongoUrl, gameServerConfig.MongoDB).then(value => {
    if (!value)
    {
        logger.error("fail to init dbs");
        process.exit(0);
    }
});

let port = gameServerConfig.GameServerPort;
let wsGameServer = new Server({port:port});
logger.log(`GameServer is listening: ${port}`);

wsGameServer.on('connection', function(wsClient : WebSocket, req : http.IncomingMessage) {
    logger.log("client(" + req.socket.remoteAddress + ") is connected");

    wsClientManager.create(wsClient, req);

    wsClient.on('message', function(message : RawData) {

        try 
        {
            let wsMsg : WSMessage = JSON.parse(message.toString());

            wsClientManager.handleMessage(wsClient, wsMsg);
        } 
        catch( err : any)
        {
            logger.error(`client message handling error : ${message.toString()}`);
            logger.error(`${(<Error>err).message}`);
            logger.error(`${(<Error>err).stack}`);

            wsClient.close();
        }
    });

    wsClient.on('error', (error : Error) => {
        let client = wsClientManager.getClient(wsClient);
        if (client)
        {
            logger.log(`wsClient error: ${client.remoteAddress}, ${client.userID}`);
        }
        else 
        {
            logger.log('wsClient error:');
        }
        logger.error(`wsClient error : ${error.message}`);
        logger.error(`${error.stack}`);

        wsClient.close();
    });
    
    wsClient.on('close', function() {
        let client = wsClientManager.getClient(wsClient);
        if (client)
        {
            logger.log(`client(${client.remoteAddress}, ${client.userID}) is disconnected`);
        }
        else 
        {
            logger.log('client disconnected: unknown');
        }
        
        wsClientManager.remove(wsClient);
    });
});

wsGameServer.on('error', (error : Error) => {
    logger.error(`wsGameServer error : ${error.message}`);
    logger.error(`${error.stack}`);
});


