
import { FileHandling } from './FileHandling';
import { Authenticate } from "./Authenticate"
import { Groups } from './Groups';
import * as groups from './Groups';
import * as users from './Users';
import { Users } from "./Users";
import * as console from 'console';
import * as express from 'express';
import * as  bodyParser from 'body-parser';
import * as microsoftGraph from '@microsoft/microsoft-graph-client';


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

        router.all("/groupids", (req, res, next)=>{
            console.log(req.method + " /groupids");
            this.group.groups(res, req, next);
        });

        router.all("/groups", (req, res, next) => {
            console.log(req.method + " /groups");
            this.group.groups(res, req, next);
        });

        router.all("/users", (req, res, next) => {
            console.log(req.method + " /users");
            this.usr.users(res, req);
        });

        router.all("/users/status", (req, res, next) => {
            console.log(req.method + " /status");
            this.usr.userStatus(res, req);
        });

        router.all("/users/photo", (req, res, next) => {
            console.log(req.method + " /photo");
            this.usr.updateProfilePictureBaseEncoded(res, req);
        });

        router.all("/lists/get", (req, res, next) => {
            console.log(req.method + " /lists/get");
            this.file.getListItems(res, req);
        });
        router.all("/lists/create", (req, res, next) => {
            console.log(req.method + "/lists/create");
            this.file.createList(res, req);
        });

        this.express.use("/", router);
    }
}
export default new App().express;