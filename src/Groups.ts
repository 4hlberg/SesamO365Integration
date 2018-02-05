import { Request, Response } from '_debugger';
import { Authenticate } from "./Authenticate"
import * as microsoftGraph from '@microsoft/microsoft-graph-client';
import * as GraphClient from "./GraphClient"


export class Groups {

    public client: microsoftGraph.Client;
    public instance: GraphClient.GraphClient;

    constructor() {
        this.instance = GraphClient.GraphClient.getInstance();
    }

    public groups(response, request): void {
        this.client = this.instance.getClient();
        if (request.method === "GET") {
            this.client
                .api("https://graph.microsoft.com/beta/groups")
                .top(999)
                .get((err, res) => {
                    if (err) {
                        console.log(err);
                        response.writeHead(500, { "Content-Type": "application/json" });
                        response.end(res.statusCode + " - " + err);

                    } else if ("@odata.nextLink" in res) {
                        let data: any[] = [];
                        Groups.getNextPage(res, response, this.client, data);

                    } else {
                        console.log("200 OK");
                        response.writeHead(200, { "Content-Type": "application/json" });
                        response.end(JSON.stringify(res.value));
                    }

                });
        }
    }
    static getNextPage(result: any, response: any, client: any, data: any): void {
        let completeResult: any[] = data;
        completeResult = data.concat(result.value);

        if (result["@odata.nextLink"]) {
            client.api(result["@odata.nextLink"])
                .get((err, res) => {
                    if (err) {
                        console.log(err);
                        response.writeHead(500, { "Content-Type": "application/json" });
                        response.end();
                        return;
                    } else {
                        completeResult.concat(res.value);
                        Groups.getNextPage(res, response, client, completeResult);
                    }
                });

        } else {
            console.log("200 OK");
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify(completeResult));
            return;
        }

    }
}

export default new Groups();