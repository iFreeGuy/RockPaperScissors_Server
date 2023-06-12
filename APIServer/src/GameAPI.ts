import express from 'express'
import {FnTryCatch} from '../../LibShare/dist/Common'
import * as message from '../../LibShare/dist/APIMessage'
import * as utils from '../../LibShare/dist/Utils'
import {sessionInfo, sessionInfoKey, sessionManager} from '../../LibShare/dist/Session'
import { gameServerManager } from '../../LibShare/src/GameServerManager'


async function playGame(req : express.Request, res : express.Response)
{
    var sessionKey = req.body.sessionKey;

    var msg : message.APIMessage = message.msgUnknown;

    if (sessionKey == undefined)
    {
        utils.logger.error('some parameters are undefined in playGame');

        msg = {
            messageID : message.APIMessageID.PlayGame,
            resultCode : message.APIResultCode.Fail,
            data : "{}",
        }

        message.sendMessage(res, msg);

        return;
    }

    let error = true;
    let session = await sessionManager.getSessionInfo(sessionKey);
    if (session)
    {
        let info = gameServerManager.getAvailableGameServerInfo();

        if (info)
        {
            let data : message.APIReplayPlayGame = {
                ip : info.ip,
                port : info.port
            }
    
            msg = {
                messageID : message.APIMessageID.PlayGame,
                resultCode : message.APIResultCode.Success,
                data : JSON.stringify(data),
            }

            error = false;
        }
    }
    
    if (error)
    {
        msg = {
            messageID : message.APIMessageID.PlayGame,
            resultCode : message.APIResultCode.Fail,
            data : "{}",
        }
    }

    message.sendMessage(res, msg);
}


var apiGame = express.Router();
apiGame.post('/playGame', FnTryCatch(playGame));

export {apiGame};

