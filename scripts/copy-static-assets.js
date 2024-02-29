const shell = require('shelljs');

shell.mkdir("-p", "dist");
shell.mkdir("-p", "dist/icons");
shell.cp("-R", "src/*.html", "dist/");
shell.cp("-R", "src/*.js", "dist/");
shell.cp("-R", "src/icons/*.svg", "dist/icons/");
