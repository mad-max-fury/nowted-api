const http = require("http");
let notes = [
  {
    id: 1,
    content: "Learn Node today",
    important: true,
  },
  {
    id: 2,
    content: "relax at home",
    important: false,
  },
  {
    id: 3,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true,
  },
];
const app = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("Welcome to panda note app");
  } else if (req.method === "GET" && req.url === "/api/notes") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(notes));
  }
  // adding note
  else if (req.method === "POST" && req.url === "/api/notes/add") {
    let requestData = "";
    req.on("data", (chunk) => {
      requestData += chunk;
    });
    return req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      const jsonData = JSON.parse(requestData);
      const noteIdExist = notes.findIndex((note) => note.id === jsonData.id);
      if (noteIdExist === -1) {
        notes.push(jsonData);
        res.statusCode = 201;
        return res.end(JSON.stringify({ message: "Note added successfully" }));
      } else {
        res.statusCode = 409;
        return res.end(JSON.stringify({ message: "note already exists" }));
      }
    });
  }
  // delete  note
  else if (req.method === "DELETE" && req.url === "/api/notes/delete") {
    let requestData = "";
    req.on("data", (chunk) => {
      requestData += chunk;
    });
    return req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      const jsonData = JSON.parse(requestData);
      const noteIdExist = notes.findIndex((note) => note.id === jsonData.id);
      if (noteIdExist === -1) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ message: "Note does not exist" }));
      } else {
        notes.splice(noteIdExist, 1);
        console.log("Deleted Notes");
        res.statusCode = 200;
        return res.end(JSON.stringify({ message: "note deleted" }));
      }
    });
  }
  // update  note
  else if (req.method === "PUT" && req.url === "/api/notes/update") {
    let requestData = "";
    req.on("data", (chunk) => {
      requestData += chunk;
    });
    return req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      const jsonData = JSON.parse(requestData);
      const noteIdExist = notes.findIndex((note) => note.id === jsonData.id);
      if (noteIdExist === -1) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ message: "Note does not exist" }));
      } else {
        notes[noteIdExist] = jsonData;
        res.statusCode = 200;
        return res.end(
          JSON.stringify({ message: "Notes updated successfully " })
        );
      }
    });
  }
  res.statusCode = 404;
  res.end("Not Found");
});
const PORT = 3000;
app.listen(PORT);
console.log("listening on port " + PORT);
