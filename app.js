
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {'flags':'a'});
var errorLog = fs.createWriteStream('error.log', {'flags':'a'});
var passport=require('passport')
	, GithubStrategy=require('passport-github').Strategy;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
//app.use(express.logger('dev'));
// app.use(express.logger({stream:accessLog}));
//app.use(express.json());
//app.use(express.urlencoded());
app.use(express.bodyParser({
	keepExtensions:true,uploadDir:'./public/images'
	}));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
	secret:settings.cookieSecret,
	// key:settings.db,
	cookie:{maxAge:1000*60*60*24*30},
	url:settings.url
	/*store:new MongoStore({
		url: settings.url,
		db:settings.db,
		host:settings.host,
		port:settings.port
	})*/
}));
app.use(passport.initialize());//初始化 Passport
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err, req, res, next){
	var meta='['+new Date()+']'+req.url+'\n';
		errorLog.write(meta+err.stack+'\n');
		next();
});
passport.use(new GithubStrategy({
	clientID:'4f5844774e402f8681a7',
	clientSecret:'9eb33f3179b1e50cd496ef722b7bdde20a46f0d7',
	clientbackURL:'http://localhost:3000/login/github/callback'
}, function(accessToken, refreshToken, profile, done){
	done(null, profile);
}));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
