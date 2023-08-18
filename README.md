# IN MIGRATION | Pilot GUI - Cross Platform version 2.2.0

This project is currently in migration from a [React + Electron Application](https://bitbucket.org/eac-ualr/dna-atr-pilot-gui/src/develop/), to a Cross Platform Application using [Ionic and Angular](https://eac-ualr.atlassian.net/wiki/spaces/D/pages/3533897729/Angular+Ionic). The work is currently being migrated, you may find the Sprint board for this project [here](https://eac-ualr.atlassian.net/jira/software/c/projects/DNAATR/boards/164).

The Pilot GUI is conceived as the client side of the decision support system developed in the pilot project. This client
has the primary goal of allowing the end-user - that is, the x-ray machine operator - to visually check the multiple
detections or objects identified as potentially of interest by the system itself.

Through this client, the pilot system provides the user with visual feedback on the results derived from the different
deep learning workflows executed on the server side. The several algorithms that constitute the business logic are
implemented as a remote service, while the client is conceived as a tool that allows the user to efficiently and
effectively inspect the detections received in the form of DICOS+TDR files packed in an tailored OpenRaster (ORA) file.

In particular, the project contains a React App to manage the current DICOS-TDR image received from the server.

## Build and development pre-requisites

The installation of both [nodejs](https://nodejs.org/) and npm is required for the proper build of the client.

Additionally, the Pilot GUI is intended to connect to, and work with a remote server. It will be necessary to have a web
server up and running, able to send ORA files to the client.

[Here](https://bitbucket.org/eac-ualr/dna-atr-socket.io-server/src/master/) you can find the code of a mock file server
that can be used for development and testing purposes. More information on how to use the server below.

## Installation of dependencies

Access the root folder of the project from a terminal and run the following command:

```
npm install
```

## Starting the client in development mode

### Web Client

Again, using terminal and being at the root folder of the project, it is possible to start the client in development
mode by using this command:

```
ionic serve
```

### Desktop Client

#### Desktop Dependencies Installation

The Desktop via [Electron](https://www.electronjs.org/) has it's own dependencies that must by installed. If you are the root folder
you may perform the following commands to install the dependencies.

```
cd electron
npm install
cd ..
```

#### Running the Desktop Client

Run the following command to start the Desktop app.

```
npm run start-electron
```

## Mock file server

You can test the client developed in this project using a mock server that can be accessed
in [this code repository](https://bitbucket.org/eac-ualr/dna-atr-socket.io-server/src/master/). This server acts as
substitute of the actual command server of the Pilot system. It sends a ORA file to the react-based client when the
client requests the current file.

The files being sent are located in the `static/img` directory.

```
<ROOT>\static\img
```

Each file is sent when the client requests the current file from the command server. Optionally, you can set it to reset
back at the start of the index and send the same files.

Images returned from the Pilot GUI are saved in the `static/returned` image folder

```
<ROOT>\static\returned
```

### Getting started

Once cloned the repository in your machine, access the root folder of the project from the terminal. To install the
required dependencies run the following command:

```
npm i
```

Then, before launching the client, it's necessary to start the mock server:

```
node app.js
```

The server gets started and remains listening on port 4001. During the server's life, log messages are provided on the
terminal for debugging purposes.
