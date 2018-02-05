import * as microsoftGraph from '@microsoft/microsoft-graph-client';
import * as http from 'http';
import App from "./App";
import auth from "./Authenticate";
import { Authenticate } from "./Authenticate"
import { Groups } from "./Groups";

const port: number = 8000;

export class Server {
  
  public static checked: boolean;


  constructor() {

    App.set("port", port);
    const server: any = http.createServer(App);
    server.listen(port);
    server.on("listening", onListening);
    function onListening(): void {
      console.log('Listening on port ' + port);
    }
  }

  checked = false;
}
export default new Server();