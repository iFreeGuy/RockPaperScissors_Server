import { WebSocket } from 'ws';
import { BattleManager } from "./BattleManager";
import { Battle } from "./Battle";


export enum BattleState
{
    Waiting = 0,
    Start = 1,
    Playing = 2,
    End = 3,
}

export class BattlePlayer
{
    private battleManager_ : BattleManager;
    private socket_ : WebSocket;
    private battle_? : Battle;


    constructor(socket : WebSocket, battleManager : BattleManager)
    {
        this.socket_ = socket;
        this.battleManager_ = battleManager;
    }

    public set battle(battle : Battle | undefined)
    {
        this.battle_ = battle;
    }

    public get battle() : Battle | undefined
    {
        return this.battle_;
    }

    public get webSocket() : WebSocket
    {
        return this.socket_;
    }
}




