#!/usr/bin/env node

/*

hostess - hosts file manipulation tool

usage:
	hostess -a <ip> <alias> [<comment>]
		Append entry.
	hostess -ri <ip>
		Remove all entries with the specified ip.
	hostess -ra <alias>
		Remove all entries with the specified alias.
	hostess -e
		Enumerate all entries.

contact:
	http://cxii.org/

*/

var fs = require('fs');
var net = require('net');

// Hosts file location.
var hosts = '/etc/hosts';

// Attempt to make this work on Windows (not tested).
if (process.platform == 'win32') {
	hosts = '%SystemRoot%\\System32\\drivers\\etc\\hosts';
}

// Bad.
function help() {
	console.log('hostess - hosts file manipulation tool');
	console.log('');
	console.log('usage:');
	console.log('\thostess -a <alias> <ip> [<comment>]');
	console.log('\t\tAppend entry.');
	console.log('\thostess -ri <ip>');
	console.log('\t\tRemove all entries with the specified ip.');
	console.log('\thostess -ra <alias>');
	console.log('\t\tRemove all entries with the specified alias.');
	console.log('\thostess -e');
	console.log('\t\tEnumerate all entries.');
	console.log('');
	console.log('contact:');
	console.log('\thttp://cxii.org/');
	process.exit(1);
}

// Parse hosts file. Output elements are in format [alias, ip, lineno].
function parse() {
	var entries = [];
	var lines = fs.readFileSync(hosts).toString().split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (line.length == 0) {
			// Empty line.
			continue;
		} else if (line[0] == '#') {
			// Comment line.
			continue;
		} else {
			// Entry.
			var dirtyWords = line.split(/(\s+)/);
			var words = [];
			for (var j = 0; j < dirtyWords.length; j++) {
				var dirtyWord = dirtyWords[j];
				if (dirtyWord.trim().length > 0) {
					words.push(dirtyWord);
				}
			}

			// Sanity checks.
			if (words.length < 2) {
				// Bad entry.
				continue;
			}

			// Append.
			var ip = words.shift();
			for (var j = 0; j < words.length; j++) {
				entries.push([words[j], ip, i]);
			}
		}
	}
	return entries;
}

