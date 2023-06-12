import { logger } from '../../LibShare/dist/Utils'
import { WebSocket, RawData } from 'ws';
import { WSMessage, WSMessageID } from './WSMessage';
import * as MessageType from './WSMessage';
import { sessionInfo, sessionInfoKey, sessionManager } from '../../LibShare/dist/Session'
import { WSClientManager } from './WSClientManager';
import { BattlePlayer } from './BattlePlayer';
import { battleManager } from './BattleManager';


export enum WSClientState
{
    None = 0,
    Connected = 1,
    Login = 2,
    Battle = 3,
}

export class WSClient
{
    wsClientManager : WSClientManager;
    socket : WebSocket;
    remoteAddress? : string;
    private state = WSClientState.None;
    private stateTime = 0;
    sessionKey? : string;
    userID? : string;


    constructor(wsClientManager : WSClientManager, socket : WebSocket, remoteAddress? : string)
    {
        this.wsClientManager = wsClientManager;
        this.socket = socket;
        this.remoteAddress = remoteAddress;
    }

    setState(state : WSClientState)
    {
        this.state = state;
        this.stateTime = Date.now();
    }

    getState() : WSClientState
    {
        return this.state;
    }

    getStateTime() : number
    {
        return this.stateTime;
    }

    // packet handling
    async handleMessage(message : WSMessage)
    {
        console.log(JSON.stringify(message));

        try
        {
            switch(message.messageID)
            {
                case WSMessageID.Login:
                    await this.handleMessageLogin(message);
                    break;
    
                case WSMessageID.PlayGame:
                    await this.handleMessagePlayGame(message);
                    break;
        
                default:
                    logger.error(`Unknown message ID: ${message.messageID}`);
                    this.socket.close();
                    break;
            }
        }
        catch( err : any )
        {
            logger.error(`client wsMessage handling error : ${message.messageID} : [${message.data.toString()}]`);
            logger.error(`${(<Error>err).message}`);
            logger.error(`${(<Error>err).stack}`);
    
            this.socket.close();
        }
    }

    async handleMessageLogin(message : WSMessage)
    {
        let wsMsg : MessageType.WSDataLogin;
    
        wsMsg = JSON.parse(message.data);

        let session = await sessionManager.getSessionInfo(wsMsg.sessionKey);
        if (!session)
        {
            let wsDataError : MessageType.WSDataError = {
                resultCode : MessageType.WSResultCode.ErrorSessionNotFound
            }

            let wsSendMsg : MessageType.WSMessage = {
                messageID : MessageType.WSMessageID.LoginReply,
                data : JSON.stringify(wsDataError)
            }

            this.socket.send(JSON.stringify(wsSendMsg));
            this.socket.close();

            return;
        }

        this.sessionKey = wsMsg.sessionKey;
        this.userID = session.infos().get(sessionInfoKey.id)!;

        this.wsClientManager.setClientState(this, WSClientState.Login);

        let wsDataError : MessageType.WSDataError = {
            resultCode : MessageType.WSResultCode.Success
        }

        let wsSendMsg : MessageType.WSMessage = {
            messageID : MessageType.WSMessageID.LoginReply,
            data : JSON.stringify(wsDataError)
        }

        this.socket.send(JSON.stringify(wsSendMsg));
    }

    async handleMessagePlayGame(message : WSMessage)
    {
        if (this.state != WSClientState.Login)
        {
            let wsDataError : MessageType.WSDataError = {
                resultCode : MessageType.WSResultCode.ErrorWrongMessage
            }

            let wsSendMsg : MessageType.WSMessage = {
                messageID : MessageType.WSMessageID.PlayGameReply,
                data : JSON.stringify(wsDataError)
            }

            this.socket.send(JSON.stringify(wsSendMsg));
            this.socket.close();

            return;
        }


        let wsDataError : MessageType.WSDataError = {
            resultCode : MessageType.WSResultCode.Success
        }

        let wsSendMsg : MessageType.WSMessage = {
            messageID : MessageType.WSMessageID.PlayGameReply,
            data : JSON.stringify(wsDataError)
        }

        this.socket.send(JSON.stringify(wsSendMsg));
        
        this.wsClientManager.setClientState(this, WSClientState.Battle);

        let bplayer = new BattlePlayer(this.socket, battleManager);
        battleManager.joinBattleRoom(bplayer);
    }

    refreshSession()
    {
        if (this.sessionKey)
        {
            sessionManager.getSessionInfo(this.sessionKey);
        }
    }
}









