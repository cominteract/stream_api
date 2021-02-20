'use strict';
/*
 Module dependencies
 */
var express = require('express'),
    morgan = require('morgan'),
    path = require('path'),
    jsonfile = require('jsonfile'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    app = express();
var data_path = path.resolve('./data');
var streams_json_path = data_path + '/streams.json';
var users_json_path = data_path + '/users.json';
var chats_json_path = data_path + '/chats.json';
var rtc_token_json_path = data_path + '/rtc_token.json';
var rtm_token_json_path = data_path + '/rtm_token.json';
var prefix_api = "/api/v1";

const RtcTokenBuilder = require('./agoranode/src/RtcTokenBuilder').RtcTokenBuilder;
const RtcRole = require('./agoranode/src/RtcTokenBuilder').Role;
const RtmTokenBuilder = require('./agoranode/src/RtmTokenBuilder').RtmTokenBuilder;
const RtmRole = require('./agoranode/src/RtmTokenBuilder').Role;
const Priviledges = require('./agoranode/src/AccessToken').priviledges;
const appID = '17397224afa944d18d3b88867ef50834';
const appCertificate = 'd7508f79155048efb35932a96b6da101';



app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

//use from morgan to logging these request into console
app.use(morgan('combined'));

/**
 helper functions for get data from json files
 **/
var getStreamsFromJsonFile = function () {
    return jsonfile.readFileSync(streams_json_path);
};
var getUsersFromJsonFile = function () {
    return jsonfile.readFileSync(users_json_path);
};
var getChatsFromJsonFile = function () {
    return jsonfile.readFileSync(chats_json_path);
};
var getRtcTokensFromJsonFile = function () {
    return jsonfile.readFileSync(rtc_token_json_path);
};
var getRtmTokensFromJsonFile = function () {
    return jsonfile.readFileSync(rtm_token_json_path);
};


//REST FULL API Routes



app.post(prefix_api + '/rtm_token', function (req, res) {
    var account = req.body.account;
    var expirationTimeInSeconds = 3600;
    var currentTimestamp = Math.floor(Date.now() / 1000);
    var privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    var token = RtmTokenBuilder.buildToken(appID, appCertificate, account, RtmRole, privilegeExpiredTs);
    var ntoken = {token : token};
    jsonfile.writeFile(rtm_token_json_path, ntoken, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(ntoken);
                }
    });
});


app.post(prefix_api + '/rtc_token', function (req, res) {
    var account = req.body.account;
    var channel = req.body.channel;
    var uid = req.body.uid;
    var expirationTimeInSeconds = 3600;
    var role = RtcRole.PUBLISHER;
    var currentTimestamp = Math.floor(Date.now() / 1000)
    var privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
    if(uid){
    // Build token with uid
        var token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, privilegeExpiredTs);
        var ntoken = {token : token};
        jsonfile.writeFile(rtc_token_json_path, ntoken, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(ntoken);
                }
        });

    }
    else if(account){
        var token = RtcTokenBuilder.buildTokenWithAccount(appID, appCertificate, channel, account, role, privilegeExpiredTs);
        var ntoken = {token : token};
        jsonfile.writeFile(rtc_token_json_path, ntoken, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(ntoken);
                }
        });
    }
    // Build token with user account
    
});







/*
 get the recent rtm token
 */
app.get(prefix_api + '/rtm_token', function (req, res) {
    var tokens = getRtmTokensFromJsonFile();
    if (tokens) {
        //filter if have query string channel
        res.json(tokens);
    }
    else {
        res.status(500).send({
            type: 'INTERNAL_SERVER_ERROR',
            description: 'Internal server error'
        });
    }
});
/*
 get the recent rtc token
 */
app.get(prefix_api + '/rtc_token', function (req, res) {
    var tokens = getRtcTokensFromJsonFile();
    if (tokens) {
        //filter if have query string channel
        res.json(tokens);
    }
    else {
        res.status(500).send({
            type: 'INTERNAL_SERVER_ERROR',
            description: 'Internal server error'
        });
    }
});




/**
 * create new user
 */
app.post(prefix_api + '/user', function (req, res) {
    var userName = req.body.userName;
    if (userName) {
        //create new user object
        var newUser = {id: uuid.v1(), userName: userName, dateCreated: new Date(), dateUpdated: new Date()};
        //get the users list and add this new user to that list
        var users = getUsersFromJsonFile();
        if (users) {
            //add this user to user list
            users.push(newUser);
            //write these user to json file
            jsonfile.writeFile(users_json_path, users, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(newUser);
                }
            });
        }
        else {
            //error happend in get list of streams from json file
            res.status(500).send({
                type: 'INTERNAL_SERVER_ERROR',
                description: 'Internal server error'
            });
        }
    }
    else {
        res.status(400).send({
            type: 'SOME_FIELDS_ARE_EMPTY',
            description: 'body field or channel field for create new stream was empty :|'
        });
    }
});




/*
 get the list of users
 */
