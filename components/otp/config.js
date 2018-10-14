module.exports = {
    "master-of-minds": {
        "otp": {
            "username": "m@sterMind",
            "password": "artatel@bxawhuldutarkwzgibxj"
        },
        "vas": {
            "smsUrl": "http://31.47.36.133/~gatewayrdn/App/app_user_sendsms.php?number=${number}&serviceName=master&content=${smsVerifyCode}",
            "validationUrl": "http://31.47.36.133/~gatewayrdn/App/app_user_validation.php?number=${number}&serviceName=master"
        },
        "artatelOtp": {
            "request": "https://otp.artatel.ir/api/otp/v1/request/masterOfMind/",
            "confirmation": 'https://otp.artatel.ir/api/otp/v1/confirmation/masterOfMind/'
        }
    },
    "moogy": {
        "otp": {
            "username": "moogy",
            "password": "artatel@rk1s4ibxjbxawhulduta"
        },
        "vas": {
            "smsUrl": "http://31.47.36.133/~gatewayrdn/App/app_user_sendsms.php?number=${number}&serviceName=master&content=${smsVerifyCode}",
            "validationUrl": "http://31.47.36.133/~gatewayrdn/App/app_user_validation.php?number=${number}&serviceName=master"
        },
        "artatelOtp": {
            "request": "https://otp.artatel.ir/api/otp/v1/request/moogyPuzzle",
            "confirmation": 'https://otp.artatel.ir/api/otp/v1/confirmation/moogyPuzzle'
        }
    }
}
