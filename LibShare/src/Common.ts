import express, {NextFunction} from 'express';

export const FnTryCatch = ( fn : (req : express.Request, res : express.Response, next : NextFunction) => any) => {
    return (req : express.Request, res : express.Response, next : NextFunction) => {
        fn(req, res, next).catch(next);
    };
}

export type WSServerInfo = {
    ip : string;
    port : number;
}








