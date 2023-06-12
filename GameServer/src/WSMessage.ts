export enum WSMessageID
{
    UnknownError = 0,
    Login = 1,
    LoginReply = 2,
    PlayGame = 3,
    PlayGameReply = 4,
    PlayerTurn = 5,
    PlayMyHand = 6,
    BattleStart = 8,
    BattleResult = 9,
    GamePlayResult = 10,
    OpponentOut = 11,
}

export interface WSMessage
{
    messageID : WSMessageID;
    data : string;
}

export enum WSResultCode
{
    Success = 0,
    ErrorSessionNotFound = -1,
    ErrorWrongMessage = -2,
}

export type WSDataLogin = {
    sessionKey : string;
}

export type WSDataError = {
    resultCode : WSResultCode;
}

export const WSDataEmpty = "{}";

export const WSMsgPlayTurn : WSMessage = {
    messageID : WSMessageID.PlayerTurn,
    data : JSON.stringify(WSDataEmpty)
}

export enum PlayerChoice
{
    Scissors = 0,
    Rock = 1,
    Paper = 2
}

export type WSDataPlayerHand = {
    choice : PlayerChoice;
}

export type WSDataBattleStart = {
    round : number;
}

export enum BattlePlayResult
{
    Win = 0,
    Lose = 1,
    Draw = 2
}

export type WSDataBattlePlayResult = {
    result : BattlePlayResult;
    yourChoice : PlayerChoice;
    opponentChoice : PlayerChoice;
}

export type WSDataGamePlayResult = {
    WinCount : number;
    LoseCount : number;
    DrawCount : number;
}

export const WSMsgOpponentOut : WSMessage = {
    messageID : WSMessageID.OpponentOut,
    data : JSON.stringify(WSDataEmpty)
}



