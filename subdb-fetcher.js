var fs = require('fs');
var http  = require('http');
var crypto = require('crypto');
var req = require('request-sync');

var args = process.argv.slice(2);

doTheDir(args[0]);

function doTheDir(dir) {
	fs.readdir(dir, function(err, items) {	
		if (!items || items.length === 0){
			return;
		}
	
		for (var i=0; i<items.length; i++) {			
			var objName = items[i];
			var fullPath = dir + '\\' + objName;
			if (fs.lstatSync(fullPath).isDirectory())
			{
				doTheDir(fullPath);
				continue;
			}
			
			if (/\.(?:mkv|mp4|avi)$/.test(objName)) {												
				var hash = getFileHash(fullPath);
				var apiUrl = 'http://api.thesubdb.com/?action=download&hash=' + hash + '&language=en';
				http.get(apiUrl);

				var strPath = fullPath.replace(/\.[^.]+$/, '.srt');
				
				if (fs.existsSync(strPath)) {
					strPath = strPath.replace(/\.srt$/, '.alt-subs.srt');
				}
				
				var response = req({ method: 'GET', uri: apiUrl, headers: { 'User-Agent': 'SubDB/1.0 (subdb-fetcher/0.1; http://github.com/subdb-fetcher)' } });
				if (!response || response.statusCode != 200)
				{
					console.log('Couldn\'t download subs');
					console.log(response.statusCode);
					continue;
				}
								
				var err = fs.writeFileSync(strPath, response.body);
				if(err) {
					console.log(err);
					continue;
				}

				console.log("Downloaded " + strPath);
			}		
		}
	});	
}


function getFileHash(fileName) {
	var readsize = 64 * 1024;
	var stats = fs.statSync(fileName);
	var fileSizeInBytes = stats.size;

	var fd = fs.openSync(fileName, 'r')
	var buffer = new Buffer(readsize * 2);	
	fs.readSync(fd, buffer, 0, readsize, 0);
	fs.readSync(fd, buffer, readsize, readsize, fileSizeInBytes-readsize);			
	var hash = crypto.createHash('md5').update(buffer).digest("hex");
	return hash;
}