try {
	// Get a more manageable representation of the arguments.
	var argv = process.argv.slice(2, process.argv.length);

	// Sanity check.
	if (argv.length == 0) {
		help();
	}

	// Eat the arguments.
	var arg = argv.shift().toLowerCase();
	if (arg == '-a') {
		// Append entry.
		if (argv.length != 2 && argv.length != 3) {
			help();
		}
		var alias = argv.shift();
		var ip = argv.shift();
		var comment = argv.shift();

		// Search for an existing identical entry.
		var entries = parse();
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entries[i][1] == ip && entries[i][0] == alias) {
				// Match found.
				console.log('entry already exists');
				process.exit(1);
			}
		}

		// Append entry.
		if (comment) {
			fs.appendFileSync(hosts, '\n# ' + comment);
		}
		fs.appendFileSync(hosts, '\n' + ip + ' ' + alias);
	} else if (arg == '-ri') {
		// Remove all entries with the specified ip.
		if (argv.length != 1) {
			help();
		}
		var ip = argv.shift();

		// Search for matching entries.
		var matches = [];
		var entries = parse();
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry[1] == ip) {
				// Match found.
				matches.push(entry[2]);	
			}
		}

		// Sanity check.
		if (matches.length == 0) {
			// No match found.
			console.log('no entries found to match the specified criteria');
			process.exit();
		}

		// Remove lines.
		var text = fs.readFileSync(hosts).toString();
		var lines = text.split('\n');
		var numberedLines = [];
		for (var i = 0; i < lines.length; i++) {
			numberedLines.push([i, lines[i]]);
		}
		var trimmedLines = numberedLines.filter(function(elt) {
			return !matches.includes(elt[0]);
		});
		var newLines = [];
		for (var i = 0; i < trimmedLines.length; i++) {
			newLines.push(trimmedLines[i][1]);
		}
		var newText = newLines.join('\n');

		// Overwrite.
		fs.writeFileSync(hosts, newText);
	} else if (arg == '-ra') {
		// Remove all entries with the specified alias.
		if (argv.length != 1) {
			help();
		}
		var alias = argv.shift();

		// Search for matching entries.
		var matches = [];
		var entries = parse();
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry[0] == alias) {
				// Match found.
				matches.push(entry[2]);	
			}
		}

		// Sanity check.
		if (matches.length == 0) {
			// No match found.
			console.log('no entries found to match the specified criteria');
			process.exit();
		}

		// Remove lines.
		var text = fs.readFileSync(hosts).toString();
		var lines = text.split('\n');
		var numberedLines = [];
		for (var i = 0; i < lines.length; i++) {
			numberedLines.push([i, lines[i]]);
		}
		var trimmedLines = numberedLines.filter(function(elt) {
			return !matches.includes(elt[0]);
		});
		var newLines = [];
		for (var i = 0; i < trimmedLines.length; i++) {
			newLines.push(trimmedLines[i][1]);
		}
		var newText = newLines.join('\n');

		// Overwrite.
		fs.writeFileSync(hosts, newText);
	} else if (arg == '-e') {
		// Enumerate all entries.
		if (argv.length != 0) {
			help();
		}

		// Parse.
		var entries = [];
		var entries4 = [];
		var entries6 = [];
		var unsiftedEntries = parse();
		for (var i = 0; i < unsiftedEntries.length; i++) {
			var entry = unsiftedEntries[i];
			var ip = entry[1];
			if (net.isIPv4(ip)) {
				entries4.push(entry);
			} else if (net.isIPv6(ip)) {
				entries6.push(entry);
			} else {
				entries.push(entry);
			}
		}

		// Maximum length.
		var allEntries = Array.prototype.concat(entries, entries4, entries6);
		var maxAliasLength = 0;
		var maxIpLength = 0;
		for (var i = 0; i < allEntries.length; i++) {
			if (allEntries[i][0].length > maxAliasLength) {
				maxAliasLength = allEntries[i][0].length;
			}
			if (allEntries[i][1].length > maxIpLength) {
				maxIpLength = allEntries[i][1].length;
			}
		}
		maxAliasLength += 3;

		// Tab-spacing.
		var tabWidth = 4;
		var lineWidth = Math.round(maxAliasLength / tabWidth) * tabWidth + tabWidth;

		// Pretty-print.
		if (allEntries.length == 0) {
			console.log('hosts file is empty');
		}
		if (entries4.length > 0) {
			console.log('ipv4 entries');
			console.log('='.repeat(lineWidth + maxIpLength));
			for (var i = 0; i < entries4.length; i++) {
				var entry = entries4[i];
				console.log(entry[0] + ' ->' + ' '.repeat(lineWidth - entry[0].length - 3) + entry[1]);
			}
			console.log('');
		}
		if (entries6.length > 0) {
			console.log('ipv6 entries');
			console.log('='.repeat(lineWidth + maxIpLength));
			for (var i = 0; i < entries6.length; i++) {
				var entry = entries6[i];
				console.log(entry[0] + ' ->' + ' '.repeat(lineWidth - entry[0].length - 3) + entry[1]);
			}
			console.log('');
		}
		if (entries.length > 0) {
			console.log('other entries');
			console.log('='.repeat(lineWidth + maxIpLength));
			for (var i = 0; i < entries.length; i++) {
				var entry = entries[i];
				console.log(entry[0] + ' ->' + ' '.repeat(lineWidth - entry[0].length - 3) + entry[1]);
			}
			console.log('');
		}
	} else {
		help();
	}
} catch (err) {
	if (err.message) {
		console.log('error: ' + err.message + ', did you forget to use sudo?');
	} else {
		console.log('error, did you forget to use sudo?');
	}
}