import auth from "./Authenticate";
import { Server } from "./Server";
import { Groups } from "./Groups";
import * as microsoftGraph from '@microsoft/microsoft-graph-client';
import * as url from 'url';
import * as request from 'request';
import * as express from 'express';
import * as http from 'http';
import App from "./App";
import * as GraphClient from "./GraphClient";


export class FileHandling {
  public client: microsoftGraph.Client;
  public instance: GraphClient.GraphClient;

  constructor() {
    this.instance = GraphClient.GraphClient.getInstance();
  }

 
  public createList(listItems: object[], listEndpoint:string): void {
    listItems.forEach(element => {
      let item = {
        "fields": {
          "Title": element["values"]["no"],
          "ContentType": "Item",
          "Edit": ""
        }
      };

    //Example listEndpoint
    //listEndpoint =  "https://graph.microsoft.com/beta/sites/bouvetasa.sharepoint.com,b3c83103-d5d4-4aa4-8209-5b8310dbffe4,acbae1fd-c062-4c70-8bc2-a65083ad4d51/lists/99f3451a-7273-4b3f-ba7a-5dc608fdce6b/items"
    //List documentation
    //https://developer.microsoft.com/en-us/graph/docs/api-reference/beta/api/list_create

      this.client = this.instance.getClient();
      this.client
        .api(listEndpoint)
        .post(item, (err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log(item + " added!");
          }
        });
      });
  }


  //Retrieves list from sharepoint
  public getListItems(listUrl: string): any {
    this.client = this.instance.getClient();
    let listItems = [];

    return new Promise((resolve, reject) => {
      this.client
        .api(listUrl + "/items?expand=fields")
        .get((err, res) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            res["value"].forEach(function (element) {
              let item = {
                "fields": element["fields"]
              };
              listItems.push(item);
            });
            resolve(listItems);
          }
        });
      });

    }


  }
