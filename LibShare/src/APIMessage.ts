import express from 'express'

export enum APIMessageID
{
    UnknownError = -99999,
    Login = 1,
    CheckLogin = 2,
    Logout = 3,
    PlayGame = 4,
}

export enum APIResultCode
{
    Success = 0,
    Fail = -1,
    NotLogin = -2,
    UnknownError = -99999
}

export interface APIMessage
{
    messageID : APIMessageID;
    resultCode : APIResultCode;
    data : string;
}

export const msgUnknown : APIMessage = {
    messageID : APIMessageID.UnknownError,
    resultCode : APIResultCode.UnknownError,
    data : "{}",
}

export function sendMessage(res : express.Response, message : APIMessage)
{
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify(message));
    res.end();
}

export type APIReplayLoginOkay = {
    sessionKey : string;
}

export type APIReplayCheckLogin = {
    login : string;
}

export type APIReplayPlayGame = {
    ip : string;
    port : number;
}

export const APIReplayEmpty = {
}







