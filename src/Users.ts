import auth from "./Authenticate";
import { Authenticate } from "./Authenticate"
import * as microsoftGraph from "@microsoft/microsoft-graph-client";
import * as fs from "fs";
import * as request from "request";
import * as GraphClient from "./GraphClient"
import * as base64 from "base-64";

export class Users {

  public userStatusArray: any[];
  public client: microsoftGraph.Client;
  public instance: GraphClient.GraphClient;



  constructor() {
    this.userStatusArray = [];
    this.instance = GraphClient.GraphClient.getInstance();
  }


  public userStatus(response, request): void {
    this.client = this.instance.getClient();
    if (request.method === "POST") {
      let body: string;

      request.on("data", (input) => {
        body += input;
        if (body.length > 1e6) {
          request.connection.destroy();
        }

        let userMail: any[];
        let userArray: any = JSON.parse(body);
        let counter: number = 0;

        if (userArray.length === 0) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end("No data");
          return;
        }

        console.log("request batch size: " + userArray.length);
        userArray.forEach((element) => {
          let id: any = element["id"];
          let name: any = element["displayName"];
          this.client.api("https://graph.microsoft.com/beta/users/" + id + "/mailboxSettings/automaticRepliesSetting?pretty=1")
            .get((err, res) => {
              if (err) {
                console.log(name + " has got no mail account!");
                ++counter;
              } else {

                if (res["status"] !== "disabled") {
                  res.id = id;
                  userMail.push(res);
                  this.userStatusArray.push(res);
                }
                ++counter;
              }
              if (counter === userArray.length) {
                console.log("Instances: " + userMail.length);
                console.log("200 OK");
                response.writeHead(200, { "Content-Type": "application/json" });
                response.end("200");
              }
            });
        });
      });

    } else if (request.method === "GET") {
      console.log("Amount of users with status: " + this.userStatusArray.length);
      if (this.userStatusArray.length > 0) {
        let batchResponse: any[];
        if (this.userStatusArray.length < 100) {
          console.log("Reached last elements:" + this.userStatusArray.length);
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(this.userStatusArray));
          return;

        } else {
          let counter: any = this.userStatusArray;
          for (let element of this.userStatusArray) {
            batchResponse.push(element);
            counter.splice(element, 1);

            if (batchResponse.length === 100) {
              console.log(200);
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(JSON.stringify(batchResponse));
              batchResponse = [];
            }

            if (counter.length < 100) {
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(JSON.stringify(counter));
              return;
            }
          }
        }

      } else {
        console.log("No data");
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end("No data");
        return;
      }
    }
  }


  public users(response, request): void {
    this.client = this.instance.getClient();

    if (request.method === "POST") {
      let userId: any = request.data;
      this.client.api("/users/" + userId + "/displayName")
        .patch(
        { "value": "Test" },
        (err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Profile Updated");
          }
        });
    } else if (request.method === "GET") {
      this.client
        .api("https://graph.microsoft.com/beta/users?$filter=accountEnabled eq true")
        .top(999)
        .get((err, res) => {
          if (err) {
            console.log(err);
            response.writeHead(500, { "Content-Type": "application/json" });
            response.end();
          } else if ("@odata.nextLink" in res) {
            let data: any[] = [];
            Users.getNextPage(res, response, this.client, data);
          } else {
            console.log("200 OK");
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify(res.value));
          }
        });
    }
  }


  public static getNextPage(result: any, response: any, client: any, data: any): void {
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
            Users.getNextPage(res, response, client, completeResult);
          }
        });
    } else {
      console.log("200 OK");
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(completeResult));
      return;
    }
  }

  public updateProfilePictureBaseEncoded(response: any, request: any): void {
    this.client = this.instance.getClient();

    if (request.method === "POST") {
      let data: object[] = request.body.images

      if (data.length === 0) {
        response.end("no data");
        return;
      }

      data.forEach((element) => {
        let userId: any = element["o365_userId"];
        let image: string = element["image"]
        let bitmap = new Buffer(image, 'base64');

        if (image.length === 0) {
          response.end("No image");
          return;

        }
        this.client.api("/users/" + userId + "/photo/$value")
          .put(bitmap, (err, res) => {
            if (err) {
              console.log(err);
              console.log("Error setting profile image");
              response.end("Error setting profile image");
            } else {
              response.end("image updated!");
              console.log("image updated!");
            }
          });
      })
    }
  }


  static download(uri: any, filename: any, callback: any): void {
    request.head(uri, (err, res, body) => {
      request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
    });
  }
}

export default new Users();
