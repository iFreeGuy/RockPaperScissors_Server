import { WebSocket } from 'ws';
import { BattlePlayer } from "./BattlePlayer";
import { logger } from "../../LibShare/dist/Utils";
import { WSMessage, WSMessageID, PlayerChoice } from "./WSMessage";
import * as MessageType from './WSMessage';
import { battleManager } from './BattleManager';
import { wsClientManager } from './WSClientManager';



export enum BattleState
{
    Error = -1,
    Making = 0,
    Start = 1,
    Playing = 2,
    End = 3
}

export enum BattleErrorState
{
    FailToStart = -1,
    None = 0,
}

export enum BattleGameState
{
    Error = -1,
    NotStarted = 0,
    PlayATurn = 1,
    PlayBTurn = 2,
    End = 3
}

export enum BattleResult
{
    WinPlayerA = 0,
    WinPlayerB = 1,
    Draw = 2,
}

export type GamePlayResult = {
    winCount : number;
    loseCount : number;
    drawCount : number;
}

export class Battle
{
    private id_ : number;
    private playerA_? : BattlePlayer;
    private playerB_? : BattlePlayer;
    private state_ : BattleState = BattleState.Making;
    private errorState_ : BattleErrorState = BattleErrorState.None;
    private round_ : number = 1;
    private battleGameState_ : BattleGameState = BattleGameState.NotStarted;
    
    private playerAChoice_ : MessageType.PlayerChoice = MessageType.PlayerChoice.Paper;
    private playerBChoice_ : MessageType.PlayerChoice = MessageType.PlayerChoice.Paper;

    private playerAGameResult_ : GamePlayResult = {
        winCount : 0,
        loseCount : 0,
        drawCount : 0
    }

    private playerBGameResult_ : GamePlayResult = {
        winCount : 0,
        loseCount : 0,
        drawCount : 0
    }

    constructor(id : number, player : BattlePlayer)
    {
        this.id_ = id;

        this.playerA_ = player;
        player.battle = this;
    }

    get playerA() : BattlePlayer | undefined
    {
        return this.playerA_;
    }

    get playerB() : BattlePlayer | undefined
    {
        return this.playerB_;
    }

    set playerB(player : BattlePlayer | undefined)
    {
        if (this.playerA_ == player)
        {
            logger.error('trying to set playerB same to playerA');
            return;
        }

        this.playerB_ = player;
        if (player)
        {
            player.battle = this;
        }

        this.round_ = 1;
        this.playerAGameResult_.winCount = 0;
        this.playerAGameResult_.loseCount = 0;
        this.playerAGameResult_.drawCount = 0;
        this.playerBGameResult_.winCount = 0;
        this.playerBGameResult_.loseCount = 0;
        this.playerBGameResult_.drawCount = 0;
    
        this.battleStart();
    }

    get isFull()
    {
        return (this.playerA_ && this.playerB_);
    }

    get brState() : BattleState
    {
        return this.state_;
    }

    setBattleStateToError()
    {
        this.state_ = BattleState.Error;
    }

    battleNextStart()
    {
        this.round_++;

        if (3 < this.round_)
        {
            this.endGame();
        }
        else
        {
            this.battleStart();
        }
    }

    battleStart()
    {
        if (!this.isFull)
        {
            this.state_ = BattleState.Error;
            this.errorState_ = BattleErrorState.FailToStart;

            logger.error('player A or B is not set when trying to start a battle');

            return;
        }

        this.state_ = BattleState.Start;
        this.startGame();
    }

    startGame()
    {
        this.refreshPlayerSessions();

        let wsData : MessageType.WSDataBattleStart = {
            round : this.round_,
        }

        let wsSendMsg : WSMessage = {
            messageID : WSMessageID.BattleStart,
            data : JSON.stringify(wsData)
        };

        this.playerA_?.webSocket.send(JSON.stringify(wsSendMsg));
        this.playerB_?.webSocket.send(JSON.stringify(wsSendMsg));

        this.state_ = BattleState.Playing;
        this.battleGameState_ = BattleGameState.PlayATurn;
        this.playerA_?.webSocket.send(JSON.stringify(MessageType.WSMsgPlayTurn));
    }

