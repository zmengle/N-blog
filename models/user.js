var settings = require('../settings');
var mongodb = require('mongodb');
var crypto = require('crypto');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

//�洢�û���Ϣ
User.prototype.save = function (callback) {
    var md5 = crypto.createHash('md5');
    email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
    head = 'http://www.gravatar.com/avatar/' + email_MD5 + "?s=48";
    //Ҫ�������ݿ���û��ĵ�
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    };

    //�����ݿ�
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);//���ش�����Ϣ
        }
        //��ȡusers����
        db.collection('users', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //���û���Ϣ����users����
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                db.close();
                if (err) {
                    return callback(err);//���ش�����Ϣ
                }
                callback(null, user[0]);//�ɹ���errΪ�գ��������û��洢����ĵ�
            });
        });
    });
};
//��ȡ�û���Ϣ
User.get = function (name, callback) {
    //�����ݿ�
    mongodb.MongoClient.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        //��ȡusers����
        db.collection('users', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //��ȡ��ֵΪname��һ���ĵ�
            collection.findOne({
                name: name
            }, function (err, user) {
                db.close();
                if (err) {
                    return callback(err);//ʧ��
                }
                callback(null, user);//�ɹ�
            });
        });
    });
};