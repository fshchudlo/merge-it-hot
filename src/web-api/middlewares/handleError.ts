import { AppConfig } from "../../app.config";
import { WebClient } from "@slack/web-api";
import express, { NextFunction } from "express";
import util from "util";

export default async function handleError(error: any, res: express.Response, next: NextFunction, slackWebClient: WebClient) {
    const errorMessage = ["Error processing webhook.", `Error: ${util.inspect(error, false, 8)}.`].join("\n\n");
    await logError(errorMessage, slackWebClient);

    if (res.headersSent) {
        return next(error);
    } else {
        res.status(500).send(AppConfig.NODE_ENV == "development" ? errorMessage : "Internal server error");
    }
}

async function logError(errorMessage: string, slackWebClient: WebClient) {
    console.error(errorMessage);
    try {
        if (AppConfig.DIAGNOSTIC_CHANNEL) {
            await slackWebClient.chat.postMessage({
                channel: AppConfig.DIAGNOSTIC_CHANNEL,
                text: errorMessage
            });
        } else {
            console.warn("Diagnostic channel is not provided");
        }
    } catch (error) {
        console.error("Error during sending message to the diagnostic channel", error);
    }
}
