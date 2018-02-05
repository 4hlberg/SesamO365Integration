import auth from "./Authenticate";
import { Server } from "./Server";
import * as server from './Server';
import { Groups } from "./Groups";
import * as microsoftGraph from '@microsoft/microsoft-graph-client';
import * as fs from 'fs';
import * as FileReader from 'filereader';
import * as url from 'url';
import * as request from 'request';
import * as csvWriter from 'csv-write-stream';
import * as express from 'express';
import * as http from 'http';
import App from "./App";
import * as qs from 'querystring';
import * as GraphClient from "./GraphClient"


let orgDataArray: any[];

export class FileHandling {


  public client: microsoftGraph.Client;
  public instance: GraphClient.GraphClient;

  constructor() {
    this.instance = GraphClient.GraphClient.getInstance();
  }

  //Creates a List in Sharepoint based on indutries from CV-Partner (Is used by Bouvet Bergen)
  public async updateIndustryList(response, request) {
    this.client = this.instance.getClient();
    if (request.method === "POST") {

      let existingInstances = [];
      let body: any = [];
      let newInstances = [];

      await this.getIndustries().then(data => {
        existingInstances = data;

        request.on('data', function (input) {
          body += input;
          if (body.length > 1e6) {
            request.connection.destroy();
          }

          if (body.length === 0) {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify("No data"));
            return;
          }

          console.log(existingInstances.length + " existing items");
          var userArray = JSON.parse(body);
          console.log(userArray.length + " new items to insert");

          userArray.forEach((item) => {
            newInstances.push(item);
          });

          for (var i = 0; i < existingInstances.length; i++) {
            for (var x = 0; x < userArray.length; x++) {

              var str1 = JSON.stringify(existingInstances[i]["fields"]["Title"]);
              var str2 = JSON.stringify(userArray[x]["values"]["no"]);
              str1 = str1.trim();
              str2 = str2.trim();

              if (str1 === str2) {
                newInstances.splice(userArray[x], 1);

              }
            }
          }

          if (newInstances.length === 0) {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify("No new data"));
            return;
          } else {

            newInstances.forEach(element => {
              var instance = {
                "fields": {
                  "Title": element["values"]["no"],
                  "ContentType": "Item",
                  "Edit": ""
                }
              }
              this.client
                .api("https://graph.microsoft.com/beta/sites/bouvetasa.sharepoint.com,b3c83103-d5d4-4aa4-8209-5b8310dbffe4,acbae1fd-c062-4c70-8bc2-a65083ad4d51/lists/99f3451a-7273-4b3f-ba7a-5dc608fdce6b/items")
                .post(instance, (err, res) => {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log(instance["fields"]["Title"] + " added!");
                  }
                });
            });
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify("Instances inserted: " + userArray.length));

          }
        });
      });

    } else if (request.method === "GET") {
      await this.getIndustries().then(data => {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(data));
      }).catch(error => {
        console.log(error);
      });
    }
  }

  //Retrieves list of existing Industries in Sharepoint
  public getIndustries(): any {
    this.client = this.instance.getClient();
    var instances = [];
    this.client
      .api("https://graph.microsoft.com/beta/sites/bouvetasa.sharepoint.com,b3c83103-d5d4-4aa4-8209-5b8310dbffe4,acbae1fd-c062-4c70-8bc2-a65083ad4d51/lists/99f3451a-7273-4b3f-ba7a-5dc608fdce6b/items?expand=fields")
      .get((err, res) => {
        if (err) {
          console.log(err);
        } else {
          res["value"].forEach(function (element) {
            var instance = {
              "fields": element["fields"]
            }
            instances.push(instance);
          });
        }
      });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(instances);
      }, 3000);
    });
  }

 //Writes a CSV file with organization data to Sharepoint
  public shareFile(response: any, request: any): void {
    this.client = this.instance.getClient();
    if (request.method === "POST") {
      let body: string;
      let is_last: boolean = false;

      request.on("data", (input) => {
        body += input;
        if (body.length > 1e6) {
          request.connection.destroy();
        }

        is_last = request.url.includes("is_last=true");
        let dataArray: any = JSON.parse(body);
        if (dataArray.length !== 0) {
          orgDataArray = orgDataArray.concat(dataArray);

        }

        if (is_last) {
          let writer: any;
          if (!Server.checked) {
            writer = csvWriter({ headers: ["DepartmentId", "DepartmentName", "ParentDepartment", "Navn"] });
          } else {
            writer = csvWriter({ headers: [" ", " ", " ", " "] });
          }
          writer.pipe(fs.createWriteStream("orgMap.csv", { flags: "a" }));
          orgDataArray = FileHandling.deleteDuplicates(orgDataArray);
          orgDataArray.forEach((element) => {
            let parentName: any = "No Department Parent";
            let depId: any = "No Department Id";
            let nameDepartmentHead: any = "No Department Head";
            let depName: any = "No Department Name";

            if (element.DepartmentName !== null) {
              depName = element.DepartmentName;
            }

            if (element.DepartmentId !== "_Scurrenttime-department:departmentref" && element.DepartmentId !== null) {
              depId = element.DepartmentId;
            }

            if (element.DepartmentHead !== null) {
              nameDepartmentHead = element.DepartmentHead.Navn;
            }

            if (typeof element.ParentDepartment[0] !== "undefined" && element.ParentDepartment[0].ParentName[0] !== null) {
              parentName = element.ParentDepartment[0].ParentName[0];
            }
            writer.write([depId, depName, parentName, nameDepartmentHead]);

          }, this);
          Server.checked = true;
          writer.end();
          console.log("Finished Writing");
        }

      });

      response.write("200");
      response.end();
      request.on("end", () => {
        if (is_last) {
          console.log("Started reading..");
          FileHandling.readOrgFile(this.client);
        }
      });
    }
  }


  static uniqInstances(array: any): any {
    return Array.from(new Set(array));
  }

  static deleteDuplicates(arr: any): any {
    let hashTable: any = {};
    return arr.filter((el) => {
      let key: any = JSON.stringify(el);
      let match: any = Boolean(hashTable[key]);

      return (match ? false : hashTable[key] = true);
    });
  }

 //Reading data from CSV file and pushing this to Sharepoint
  static readOrgFile(client: microsoftGraph.Client): void {
    fs.readFile("./orgMap.csv", "utf8", (err, data) => {
      data = "\ufeff" + data;
      if (err) {
        console.log(err);
      } else {
        client
          .api("groups/2fe68adf-397c-4c85-90bb-4fd64544680d/drive/root/children/orgMap.csv/content")
          .put(data, (err, res) => {
            if (err) {
              console.log(err);
            } else {
              orgDataArray = [];
              console.log("File updated!");
            }
          });
      }
    });
  }
}