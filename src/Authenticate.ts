import * as request from "request";
import * as Q from "q";
import * as rp from "request-promise";
import { resolve } from "dns";


export class Authenticate {

    public static tokenEndpoint: string;
    public static clientId: string;
    public static clientSecret: string;
    public static auth: object;
    public static token: string;

    constructor() {
        Authenticate.tokenEndpoint = "https://login.windows.net/c317fa72-b393-44ea-a87c-ea272e8d963d/oauth2/token";
        Authenticate.clientId = "b2e9e676-4110-4340-ae4c-21742e848f3d";
        Authenticate.clientSecret = process.env.Token_Node_Office;
        Authenticate.auth = {};
        //Refreshing token every 1.5 hrs
        setInterval(() => {
            Authenticate.refreshToken();
        }, 60 * 60 * 1000)

    }

    //Makes a request for a token using client credentials.
    public static getAccessToken(): any {
        let deferred: any = Q.defer();
        let result: string;
        let requestParams: any = {
            grant_type: "client_credentials",
            client_id: Authenticate.clientId,
            client_secret: Authenticate.clientSecret,
            resource: "https://graph.microsoft.com"
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
                console.error("Error getting access token: " + error)
            });
        });
    }
}

export default new Authenticate();