    endGame()
    {
        let playerAResult : MessageType.WSDataGamePlayResult = {
            WinCount : this.playerAGameResult_.winCount,
            LoseCount : this.playerAGameResult_.loseCount,
            DrawCount : this.playerAGameResult_.drawCount,
        }

        let sndMsgPlayerA : WSMessage = {
            messageID : WSMessageID.GamePlayResult,
            data : JSON.stringify(playerAResult)
        };

        this.playerA_?.webSocket.send(JSON.stringify(sndMsgPlayerA));

        let playerBResult : MessageType.WSDataGamePlayResult = {
            WinCount : this.playerBGameResult_.winCount,
            LoseCount : this.playerBGameResult_.loseCount,
            DrawCount : this.playerBGameResult_.drawCount,
        }

        let sndMsgPlayerB : WSMessage = {
            messageID : WSMessageID.GamePlayResult,
            data : JSON.stringify(playerBResult)
        };

        this.playerB_?.webSocket.send(JSON.stringify(sndMsgPlayerB));

        this.state_ = BattleState.End;

        this.refreshPlayerSessions();

        battleManager.clearBattleRoom(this);
    }

    refreshPlayerSessions()
    {
        if (this.playerA_?.webSocket)
        {
            wsClientManager.refreshClientSession(this.playerA_?.webSocket);
        }

        if (this.playerB_?.webSocket)
        {
            wsClientManager.refreshClientSession(this.playerB_?.webSocket);
        }
    }

    handleMessage(socket : WebSocket, message : WSMessage)
    {
        try 
        {
            switch(message.messageID)
            {
                case WSMessageID.PlayMyHand:
                    this.handleMessagePlayMyHand(socket, message);
                    break;
    
                default:
                    logger.error(`Unknown message ID: ${message.messageID}`);
                    socket.close();
                    break;
            }
        }
        catch( err : any )
        {
            logger.error(`client wsMessage handling error : ${message.messageID} : [${message.data.toString()}]`);
            logger.error(`${(<Error>err).message}`);
            logger.error(`${(<Error>err).stack}`);
    
            socket.close();
        }
    }

    handleMessagePlayMyHand(socket : WebSocket, message : WSMessage)
    {
        if (this.state_ != BattleState.Playing)
        {
            logger.error(`Wrong state: ${this.state_} in handleMessagePlayMyHand`);

            return;
        }

        if (this.battleGameState_ == BattleGameState.PlayATurn)
        {
            if (this.playerA_?.webSocket != socket)
            {
                logger.error(`Wrong play: playerA's turn but playerB's hand in handleMessagePlayMyHand`);
    
                return;
            }

            let wsMsg : MessageType.WSDataPlayerHand = JSON.parse(message.data);
            this.playerAChoice_ = wsMsg.choice;

            this.battleGameState_ = BattleGameState.PlayBTurn;
            this.playerB_?.webSocket.send(JSON.stringify(MessageType.WSMsgPlayTurn));

            return;
        }
        else if (this.battleGameState_ == BattleGameState.PlayBTurn)
        {
            if (this.playerB_?.webSocket != socket)
            {
                logger.error(`Wrong play: playerB's turn but playerA's hand in handleMessagePlayMyHand`);
                socket.close();
    
                return;
            }

            let wsMsg : MessageType.WSDataPlayerHand = JSON.parse(message.data);
            this.playerBChoice_ = wsMsg.choice;
            let result = this.judgeBattle();
            if (result == BattleResult.WinPlayerA)
            {
                let dataA : MessageType.WSDataBattlePlayResult = {
                    result : MessageType.BattlePlayResult.Win,
                    yourChoice : this.playerAChoice_,
                    opponentChoice : this.playerBChoice_
                };
                
                let msgA : WSMessage = {
                    messageID : WSMessageID.BattleResult,
                    data : JSON.stringify(dataA)
                }

                this.playerA_?.webSocket.send(JSON.stringify(msgA));

                let dataB : MessageType.WSDataBattlePlayResult = {
                    result : MessageType.BattlePlayResult.Lose,
                    yourChoice : this.playerBChoice_,
                    opponentChoice : this.playerAChoice_
                };
                
                let msgB : WSMessage = {
                    messageID : WSMessageID.BattleResult,
                    data : JSON.stringify(dataB)
                }

                this.playerB_?.webSocket.send(JSON.stringify(msgB));

                this.playerAGameResult_.winCount++;
                this.playerBGameResult_.loseCount++;
            }
            else if (result == BattleResult.WinPlayerB)
            {
                let dataA : MessageType.WSDataBattlePlayResult = {
                    result : MessageType.BattlePlayResult.Lose,
                    yourChoice : this.playerAChoice_,
                    opponentChoice : this.playerBChoice_
                };
                
                let msgA : WSMessage = {
                    messageID : WSMessageID.BattleResult,
                    data : JSON.stringify(dataA)
                }

                this.playerA_?.webSocket.send(JSON.stringify(msgA));

                let dataB : MessageType.WSDataBattlePlayResult = {
                    result : MessageType.BattlePlayResult.Win,
                    yourChoice : this.playerBChoice_,
                    opponentChoice : this.playerAChoice_
                };
                
                let msgB : WSMessage = {
                    messageID : WSMessageID.BattleResult,
                    data : JSON.stringify(dataB)
                }

                this.playerB_?.webSocket.send(JSON.stringify(msgB));

                this.playerAGameResult_.loseCount++;
                this.playerBGameResult_.winCount++;
            }
            else // Draw
            {
                let dataA : MessageType.WSDataBattlePlayResult = {
                    result : MessageType.BattlePlayResult.Draw,
                    yourChoice : this.playerAChoice_,
                    opponentChoice : this.playerBChoice_
                };
                
                let msgA : WSMessage = {
                    messageID : WSMessageID.BattleResult,
                    data : JSON.stringify(dataA)
                }

                this.playerA_?.webSocket.send(JSON.stringify(msgA));

                let dataB : MessageType.WSDataBattlePlayResult = {
                    result : MessageType.BattlePlayResult.Draw,
                    yourChoice : this.playerBChoice_,
                    opponentChoice : this.playerAChoice_
                };
                
                let msgB : WSMessage = {
                    messageID : WSMessageID.BattleResult,
                    data : JSON.stringify(dataB)
                }

                this.playerB_?.webSocket.send(JSON.stringify(msgB));

                this.playerAGameResult_.drawCount++;
                this.playerBGameResult_.drawCount++;
            }

            this.battleGameState_ = BattleGameState.End;

            this.battleNextStart();
        }
        else 
        {
            logger.error(`Wrong battle game state: ${this.battleGameState_} in handleMessagePlayMyHand`);
            socket.close();

            return;
        }
    }

