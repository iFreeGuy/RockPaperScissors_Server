import express from 'express'
import * as common from '../../LibShare/dist/Common'
import * as utils from '../../LibShare/dist/Utils'
import * as message from '../../LibShare/dist/APIMessage'
import * as DB from '../../LibShare/dist/DB'
import {sessionInfo, sessionInfoKey, sessionManager} from '../../LibShare/dist/Session'


async function login(req : express.Request, res : express.Response)
{
    var id = req.body.id;
    var password = req.body.password;

    var msg : message.APIMessage;

    if (id == undefined || password == undefined)
    {
        utils.logger.error('some parameters are undefined in login');
            
        msg = {
            messageID : message.APIMessageID.Login,
            resultCode : message.APIResultCode.Fail,
            data : "{}",
        }

        message.sendMessage(res, msg);

        return;
    }

    let collection = DB.mongoDB.collection('Users');
    const find = await collection.find({_id: id, password: password}).toArray();
    if (find.length == 1)
    {
        let session = await sessionManager.create(id);
        
        let data : message.APIReplayLoginOkay = {
            sessionKey : session.ID()
        }

        msg = {
            messageID : message.APIMessageID.Login,
            resultCode : message.APIResultCode.Success,
            data : JSON.stringify(data),
        }
    }
    else 
    {
        msg = {
            messageID : message.APIMessageID.Login,
            resultCode : message.APIResultCode.Fail,
            data : "{}",
        }
    }

    message.sendMessage(res, msg);
}

async function checkLogin(req : express.Request, res : express.Response)
{
    var sessionKey = req.body.sessionKey;

    var msg : message.APIMessage;

    if (sessionKey == undefined)
    {
        utils.logger.error('some parameters are undefined in checkLogin');

        msg = {
            messageID : message.APIMessageID.CheckLogin,
            resultCode : message.APIResultCode.Fail,
            data : "{}",
        }

        message.sendMessage(res, msg);

        return;
    }

    let session = await sessionManager.getSessionInfo(sessionKey);
    if (session)
    {
        let data : message.APIReplayCheckLogin = {
            login : session.infos().get(sessionInfoKey.login)!
        }

        msg = {
            messageID : message.APIMessageID.CheckLogin,
            resultCode : message.APIResultCode.Success,
            data : JSON.stringify(data),
        }
    }
    else
    {
        msg = {
            messageID : message.APIMessageID.CheckLogin,
            resultCode : message.APIResultCode.NotLogin,
            data : "{}",
        }
    }

    message.sendMessage(res, msg);
}


async function logout(req : express.Request, res : express.Response)
{
    var sessionKey = req.body.sessionKey;

    var msg : message.APIMessage;

    if (sessionKey == undefined)
    {
        utils.logger.error('some parameters are undefined in logout');

        msg = {
            messageID : message.APIMessageID.Logout,
            resultCode : message.APIResultCode.Fail,
            data : "{}",
        }

        message.sendMessage(res, msg);

        return;
    }

    let session = await sessionManager.getSessionInfo(sessionKey)
    if (session)
    {
        let id = session.infos().get(sessionInfoKey.id);

        sessionManager.remove(id!, sessionKey);

        let data = message.APIReplayEmpty;

        msg = {
            messageID : message.APIMessageID.Logout,
            resultCode : message.APIResultCode.Success,
            data : JSON.stringify(data),
        }
    }
    else
    {
        msg = {
            messageID : message.APIMessageID.Logout,
            resultCode : message.APIResultCode.NotLogin,
            data : "{}",
        }
    }

    message.sendMessage(res, msg);
}


var apiLogin = express.Router();
apiLogin.post('/login', common.FnTryCatch(login));
apiLogin.post('/checkLogin', common.FnTryCatch(checkLogin));
apiLogin.post('/logout', common.FnTryCatch(logout));

export {apiLogin};





