import * as request from "request";
import * as Q from "q";
import * as rp from "request-promise";
import { resolve } from "dns";

var config: any = require("../appConfig.json");

export class Authenticate {

    public static tokenEndpoint: string;
    public static clientId: string;
    public static clientSecret: string;
    public static auth: object;
    public static token: string;

    constructor() {
        Authenticate.tokenEndpoint = config.TokenEndPoint;
        Authenticate.clientId =config.ClientId;
        Authenticate.clientSecret = process.env.Token_Node_Office;
        Authenticate.auth = {};
        //Refreshing token every 1 hrs
        setInterval(() => {
            Authenticate.refreshToken();
        }, 60 * 60 * 1000);

    }

    //Makes a request for a token using client credentials.
    public static getAccessToken(): any {
        let deferred: any = Q.defer();
        let result: string;
        let requestParams: any = {
            grant_type: "client_credentials",
            client_id: Authenticate.clientId,
            client_secret: Authenticate.clientSecret,
            resource: config.Resource
        };

        // make a request to the token issuing endpoint.
        request.post({ url: Authenticate.tokenEndpoint, form: requestParams }, function (err: any, response: any, body: any): any {
            let parsedBody: any = JSON.parse(body);
            if (err) {
                deferred.reject(err);
                result = err;
            } else if (parsedBody.error) {
                deferred.reject(parsedBody.error_description);
                result = parsedBody.error_description;
            } else {
                // if successful, return the access token.
                deferred.resolve(parsedBody.access_token);

                result = parsedBody.access_token;
            }
        });

        return deferred.promise;
    }

    // Refreshing Token by getting a new one
    public static async refreshToken(): Promise<object> {
        return new Promise(function (resolve, reject) {
            Authenticate.getAccessToken().then((tokenValue: string) => {
                Authenticate.token = tokenValue;
                resolve(tokenValue);
            }, (error: string): any => {
                console.error("Error getting access token: " + error),
                reject(error);
            });
        });
    }
}

export default new Authenticate();