    judgeBattle() : BattleResult
    {
        if (this.playerAChoice_ == PlayerChoice.Paper && this.playerBChoice_ == PlayerChoice.Rock)
        {
            return BattleResult.WinPlayerA;
        }
        else if (this.playerAChoice_ == PlayerChoice.Paper && this.playerBChoice_ == PlayerChoice.Scissors)
        {
            return BattleResult.WinPlayerB;
        }
        else if (this.playerAChoice_ == PlayerChoice.Rock && this.playerBChoice_ == PlayerChoice.Scissors)
        {
            return BattleResult.WinPlayerA;
        }
        else if (this.playerAChoice_ == PlayerChoice.Rock && this.playerBChoice_ == PlayerChoice.Paper)
        {
            return BattleResult.WinPlayerB;
        }
        else if (this.playerAChoice_ == PlayerChoice.Scissors && this.playerBChoice_ == PlayerChoice.Paper)
        {
            return BattleResult.WinPlayerA;
        }
        else if (this.playerAChoice_ == PlayerChoice.Scissors && this.playerBChoice_ == PlayerChoice.Rock)
        {
            return BattleResult.WinPlayerB;
        }
        else
        {
            return BattleResult.Draw;
        }
    }

    handleSocketClose(socket : WebSocket)
    {
        if (this.playerA?.webSocket == socket)
        {
            this.playerA_ = undefined;
        } 
        else if (this.playerB?.webSocket == socket)
        {
            this.playerB_ = undefined;
        }

        switch(this.state_)
        {
            case BattleState.Making:
                this.state_ = BattleState.Error;
                break;

            case BattleState.Start:
            case BattleState.Playing:
                {
                    this.state_ = BattleState.End;

                    if (this.playerA)
                    {
                        this.playerA_?.webSocket.send(JSON.stringify(MessageType.WSMsgOpponentOut));
                        this.playerA_?.webSocket.close();
                        this.playerA_ = undefined;
                    }

                    if (this.playerB)
                    {
                        this.playerB_?.webSocket.send(JSON.stringify(MessageType.WSMsgOpponentOut));
                        this.playerB_?.webSocket.close();
                        this.playerB_ = undefined;
                    }
                }
                break;
    
            case BattleState.End:
            case BattleState.Error:
                break;
            
            default:
                logger.error(`Unknown state(${this.state_}) in handleSocketClose`);
                break;
        }
    }
}










