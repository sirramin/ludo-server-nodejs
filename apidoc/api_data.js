define({ "api": [
  {
    "type": "post",
    "url": "/gameResult",
    "title": "send game result",
    "name": "gameResult",
    "group": "leaderboard",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": ""
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "league",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "isWinner",
            "description": ""
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 40": [
          {
            "group": "Success 40",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>score added</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Errors": [
          {
            "group": "Errors",
            "optional": false,
            "field": "41",
            "description": "<p>error adding score</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "components/leaderboard/route.js",
    "groupTitle": "leaderboard"
  },
  {
    "type": "get",
    "url": "/leaderboard/:operator",
    "title": "Get leaderboard",
    "name": "getLeaderboard",
    "group": "leaderboard",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": ""
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "operator",
            "description": ""
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "     {\n    \"code\": 200,\n    \"message\": \"\",\n    \"data\": {\n        \"leaders\": {\n            \"top20\": [\n                {\n                    \"rank\": 1,\n                    \"member\": {\n                        \"name\": \"user78927\",\n                        \"userId\": \"5b31dc0de49297286b2df397\",\n                        \"win\": 1,\n                        \"lose\": 0\n                    },\n                    \"score\": 10\n                }\n            ],\n            \"middleRanks\": [\n                {\n                    \"rank\": 14,\n                    \"member\": {\n                        \"name\": \"user78927\",\n                        \"userId\": \"5b31dc0de49297286b2df397\",\n                        \"win\": 1,\n                        \"lose\": 0\n                    },\n                    \"score\": 4\n                }\n            ]\n        }\n    }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Errors": [
          {
            "group": "Errors",
            "optional": false,
            "field": "31",
            "description": "<p>Error getting leaderboard</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "components/leaderboard/route.js",
    "groupTitle": "leaderboard"
  },
  {
    "type": "get",
    "url": "/otp/check/:phoneNumber",
    "title": "Check User",
    "name": "check",
    "group": "otp",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "phoneNumber",
            "description": ""
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 1": [
          {
            "group": "Success 1",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Code sent</p>"
          }
        ],
        "Success 2": [
          {
            "group": "Success 2",
            "type": "Object",
            "optional": false,
            "field": "smsData",
            "description": "<p>sms data for sending to confirmation api</p>"
          },
          {
            "group": "Success 2",
            "type": "String",
            "optional": false,
            "field": "smsData.cpUniqueToken",
            "description": ""
          },
          {
            "group": "Success 2",
            "type": "String",
            "optional": false,
            "field": "smsData.otpTransactionId",
            "description": ""
          }
        ],
        "Success 3": [
          {
            "group": "Success 3",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Code sent</p>"
          }
        ],
        "Success 4": [
          {
            "group": "Success 4",
            "type": "Object",
            "optional": false,
            "field": "smsData",
            "description": "<p>sms data for sending to confirmation api</p>"
          },
          {
            "group": "Success 4",
            "type": "String",
            "optional": false,
            "field": "smsData.cpUniqueToken",
            "description": ""
          },
          {
            "group": "Success 4",
            "type": "String",
            "optional": false,
            "field": "smsData.otpTransactionId",
            "description": ""
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Errors": [
          {
            "group": "Errors",
            "optional": false,
            "field": "5",
            "description": "<p>Request sms error</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "6",
            "description": "<p>Check user db error</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "7",
            "description": "<p>Check SubscriptionStatus error</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "8",
            "description": "<p>Get user info error</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "9",
            "description": "<p>Request login sms error</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "10",
            "description": "<p>phoneNumber required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "components/otp/route.js",
    "groupTitle": "otp"
  },
  {
    "type": "post",
    "url": "/otp/confirmation/:phoneNumber",
    "title": "confirmation",
    "name": "confirmation",
    "group": "otp",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "phoneNumber",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "verificationCode",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "cpUniqueToken",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "otpTransactionId",
            "description": ""
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 1": [
          {
            "group": "Success 1",
            "type": "Object",
            "optional": false,
            "field": "userData",
            "description": "<p>user data on database</p>"
          },
          {
            "group": "Success 1",
            "type": "String",
            "optional": false,
            "field": "userData.name",
            "description": ""
          },
          {
            "group": "Success 1",
            "type": "String",
            "optional": false,
            "field": "userData.userId",
            "description": ""
          },
          {
            "group": "Success 1",
            "type": "Number",
            "optional": false,
            "field": "userData.phoneNumber",
            "description": ""
          },
          {
            "group": "Success 1",
            "type": "String",
            "optional": false,
            "field": "userData.token",
            "description": ""
          },
          {
            "group": "Success 1",
            "type": "Number",
            "optional": false,
            "field": "userData.coin",
            "description": ""
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Errors": [
          {
            "group": "Errors",
            "optional": false,
            "field": "21",
            "description": "<p>OTP error</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "22",
            "description": "<p>phoneNumber required</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "23",
            "description": "<p>verificationCode required</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "24",
            "description": "<p>Get user info error</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "25",
            "description": "<p>Code is not valid</p>"
          },
          {
            "group": "Errors",
            "optional": false,
            "field": "26",
            "description": "<p>error adding user</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "components/otp/route.js",
    "groupTitle": "otp"
  }
] });