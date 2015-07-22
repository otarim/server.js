server.js
=========

> a simple node.js server

![http://ww2.sinaimg.cn/large/9bfe0b14gw1enxbuacpbpj20pd0hsjtm.jpg](http://ww2.sinaimg.cn/large/9bfe0b14gw1enxbuacpbpj20pd0hsjtm.jpg)

###Structure

```
.
├── colors.js     --- colorful console output
├── README.md     --- readme file
├── server.js     --- entry file
├── server.conf   --- config file
└── license       --- license file
```

###Settings

The following object sets up the default settings of ```server.conf``` :

```
"root": "./", // http server path
"port": 2333, // http server port
"gzip": ["application/javascript"] // which mimeType to use gzip compress
"ignoreExtname": [".DS_Store",".git",".idea"] // extname to ignore
"domainMap": {
    "netease.misaka.ota": {
        "port": 9527
    },
    "cors.misaka.ota": {
        "port": 8060
    }
} // Port Mapping,you should map these domains to localhost in your hosts
"style": ... // your customize style
```

###Mocha

```
$ npm test
```

### License

Copyright (c) 2015 contributors.
Released under the ,  [licenses](https://raw.githubusercontent.com/otarim/server.js/master/LICENSE)