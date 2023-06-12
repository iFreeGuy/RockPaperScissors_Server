export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class logger
{
    static log(contents: string)
    {
        console.log(contents);
    }

    static error(contents: string)
    {
        console.log(contents);
    }
}



