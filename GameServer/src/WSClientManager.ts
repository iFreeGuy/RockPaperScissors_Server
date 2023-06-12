import { WebSocket } from 'ws';
import { WSClient, WSClientState } from './WSClient';
import * as http from 'http';
import { WSMessage } from './WSMessage';
import { battleManager } from './BattleManager';


export class WSClientManager
{
    clientsBySocket = new Map<WebSocket, WSClient>()
    stateListConnected = new Set<WSClient>();
    stateListLogin = new Set<WSClient>();
    stateListBattle = new Set<WSClient>();

    create(socket: WebSocket, req : http.IncomingMessage)
    {
        let client : WSClient = new WSClient(this, socket, req.socket.remoteAddress);
        client.setState(WSClientState.Connected);

        this.setClientState(client, WSClientState.Connected);
        
        this.clientsBySocket.set(socket, client);
    }

    setClientState(client : WSClient, state: WSClientState)
    {
        this.removeFromStateList(client);

        switch (state)
        {
            case WSClientState.Connected:
                client.setState(WSClientState.Connected);
                this.stateListConnected.add(client);
                break;

            case WSClientState.Login:
                client.setState(WSClientState.Login);
                this.stateListLogin.add(client);
                break;

            case WSClientState.Battle:
                client.setState(WSClientState.Battle);
                this.stateListBattle.add(client);
                break;
        }
    }

    private removeFromStateList(client : WSClient)
    {
        switch(client.getState())
        {
            case WSClientState.Connected:
                this.stateListConnected.delete(client);
                break;

            case WSClientState.Login:
                this.stateListLogin.delete(client);
                break;

            case WSClientState.Battle:
                this.stateListBattle.delete(client);
                break;
        }
    }

    getClient(socket: WebSocket) : WSClient | undefined
    {
        return this.clientsBySocket.get(socket);
    }

    refreshClientSession(socket: WebSocket)
    {
        this.clientsBySocket.get(socket)?.refreshSession();
    }

    remove(socket: WebSocket)
    {
        let client = this.clientsBySocket.get(socket);
        if (client)
        {
            if (client.getState() == WSClientState.Battle)
            {
                battleManager.handleSocketClose(socket);
            }

            this.removeFromStateList(client);
            this.clientsBySocket.delete(socket);
        }
    }

    handleMessage(socket : WebSocket, message : WSMessage)
    {
        let client = this.clientsBySocket.get(socket);
        if (client)
        {
            if (client.getState() == WSClientState.Battle)
            {
                battleManager.handleMessage(socket, message);
            }
            else 
            {
                client.handleMessage(message);
            }
        }
    }
}


export let wsClientManager = new WSClientManager();


