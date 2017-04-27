
/*
 * GET home page.
 */
 var passport=require('passport');
 var crypto=require('crypto');
 
 fs=require('fs');
 var User=require('../models/user.js');
 var Post=require('../models/post.js');
 var Comment=require('../models/comment.js');

module.exports = function(app){
	/*app.get('/',function(req,res){
		Post.getAll(null,function(err,posts){
			if(err){
				posts=[];
			}
			res.render('index',{
			title:'主页',
			user:req.session.user,
			posts:posts,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
		});
	});*/
	app.get('/', function(req, res){
		//console.log("开始");
		//判断是否是第一页
		var page=req.query.p ? parseInt(req.query.p) : 1;
		//查询并返回第page页的10篇文章
		Post.getTen(null, page, function(err, posts, total){
			if(err){
				posts=[];
			}
			res.render('index', {
				title:'主页',
				posts:posts,
				page:page,
				isFirstPage:(page-1)==0,
				isLastPage:((page-1)*10+posts.length)==total,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'注册',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		//校验两次密码是一致
		if(password_re != password){
			req.flash('error', "两次输入的密码不一致！");
			res.redirect('/reg');//返回注册页
		}
		//md5加密
		var md5 = crypto.createHash('md5');
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name:req.body.name,
			password:password,
			email:req.body.email
		});
		//检查用户是否存在
		User.get(newUser.name, function(err,user) {
			if (err) {
				req.flash('error',err);
				return res.redirect('/');
			}
			if (user) {
				req.flash('error', '用户已存在!');
				return res.redirect('/reg'); // 返回注册页
			}
			// 如果不存在则新增用户
			newUser.save(function(err, user) {
				if (err) {
					//req.flash('error', '出错sava');
					req.flash('error', err);
					return res.redirect('/reg'); // 注册失败返回注册页
				}
				req.session.user = user; // 用户信息存入session
				req.flash('success', '注册成功！');
				res.redirect('/'); // 注册成功后返回主页
			});
		});
	});
	app.get('/login',checkNotLogin);
	app.get('/login/github', passport.authenticate('github', {session:false}));
	app.get('/login/github/callback', passport.authenticate('github', {
		session:false,
		failureRecdirect:'/login',
		successFlash:'登陆成功!'
	}), function(req, res){
		//console.log('我是github用户'+req.user);
		console.log();
		req.session.user={
			name:req.user._json.name,
			email:req.user._json.email,
			head:req.user._json.avatar_url,
			loginType:2
			//head:'https://gravatar.com/avatar/'+req.user._json.gravatar_id+'?s=48'
		};
		res.redirect('/');
	});
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登录',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5');
			password = md5.update(req.body.password).digest('hex');
		if(req.body.name==''){
			req.flash('error','用户名为空');
			res.redirect('/login');
		}
		//判断用户是否存在
		User.get(req.body.name,function(err, user){
			if(!user){
				req.flash('error',"用户不存在");
				return res.redirect('/login');
			}
			//密码验证
			if(user.password!=password){
				req.flash('error',"密码错误！");
				return res.redirect('/login');
			}
			req.session.user=user;
			req.flash('success','登陆成功');
			res.redirect('/');
		});
	});
	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title:'发表',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/post',checkLogin);
	app.post('/post',function(req, res){
		var currentUser=req.session.user,
			tags=[req.body.tag1, req.body.tag2, req.body.tag3],
			post=new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success',"发布成功！");
			return res.redirect('/');
		});
	});
	app.get('/logout',checkLogin);
	app.get('/logout',function(req, res){
		req.session.user=null;
		req.flash('success','登出成功！');
		res.redirect('/');
	});
	app.get('/test',function(req,res){
		res.render('test',{title:'test'});
	});
	app.get('/upload',checkLogin);
	app.get('/upload',function(req, res){
		res.render('upload',{
			title:'文件上传',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/upload',checkLogin);
	app.post('/upload',function(req, res){
		for(var i in req.files){
			if(req.files[i].size==0){
				//使用同步方式删除文件
				fs.unlinkSync(req.files[i].path);
				console.log('Successfully removed an empty file ！');
			}else{
				var target_path='./public/images/'+req.files[i].name;
				//使用同步方式重命名一个文件
				fs.renameSync(req.files[i].path,target_path);
				console.log('Successful renamed a file ! ');
			}
		}
		req.flash('success','文件上传成功！');
		res.redirect('/upload');
	});
	/*app.get('/u/:name',function(req, res){
		//检查用户是否存在
		User.get(req.params.name, function(err, user){
			if(!user){
				req.flash('error','用户不存在！');
				res.redirect('/');
			}
			//检查并返回该用户的所有文章
			Post.getAll(user.name, function(err, posts){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user',{
					title:user.name,
					posts:posts,
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				});
			});
		});
	});*/
	app.get('/u/:name',function(req, res){
		var page=req.query.p ? parseInt(req.query.p) : 1 ;
		//判断是否为第三方登录
		/*if(req.session.user.name==req.params.name){
			console.log('我执行了');
			if(req.session.user.loginType){
				switch(req.session.user.loginType){
					case 1:
					case 2:
						req.flash('success','你使用的是第三方登录，请注册');
						req.session.user=null;
						res.redirect('/reg');
						return ;
					default:
						req.flash('error','用户不存在！');
						res.redirect('/');
				}
			}
		}*/
		//console.log('我执行了'+req.session.user);	
		//检查用户是否存在
		User.get(req.params.name, function(err, user){
			if(!user){
				if(req.session.user){
					req.flash('error','你需要注册');
					req.session.user=null;
					res.redirect('/reg');
					return ;
				}else{
					req.flash('error','用户不存在！');
					res.redirect('/');
					return ;
				}
			}
			//检查并返回该用户的所有文章
			Post.getTen(user.name, page,  function(err, posts, total){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user',{
					title:user.name,
					posts:posts,
					page:page,
					isFirstPage:(page-1)==0,
					isLastPage:((page-1)*10+posts.length)==total,
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				});
			});
		});
	});
	app.get('/u/:name/:day/:title', function(req, res){
		Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			 res.render('article', {
				title:req.params.title,
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			}); 
		});
	});
	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res){
		var currentUser=req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			res.render('edit', {
				title:'编辑',
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res){
		var currentUser=req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err){
			//var url='/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title;
			var url='/u/'+req.params.name;
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success','修改成功');
			res.redirect(url);
		});
	});
	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res){
		var currentUser=req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success','删除成功');
			res.redirect('/');
		});
	});
	app.get('/reprint/:name/:day/:title', checkLogin);
	app.get('/reprint/:name/:day/:title', function(req, res){
		Post.edit(req.params.name, req.params.day, req.params.title, function(err, post){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			var currentUser=req.session.user,
				reprint_from={name:post.name, day:post.time.day, title:post.title},
				reprint_to={name:currentUser.name, head:currentUser.head};
			Post.reprint(reprint_from, reprint_to, function(err, post){
				if(err){
					req.flash('error', err);
					return res.redirect('back');
				}
				req.flash('success', '转载成功！');
				//var url='/u/'+post.name+'/'+post.time.day+'/'+post.title;
				//解决办法，通过name
				var url='/u/'+post.name;
				res.redirect(url);
			}); 
		});
	});
	app.post('/u/:name/:day/:title', function(req, res){
		var date=new Date();
			time=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10?'0'+data.getMinutes():date.getMinutes());
		var md5=crypto.createHash('md5');
			email_MD5=md5.update(req.body.email.toLowerCase()).digest('hex');
			head='http://www.gravatar.com/avatar/'+email_MD5+"?s=48";
		var comment={
			name:req.body.name,
			head:head,
			email:req.body.email,
			website:req.body.website,
			time:time,
			content:req.body.content
		};
		var newComment=new Comment(req.params.name, req.params.day, req.params.title, comment);
		
		newComment.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '留言成功');
			res.redirect('back');
		});
	});
	app.get('/archive',function(req, res){
		Post.getArchive(function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', {
				title:'归档',
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/tags', function(req, res){
		Post.getTags(function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tags', {
				title:'标签',
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/tags/:tag', function(req, res){
		Post.getTag(req.params.tag, function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tag', {
				title:'TAG'+req.params.tag,
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/search', function(req, res){
		Post.search(req.query.keyword, function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', {
				title:'SEARCH:'+req.query.keyword,
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/links', function(req, res){
		res.render('links', {
			title:'友情链接',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	//检查已登录
	function checkLogin(req, res, next){
		if(!req.session.user){
			req.flash('error','未登录！');
			res.redirect('/login');
		}
		next();
	}
	//检查未登陆
	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error',"已登录！");
			res.redirect('back');
		}
		next();
	}
	/*app.use(function(req, res){
		res.render('404');
	});*/
}