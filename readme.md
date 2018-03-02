## Node.js application written in TypeScript

### Install 

```bash
npm install
```

### Build 

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Start 

```bash
npm start
```

### Sesam 

```bash
The application requires the user to be Registered in Azure AD in order to ble able to access the data in the tenant.
After registration you will be provided with clientID and a secret that enables you to be authenticated.

For registration of application:
https://docs.microsoft.com/en-us/azure/active-directory/active-directory-app-registration


Example of a Sesam pipe for retrieving all users

{
  "_id": "o365-users",
  "type": "pipe",
  "source": {
    "type": "json",
    "system": "O365",
    "url": "/users"
  },
  "sink": {
    "type": "dataset",
    "dataset": "o365-users"
  },
  "transform": {
    "type": "dtl",
    "rules": {
      "default": [
        ["add", "_id", "_S.id"],
        ["copy", "*"]
      ]
    }
  },
  "pump": {
    "cron_expression": "0 0 ? * SUN"
  }
}


Example of System in Sesam

{
  "_id": "O365",
  "type": "system:microservice",
  "name": "O365",
  "docker": {
    "environment": {
      "Token_Node_Office": "$SECRET(O365Token)"
    },
    "image": "trondtufte/sesamo365integration:latest",
    "memory": 256,
    "port": 8000
  }
}


```

