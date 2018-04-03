import { FileHandling } from './FileHandling';
import { Authenticate } from "./Authenticate"
import { Groups } from './Groups';
import * as groups from './Groups';
import * as users from './Users';
import { Users } from "./Users";
import * as console from 'console';
import * as express from 'express';
import * as  bodyParser from 'body-parser';


class App {

  public express: express.Application;
  private authentication: Authenticate;
  private group: Groups;
  private usr: Users;
  private file: FileHandling;

  constructor() {

    this.express = express();
    this.middleware();
    this.routes();
    this.authentication = new Authenticate();
    this.group = new Groups();
    this.usr = new Users();
    this.file = new FileHandling();

  }

  // Configure Express middleware.
  private middleware(): void {
   
    this.express.use(bodyParser.urlencoded({
      limit: '50mb',
      extended: true
    }));
   this.express.use(bodyParser.json({ limit: 5000000}));
  }


  private routes(): void {
    let router: any = express.Router();
  
    router.all("/industry", bodyParser.json(), (req, res, next) => {
      console.log(req.method + " /industry");
      this.file.updateIndustryList(res, req);
    });

    router.all("/groups", (req, res, next) => {
      console.log(req.method + " /groups");
      this.group.groups(res, req);
    });

    router.all("/users", (req, res, next) => {
      console.log(req.method + " /users");
      this.usr.users(res, req);
    });

    router.all("/status", (req, res, next) => {
      console.log(req.method + " /status");
      this.usr.userStatus(res, req);
    });

    router.all("/photo", (req, res, next) => {
      console.log(req.method + " /photo");
      this.usr.updateProfilePictureBaseEncoded(res, req);
    });

    router.all("/file", (req, res, next) => {
      console.log(req.method + " /file");
      this.file.shareFile(res, req);
    });

    this.express.use("/", router);
  }
}
export default new App().express;