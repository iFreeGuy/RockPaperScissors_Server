import { WebSocket } from 'ws';
import { BattlePlayer } from "./BattlePlayer";
import { Battle, BattleState } from "./Battle";
import { Queue } from '../../LibShare/dist/Collections'
import { logger } from '../../LibShare/dist/Utils'
import { WSMessage } from "./WSMessage";


export class BattleManager
{
    private roomID_ : number = 1;
    private listWaiting_ : Queue<Battle> = new Queue<Battle>();
    private battlesBySocket_ = new Map<WebSocket, BattlePlayer>();


    joinBattleRoom(bplayer : BattlePlayer) : boolean
    {
        if (this.battlesBySocket_.get(bplayer.webSocket))
        {
            logger.error('socket is exist in joinBattleRoom');

            return false;
        }

        this.battlesBySocket_.set(bplayer.webSocket, bplayer);

        while(true)
        {
            if (this.listWaiting_.isEmpty)
            {
                let newRoom = new Battle(this.roomID_, bplayer);
                this.roomID_++;
                this.listWaiting_.enqueue(newRoom);

                break;
            }
    
            let room = this.listWaiting_.dequeue();
            if (room.brState == BattleState.Error)
            {
                continue;
            }

            room.playerB = bplayer;

            break;
        }

        return true;
    }

    clearBattleRoom(room : Battle)
    {
        let playerA = room.playerA;
        let playerB = room.playerB;

        if (playerA)
        {
            this.battlesBySocket_.delete(playerA.webSocket);
            // There is no way to close after sending all last messages.
            // So, I use setTimeout to send all last messages.
            setTimeout(function ()
            {
                playerA?.webSocket.close();
            }, 1000);        
        }

        if (playerB)
        {
            this.battlesBySocket_.delete(playerB.webSocket);
            setTimeout(function ()
            {
                playerB?.webSocket.close();
            }, 1000);        
        }
    }

    handleMessage(socket : WebSocket, message : WSMessage)
    {
        let battle = this.battlesBySocket_.get(socket);
        
        if (!battle)
        {
            logger.error('socket\'s battle is not found');

            socket.close();
            return;
        }
        
        battle.battle?.handleMessage(socket, message);
    }

    handleSocketClose(socket : WebSocket)
    {
        let battle = this.battlesBySocket_.get(socket);
        battle?.battle?.handleSocketClose(socket);
    }
}


export let battleManager = new BattleManager();




