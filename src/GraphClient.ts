
import * as microsoftGraph from '@microsoft/microsoft-graph-client';
import { Authenticate } from './Authenticate';


export class GraphClient {

    private static instance: GraphClient;
    private static client: microsoftGraph.Client;

    constructor() {
        this.initToken()
    }

    public async initToken() {
        let tok = await Authenticate.refreshToken();
        this.initClient(tok);
    }

    public initClient(token) {
        GraphClient.client = microsoftGraph.Client.init({
            authProvider: async (done) => {
                done(null, token);
            }
        });
    }

    static getInstance() {
        if (!GraphClient.instance) {
            GraphClient.instance = new GraphClient();
        }
        return GraphClient.instance;
    }

    public getClient() {
        return GraphClient.client;
    }

}
