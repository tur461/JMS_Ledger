thank you for considering.
expecting issues...(kindly submit if any)

Usage:

After cloning:

1. install nodejs if not available.
2. open 2 terminals in the root of the project

In one terminal do the following:

1. npm install --> this will install all dependencies
2. npm install -g liveserver --> this will install live-web-server to view html files
3. node server.js --> this will start the backend of the project

In other terminal do the following:

1. cd pub -> press enter
2. live-server -> press enter

Note: incase of CORS issue, add the live-server url in server.js under app.use(cors({origin:[
//here
]}))
find it at the top of server.js file.
Remember, http://localhost:1234 and http://127.0.0.1:1234 are considered different in cors issue.

License: MIT Open source License
