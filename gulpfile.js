"use strict"
var gulp = require("gulp");
var plumber = require("gulp-plumber");
var eslint = require("gulp-eslint");
var babel = require("gulp-babel");
var SOURCE_PATH = "./src/**/*.js";



gulp.task("lint", function() {
  return gulp.src(SOURCE_PATH)
             .pipe(eslint())
             .pipe(eslint.format());
});



gulp.task("default", ["lint"]);
