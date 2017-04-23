var mongodb=require('./db');
markdown=require('markdown').markdown;

function Post(name, head, title, tags, post){
	this.name=name;
	this.head=head;
	this.title=title;
	this.tags=tags;
	this.post=post;
}

module.exports=Post;

//存储一篇文章及其相关信息
Post.prototype.save=function(callback){
	var date=new Date();
	//存储各种时间格式，方便扩展
	var time={
		date:date,
		year:date.getFullYear(),
		month:date.getFullYear()+"-"+(date.getMonth()+1),
		day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
		minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes()),
	};
	//要存入数据库的文档
	var post={
		name:this.name,
		head:this.head,
		title:this.title,
		tags:this.tags,
		post:this.post,
		time:time,
		comments:[],
		reprint_info:{},
		pv:0
	};
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.save(post,{
				safe:true
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);//返回err为空
			});
		});
	});
};
//读取文章信息
/*Post.getAll=function(name,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query={};
			if(name){
				query.name=name;
			}
			//根据query对象查询文章
			collection.find(query).sort({
				time:-1
			}).toArray(function(req,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				docs.forEach(function(doc){
					doc.post=markdown.toHTML(doc.post);
				});
				callback(null,docs);//成功，以数组形式返回结果
			});
		});
	});
};*/
Post.getTen=function(name, page, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query={};
			if(name){
				query.name=name;
			}
			//使用count返回特定查询的文档数total
			collection.count(query, function(err, total){
				//根据query 对象查询，并跳过（page-1）*10个结果，返回之后的10个结果
				collection.find(query, {
					skip:(page-1)*10,
					limit:10
				}).sort({
					time:-1
				}).toArray(function(err, docs){
					mongodb.close();
					if(err){
						return callback(err);
					}
					//解析markdown为html
					docs.forEach(function(doc){
						doc.post=markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});
			});
		});
	});
};
//获取一篇文章
Post.getOne=function(name, day, title, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名，发表日期及文章名进行查询
			collection.findOne({
				'name':name,
				'time.day':day,
				'title':title
			},function(err, doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				//解析markdown为html
				if(doc){
					//每访问一次，就 pv+1
					collection.update({
						'name':name,
						'time.day':day,
						'title':title
					},{
						$inc:{'pv':1}
					}, function(err){
						mongodb.close();
						if(err){
							return callback(err);
						}
					});
					doc.post=markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
						comment.content=markdown.toHTML(comment.content);
					});
					callback(null, doc);
				}
			});
		});
	});
};
//返回原始格式发表的文章（markdown格式）
Post.edit=function(name, day, title, callback){
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名，发表日期及文章名进行查询
			collection.findOne({
				'name':name,
				'time.day':day,
				'title':title
			},function(err, doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, doc);//返回查询的文章（markdown格式）
			});
		});
	});
};
Post.update=function(name, day, title, post, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.update({
				'name':name,
				'time.day':day,
				'title':title
			}, {
				$set:{post:post}
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
/*Post.remove=function(name, day, title, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.update({
				'name':name,
				'time.day':day,
				'title':title
			}, {
				w:1
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};*/
Post.remove=function(name, day, title, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				'name':name,
				'time.day':day,
				'title':title
			},function(err, doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				//如果reprint_from为真，即该文章是转载来的，先保存下来reprint_from
				var reprint_from='';
				if(doc.reprint_info.reprint_from){
					reprint_from=doc.reprint_info.reprint_from;
				}
				if(reprint_from!=''){
					//更新原文档的reprint_to
					collection.update({
						'name':reprint_from.name,
						'time.day':reprint_from.day,
						'title':reprint_from.title
					}, {
						$pull:{
							'reprint_info.reprint_to':{
								'name':name,
								'day':day,
								'title':title
							}
						}
					}, function(err){
						if(err){
							mongodb.close();
							return callback(err);
						}
					});
				}
				//删除转载来的文章所在文档
				collection.remove({
					'name':name,
					'time.day':day,
					'title':title
				}, {
					w:1
				}, function(err){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(null);
				});
			});
		});
	});
};
Post.getArchive=function(callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.find({}, {
				'name':1,
				'time':1,
				'title':1
			}).sort({
				time:-1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};
Post.getTags=function(callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//distinct 用来找出给定键的所有不同值
			collection.distinct('tags', function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};
Post.getTag=function(tag, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//查询所有tags下包含的tag文档
			//并返回只含有name、time、title 组成的数组
			collection.find({
				'tags':tag
			},{
				'name':-1,
				'time':1,
				'title':1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};
Post.search=function(keyword, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var pattern=new RegExp("^.*"+keyword+".*$", "i");
			collection.find({
				'title':pattern
			}, {
				'name':1,
				'time':1,
				'title':1
			}).sort({
				time:-1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};
Post.reprint=function(reprint_from, reprint_to, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//找到被转载文章
			collection.findOne({
				'name':reprint_from.name,
				'time.day':reprint_from.day,
				'title':reprint_from.title
			},function(err, doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				var date =new Date();
				var time={
					date:date,
					year:date.getFullYear(),
					month:date.getFullYear()+'-'+(date.getMonth()+1),
					day:date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
					minute:date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())
				};
				delete doc._id;//注意删掉原来的_id
				
				doc.name=reprint_to.name;
				doc.head=reprint_to.head;
				doc.time=time;
				doc.title=(doc.title.search(/[转载]/) > -1)?doc.title : "[转载]" +doc.title;
				doc.comments=[];
				doc.reprint_info={'reprint_from':reprint_from};
				doc.pv=0;
				
				//更新被转载文档的reprint_info内的reprint_to
				collection.update({
					'name':reprint_from.name,
					'time.day':reprint_from.day,
					'title':reprint_from.title
				},{
					$push:{
						'reprint_info.reprint_to':{
							'name':doc.name,
							'day':time.day,
							'title':doc.title
						}
					}
				}, function(err){
					if(err){
						mongodb.close();
						return callback(err);
					}
				});
				//console.log(doc);
				//并将转载生成的副本修改后保存，返回修改后的文档
				collection.insert(doc, {
					safe:true
				} ,function(err, post){
					mongodb.close();
					if(err){
						return callback(err);
					}
					//console.log(post.ops[0]);
					callback(null, post.ops[0]);
				});
			});
		});
	});
};