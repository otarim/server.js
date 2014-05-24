var http = require('http'),
	url = require('url'),
	path = require('path'),
	colors = require('colors'),
	fs = require('fs'),
	port = 8080;
http.createServer(function(req, res) {
	// 针对中文路径以及空格进行编码
	var pathname = __dirname + decodeURI(url.parse(req.url).pathname),
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
	console.log(pathname);
	fs.exists(pathname, function(exists) {
		// req.header.host 
		// req.url 不带协议以及host
		if (exists) {
			fs.stat(pathname, function(err, stat) {
				if (stat.isFile()) {
					switch (path.extname(pathname)) {
						case '.html':
						case '.htm':
							res.writeHead(200, {
								'Content-type': 'text/html',
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
								'Content-type': 'text/javascript'
							});
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
							var mediaStream = fs.createReadStream(pathname);
							mediaStream.pipe(res);
							break;
						case '.swf':
							res.writeHead(200, {
								'Content-type': 'application/x-shockwave-flash',
								'Content-length': stat.size
							});
							break;
						default:
							res.writeHead(200, {
								'Content-type': 'application/octet-stream',
								'Content-length': stat.size
							})
					}
					fs.readFile(pathname, function(err, data) {
						res.end(new Buffer(data));
					})
				} else if (stat.isDirectory()) {
					// 构建索引
					var _pathname = decodeURI(req.url);
					if (_pathname.charAt(_pathname.length - 1) !== '/') {
						_pathname += '/';
					}
					fs.readdir(path.normalize(pathname), function(err, files) {
						var tmp = req.headers.host + _pathname.replace(/(.+)\b\/?/g, '$1');
						tmp = tmp.split('/');
						tmp.pop();
						var rootDir = tmp.join('/') + '/',
							ret = ['<h1>Index of ' + _pathname + '</h1><ul><li><a href="http://' + rootDir + '">../</a></li>'];
						files.forEach(function(file) {
							ret.push('<li><a href="http://' + req.headers.host + _pathname + file + '">' + file + '</a></li>')
						})
						ret.push('</ul>');
						res.writeHead(200, {
							'Content-Type': 'text/html'
						})
						res.end(ret.join(''));
					})
				}

			})
		} else {
			is404 = true;
			res.writeHead(404, {
				'Content-type': 'text/html',
				'Server': 'node.js!!!!!!'
			});
			res.end('<h1>goddamn 404</h1>')
		}
		console.log('guest:'.red + consoles.ip.yellow.bold + ' ' + (is404 ? consoles.url.redBG : consoles.url.green))
	})
}).listen(port);
console.log('servering...');