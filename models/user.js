var settings = require('../settings');
var mongodb = require('mongodb');
var crypto = require('crypto');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

//存储用户信息
User.prototype.save = function (callback) {
    var md5 = crypto.createHash('md5');
    email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
    head = 'http://www.gravatar.com/avatar/' + email_MD5 + "?s=48";
    //要存入数据库的用户文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    };

    //打开数据库
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);//返回错误信息
        }
        //读取users集合
        db.collection('users', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //将用户信息插入users集合
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                db.close();
                if (err) {
                    return callback(err);//返回错误信息
                }
                callback(null, user[0]);//成功，err为空，并返回用户存储后的文档
            });
        });
    });
};
//读取用户信息
User.get = function (name, callback) {
    //打开数据库
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取users集合
        db.collection('users', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //读取键值为name的一个文档
            collection.findOne({
                name: name
            }, function (err, user) {
                db.close();
                if (err) {
                    return callback(err);//失败
                }
                callback(null, user);//成功
            });
        });
    });
};