app.get(prefix_api + '/user', function (req, res) {
    var users = getUsersFromJsonFile();
    if (users) {
        //filter if have query string channel
        var wanted_userName = req.query.userName;
        if (wanted_userName) {
            var result = [];
            //filter with this channel
            users.forEach(function (user) {
                if (user.userName === wanted_userName) {
                    result.push(user);
                }
            });
            res.json(result.reverse());
        }
        else {
            res.json(users.reverse());
        }
    }
    else {
        res.status(500).send({
            type: 'INTERNAL_SERVER_ERROR',
            description: 'Internal server error'
        });
    }
});





/**
 * create new stream
 */
app.post(prefix_api + '/stream', function (req, res) {
    var channel = req.body.channel;
    var status = req.body.status;
    var user = req.body.user;
    var imageString = req.body.imageString;
    var userId = req.body.userId;
    var dateCreated = req.body.dateCreated;
    if (user && channel) {
        //create new stream object
        var newStream = {id: uuid.v1(), user: user, status: status, imageString: imageString, 
            channel: channel, userId: userId, dateCreated: dateCreated};
        //get the streams list and add this new stream to that list
        var streams = getStreamsFromJsonFile();
        if (streams) {
            //add this stream to stream list
            streams.push(newStream);
            //write these stream to json file
            jsonfile.writeFile(streams_json_path, streams, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(newStream);
                }
            });
        }
        else {
            //error happend in get list of streams from json file
            res.status(500).send({
                type: 'INTERNAL_SERVER_ERROR',
                description: 'Internal server error'
            });
        }
    }
    else {
        res.status(400).send({
            type: 'SOME_FIELDS_ARE_EMPTY',
            description: 'body field or channel field for create new stream was empty :|'
        });
    }
});

/*
 get the list of streams
 we can also search in streams by channel with this query string like ?channel=😀
 */
app.get(prefix_api + '/stream', function (req, res) {
    var streams = getStreamsFromJsonFile();
    if (streams) {
        //filter if have query string channel
        var wanted_channel = req.query.channel;
        if (wanted_channel) {
            var result = [];
            //filter with this channel
            streams.forEach(function (stream) {
                if (stream.channel === wanted_channel) {
                    result.push(stream);
                }
            });
            res.json(result.reverse());
        }
        else {
            res.json(streams.reverse());
        }
    }
    else {
        res.status(500).send({
            type: 'INTERNAL_SERVER_ERROR',
            description: 'Internal server error'
        });
    }
});

/*
 get one stream by id
 */
app.get(prefix_api + '/stream/:id', function (req, res) {
    var stream_with_this_id;
    var streams = getStreamsFromJsonFile();
    var stream_id = req.params.id;
    streams.forEach(function (stream) {
        if (stream.id === stream_id) {
            stream_with_this_id = stream;
        }
    });
    if (stream_with_this_id) {
        res.json(stream_with_this_id);
    }
    else {
        res.status(404).send({
            type: 'NOT_FOUND_STREAM_WITH_THIS_ID',
            description: 'not found any stream with this id'
        });
    }
});

/*
 update the stream by id
 */
app.put(prefix_api + '/stream/:id', function (req, res) {
    var updated_stream;
    var streams = getStreamsFromJsonFile();
    var stream_channel = req.params.id;
    var channel = req.body.channel;
    var status = req.body.status;
    var user = req.body.user;
    var userId = req.body.userId;
    if (user && channel) {
        streams.forEach(function (stream) {
            if (stream.channel === stream_channel) {
                //find it :) now should edit the fields
                stream.user = user;
                stream.status = status;
                stream.channel = channel;
                stream.userId = userId;
                updated_stream = stream;
            }
        });
        if (updated_stream) {
            //write it to json file
            jsonfile.writeFile(streams_json_path, streams, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(updated_stream);
                }
            });
        }
        else {
            res.status(404).send({
                type: 'NOT_FOUND_STREAM_WITH_THIS_ID',
                description: 'not found any stream with this id'
            });
        }
    }
    else {
        res.status(400).send({
            type: 'SOME_FIELDS_ARE_EMPTY',
            description: 'body field or channel field for create new stream was empty :|'
        });
    }
});

/*
 delete the stream by id
 */
app.delete(prefix_api + '/stream/:id', function (req, res) {
    //first should find it then remove it and write it to json file
    var stream_index = -1;
    var streams = getStreamsFromJsonFile();
    var stream_id = req.params.id;
    streams.forEach(function (stream, index) {
        if (stream.id === stream_id) {
            stream_index = index;
        }
    });
    if (stream_index !== -1) {
        //remove it
        streams.splice(stream_index, 1);
        //write it to json file
        jsonfile.writeFile(streams_json_path, streams, function (err) {
            if (err) {
                res.status(500).send({
                    type: 'INTERNAL_SERVER_ERROR',
                    description: 'Internal server error'
                });
            }
            else {
                //inform user this stream successfully remove it
                res.send({
                    type: 'REMOVED_SUCCESSFULLY', description: 'Removed successfully'
                });
            }
        });
    }
    else {
        res.status(404).send({
            type: 'NOT_FOUND_STREAM_WITH_THIS_ID',
            description: 'not found any stream with this id'
        });
    }
});


var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    host = host === '::' ? 'localhost' : host;
    console.log("sample REST API for Retrofit in android without Authentication is running at http://%s:%s", host, port);
});
