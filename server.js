var http = require('http'),
	url = require('url'),
	path = require('path'),
	colors = require('./colors'),
	dns = require('dns'),
	fs = require('fs'),
	zlib = require('zlib'), // node has its own zlib package
	cache = {} // cache[absPath] = data;
var conf = JSON.parse(fs.readFileSync('./server.conf').toString())
var port = conf.port //listen EACCES 权限
var ignoreExtname = conf.ignoreExtname
var DIR = path.join(__dirname,conf.root)
var styleText = conf.style
var request = function(req,res){
	var request = http.request(req.reqConfig,function(response){
		var chunk = ''
		response.on('data',function(d){
			chunk += d
		}).on('end',function(){
			res.writeHead(response.statusCode, response.headers)
			res.end(chunk)
		})
	})
	req.reqConfig.method === 'post' && request.write(req.postData)
	return request.end()
}
var domainMap = conf.domainMap

http.createServer(function(req, res) {
	var host = req.headers.host,
		mapDir = url.parse(req.url).pathname,
		method = req.method.toLowerCase(),
		query = url.parse(req.url).query || ''
	if(host in domainMap){
		var customDomain = domainMap[host]
		var reqConfig = {
			hostname: '127.0.0.1',
			method: method,
			headers: req.headers
		}
		for(var i in customDomain){
			if(customDomain.hasOwnProperty(i)){
				reqConfig[i] = customDomain[i]
			}
		}
		if(method === 'post'){
			reqConfig['path'] = mapDir
			var chunk = [],len = 0
			return req.on('data',function(d){
				chunk.push(d)
				len += d.length
			}).on('end',function(){
				chunk = Buffer.concat(chunk,len).toString()
				req.headers['Content-length'] = chunk.length
				req.reqConfig = reqConfig
				req.postData = chunk
				return request(req,res)
			})
		}else{
			reqConfig['path'] = mapDir + (query ? '?' + query : '')
			req.reqConfig = reqConfig
			return request(req,res)
		}
	}

	// 针对中文路径以及空格进行编码
	var pathname = path.join(DIR,decodeURI(url.parse(req.url).pathname)),
		consoles = {
			'ip': req.connection.remoteAddress,
			'url': req.headers.host + req.url
		},
		is404 = false;
	// 针对存在括号的情况
	if (pathname.search(/(\(|\))/) !== -1) {
		pathname = pathname.replace(/(\(|\))/g, '\$1')
	}

	if (path.extname(pathname) === '') {
		pathname += '/'
	}
	fs.exists(pathname, function(exists) {
		// req.header.host 
		// req.url 不带协议以及host
		if (exists) {
			fs.stat(pathname, function(err, stat) {
				if (stat.isFile()) {
					/**
					 * add gzip support
					 * 
					 */
					switch (path.extname(pathname)) {
						case '.html':
						case '.htm':
						case '.jsp':
							res.writeHead(200, {
								'Content-type': 'text/html',
								// 'Access-Control-Allow-Origin': req.headers['origin'],
								// 'Access-Control-Allow-Credentials': true,
								// 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
							});
							break;
						case '.xml':
							res.writeHead(200, {
								'Content-type': 'text/xml',
							});
							break;
						case '.css':
							res.writeHead(200, {
								'Content-type': 'text/css'
							});
							break;
						case '.js':
							res.writeHead(200, {
								'Content-type': 'text/javascript',
								'Content-Encoding': 'gzip', //necessary
							});
							if(req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf('gzip') !== -1){
								zlib.gzip(fs.readFileSync(pathname),function(err,data){
								    res.end(data);
								});
								return;
							}
							break;
						case '.json':
							res.writeHead(200, {
								'Content-type': 'application/json'
							});
							break;
						case '.jpg':
						case '.jpeg':
							res.writeHead(200, {
								'Content-type': 'image/jpeg',
								'Content-length': stat.size
							});
							break;
						case '.png':
							res.writeHead(200, {
								'Content-type': 'image/png',
								'Content-length': stat.size
							});
							break;
						case '.gif':
							res.writeHead(200, {
								'Content-type': 'image/gif'
							});
							break;
						case '.md':
						case '.log':
						case '.txt':
							res.writeHead(200, {
								'Content-type': 'text/plain'
							});
							break;
						case '.pdf':
							res.writeHead(200, {
								'Content-type': 'application/pdf',
								'Content-length': stat.size
							});
							break;
						case '.manifest':
							res.writeHead(200, {
								'Content-type': 'text/cache-manifest'
							});
						case '.mp3':
							res.writeHead(200, {
								'Content-type': 'audio/mpeg',
								'Content-length': stat.size
							})
							// var mediaStream = fs.createReadStream(pathname);
							// mediaStream.pipe(res);
							break;
						case '.swf':
							res.writeHead(200, {
								'Content-type': 'application/x-shockwave-flash',
								'Content-length': stat.size
							});
							break;
						case '.ico':
							res.writeHead(200, {
								'Content-type': 'image/x-icon',
								'Content-length': stat.size
							});
							break;
						default:
							res.writeHead(200, {
								'Content-type': 'application/octet-stream',
								'Content-length': stat.size
							})
					}
					fs.createReadStream(pathname).pipe(res)
				} else if (stat.isDirectory()) {
					// 构建索引
					var _pathname = decodeURI(req.url);
					if (_pathname.charAt(_pathname.length - 1) !== '/') {
						_pathname += '/'
					}
					fs.readdir(path.normalize(pathname), function(err, files) {
						var tmp = req.headers.host + _pathname.replace(/(.+)\b\/?/g, '$1')
						tmp = tmp.split('/')
						tmp.pop()
						var rootDir = tmp.join('/') + '/',
							ret = ['<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/><meta charset="UTF-8"><title>'+_pathname+'</title><style>'+styleText+'</style></head><body><h1>Index of ' + _pathname + '</h1><ul><li><a href="http://' + rootDir + '">../</a></li>']
						files.forEach(function(file) {
							if(ignoreExtname.some(function(ext){
								return file === ext
							})){
								return
							}
							ret.push('<li '+(fs.statSync(path.join(pathname,file)).isDirectory() ? 'class="dir"' : '')+'><a href="http://' + req.headers.host + _pathname + file + '">' + file + '</a></li>')
						})
						ret.push('<li></li></ul></body></html>')
						res.writeHead(200, {
							'Content-Type': 'text/html; charset=utf-8'
						})
						res.end(ret.join(''))
					})
				}
			})
		} else {
			is404 = true
			res.writeHead(404, {
				'Content-type': 'text/html; charset=utf-8',
				'Server': 'node.js!!!!!!'
			})
			res.end('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>404!</title><style>'+styleText+'</style></head><body><p style="font-family: monaco;font-size: 3rem;text-align: center;position: absolute;top: 50%;left: 50%;transform: translate(-50%,-50%);-webkit-transform: -webkit-translate(-50%,-50%);">U GOT A GODDAMN 404 PAGE ~ <sub style="font-size: 50%;">▔fﾟﾟ▔</sub></p></body></html>')
		}
		console.log('guest:'.red + consoles.ip.yellow.bold + ' ' + (is404 ? consoles.url.redBG : consoles.url.green))
	})	
}).listen(port)
console.log('servering...')