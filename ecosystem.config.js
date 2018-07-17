module.exports = {
  "apps" : [
      {
          "name": "platform-Master",
          "script": "index.js",
          "args": ["platform-Master"],
          "instances": "1",
          "combine_logs": true
      },
      {
          "name": "platform-Slave",
          "script": "index.js",
          "args": ["platform-Slave"],
          "instances": "3",
          "combine_logs": true
      }
  ]
}