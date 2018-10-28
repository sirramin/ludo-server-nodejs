module.exports = {
    "master-of-minds": {
        "jhoobin": {
            url: 'https://seller.jhoobin.com/ws/androidpublisher/v2/applications/',
            accessToken: '9d2d08ff-6e98-3a05-b3ab-5830db5a1ccc',
            packageName: 'com.artagamestudio.MasterOfMinds',
            sku: 'master_daily_subscription',
            products: [
                {'master_coin_pack_1': 7500},
                {'master_coin_pack_2': 20000},
                {'master_coin_pack_3': 42000}
            ]
        },
        verificationCodeProvider: 'http://31.47.36.133/~gatewayrdn/App/app_user_sendsms.php?number=${number}&serviceName=master&content=${smsVerifyCode}'
    },
    "moogy": {
        "jhoobin": {
            url: 'https://seller.jhoobin.com/ws/androidpublisher/v2/applications/',
            accessToken: '9d2d08ff-6e98-3a05-b3ab-5830db5a1ccc',
            // packageName: 'com.artagamestudio.MasterOfMinds',
            // sku: 'master_daily_subscription',
            packageName: 'com.artagamestudio.moogy',
            sku: 'Moogy_daily_subscription',
            products: [
                {'master_coin_pack_1': 7500},
                {'master_coin_pack_2': 20000},
                {'master_coin_pack_3': 42000}
            ]
        },
        verificationCodeProvider: 'http://31.47.36.133/~gatewayrdn/App/app_user_sendsms.php?number=${number}&serviceName=test&content=${smsVerifyCode}'
    }
}