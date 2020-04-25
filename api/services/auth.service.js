const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const config = require('../../config/');

AWS.config.update({
    region: 'us-east-1',
});
AWS.config.credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: 'us-east-1:0adcf134-5e3a-4aeb-8028-60845f2fc95d' });
const lambda = new AWS.Lambda({
    region: 'us-east-1',
    apiVersion: '2015-03-31',
});

// {
//     "Version": "2012-10-17",
//     "Statement": [
//       {
//         "Effect": "Allow",
//         "Principal": {
//           "Service": [
//             "edgelambda.amazonaws.com",
//             "lambda.amazonaws.com"
//           ]
//         },
//         "Action": "sts:AssumeRole"
//       }
//     ]
//   }

const authService = () => {
    const issue = (payload) => jwt.sign(payload, config.jwtSecret, { expiresIn: 10800 });
    const verify = (token, cb) => jwt.verify(token, config.jwtSecret, {}, cb);

    const verifyCognitoToken = () => {
        console.log('verifyCognitoToken');
        const pullParams = {
            FunctionName: 'aws-cognito-jwt-verification',
            InvocationType: 'RequestResponse',
            LogType: 'None',
            Payload: Buffer.from('{token:"eyJraWQiOiJLUmZcLzFhMk1ZTndZa1lrMmJLNmNEWXI1cVltSVNVbmhwbGdKdklzelNhST0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmNTliMTU3MS04ZmFiLTRhNGItOTFlYi02NzE2MTA4YThiN2UiLCJhdWQiOiI0ZXNoZzk3ajBhYnBma2o1aG5uZWU3N2loZCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZXZlbnRfaWQiOiJhNjA0ZGY4Zi03MTQ1LTExZTktYWM1MC0xNzA3MmIwNWM0Y2EiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTU1NzI4Nzk1NiwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfbHh0REZIWHBVIiwiY29nbml0bzp1c2VybmFtZSI6ImhhcnJ5LmNtc0B0ZXN0LmNvbSIsImV4cCI6MTU1NzI5MTU1NiwiaWF0IjoxNTU3Mjg3OTU2LCJlbWFpbCI6ImhhcnJ5LmNtc0B0ZXN0LmNvbSJ9.cl_MMWp-qbkDQEAgdptw3noXphST45eXngNepNQZr5uKn5yCSpmGS8vwhBVxmy0KhSCm_Hhk2Z1QDADv7kLKiqHej5mdHiZ7iL4H-I8SCDBgX8zp0iFM4rgGClgxmyjTXdiu3MuVMzJyZeqoSRFGIOdN1mj3_4FLkvu78NCarI3Ikeic5Y84UKuJBpvP4iU5aOA7kTlRf68PrQZMLtj97UyFQK37sX6ICgZSa-CuH_4WumvTPKvCfmjsYNmHhONabov0_689PcJyQtxq-NpNMt8qZoiBgbUkMj9VGRfZyvlkjCFBlsmkbu_1FApZLLrhrdUo9xyrewX6uJ5TRLuHRQ"'),
        };
        lambda.invoke(pullParams, (error, data) => {
            if (error) {
                console.log(error);
            } else {
                console.log(JSON.parse(data.Payload));
            }
        });
    };

    return {
        issue,
        verify,
        verifyCognitoToken,
    };
};

module.exports = authService;
