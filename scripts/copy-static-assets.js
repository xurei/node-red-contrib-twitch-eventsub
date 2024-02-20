const shell = require('shelljs');

shell.mkdir("-p", "dist");
shell.cp("-R", "src/*.html", "dist/");
shell.cp("-R", "src/*.md", "dist/");
shell.cp("-R", "src/*.js", "dist/");
